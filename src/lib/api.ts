import { supabase } from './supabase';
import type { Recipe, PublicRecipe, RecipeFilters } from './types';
import { parseRecipeFromText } from './recipe-parser';
import { trackDatabaseError, trackAPIError } from './error-tracking';
import { IngredientMatcher } from './groceries/ingredient-matcher';
import { getUserGroceries } from './user-preferences';

// Configuration constants for ingredient filtering
const INGREDIENT_MATCH_CONFIDENCE_THRESHOLD = 50; // Minimum confidence score for ingredient matching (0-100)

// Type for profile summary data used in API responses
interface ProfileSummary {
  id: string;
  full_name: string | null;
}

// Enhanced error handler with error tracking
function handleError(error: unknown, operation: string): never {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // Determine error category and track appropriately
  if (
    error &&
    typeof error === 'object' &&
    ('code' in error || 'hint' in error || 'details' in error)
  ) {
    // Supabase database error
    trackDatabaseError(`${operation}: ${errorMessage}`, error, { operation });
  } else {
    // General API error
    trackAPIError(`${operation}: ${errorMessage}`, error, { operation });
  }

  console.error(`${operation} error:`, error);
  throw new Error(`${operation} failed: ${errorMessage}`);
}

export const recipeApi = {
  // Fetch all recipes for the current user with optional filters
  async getUserRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Optimize: Only select needed fields for list view to reduce data transfer
    let query = supabase
      .from('recipes')
      .select(
        'id, title, ingredients, instructions, notes, image_url, categories, cooking_time, difficulty, is_public, created_at, updated_at, user_id'
      )
      .eq('user_id', user.id);

    // Apply search filter using secure parameterized queries to prevent SQL injection
    if (filters?.searchTerm) {
      // SECURITY FIX: Use safe ILIKE patterns instead of raw SQL interpolation with to_tsquery
      // This prevents SQL injection while maintaining search functionality
      const searchTerm = filters.searchTerm.trim().replace(/[%_\\]/g, '\\$&'); // Escape LIKE wildcards

      query = query.or(
        `title.ilike.%${searchTerm}%,instructions.ilike.%${searchTerm}%,ingredients.cs.{${searchTerm}}`
      );
    }

    // Apply category filter
    if (filters?.categories?.length) {
      query = query.overlaps('categories', filters.categories);
    }

    // Apply cuisine filter (cuisine is stored as a category)
    if (filters?.cuisine?.length) {
      const cuisineCategories = filters.cuisine.map((c) => `Cuisine: ${c}`);
      query = query.overlaps('categories', cuisineCategories);
    }

    // Apply mood filter (moods are stored as namespaced categories)
    if (filters?.moods?.length) {
      // Backward-compatible: match both namespaced and plain mood tags
      const moodCategories = [
        ...filters.moods.map((m) => `Mood: ${m}`),
        ...filters.moods,
      ];
      query = query.overlaps('categories', moodCategories);
    }

    // NOTE: availableIngredients filtering is now handled client-side
    // using sophisticated IngredientMatcher for better accuracy.
    // The old simple string matching was removed because it couldn't handle:
    // - Recipe ingredients with measurements ("2 cups diced onions")
    // - Synonyms and variations
    // - Normalization and fuzzy matching

    // Apply sorting
    const sortBy = filters?.sortBy || 'date';
    const sortOrder = filters?.sortOrder || 'desc';

    if (sortBy === 'date') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'title') {
      query = query.order('title', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'popularity') {
      // Use updated_at as a proxy for popularity (more popular recipes get updated more)
      // Fall back to created_at for recipes with same updated_at
      query = query
        .order('updated_at', { ascending: sortOrder === 'asc' })
        .order('created_at', { ascending: sortOrder === 'asc' });
    } else {
      // Default to date sorting
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    const { data, error } = await query;

    if (error) handleError(error, 'Get user recipes');
    let recipes = (data as unknown as Recipe[]) || [];

    // Apply client-side ingredient filtering using sophisticated IngredientMatcher
    if (filters?.availableIngredients?.length) {
      try {
        // Get user's available groceries for matching
        const userGroceries = await getUserGroceries(user.id);
        const groceriesData = userGroceries?.groceries || {};

        // Check if user has grocery data set up
        const hasGroceryData = Object.keys(groceriesData).length > 0;

        if (hasGroceryData) {
          // Use sophisticated IngredientMatcher when grocery data is available
          const matcher = new IngredientMatcher(groceriesData);

          // Create a function to check if a matched grocery ingredient relates to selected global ingredients
          const isIngredientMatch = (matchedGroceryIngredient: string, selectedIngredients: string[]): boolean => {
            const normalizedMatched = matchedGroceryIngredient.toLowerCase().trim();
            
            return selectedIngredients.some(selectedIngredient => {
              const normalizedSelected = selectedIngredient.toLowerCase().trim();
              
              // Exact match
              if (normalizedMatched === normalizedSelected) return true;
              
              // Check if matched ingredient contains the selected ingredient
              if (normalizedMatched.includes(normalizedSelected)) return true;
              
              // Check if selected ingredient contains the matched ingredient
              if (normalizedSelected.includes(normalizedMatched)) return true;
              
              // Check for common variations (e.g., "Yellow Onions" vs "Onions")
              const matchedWords = normalizedMatched.split(/\s+/);
              const selectedWords = normalizedSelected.split(/\s+/);
              
              // If any word from selected matches any word from matched
              return selectedWords.some(selectedWord => 
                matchedWords.some(matchedWord => 
                  selectedWord === matchedWord || 
                  matchedWord.includes(selectedWord) || 
                  selectedWord.includes(matchedWord)
                )
              );
            });
          };

          // Filter recipes based on sophisticated ingredient matching
          recipes = recipes.filter((recipe) => {
            // Check if any recipe ingredient matches any selected ingredient
            return recipe.ingredients.some((recipeIngredient) => {
              const match = matcher.matchIngredient(recipeIngredient);
              // Consider it a match if:
              // 1. The matcher found a match with good confidence, AND
              // 2. The matched ingredient relates to any selected ingredient
              return (
                match.matchType !== 'none' &&
                match.confidence >= INGREDIENT_MATCH_CONFIDENCE_THRESHOLD &&
                match.matchedGroceryIngredient &&
                isIngredientMatch(match.matchedGroceryIngredient, filters.availableIngredients!)
              );
            });
          });
        } else {
          // Fall back to simple string matching when no grocery data is available
          // This matches the behavior of the explore page
          const selectedIngredientsSet = new Set(filters.availableIngredients);
          recipes = recipes.filter((recipe) =>
            recipe.ingredients.some((recipeIngredient) =>
              selectedIngredientsSet.has(recipeIngredient.toLowerCase().trim())
            )
          );
        }
      } catch (error) {
        console.warn(
          'Failed to apply client-side ingredient filtering:',
          error
        );
        // Fall back to simple string matching if there's an error
        const selectedIngredientsSet = new Set(filters.availableIngredients);
        recipes = recipes.filter((recipe) =>
          recipe.ingredients.some((recipeIngredient) =>
            selectedIngredientsSet.has(recipeIngredient.toLowerCase().trim())
          )
        );
      }
    }

    return recipes;
  },

  // Get a single recipe by ID
  async getRecipe(id: string): Promise<Recipe | null> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) handleError(error, 'Get recipe');
    return data;
  },

  // Get recipe summary (optimized for list views)
  async getRecipeSummary(id: string): Promise<Partial<Recipe> | null> {
    const { data, error } = await supabase
      .from('recipes')
      .select(
        'id, title, ingredients, categories, cooking_time, difficulty, is_public, created_at, updated_at'
      )
      .eq('id', id)
      .single();

    if (error) handleError(error, 'Get recipe summary');
    return data;
  },

  // Fetch public recipes for the Explore feed
  async getPublicRecipes(): Promise<PublicRecipe[]> {
    // Optimize: Only select fields needed for public recipe cards to reduce data transfer
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select(
        'id, title, ingredients, instructions, notes, image_url, categories, cooking_time, difficulty, user_id, created_at'
      )
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (recipesError) handleError(recipesError, 'Get public recipes');
    if (!recipes || recipes.length === 0) return [];

    // Get unique user IDs from recipes
    const userIds = [
      ...new Set(
        recipes.map((recipe: Record<string, unknown>) => recipe.user_id)
      ),
    ];

    // Fetch profiles for those users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError) handleError(profilesError, 'Get profiles');

    // Create a map of user_id to full_name
    const profileMap = new Map(
      (profiles || []).map((profile: ProfileSummary) => [
        profile.id,
        profile.full_name,
      ])
    );

    // Combine recipes with profile data
    return recipes.map((recipe: Record<string, unknown>) => ({
      ...recipe,
      author_name: profileMap.get(recipe.user_id as string) || 'Unknown Author',
    })) as PublicRecipe[];
  },

  // Toggle recipe public status
  async toggleRecipePublic(recipeId: string, isPublic: boolean): Promise<void> {
    const { error } = await supabase
      .from('recipes')
      .update({ is_public: isPublic })
      .eq('id', recipeId);

    if (error) handleError(error, 'Toggle recipe public status');
  },

  // Get recipe sharing status
  async getRecipeSharingStatus(recipeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('recipes')
      .select('is_public')
      .eq('id', recipeId)
      .single();

    if (error) handleError(error, 'Get recipe sharing status');
    return data?.is_public || false;
  },

  // Create a new recipe
  async createRecipe(
    recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Recipe> {
    // Check network connectivity
    if (!navigator.onLine) {
      throw new Error(
        'No internet connection. Please check your network and try again.'
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert({ ...recipe, user_id: user.id, is_public: false })
        .select()
        .single();

      if (error) {
        console.error('Supabase create recipe error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create recipe. Please try again.');
    }
  },

  // Update an existing recipe
  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    // Get current recipe to check for old image that needs cleanup
    const { data: currentRecipe } = await supabase
      .from('recipes')
      .select('image_url')
      .eq('id', id)
      .single();

    // Update recipe
    const { data, error } = await supabase
      .from('recipes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error, 'Update recipe');

    // Clean up old image if it exists and is different from the new one
    if (
      currentRecipe?.image_url &&
      currentRecipe.image_url !== updates.image_url
    ) {
      await this.deleteImageFromStorage(currentRecipe.image_url);
    }

    return data;
  },

  // Delete a recipe
  async deleteRecipe(id: string): Promise<void> {
    // Get recipe image URL before deletion for cleanup
    const { data: recipe } = await supabase
      .from('recipes')
      .select('image_url')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('recipes').delete().eq('id', id);

    if (error) handleError(error, 'Delete recipe');

    // Clean up associated image if it exists
    if (recipe?.image_url) {
      await this.deleteImageFromStorage(recipe.image_url);
    }
  },

  // Save (clone) a public recipe to user's collection
  async savePublicRecipe(recipeId: string): Promise<Recipe> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the public recipe
    const { data: sourceRecipe, error: fetchError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .eq('is_public', true)
      .single();

    if (fetchError) handleError(fetchError, 'Fetch public recipe');
    if (!sourceRecipe) throw new Error('Recipe not found or not public');

    // Create a new recipe with the current user as owner
    const newRecipe = {
      title: sourceRecipe.title,
      ingredients: sourceRecipe.ingredients,
      instructions: sourceRecipe.instructions,
      notes: sourceRecipe.notes,
      image_url: sourceRecipe.image_url,
      user_id: user.id,
      is_public: false,
    };

    const { data, error } = await supabase
      .from('recipes')
      .insert(newRecipe)
      .select()
      .single();

    if (error) handleError(error, 'Save public recipe');
    return data;
  },

  // Upload recipe image
  async uploadImage(file: File): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Derive a safe extension from MIME type if available, otherwise fall back to original name
    const mimeType = file.type || 'application/octet-stream';
    const defaultExtFromMime = (() => {
      if (mimeType === 'image/jpeg') return 'jpg';
      if (mimeType === 'image/png') return 'png';
      if (mimeType === 'image/webp') return 'webp';
      if (mimeType === 'image/gif') return 'gif';
      return (file.name.split('.').pop() || 'bin').toLowerCase();
    })();

    const fileExt = (
      file.name.split('.').pop() || defaultExtFromMime
    ).toLowerCase();

    // Generate unique filename; include a random suffix to avoid rare collisions
    const uniqueSuffix = Math.random().toString(36).slice(2, 8);
    const initialName = `${user.id}/${Date.now()}-${uniqueSuffix}.${fileExt}`;

    // Attempt upload; retry once on conflict with a new unique name
    const attemptUpload = async (path: string): Promise<string> => {
      const { error } = await supabase.storage
        .from('recipe-images')
        .upload(path, file, {
          cacheControl: '31536000',
          contentType: mimeType,
          upsert: true, // Allow overwrites like profile avatars
        });

      if (error) {
        // Handle conflict by retrying with a new name once
        const status =
          (error as unknown as { status?: number; statusCode?: number }) || {};
        if (status.statusCode === 409 || status.status === 409) {
          const altSuffix = Math.random().toString(36).slice(2, 8);
          const altName = `${user.id}/${Date.now()}-${altSuffix}.${fileExt}`;
          const { error: retryError } = await supabase.storage
            .from('recipe-images')
            .upload(altName, file, {
              cacheControl: '31536000',
              contentType: mimeType,
              upsert: true,
            });
          if (retryError) {
            handleError(retryError, 'Upload image (retry)');
          }
          return altName;
        }
        handleError(error, 'Upload image');
      }
      return path;
    };

    const storedPath = await attemptUpload(initialName);

    const { data } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(storedPath);
    return data.publicUrl;
  },

  // Delete image from storage
  async deleteImageFromStorage(imageUrl: string): Promise<void> {
    try {
      // Extract path from URL
      const url = new URL(imageUrl);
      const pathSegments = url.pathname.split('/');
      // Get the last two segments: user_id/filename
      const path = pathSegments.slice(-2).join('/');

      const { error } = await supabase.storage
        .from('recipe-images')
        .remove([path]);

      if (error) {
        console.warn('Failed to delete old image:', error);
        // Don't throw - this shouldn't block the main operation
      } else {
        console.log('Successfully deleted old image:', path);
      }
    } catch (error) {
      console.warn('Error parsing image URL for deletion:', error);
      // Don't throw - this shouldn't block the main operation
    }
  },

  // Parse recipe from text (delegates to recipe-parser)
  parseRecipeFromText,
};

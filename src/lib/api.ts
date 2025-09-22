import { supabase } from './supabase';
import type { Recipe, PublicRecipe, RecipeFilters } from './types';
import { parseRecipeFromText } from './recipe-parser';
import { trackAPIError } from './error-tracking';
import { IngredientMatcher } from './groceries/ingredient-matcher';
import { getUserGroceries } from './user-preferences';
import { handleError } from './api/shared/error-handling';
import { versioningApi } from './api/features/versioning-api';

// Configuration constants for ingredient filtering
const INGREDIENT_MATCH_CONFIDENCE_THRESHOLD = 50; // Minimum confidence score for ingredient matching (0-100)

// Simple string-based fallback matching (mirrors explore page)
function applySimpleIngredientFilter(
  list: Recipe[],
  selected: string[]
): Recipe[] {
  const selectedIngredientsSet = new Set(
    selected.map((s) => s.toLowerCase().trim())
  );
  return list.filter((recipe) =>
    recipe.ingredients.some((recipeIngredient) =>
      selectedIngredientsSet.has(recipeIngredient.toLowerCase().trim())
    )
  );
}

// Type for profile summary data used in API responses
interface ProfileSummary {
  id: string;
  full_name: string | null;
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
          const isIngredientMatch = (
            matchedGroceryIngredient: string,
            selectedIngredients: string[]
          ): boolean => {
            const normalizedMatched = matchedGroceryIngredient
              .toLowerCase()
              .trim();

            return selectedIngredients.some((selectedIngredient) => {
              const normalizedSelected = selectedIngredient
                .toLowerCase()
                .trim();

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
              return selectedWords.some((selectedWord) =>
                matchedWords.some(
                  (matchedWord) =>
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
                isIngredientMatch(
                  match.matchedGroceryIngredient,
                  filters.availableIngredients!
                )
              );
            });
          });
        } else {
          // Fall back to simple string matching when no grocery data is available
          // This matches the behavior of the explore page
          recipes = applySimpleIngredientFilter(
            recipes,
            filters.availableIngredients
          );
        }
      } catch (error) {
        console.warn(
          'Failed to apply client-side ingredient filtering:',
          error
        );
        // Fall back to simple string matching if there's an error
        recipes = applySimpleIngredientFilter(
          recipes,
          filters.availableIngredients
        );
      }
    }

    return recipes;
  },

  // Get a single recipe by ID (user's own recipes only)
  async getRecipe(id: string): Promise<Recipe | null> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) handleError(error, 'Get recipe');
    return data;
  },

  // Get a single public recipe by ID (any public recipe)
  async getPublicRecipe(id: string): Promise<PublicRecipe | null> {
    console.log('🔍 [API] getPublicRecipe called with ID:', id);

    // Input validation
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('❌ [API] getPublicRecipe: Invalid ID provided:', id);
      throw new Error('Recipe ID is required and must be a non-empty string');
    }

    try {
      // Step 1: Fetch the recipe
      console.log('📋 [API] Fetching public recipe from database...');
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id.trim())
        .eq('is_public', true)
        .single();

      if (recipeError) {
        console.error('❌ [API] Recipe fetch error:', {
          code: recipeError.code,
          message: recipeError.message,
          details: recipeError.details,
          hint: recipeError.hint,
          recipeId: id,
        });

        // Handle specific error cases
        if (recipeError.code === 'PGRST116') {
          console.log('📝 [API] Recipe not found or not public:', id);
          return null;
        }

        handleError(recipeError, 'Get public recipe');
      }

      if (!recipe) {
        console.log('📝 [API] No recipe found for ID:', id);
        return null;
      }

      console.log('✅ [API] Recipe found:', {
        id: recipe.id,
        title: recipe.title,
        isPublic: recipe.is_public,
        userId: recipe.user_id,
      });

      // Step 2: Fetch author profile (with graceful fallback)
      console.log('👤 [API] Fetching author profile for user:', recipe.user_id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', recipe.user_id)
        .single();

      if (profileError) {
        console.warn('⚠️ [API] Could not fetch author name:', {
          code: profileError.code,
          message: profileError.message,
          userId: recipe.user_id,
          recipeId: id,
        });
        trackAPIError('Fetch author profile for public recipe', profileError);
      }

      const authorName = profile?.full_name || 'Anonymous';
      console.log('✅ [API] Author resolved:', authorName);

      const result = {
        ...recipe,
        author_name: authorName,
      } as PublicRecipe;

      console.log('🎉 [API] getPublicRecipe success:', {
        id: result.id,
        title: result.title,
        author: result.author_name,
      });

      return result;
    } catch (error) {
      console.error('💥 [API] getPublicRecipe unexpected error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recipeId: id,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
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

  // Fetch public recipes with aggregate stats for explore page
  async getPublicRecipesWithStats(): Promise<
    (PublicRecipe & {
      aggregate_rating?: number | null;
      total_ratings?: number;
      total_views?: number;
      total_versions?: number;
      latest_version?: number;
    })[]
  > {
    // Get recipes with aggregate stats
    const { data: aggregateData, error: aggregateError } = await supabase
      .from('recipe_aggregate_stats')
      .select('*')
      .order('aggregate_avg_rating', { ascending: false, nullsFirst: false })
      .order('total_views', { ascending: false });

    // If the aggregate view does not exist (e.g., after cleanup), gracefully fallback
    if (aggregateError) {
      console.warn(
        '[Explore] Falling back to basic public recipes due to aggregate view error:',
        aggregateError
      );
      return this.getPublicRecipes();
    }

    if (!aggregateData || aggregateData.length === 0) {
      // Fallback to regular public recipes if no aggregate data
      return this.getPublicRecipes();
    }

    // Get the latest version recipes for each original recipe
    const originalIds = aggregateData.map((item) => item.original_recipe_id);
    const { data: latestRecipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .in('id', originalIds)
      .eq('is_public', true);

    if (recipesError) handleError(recipesError, 'Get latest recipes');

    // Get profiles for authors
    const userIds = [
      ...new Set(latestRecipes?.map((recipe) => recipe.user_id) || []),
    ];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError)
      handleError(profilesError, 'Get profiles for aggregate recipes');

    // Create profile map
    const profileMap = new Map(
      (profiles || []).map((profile: { id: string; full_name: string }) => [
        profile.id,
        profile.full_name,
      ])
    );

    // Combine data
    const combinedData = (latestRecipes || []).map((recipe) => {
      const stats = aggregateData.find(
        (item) => item.original_recipe_id === recipe.id
      );
      return {
        ...recipe,
        author_name: profileMap.get(recipe.user_id) || 'Unknown Author',
        aggregate_rating: stats?.aggregate_avg_rating,
        total_ratings: stats?.total_ratings || 0,
        total_views: stats?.total_views || 0,
        total_versions: stats?.total_versions || 1,
        latest_version: stats?.latest_version || 1,
      };
    });

    return combinedData;
  },

  // Fetch highest-rated public recipes for featured content
  async getHighestRatedPublicRecipes(
    limit: number = 10
  ): Promise<PublicRecipe[]> {
    const { data, error } = await supabase
      .from('recipe_rating_stats')
      .select(
        `
        recipe_id,
        title,
        creator_rating,
        community_rating_count,
        community_rating_average,
        is_public,
        created_at
      `
      )
      .eq('is_public', true)
      .not('creator_rating', 'is', null)
      .gte('creator_rating', 4) // Only show high-rated recipes (4+ stars)
      .order('creator_rating', { ascending: false })
      .order('community_rating_average', { ascending: false })
      .order('community_rating_count', { ascending: false })
      .limit(limit);

    if (error) handleError(error, 'Get highest rated public recipes');
    if (!data || data.length === 0) {
      // Fallback to regular public recipes if no ratings exist yet
      return this.getPublicRecipes();
    }

    // Get the full recipe data for these high-rated recipes
    const recipeIds = data.map((item) => item.recipe_id);
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recipeIds)
      .eq('is_public', true)
      .not('image_url', 'is', null)
      .neq('image_url', '');

    if (recipesError) handleError(recipesError, 'Get recipe details');
    if (!recipes || recipes.length === 0) {
      // Fallback if no recipes with images
      return this.getPublicRecipes();
    }

    // Get profiles for authors
    const userIds = [...new Set(recipes.map((recipe) => recipe.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError)
      handleError(profilesError, 'Get profiles for highest rated');

    // Create profile map
    const profileMap = new Map(
      (profiles || []).map((profile: ProfileSummary) => [
        profile.id,
        profile.full_name,
      ])
    );

    // Combine recipes with profile data and maintain rating order
    const recipeMap = new Map(
      recipes.map((recipe) => [
        recipe.id,
        {
          ...recipe,
          author_name: profileMap.get(recipe.user_id) || 'Unknown Author',
        },
      ])
    );

    // Return recipes in rating order
    return data
      .map((item) => recipeMap.get(item.recipe_id))
      .filter((recipe) => recipe !== undefined) as PublicRecipe[];
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
      // Create the recipe first
      const { data, error } = await supabase
        .from('recipes')
        .insert({ ...recipe, user_id: user.id, is_public: false })
        .select()
        .single();

      if (error) {
        console.error('Supabase create recipe error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // 🎯 CRITICAL: Automatically create Version 0 (Original Recipe) for new recipes
      console.log(
        '🔄 [createRecipe] Creating Version 0 for new recipe:',
        data.title
      );

      const { error: versionError } = await supabase
        .from('recipe_content_versions')
        .insert({
          recipe_id: data.id,
          version_number: 0,
          version_name: 'Original Recipe',
          changelog: 'Initial recipe version',
          title: data.title,
          ingredients: data.ingredients,
          instructions: data.instructions,
          notes: data.notes,
          setup: data.setup,
          categories: data.categories,
          cooking_time: data.cooking_time,
          difficulty: data.difficulty,
          creator_rating: data.creator_rating,
          image_url: data.image_url,
          created_by: user.id,
          is_published: true, // Original is always published
        });

      if (versionError) {
        console.error(
          '❌ Failed to create Version 0 for new recipe:',
          versionError
        );
        // Don't fail the recipe creation, but log the error
        console.warn(
          'Recipe created but Version 0 creation failed. This may cause versioning issues.'
        );
      } else {
        console.log('✅ Version 0 created successfully for new recipe');
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

  // Creator Rating API
  async updateCreatorRating(recipeId: string, rating: number): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('recipes')
      .update({ creator_rating: rating })
      .eq('id', recipeId)
      .eq('user_id', user.id); // Only allow updating own recipes

    if (error) handleError(error, 'Update creator rating');
  },

  // Community Rating API
  async getCommunityRating(recipeId: string): Promise<{
    average: number;
    count: number;
    userRating?: number;
  }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get community rating stats
    const { data: stats, error: statsError } = await supabase
      .from('recipe_rating_stats')
      .select('community_rating_average, community_rating_count')
      .eq('recipe_id', recipeId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      handleError(statsError, 'Get community rating stats');
    }

    // Get user's rating if authenticated
    let userRating: number | undefined;
    if (user) {
      const { data: userRatingData, error: userError } = await supabase
        .from('recipe_ratings')
        .select('rating')
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        handleError(userError, 'Get user rating');
      }

      userRating = userRatingData?.rating;
    }

    return {
      average: stats?.community_rating_average || 0,
      count: stats?.community_rating_count || 0,
      userRating,
    };
  },

  async submitCommunityRating(recipeId: string, rating: number): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.from('recipe_ratings').upsert({
      recipe_id: recipeId,
      user_id: user.id,
      rating,
      updated_at: new Date().toISOString(),
    });

    if (error) handleError(error, 'Submit community rating');
  },

  // PHASE 2: ENHANCED DISCOVERY & ANALYTICS

  // Get trending recipes based on recent engagement
  async getTrendingRecipes(limit: number = 10): Promise<
    (PublicRecipe & {
      trend_score?: number;
      recent_ratings?: number;
      recent_views?: number;
    })[]
  > {
    // Calculate trending score based on recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: trendingData, error } = await supabase
      .from('recipe_version_stats')
      .select(
        `
        recipe_id,
        title,
        version_number,
        creator_rating,
        owner_id,
        version_rating_count,
        version_avg_rating,
        version_view_count,
        created_at,
        updated_at
      `
      )
      .eq('is_public', true)
      .gte('updated_at', sevenDaysAgo.toISOString())
      .order('version_rating_count', { ascending: false })
      .order('version_view_count', { ascending: false })
      .limit(limit * 2); // Get more to filter and calculate trends

    if (error) handleError(error, 'Get trending recipes');

    if (!trendingData || trendingData.length === 0) {
      // Fallback to highest rated if no recent activity
      return this.getHighestRatedPublicRecipes(limit);
    }

    // Calculate trend scores (combination of recent ratings and views)
    const recipesWithTrends = trendingData
      .map((recipe) => ({
        ...recipe,
        trend_score:
          recipe.version_rating_count * 3 + recipe.version_view_count,
        recent_ratings: recipe.version_rating_count,
        recent_views: recipe.version_view_count,
      }))
      .sort((a, b) => b.trend_score - a.trend_score)
      .slice(0, limit);

    // Get full recipe data
    const recipeIds = recipesWithTrends.map((item) => item.recipe_id);
    const { data: fullRecipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recipeIds)
      .eq('is_public', true);

    if (recipesError) handleError(recipesError, 'Get full trending recipes');

    // Get author profiles
    const userIds = [
      ...new Set(fullRecipes?.map((recipe) => recipe.user_id) || []),
    ];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError)
      handleError(profilesError, 'Get trending recipe authors');

    const profileMap = new Map(
      (profiles || []).map((profile: { id: string; full_name: string }) => [
        profile.id,
        profile.full_name,
      ])
    );

    // Combine data maintaining trend order
    const recipeMap = new Map(
      (fullRecipes || []).map((recipe) => [
        recipe.id,
        {
          ...recipe,
          author_name: profileMap.get(recipe.user_id) || 'Unknown Author',
        },
      ])
    );

    return recipesWithTrends
      .map((trendData) => {
        const recipe = recipeMap.get(trendData.recipe_id);
        return recipe
          ? {
              ...recipe,
              trend_score: trendData.trend_score,
              recent_ratings: trendData.recent_ratings,
              recent_views: trendData.recent_views,
            }
          : null;
      })
      .filter((recipe) => recipe !== null) as (PublicRecipe & {
      trend_score?: number;
      recent_ratings?: number;
      recent_views?: number;
    })[];
  },

  // Get recipe engagement analytics for creators
  // Simple recipe analytics using clean API
  async getRecipeAnalytics(recipeId: string): Promise<{
    version_count: number;
    recent_activity: {
      ratings_this_week: number;
      views_this_week: number;
      comments_this_week: number;
    };
    top_comments: Array<{ id: string; comment: string; created_at: string }>;
  } | null> {
    try {
      // Get version count using clean API
      const versionCount = await this.getVersionCount(recipeId);

      // Calculate recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentRatings } = await supabase
        .from('recipe_ratings')
        .select('id, comment, created_at')
        .eq('recipe_id', recipeId)
        .gte('created_at', sevenDaysAgo.toISOString());

      const { data: recentViews } = await supabase
        .from('recipe_views')
        .select('id')
        .eq('recipe_id', recipeId)
        .gte('viewed_at', sevenDaysAgo.toISOString());

      // Get top comments (highest rated comments)
      const { data: topComments } = await supabase
        .from('recipe_ratings')
        .select('*')
        .eq('recipe_id', recipeId)
        .not('comment', 'is', null)
        .neq('comment', '')
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        version_count: versionCount,
        recent_activity: {
          ratings_this_week: recentRatings?.length || 0,
          views_this_week: recentViews?.length || 0,
          comments_this_week:
            recentRatings?.filter((r) => r.comment && r.comment.trim() !== '')
              .length || 0,
        },
        top_comments: topComments || [],
      };
    } catch (error) {
      console.error('Failed to get recipe analytics:', error);
      return null;
    }
  },

  // Get user profile by ID (for comment system)
  async getUserProfile(
    userId: string
  ): Promise<{ id: string; full_name: string; avatar_url?: string } | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to get user profile:', error);
      return null;
    }

    return data;
  },

  // VERSIONING API - using clean implementation
  ...versioningApi,
};
// Formatting fix

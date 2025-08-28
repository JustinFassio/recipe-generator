import { supabase } from './supabase';
import type { Recipe, PublicRecipe, RecipeFilters } from './types';
import { parseRecipeFromText } from './recipe-parser';

// Type for profile summary data used in API responses
interface ProfileSummary {
  id: string;
  full_name: string | null;
}

// Simple error handler
function handleError(error: unknown, operation: string): never {
  console.error(`${operation} error:`, error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`${operation} failed: ${errorMessage}`);
}

export const recipeApi = {
  // Fetch all recipes for the current user with optional filters
  async getUserRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase.from('recipes').select('*').eq('user_id', user.id);

    // Apply search filter
    if (filters?.searchTerm) {
      // Use separate queries to avoid SQL injection
      const searchTerm = filters.searchTerm.toLowerCase();

      // Create separate queries for each search field
      const titleQuery = supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .ilike('title', `%${searchTerm}%`);

      const instructionsQuery = supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .ilike('instructions', `%${searchTerm}%`);

      const ingredientsQuery = supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .contains('ingredients', [searchTerm]);

      // Execute all queries and combine results
      const [titleResults, instructionsResults, ingredientsResults] =
        await Promise.all([titleQuery, instructionsQuery, ingredientsQuery]);

      // Combine and deduplicate results
      const allResults = [
        ...(titleResults.data || []),
        ...(instructionsResults.data || []),
        ...(ingredientsResults.data || []),
      ];

      // Remove duplicates based on recipe ID
      const uniqueResults = allResults.filter(
        (recipe, index, self) =>
          index === self.findIndex((r) => r.id === recipe.id)
      );

      // Apply other filters to the combined results
      let filteredResults = uniqueResults;

      // Apply category filter
      if (filters?.categories?.length) {
        filteredResults = filteredResults.filter((recipe) =>
          recipe.categories?.some((cat) => filters.categories!.includes(cat))
        );
      }

      // Apply cuisine filter
      if (filters?.cuisine?.length) {
        const cuisineCategories = filters.cuisine.map((c) => `Cuisine: ${c}`);
        filteredResults = filteredResults.filter((recipe) =>
          recipe.categories?.some((cat) => cuisineCategories.includes(cat))
        );
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'date';
      const sortOrder = filters?.sortOrder || 'desc';

      filteredResults.sort((a, b) => {
        if (sortBy === 'title') {
          return sortOrder === 'asc'
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        } else {
          // Default to date sorting
          return sortOrder === 'asc'
            ? new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime();
        }
      });

      return filteredResults;
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

    // Apply sorting
    const sortBy = filters?.sortBy || 'date';
    const sortOrder = filters?.sortOrder || 'desc';

    if (sortBy === 'date') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'title') {
      query = query.order('title', { ascending: sortOrder === 'asc' });
    } else {
      // Default to date sorting
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) handleError(error, 'Get user recipes');
    return data || [];
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

  // Fetch public recipes for the Explore feed
  async getPublicRecipes(): Promise<PublicRecipe[]> {
    // Get all public recipes
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (recipesError) handleError(recipesError, 'Get public recipes');
    if (!recipes || recipes.length === 0) return [];

    // Get unique user IDs from recipes
    const userIds = [
      ...new Set(recipes.map((recipe: Recipe) => recipe.user_id)),
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
    return recipes.map((recipe: Recipe) => ({
      ...recipe,
      author_name: profileMap.get(recipe.user_id) || 'Unknown Author',
    }));
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('recipes')
      .insert({ ...recipe, user_id: user.id, is_public: false })
      .select()
      .single();

    if (error) handleError(error, 'Create recipe');
    return data;
  },

  // Update an existing recipe
  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error, 'Update recipe');
    return data;
  },

  // Delete a recipe
  async deleteRecipe(id: string): Promise<void> {
    const { error } = await supabase.from('recipes').delete().eq('id', id);

    if (error) handleError(error, 'Delete recipe');
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

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, file);

    if (uploadError) handleError(uploadError, 'Upload image');

    const { data } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  // Parse recipe from text (delegates to recipe-parser)
  parseRecipeFromText,
};

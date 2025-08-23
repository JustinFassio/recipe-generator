import { supabase } from './supabase';
import type { Recipe, PublicRecipe } from './types';
import { parseRecipeFromText } from './recipe-parser';

// Type for profile summary data used in API responses
interface ProfileSummary {
  id: string;
  full_name: string | null;
}

// Simple error handler
function handleError(error: unknown, operation: string): never {
  console.error(`${operation} error:`, error);

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = (error as { message: string }).message;
    throw new Error(`${operation} failed: ${errorMessage}`);
  }

  // Handle PostgrestError
  if (error && typeof error === 'object' && 'details' in error) {
    const details =
      (error as { details?: string }).details || 'Unknown database error';
    throw new Error(`${operation} failed: ${details}`);
  }

  // Fallback
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`${operation} failed: ${errorMessage}`);
}

export const recipeApi = {
  // Fetch all recipes for the current user
  async getUserRecipes(): Promise<Recipe[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('recipes')
      .update({ is_public: isPublic })
      .eq('id', recipeId)
      .eq('user_id', user.id); // Ensure user owns the recipe

    if (error) handleError(error, 'Toggle recipe public status');
  },

  // Get recipe sharing status
  async getRecipeSharingStatus(recipeId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('recipes')
      .select('is_public')
      .eq('id', recipeId)
      .eq('user_id', user.id) // Ensure user owns the recipe
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the recipe
      .select()
      .single();

    if (error) handleError(error, 'Update recipe');
    return data;
  },

  // Delete a recipe
  async deleteRecipe(id: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user owns the recipe

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

import { supabase } from '../../supabase';
import type { PublicRecipe, Recipe } from '../../types';
import { handleError } from '../shared/error-handling';

// Type for profile summary data used in API responses
interface ProfileSummary {
  id: string;
  full_name: string | null;
}

/**
 * Public Recipe API - Operations for public recipes and community features
 */
export const publicRecipeApi = {
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
        // Note: trackAPIError is not available in this module, but this is just a warning
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

  // Fetch public recipes for the Explore feed
  async getPublicRecipes(): Promise<PublicRecipe[]> {
    // Optimize: Only select fields needed for public recipe cards to reduce data transfer
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select(
        'id, title, description, ingredients, instructions, notes, image_url, categories, cooking_time, difficulty, user_id, created_at'
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

  // Save (clone) a public recipe to user's collection
  async savePublicRecipe(recipeId: string): Promise<Recipe> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) throw new Error('User not authenticated');
    const user = authData.user;

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
};

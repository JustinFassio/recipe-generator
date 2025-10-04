import { supabase } from '../../supabase';
import type { Recipe } from '../../types';
import { handleError } from '../shared/error-handling';

/**
 * Core Recipe API - Basic CRUD operations for recipes
 */
export const recipeApi = {
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

  // Get recipe summary (optimized for list views)
  async getRecipeSummary(id: string): Promise<Partial<Recipe> | null> {
    const { data, error } = await supabase
      .from('recipes')
      .select(
        'id, title, description, ingredients, categories, cooking_time, difficulty, is_public, created_at, updated_at'
      )
      .eq('id', id)
      .single();

    if (error) handleError(error, 'Get recipe summary');
    return data;
  },

  // Create a new recipe
  async createRecipe(
    recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Recipe> {
    // Check network connectivity (only in browser environment)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error(
        'No internet connection. Please check your network and try again.'
      );
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) throw new Error('User not authenticated');
    const user = authData.user;

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

  // Creator Rating API
  async updateCreatorRating(recipeId: string, rating: number): Promise<void> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) throw new Error('User not authenticated');
    const user = authData.user;

    const { error } = await supabase
      .from('recipes')
      .update({ creator_rating: rating })
      .eq('id', recipeId)
      .eq('user_id', user.id); // Only allow updating own recipes

    if (error) handleError(error, 'Update creator rating');
  },
};

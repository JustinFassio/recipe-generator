import { supabase } from '../../supabase';
import type { RecipeImage } from '../../types';
import { handleError } from '../shared/error-handling';

/**
 * Image Gallery API - Operations for managing recipe images
 */
export const imageGalleryApi = {
  // Get all images for a recipe
  async getRecipeImages(recipeId: string): Promise<RecipeImage[]> {
    const { data, error } = await supabase
      .from('recipe_images')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('display_order', { ascending: true });

    if (error) handleError(error, 'Get recipe images');
    return data || [];
  },

  // Get the primary image for a recipe
  async getPrimaryRecipeImage(recipeId: string): Promise<RecipeImage | null> {
    const { data, error } = await supabase
      .from('recipe_images')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('is_primary', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      handleError(error, 'Get primary recipe image');
    }
    return data || null;
  },

  // Add a new image to a recipe
  async addRecipeImage(imageData: Omit<RecipeImage, 'id' | 'created_at' | 'updated_at'>): Promise<RecipeImage> {
    const { data, error } = await supabase
      .from('recipe_images')
      .insert(imageData)
      .select()
      .single();

    if (error) handleError(error, 'Add recipe image');
    return data;
  },

  // Update an existing recipe image
  async updateRecipeImage(imageId: string, updates: Partial<RecipeImage>): Promise<RecipeImage> {
    const { data, error } = await supabase
      .from('recipe_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();

    if (error) handleError(error, 'Update recipe image');
    return data;
  },

  // Delete a recipe image
  async deleteRecipeImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('recipe_images')
      .delete()
      .eq('id', imageId);

    if (error) handleError(error, 'Delete recipe image');
  },

  // Set an image as the primary image for a recipe
  async setPrimaryImage(recipeId: string, imageId: string): Promise<void> {
    // First, unset all primary images for this recipe
    await supabase
      .from('recipe_images')
      .update({ is_primary: false })
      .eq('recipe_id', recipeId);

    // Then set the specified image as primary
    const { error } = await supabase
      .from('recipe_images')
      .update({ is_primary: true })
      .eq('id', imageId)
      .eq('recipe_id', recipeId);

    if (error) handleError(error, 'Set primary image');
  },

  // Reorder images for a recipe
  async reorderRecipeImages(recipeId: string, imageOrders: { id: string; display_order: number }[]): Promise<void> {
    const updates = imageOrders.map(({ id, display_order }) =>
      supabase
        .from('recipe_images')
        .update({ display_order })
        .eq('id', id)
        .eq('recipe_id', recipeId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      handleError(errors[0].error, 'Reorder recipe images');
    }
  },

  // Upload recipe image
  async uploadImage(file: File): Promise<string> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) throw new Error('User not authenticated');
    const user = authData.user;

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
};

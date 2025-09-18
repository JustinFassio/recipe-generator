import { supabase } from '../../supabase';
import type { RecipeVersion, Recipe } from '../../types';
import { handleError } from '../shared/error-handling';

/**
 * CLEAN VERSIONING API - NO MORE PARENT-CHILD TRAVERSAL HELL!
 * 
 * Simple, straightforward functions that work with the new clean schema:
 * - recipes table: Contains only current/published content (one entry per recipe)
 * - recipe_content_versions table: Contains historical version snapshots
 */
export const versioningApi = {
  
  /**
   * Get all versions of a recipe (SIMPLE!)
   * No more complex family traversal - just direct lookup by recipe_id
   */
  async getRecipeVersions(recipeId: string): Promise<RecipeVersion[]> {
    const { data, error } = await supabase
      .from('recipe_content_versions')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('version_number', { ascending: false }); // Newest first

    if (error) handleError(error, 'Get recipe versions');
    return data || [];
  },

  /**
   * Get a specific version by ID (SIMPLE!)
   */
  async getVersion(versionId: string): Promise<RecipeVersion | null> {
    const { data, error } = await supabase
      .from('recipe_content_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      handleError(error, 'Get version');
    }
    return data;
  },

  /**
   * Create new version (SIMPLE!)
   * Takes current recipe content + changes, creates new version snapshot
   */
  async createVersion(
    recipeId: string, 
    versionData: {
      name: string;
      changelog: string;
      title?: string;
      ingredients?: string[];
      instructions?: string;
      notes?: string;
      setup?: string[];
      categories?: string[];
      cooking_time?: string;
      difficulty?: string;
      creator_rating?: number;
      image_url?: string;
    }
  ): Promise<RecipeVersion> {
    // Get current recipe content
    const { data: currentRecipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (recipeError) handleError(recipeError, 'Get current recipe for versioning');

    // Get next version number
    const { data: maxVersionData } = await supabase
      .from('recipe_content_versions')
      .select('version_number')
      .eq('recipe_id', recipeId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const isFirstVersion = !maxVersionData;
    const nextVersionNumber = (maxVersionData?.version_number || 0) + 1;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // 🎯 CRITICAL FIX: If this is the first version, create "Version 0" (original) first
    if (isFirstVersion) {
      console.log('🔄 [createVersion] First version detected - creating Version 0 (original recipe)');
      
      // Create Version 0 with the original recipe content
      const { error: originalVersionError } = await supabase
        .from('recipe_content_versions')
        .insert({
          recipe_id: recipeId,
          version_number: 0,
          version_name: 'Original Recipe',
          changelog: 'Initial recipe version',
          title: currentRecipe.title,
          ingredients: currentRecipe.ingredients,
          instructions: currentRecipe.instructions,
          notes: currentRecipe.notes,
          setup: currentRecipe.setup,
          categories: currentRecipe.categories,
          cooking_time: currentRecipe.cooking_time,
          difficulty: currentRecipe.difficulty,
          creator_rating: currentRecipe.creator_rating,
          image_url: currentRecipe.image_url,
          created_by: user.id,
          is_published: true // Original is always published
        });

      if (originalVersionError) {
        console.error('❌ Failed to create Version 0:', originalVersionError);
        handleError(originalVersionError, 'Create original version (Version 0)');
      } else {
        console.log('✅ Version 0 (original recipe) created successfully');
      }
    }

    // Create new version with current content + changes
    const { data, error } = await supabase
      .from('recipe_content_versions')
      .insert({
        recipe_id: recipeId,
        version_number: nextVersionNumber,
        version_name: versionData.name,
        changelog: versionData.changelog,
        // Use provided changes or fall back to current recipe content
        title: versionData.title !== undefined ? versionData.title : currentRecipe.title,
        ingredients: versionData.ingredients !== undefined ? versionData.ingredients : currentRecipe.ingredients,
        instructions: versionData.instructions !== undefined ? versionData.instructions : currentRecipe.instructions,
        notes: versionData.notes !== undefined ? versionData.notes : currentRecipe.notes,
        setup: versionData.setup !== undefined ? versionData.setup : currentRecipe.setup,
        categories: versionData.categories !== undefined ? versionData.categories : currentRecipe.categories,
        cooking_time: versionData.cooking_time !== undefined ? versionData.cooking_time : currentRecipe.cooking_time,
        difficulty: versionData.difficulty !== undefined ? versionData.difficulty : currentRecipe.difficulty,
        creator_rating: versionData.creator_rating !== undefined ? versionData.creator_rating : currentRecipe.creator_rating,
        image_url: versionData.image_url !== undefined ? versionData.image_url : currentRecipe.image_url,
        created_by: user.id,
        is_published: false // New versions start as drafts
      })
      .select()
      .single();

    if (error) handleError(error, 'Create version');
    
    console.log(`✅ [createVersion] Created Version ${nextVersionNumber}: ${versionData.name}`);
    return data;
  },

  /**
   * Publish a version (make it the current version) (SIMPLE!)
   */
  async publishVersion(recipeId: string, versionId: string): Promise<void> {
    // Get the version content
    const version = await this.getVersion(versionId);
    if (!version) throw new Error('Version not found');

    // Update main recipe with version content
    const { error: recipeError } = await supabase
      .from('recipes')
      .update({
        title: version.title,
        ingredients: version.ingredients,
        instructions: version.instructions,
        notes: version.notes,
        setup: version.setup,
        categories: version.categories,
        cooking_time: version.cooking_time,
        difficulty: version.difficulty,
        creator_rating: version.creator_rating,
        image_url: version.image_url,
        current_version_id: versionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipeId);

    if (recipeError) handleError(recipeError, 'Publish version');

    // Mark this version as published and others as drafts
    await supabase
      .from('recipe_content_versions')
      .update({ is_published: false })
      .eq('recipe_id', recipeId);

    const { error: versionError } = await supabase
      .from('recipe_content_versions')
      .update({ is_published: true })
      .eq('id', versionId);

    if (versionError) handleError(versionError, 'Mark version published');
  },

  /**
   * Switch to a specific version (load version content into main recipe) (SIMPLE!)
   */
  async switchToVersion(recipeId: string, versionNumber: number): Promise<Recipe> {
    // Get the version content
    const { data: version, error: versionError } = await supabase
      .from('recipe_content_versions')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('version_number', versionNumber)
      .single();

    if (versionError) handleError(versionError, 'Get version for switching');

    // Return a Recipe object with the version content
    return {
      id: recipeId,
      title: version.title,
      ingredients: version.ingredients,
      instructions: version.instructions,
      notes: version.notes,
      setup: version.setup,
      categories: version.categories,
      cooking_time: version.cooking_time,
      difficulty: version.difficulty,
      creator_rating: version.creator_rating,
      image_url: version.image_url,
      user_id: version.created_by,
      is_public: false, // Will be fetched from main recipe if needed
      created_at: version.created_at,
      updated_at: version.created_at,
      current_version_id: version.id
    };
  },

  /**
   * Delete a version (SIMPLE!)
   */
  async deleteVersion(versionId: string): Promise<void> {
    const { error } = await supabase
      .from('recipe_content_versions')
      .delete()
      .eq('id', versionId);

    if (error) handleError(error, 'Delete version');
  },

  /**
   * Get version count for a recipe (SIMPLE!)
   */
  async getVersionCount(recipeId: string): Promise<number> {
    const { count, error } = await supabase
      .from('recipe_content_versions')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId);

    if (error) handleError(error, 'Get version count');
    return count || 0;
  },

  /**
   * Check if user owns a recipe (SIMPLE!)
   */
  async checkRecipeOwnership(recipeId: string): Promise<boolean> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return false;

    const { data, error } = await supabase
      .from('recipes')
      .select('user_id')
      .eq('id', recipeId)
      .single();

    if (error) return false;
    return data?.user_id === user.id;
  },

  /**
   * Alias for createVersion to maintain compatibility with existing frontend code
   */
  async createNewVersion(
    recipeId: string,
    versionName: string,
    changelog: string,
    recipeData?: Partial<Recipe>
  ): Promise<RecipeVersion> {
    // Convert Recipe fields to version data format, handling null values
    const versionData = {
      name: versionName,
      changelog: changelog,
      ...(recipeData && {
        title: recipeData.title,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        notes: recipeData.notes || undefined, // Convert null to undefined
        setup: recipeData.setup,
        categories: recipeData.categories,
        cooking_time: recipeData.cooking_time || undefined,
        difficulty: recipeData.difficulty || undefined,
        creator_rating: recipeData.creator_rating || undefined,
        image_url: recipeData.image_url || undefined
      })
    };
    
    return this.createVersion(recipeId, versionData);
  },

  /**
   * Get next version number for a recipe (SIMPLE!)
   */
  async getNextVersionNumber(recipeId: string): Promise<number> {
    const { data, error } = await supabase
      .from('recipe_content_versions')
      .select('version_number')
      .eq('recipe_id', recipeId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error getting next version number:', error);
      return 1;
    }

    return (data?.version_number || 0) + 1;
  }
};

import { supabase } from '../../supabase';
import type {
  Recipe,
  RecipeVersion,
  VersionStats,
  AggregateStats,
  VersionRating,
} from '../../types';
import { handleError } from '../shared/error-handling';

export const versioningApi = {
  // Get all versions of a recipe family (works with any recipe ID in the family)
  async getRecipeVersions(
    anyRecipeIdInFamily: string
  ): Promise<RecipeVersion[]> {
    // STEP 1: Find the true original recipe ID (the one with parent_recipe_id = NULL)
    const originalRecipeId =
      await this.findOriginalRecipeId(anyRecipeIdInFamily);

    // STEP 2: Get current user for ownership-based filtering
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // STEP 3: Get all recipes in the version family
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .or(`id.eq.${originalRecipeId},parent_recipe_id.eq.${originalRecipeId}`)
      // Allow viewing versions if: user owns them OR they're public
      .or(
        user ? `user_id.eq.${user.id},is_public.eq.true` : `is_public.eq.true`
      )
      .order('version_number', { ascending: false });

    if (recipesError) handleError(recipesError, 'Get recipe versions');

    // STEP 4: Get version metadata from recipe_versions table
    // Note: Original recipe (v1) won't have an entry here, only child versions (v2+)
    const { data: versionMeta, error: versionError } = await supabase
      .from('recipe_versions')
      .select('version_recipe_id, version_name, changelog')
      .eq('original_recipe_id', originalRecipeId)
      .eq('is_active', true);

    if (versionError)
      console.warn('Could not load version metadata:', versionError);

    // Create a map of version metadata
    const metaMap = new Map();
    (versionMeta || []).forEach((meta) => {
      metaMap.set(meta.version_recipe_id, {
        version_name: meta.version_name,
        changelog: meta.changelog,
      });
    });

    // Convert recipes to RecipeVersion format with metadata
    const recipeVersions: RecipeVersion[] = (recipes || []).map((recipe) => {
      const meta = metaMap.get(recipe.id) || {};

      return {
        id: recipe.id,
        original_recipe_id: originalRecipeId, // All versions share the same original_recipe_id
        version_recipe_id: recipe.id,
        version_number: recipe.version_number || 1,
        version_name: meta.version_name || null,
        changelog: meta.changelog || null,
        created_at: recipe.created_at,
        is_active: true,
        recipe: recipe,
      };
    });

    return recipeVersions;
  },

  // Get version-specific stats
  async getVersionStats(
    recipeId: string,
    versionNumber: number
  ): Promise<VersionStats | null> {
    const { data, error } = await supabase
      .from('recipe_version_stats')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('version_number', versionNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      handleError(error, 'Get version stats');
    }
    return data;
  },

  // Get aggregate stats for all versions of a recipe
  async getAggregateStats(
    anyRecipeIdInFamily: string
  ): Promise<AggregateStats | null> {
    // Find the true original recipe ID first
    const originalRecipeId =
      await this.findOriginalRecipeId(anyRecipeIdInFamily);

    const { data, error } = await supabase
      .from('recipe_aggregate_stats')
      .select('*')
      .eq('original_recipe_id', originalRecipeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      handleError(error, 'Get aggregate stats');
    }
    return data;
  },

  // Create new version (owner only)
  async createNewVersion(
    originalRecipeId: string,
    recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    versionName?: string,
    changelog?: string
  ): Promise<Recipe> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get next version number
    const { data: nextVersionData, error: versionError } = await supabase.rpc(
      'get_next_version_number',
      { original_id: originalRecipeId }
    );

    if (versionError) handleError(versionError, 'Get next version number');
    const nextVersion = nextVersionData || 2;

    // Create the new recipe version
    const { data: newRecipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        ...recipeData,
        user_id: user.id,
        version_number: nextVersion,
        parent_recipe_id: originalRecipeId,
        is_version: true,
      })
      .select()
      .single();

    if (recipeError) handleError(recipeError, 'Create new recipe version');

    // Add to recipe_versions tracking table
    const { error: versionTrackingError } = await supabase
      .from('recipe_versions')
      .insert({
        original_recipe_id: originalRecipeId,
        version_recipe_id: newRecipe.id,
        version_number: nextVersion,
        version_name: versionName,
        changelog: changelog,
      });

    if (versionTrackingError)
      handleError(versionTrackingError, 'Track recipe version');

    return newRecipe;
  },

  // Get next version number for a recipe
  async getNextVersionNumber(anyRecipeIdInFamily: string): Promise<number> {
    // Find the true original recipe ID first
    const originalRecipeId =
      await this.findOriginalRecipeId(anyRecipeIdInFamily);

    const { data, error } = await supabase.rpc('get_next_version_number', {
      original_id: originalRecipeId,
    });

    if (error) {
      console.error('Error getting next version number:', error);
      return 2; // fallback
    }

    return data || 2;
  },

  // Rate specific version
  async rateVersion(
    recipeId: string,
    versionNumber: number,
    rating: number,
    comment?: string
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.from('recipe_ratings').upsert({
      recipe_id: recipeId,
      user_id: user.id,
      version_number: versionNumber,
      rating,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    });

    if (error) handleError(error, 'Rate recipe version');
  },

  // Get version-specific ratings
  async getVersionRatings(
    recipeId: string,
    versionNumber: number
  ): Promise<VersionRating[]> {
    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('version_number', versionNumber)
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'Get version ratings');
    return data || [];
  },

  // Track view for specific version
  async trackVersionView(
    recipeId: string,
    versionNumber: number
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return; // Only track views for logged-in users

    const { error } = await supabase.from('recipe_views').upsert(
      {
        recipe_id: recipeId,
        version_number: versionNumber,
        user_id: user.id,
        viewed_at: new Date().toISOString(),
        viewed_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      },
      {
        onConflict: 'recipe_id,version_number,user_id,viewed_date',
        ignoreDuplicates: true,
      }
    );

    // Don't throw errors for view tracking failures
    if (error) {
      console.warn('Failed to track recipe view:', error);
    }
  },

  // Get user's rating for a specific version
  async getUserVersionRating(
    recipeId: string,
    versionNumber: number
  ): Promise<VersionRating | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('version_number', versionNumber)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      handleError(error, 'Get user version rating');
    }
    return data;
  },

  // Check if user owns a recipe (for version creation permissions)
  async checkRecipeOwnership(recipeId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('recipes')
      .select('user_id')
      .eq('id', recipeId)
      .single();

    if (error) return false;
    return data?.user_id === user.id;
  },

  // 🎯 NEW UTILITY: Find the original recipe ID from any recipe in the version family
  // This fixes Issue 1 by ensuring we always query with the correct original ID
  async findOriginalRecipeId(anyRecipeIdInFamily: string): Promise<string> {
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('id, parent_recipe_id')
      .eq('id', anyRecipeIdInFamily)
      .single();

    if (error) handleError(error, 'Find original recipe ID');

    // If this recipe has no parent, it IS the original
    // If it has a parent, the parent is the original
    return recipe.parent_recipe_id || recipe.id;
  },
};

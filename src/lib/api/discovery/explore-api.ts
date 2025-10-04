import { supabase } from '../../supabase';
import type { PublicRecipe } from '../../types';
import { handleError } from '../shared/error-handling';

// Typed row for the recipe_aggregate_stats view
interface AggregateStatsRow {
  id: string;
  title: string;
  is_public: boolean;
  aggregate_avg_rating: number | null;
  total_ratings: number;
  total_views: number;
  total_versions: number;
  latest_version: number;
}

// Type for profile summary data used in API responses
interface ProfileSummary {
  id: string;
  full_name: string | null;
}

/**
 * Explore API - Operations for recipe discovery and trending content
 */
export const exploreApi = {
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

    if (aggregateError) {
      console.warn(
        '[Explore] Falling back to basic public recipes due to aggregate view error:',
        aggregateError
      );
      return this.getPublicRecipes(); // Graceful fallback
    }

    if (!aggregateData || aggregateData.length === 0) {
      // Fallback to regular public recipes if no aggregate data
      return this.getPublicRecipes();
    }

    const typedAggregate: AggregateStatsRow[] =
      (aggregateData as unknown as AggregateStatsRow[]) || [];

    // Get the latest version recipes for each recipe (view now exposes `id`)
    const originalIds = (typedAggregate || [])
      .map((item) => item.id)
      .filter((id) => typeof id === 'string' && id.trim() !== '');

    if (!originalIds.length) {
      // Safety: if view returns no usable IDs, fall back gracefully
      return this.getPublicRecipes();
    }
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
      const stats = (typedAggregate || []).find(
        (item) => item.id === recipe.id
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

  // Helper method to get version count
  async getVersionCount(recipeId: string): Promise<number> {
    const { count, error } = await supabase
      .from('recipe_content_versions')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId);

    if (error) handleError(error, 'Get version count');
    return count || 0;
  },

  // Fallback method for basic public recipes
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
};

import { supabase } from '../../supabase';
import { handleError } from '../shared/error-handling';

/**
 * Rating API - Operations for recipe ratings and comments
 */
export const ratingApi = {
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
    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) throw new Error('User not authenticated');
    const user = authData.user;

    const { error } = await supabase.from('recipe_ratings').upsert({
      recipe_id: recipeId,
      user_id: user.id,
      rating,
      updated_at: new Date().toISOString(),
    });

    if (error) handleError(error, 'Submit community rating');
  },

  // Get comments for a recipe
  async getComments(recipeId: string): Promise<{
    id: string;
    user_id: string;
    comment: string;
    rating?: number;
    created_at: string;
    updated_at: string;
    user_profile?: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
  }[]> {
    const { data, error } = await supabase
      .from('recipe_comments')
      .select(`
        id,
        user_id,
        comment,
        rating,
        created_at,
        updated_at,
        profiles!inner(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get comments:', error);
      return [];
    }

    // Transform the data to match the expected type
    return (data || []).map((comment: Record<string, any>) => ({
      id: comment.id,
      user_id: comment.user_id,
      comment: comment.comment,
      rating: comment.rating,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user_profile: comment.profiles ? {
        id: comment.profiles.id,
        full_name: comment.profiles.full_name,
        avatar_url: comment.profiles.avatar_url,
      } : undefined,
    }));
  },

  // Submit a comment for a recipe
  async submitComment(recipeId: string, comment: string, rating?: number): Promise<void> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) throw new Error('User not authenticated');
    const user = authData.user;

    const { error } = await supabase.from('recipe_comments').insert({
      recipe_id: recipeId,
      user_id: user.id,
      comment,
      rating,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) handleError(error, 'Submit comment');
  },

  // Get user's rating for a specific version
  async getUserVersionRating(
    recipeId: string,
    versionNumber: number
  ): Promise<{
    rating: number;
    comment?: string;
  } | null> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) return null;
    const user = authData.user;

    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('rating, comment')
      .eq('recipe_id', recipeId)
      .eq('user_id', user.id)
      .eq('version_number', versionNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to get user version rating:', error);
      return null;
    }

    return data ? {
      rating: data.rating,
      comment: data.comment,
    } : null;
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
};
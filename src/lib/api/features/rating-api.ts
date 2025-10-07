import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/api/shared/error-handling';

export interface CommentRow {
  id: string;
  recipe_id: string;
  version_number: number | null;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export const ratingApi = {
  async submitRating(
    recipeId: string,
    versionNumber: number | null,
    rating: number,
    comment?: string
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated to rate');

    const payload: Record<string, unknown> = {
      recipe_id: recipeId,
      version_number: versionNumber,
      user_id: user.id,
      rating,
      updated_at: new Date().toISOString(),
    };
    if (typeof comment === 'string') {
      payload.comment = comment;
    }

    const { error } = await supabase.from('recipe_ratings').upsert(payload, {
      onConflict: 'recipe_id,user_id',
    });
    if (error) handleError(error, 'Submit rating with optional comment');
  },

  async getComments(
    recipeId: string,
    versionNumber?: number,
    limit = 20
  ): Promise<CommentRow[]> {
    let q = supabase
      .from('recipe_ratings')
      .select('*')
      .eq('recipe_id', recipeId)
      .not('comment', 'is', null)
      .neq('comment', '')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (typeof versionNumber === 'number') {
      q = q.eq('version_number', versionNumber);
    }

    const { data, error } = await q;
    if (error) handleError(error, 'Get comments');
    return (data as unknown as CommentRow[]) || [];
  },

  async getUserVersionRating(
    recipeId: string,
    versionNumber: number
  ): Promise<CommentRow | null> {
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
      .maybeSingle(); // Use maybeSingle() to avoid 406 errors when no rating exists

    if (error) {
      handleError(error, 'Get user version rating');
      return null;
    }

    return (data as unknown as CommentRow) || null;
  },
};

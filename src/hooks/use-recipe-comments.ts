export interface UseRecipeCommentsResult {
  comments: Array<import('@/lib/api/features/rating-api').CommentRow>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

import { useEffect, useState, useCallback } from 'react';
import { ratingApi } from '@/lib/api/features/rating-api';

export function useRecipeComments(
  recipeId: string,
  versionNumber?: number,
  limit = 20
): UseRecipeCommentsResult {
  const [comments, setComments] = useState<
    Array<import('@/lib/api/features/rating-api').CommentRow>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ratingApi.getComments(recipeId, versionNumber, limit);
      setComments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [recipeId, versionNumber, limit]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    refresh: fetchComments,
  };
}

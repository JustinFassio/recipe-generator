import { useState, useEffect } from 'react';
import { recipeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Send, Flag, ThumbsUp, Reply } from 'lucide-react';
import type { VersionRating } from '@/lib/types';

interface CommentSystemProps {
  recipeId: string;
  versionNumber: number;
  className?: string;
}

interface CommentWithProfile extends VersionRating {
  author_name: string;
  author_avatar?: string;
}

export function CommentSystem({
  recipeId,
  versionNumber,
  className = '',
}: CommentSystemProps) {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [userExistingRating, setUserExistingRating] =
    useState<VersionRating | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
    loadUserRating();
  }, [recipeId, versionNumber]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const ratingsData = await recipeApi.getVersionRatings(
        recipeId,
        versionNumber
      );

      // Filter only ratings with comments and get profile data
      const commentsWithRatings = ratingsData.filter(
        (rating) => rating.comment && rating.comment.trim() !== ''
      );

      // Get profile data for comment authors
      const userIds = [
        ...new Set(commentsWithRatings.map((comment) => comment.user_id)),
      ];
      const profiles = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const profile = await recipeApi.getUserProfile(userId);
            return (
              profile || {
                id: userId,
                full_name: 'Anonymous',
                avatar_url: null,
              }
            );
          } catch {
            return { id: userId, full_name: 'Anonymous', avatar_url: null };
          }
        })
      );

      const profileMap = new Map(profiles.map((p) => [p.id, p]));

      const commentsWithProfiles = commentsWithRatings.map((comment) => ({
        ...comment,
        author_name: profileMap.get(comment.user_id)?.full_name || 'Anonymous',
        author_avatar: profileMap.get(comment.user_id)?.avatar_url || undefined,
      }));

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserRating = async () => {
    if (!user) return;

    try {
      const userRating = await recipeApi.getUserVersionRating(
        recipeId,
        versionNumber
      );
      setUserExistingRating(userRating);
      if (userRating) {
        setNewRating(userRating.rating);
        setNewComment(userRating.comment || '');
      }
    } catch (error) {
      console.error('Failed to load user rating:', error);
    }
  };

  const handleSubmitRatingComment = async () => {
    if (!user || newRating === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a rating (1-5 stars)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await recipeApi.rateVersion(
        recipeId,
        versionNumber,
        newRating,
        newComment.trim() || undefined
      );

      toast({
        title: 'Success',
        description: userExistingRating
          ? 'Rating updated!'
          : 'Rating and comment submitted!',
      });

      // Reload comments and user rating
      await loadComments();
      await loadUserRating();
      setShowCommentForm(false);
    } catch (error) {
      console.error('Failed to submit rating/comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (
    rating: number,
    interactive: boolean = false,
    onRate?: (rating: number) => void
  ) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate?.(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`h-4 w-4 ${
                star <= rating
                  ? 'text-orange-400 fill-orange-400'
                  : interactive
                    ? 'text-gray-300 hover:text-orange-200'
                    : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">
            Comments ({comments.length})
          </h3>
        </div>

        {user && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCommentForm(!showCommentForm)}
          >
            {userExistingRating ? 'Update Rating' : 'Rate & Comment'}
          </Button>
        )}
      </div>

      {/* Comment Form */}
      {showCommentForm && user && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating *
              </label>
              {renderStars(newRating, true, setNewRating)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (optional)
              </label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this recipe version..."
                rows={3}
                className="w-full resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {newComment.length}/500 characters
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCommentForm(false);
                  setNewComment(userExistingRating?.comment || '');
                  setNewRating(userExistingRating?.rating || 0);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitRatingComment}
                disabled={submitting || newRating === 0}
              >
                {submitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {userExistingRating ? 'Update' : 'Submit'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {comment.author_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">
                        {comment.author_name}
                      </span>
                      <div className="flex items-center space-x-1">
                        {renderStars(comment.rating)}
                        <span className="text-xs text-gray-500">
                          {comment.rating}/5
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>

                  {comment.comment && (
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      {comment.comment}
                    </p>
                  )}

                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                      <ThumbsUp className="h-3 w-3" />
                      <span>Helpful</span>
                    </button>
                    <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                      <Reply className="h-3 w-3" />
                      <span>Reply</span>
                    </button>
                    <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
                      <Flag className="h-3 w-3" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Login Prompt for Unauthenticated Users */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-blue-800 mb-2">
            Sign in to rate and comment on recipes
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = '/auth/signin')}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
}

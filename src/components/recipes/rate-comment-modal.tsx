import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, Send, X } from 'lucide-react';
import { recipeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { VersionRating } from '@/lib/types';

interface RateCommentModalProps {
  recipeId: string;
  versionNumber: number;
  recipeTitle: string;
  versionName?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function RateCommentModal({
  recipeId,
  versionNumber,
  recipeTitle,
  versionName,
  onClose,
  onSubmitted,
}: RateCommentModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<VersionRating | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadExistingRating();
  }, [recipeId, versionNumber]);

  const loadExistingRating = async () => {
    if (!user) return;
    
    try {
      const userRating = await recipeApi.getUserVersionRating(recipeId, versionNumber);
      if (userRating) {
        setExistingRating(userRating);
        setRating(userRating.rating);
        setComment(userRating.comment || '');
      }
    } catch (error) {
      console.error('Failed to load existing rating:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a rating (1-5 stars)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await recipeApi.rateVersion(recipeId, versionNumber, rating, comment.trim() || undefined);
      
      toast({
        title: 'Success',
        description: existingRating 
          ? 'Your rating has been updated!' 
          : 'Thank you for rating this recipe!',
      });

      onSubmitted();
      onClose();
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">
                {existingRating ? 'Update Rating' : 'Rate Recipe'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {recipeTitle} {versionName && `(${versionName})`}
              </p>
              <Badge variant="outline" className="text-xs mt-1">
                Version {versionNumber}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Rating Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Rating *
            </label>
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    disabled={submitting}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= displayRating 
                          ? 'text-orange-400 fill-orange-400' 
                          : 'text-gray-300 hover:text-orange-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              {displayRating > 0 && (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    {ratingLabels[displayRating as keyof typeof ratingLabels]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {displayRating} out of 5 stars
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Comment Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this recipe version. What did you like? Any modifications you made?"
              rows={4}
              className="w-full resize-none"
              disabled={submitting}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-blue-800 font-medium mb-1">
              Community Guidelines:
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Be respectful and constructive</li>
              <li>• Share specific feedback about the recipe</li>
              <li>• Mention any modifications you made</li>
              <li>• Help others by sharing cooking tips</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {existingRating ? 'Update Rating' : 'Submit Rating'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

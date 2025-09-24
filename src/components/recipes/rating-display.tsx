import { useState, useEffect } from 'react';
import { Star, StarHalf } from 'lucide-react';
// Button import removed as it's not used in this component
import { supabase } from '@/lib/supabase';
import { ratingApi } from '@/lib/api/features/rating-api';

interface RatingDisplayProps {
  recipeId: string;
  versionNumber?: number; // Optional - for version-specific ratings
  showAggregateRating?: boolean;
  allowRating?: boolean;
  className?: string;
}

interface RatingData {
  average: number;
  count: number;
  distribution: number[]; // [1-star, 2-star, 3-star, 4-star, 5-star]
}

export function RatingDisplay({
  recipeId,
  versionNumber,
  showAggregateRating = false,
  allowRating = true,
  className = '',
}: RatingDisplayProps) {
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRatingData();
  }, [recipeId, versionNumber, showAggregateRating]);

  const loadRatingData = async () => {
    try {
      setLoading(true);

      console.log(
        `📊 [RatingDisplay] Loading ${showAggregateRating ? 'aggregate' : 'specific'} rating data for recipe: ${recipeId}${versionNumber ? `, version: ${versionNumber}` : ''}`
      );

      // Get real rating data from database
      const comments = await ratingApi.getComments(
        recipeId,
        versionNumber || undefined
      );

      if (comments.length === 0) {
        setRatingData({ average: 0, count: 0, distribution: [0, 0, 0, 0, 0] });
      } else {
        // Calculate real statistics from comments
        const ratings = comments
          .map((c) => c.rating)
          .filter((r) => r !== null) as number[];
        const average =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0;

        // Calculate distribution
        const distribution = [0, 0, 0, 0, 0];
        ratings.forEach((rating) => {
          if (rating >= 1 && rating <= 5) {
            distribution[rating - 1]++;
          }
        });

        setRatingData({
          average,
          count: ratings.length,
          distribution,
        });
      }

      // Load user's rating if authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          // If no specific version, try to get the latest version or use version 1
          const targetVersion = versionNumber || 1;
          const userRating = await ratingApi.getUserVersionRating(
            recipeId,
            targetVersion
          );
          setUserRating(userRating?.rating || null);
        } catch {
          console.log('No existing user rating found');
          setUserRating(null);
        }
      }
    } catch (error) {
      console.error('❌ [RatingDisplay] Failed to load rating data:', error);
      setRatingData({ average: 0, count: 0, distribution: [0, 0, 0, 0, 0] });
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating: number) => {
    try {
      setSubmitting(true);

      console.log(
        `⭐ [RatingDisplay] Submitting rating: ${rating} for recipe: ${recipeId}${versionNumber ? `, version: ${versionNumber}` : ''}`
      );

      // Submit real rating to database
      await ratingApi.submitRating(recipeId, versionNumber || null, rating);

      setUserRating(rating);
      await loadRatingData(); // Refresh data

      console.log('✅ [RatingDisplay] Rating submitted successfully');
    } catch (error) {
      console.error('❌ [RatingDisplay] Failed to submit rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded mb-2 w-32"></div>
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-5 h-5 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  const ratingTitle = showAggregateRating
    ? 'Overall Rating (All Versions)'
    : versionNumber
      ? `Version ${versionNumber} Rating`
      : 'Current Recipe Rating';

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h4 className="font-semibold mb-2 text-gray-800">{ratingTitle}</h4>

        <div className="flex items-center gap-3">
          <StarRating rating={ratingData?.average || 0} size="md" />
          <span className="text-sm text-gray-600">
            {ratingData?.average?.toFixed(1) || '0.0'} ({ratingData?.count || 0}{' '}
            {ratingData?.count === 1 ? 'rating' : 'ratings'})
          </span>
        </div>
      </div>

      {allowRating && (
        <div>
          <h5 className="font-medium mb-2 text-gray-700">Your Rating</h5>
          <div className="flex items-center gap-2">
            <InteractiveStarRating
              rating={userRating || 0}
              onRate={handleRating}
              disabled={submitting}
            />
            {submitting && (
              <span className="text-sm text-gray-500">Saving...</span>
            )}
          </div>
        </div>
      )}

      {ratingData?.distribution && ratingData.count > 0 && (
        <div>
          <h5 className="font-medium mb-2 text-gray-700">
            Rating Distribution
          </h5>
          <RatingDistribution distribution={ratingData.distribution} />
        </div>
      )}
    </div>
  );
}

// Supporting components - keep them focused on display only
function StarRating({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const starSize = sizeClasses[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const halfFilled = rating >= star - 0.5 && rating < star;

        return (
          <div key={star} className={`${starSize} text-yellow-400`}>
            {filled ? (
              <Star className={`${starSize} fill-current`} />
            ) : halfFilled ? (
              <StarHalf className={`${starSize} fill-current`} />
            ) : (
              <Star className={`${starSize} text-gray-300`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InteractiveStarRating({
  rating,
  onRate,
  disabled = false,
}: {
  rating: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = (hoverRating || rating) >= star;

        return (
          <button
            key={star}
            className={`w-5 h-5 transition-colors ${
              disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:scale-110'
            } ${isActive ? 'text-yellow-400' : 'text-gray-300'}`}
            onClick={() => !disabled && onRate(star)}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => !disabled && setHoverRating(0)}
            disabled={disabled}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        );
      })}
    </div>
  );
}

function RatingDistribution({ distribution }: { distribution: number[] }) {
  const total = distribution.reduce((sum, count) => sum + count, 0);

  if (total === 0) return null;

  return (
    <div className="space-y-1">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = distribution[stars - 1] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={stars} className="flex items-center gap-2 text-sm">
            <span className="w-8 text-gray-600">{stars}★</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-gray-500 text-xs">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function Rating({
  rating,
  onRate,
  readonly = false,
  size = 'md',
  label,
  showValue = true,
  className = '',
}: RatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const starSize = sizeClasses[size];
  const isInteractive = !readonly && onRate;

  const handleStarClick = (starRating: number) => {
    if (isInteractive) {
      onRate?.(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (isInteractive) {
      setHoveredRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoveredRating(0);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}:</span>
      )}

      <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`
              ${isInteractive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
              transition-all duration-150 ease-in-out
              ${isInteractive ? 'hover:drop-shadow-sm' : ''}
            `}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            disabled={readonly}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              className={`
                ${starSize}
                transition-colors duration-150
                ${
                  star <= displayRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-300'
                }
                ${
                  isInteractive && star <= (hoveredRating || rating)
                    ? 'drop-shadow-sm'
                    : ''
                }
              `}
            />
          </button>
        ))}
      </div>

      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {rating > 0 ? `${rating}/5` : 'Not rated'}
        </span>
      )}
    </div>
  );
}

// Creator Rating - for recipe owners to rate their own recipes
interface CreatorRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  disabled?: boolean;
  className?: string;
}

export function CreatorRating({
  rating,
  onRate,
  disabled = false,
  className = '',
}: CreatorRatingProps) {
  return (
    <div
      className={`p-3 bg-orange-50 rounded-lg border border-orange-200 ${className}`}
    >
      <Rating
        rating={rating}
        onRate={disabled ? undefined : onRate}
        readonly={disabled}
        size="md"
        label="Your Rating"
        showValue={true}
        className="justify-center"
      />
      <p className="text-xs text-orange-700 mt-1 text-center">
        {disabled
          ? 'Rating locked after sharing'
          : 'Rate your recipe before sharing'}
      </p>
    </div>
  );
}

// Community Rating - shows aggregate community ratings
interface CommunityRatingProps {
  averageRating: number;
  totalRatings: number;
  userRating?: number;
  onRate?: (rating: number) => void;
  className?: string;
}

export function CommunityRating({
  averageRating,
  totalRatings,
  userRating,
  onRate,
  className = '',
}: CommunityRatingProps) {
  return (
    <div
      className={`p-3 bg-blue-50 rounded-lg border border-blue-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-900">
          Community Rating
        </span>
        <span className="text-xs text-blue-700">
          {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Rating
          rating={averageRating}
          readonly={true}
          size="sm"
          showValue={false}
        />
        <span className="text-sm font-semibold text-blue-900">
          {averageRating.toFixed(1)}/5
        </span>
      </div>

      {onRate && (
        <div className="mt-3 pt-2 border-t border-blue-200">
          <Rating
            rating={userRating || 0}
            onRate={onRate}
            size="sm"
            label="Your Rating"
            showValue={false}
          />
        </div>
      )}
    </div>
  );
}

// Your Comment - shows user's personal rating and comment
interface YourCommentProps {
  userRating?: number;
  userComment?: string;
  onEdit?: () => void;
  className?: string;
}

export function YourComment({
  userRating,
  userComment,
  onEdit,
  className = '',
}: YourCommentProps) {
  if (!userRating && !userComment) {
    return null;
  }

  return (
    <div
      className={`p-3 bg-green-50 rounded-lg border border-green-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-green-900">Your Comment</span>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-green-700 hover:text-green-900 underline"
          >
            Edit
          </button>
        )}
      </div>

      {userRating && (
        <div className="flex items-center gap-3 mb-2">
          <Rating
            rating={userRating}
            readonly={true}
            size="sm"
            showValue={false}
          />
          <span className="text-sm font-semibold text-green-900">
            {userRating}/5
          </span>
        </div>
      )}

      {userComment && (
        <div className="mt-2">
          <p className="text-sm text-green-800 leading-relaxed">
            {userComment}
          </p>
        </div>
      )}
    </div>
  );
}

// Combined Rating Display - shows both creator and community ratings
interface RatingDisplayProps {
  creatorRating: number;
  communityRating?: {
    average: number;
    count: number;
    userRating?: number;
    onRate?: (rating: number) => void;
  };
  className?: string;
}

export function RatingDisplay({
  creatorRating,
  communityRating,
  className = '',
}: RatingDisplayProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <CreatorRating
        rating={creatorRating}
        disabled={true}
        className="bg-orange-50/50"
      />

      {communityRating && communityRating.count > 0 && (
        <CommunityRating
          averageRating={communityRating.average}
          totalRatings={communityRating.count}
          userRating={communityRating.userRating}
          onRate={communityRating.onRate}
          className="bg-blue-50/50"
        />
      )}
    </div>
  );
}

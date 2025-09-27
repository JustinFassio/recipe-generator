import { useState, useEffect } from 'react';
import { recipeApi } from '@/lib/api';
import type { PublicRecipe } from '@/lib/types';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';
import { Star } from 'lucide-react';

interface StackedImagesProps {
  maxImages?: number;
  className?: string;
}

export function StackedImages({
  maxImages = 6,
  className = '',
}: StackedImagesProps) {
  const [featuredRecipes, setFeaturedRecipes] = useState<PublicRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetching during SSR or in test environment
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
      setLoading(false);
      return;
    }

    const loadFeaturedRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get highest-rated public recipes with images
        // Falls back to recent recipes if no ratings exist yet
        const featuredRecipes =
          await recipeApi.getHighestRatedPublicRecipes(maxImages);

        setFeaturedRecipes(featuredRecipes);
      } catch (err) {
        console.error('Error loading featured recipes:', err);
        setError('Failed to load featured recipes');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedRecipes();
  }, [maxImages]);

  const getFirstName = (fullName: string): string => {
    return fullName.trim().split(' ')[0] || 'Chef';
  };

  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 ${className}`}
      >
        <div className="flex -space-x-4 mb-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-full bg-gray-200 animate-pulse border-4 border-white shadow-lg"
            />
          ))}
        </div>
        <div className="text-center">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || featuredRecipes.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🍳</span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Discover Amazing Recipes
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Join our community of home chefs sharing delicious recipes
        </p>
        <p className="text-xs text-gray-500">
          Be the first to share your favorite recipes!
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      {/* Stacked Recipe Images */}
      <div className="relative mb-6">
        <div className="flex -space-x-6">
          {featuredRecipes.map((recipe, index) => (
            <div
              key={recipe.id}
              className={`
                relative w-20 h-20 rounded-full border-4 border-white shadow-lg
                transform transition-transform duration-200 hover:scale-110 hover:z-10
                ${index > 0 ? 'hover:-translate-x-2' : ''}
              `}
              style={{
                zIndex: featuredRecipes.length - index,
              }}
            >
              <ProgressiveImage
                src={recipe.image_url || ''}
                alt={recipe.title}
                className="w-full h-full rounded-full object-cover"
                loading="eager"
                priority={index < 3}
              />

              {/* Rating badge */}
              {recipe.creator_rating && (
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                  <div className="flex items-center">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-xs font-bold ml-0.5">
                      {recipe.creator_rating}
                    </span>
                  </div>
                </div>
              )}

              {/* Chef name overlay on hover */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                  {getFirstName(recipe.author_name)}
                  {recipe.creator_rating && (
                    <span className="ml-1 text-orange-300">
                      ★{recipe.creator_rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recipe count indicator */}
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {featuredRecipes.length}+
        </div>
      </div>

      {/* Content */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Discover Top-Rated Recipes
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Highest-rated recipes from our community of talented home chefs
        </p>

        {/* Featured chef names */}
        <div className="flex flex-wrap justify-center gap-1 mb-4">
          {featuredRecipes.slice(0, 3).map((recipe, index) => (
            <span key={recipe.id} className="text-xs text-gray-500">
              {getFirstName(recipe.author_name)}
              {index < Math.min(2, featuredRecipes.length - 1) && ', '}
            </span>
          ))}
          {featuredRecipes.length > 3 && (
            <span className="text-xs text-gray-500">
              & {featuredRecipes.length - 3} more
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Join our community and share your favorite recipes!
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import { createDaisyUIBadgeClasses } from '@/lib/badge-migration';
import { Eye, Star, MoreHorizontal, Save, GitBranch } from 'lucide-react';
import CategoryChip from '@/components/ui/CategoryChip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VersionSelector } from './version-selector';
import type { PublicRecipe, RecipeVersion } from '@/lib/types';
import { useIngredientMatching } from '@/hooks/useIngredientMatching';
import { getSafeImageUrl } from '@/lib/image-cache-utils';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';
import { FALLBACK_IMAGE_PATH } from '@/lib/constants';

// Constants
const RECIPE_TITLE_MAX_LENGTH = 45;

interface VersionedRecipeCardProps {
  recipe: PublicRecipe & {
    aggregate_rating?: number | null;
    total_ratings?: number;
    total_views?: number;
    total_versions?: number;
    latest_version?: number;
  };
  onView?: (recipe: PublicRecipe) => void;
  onViewNew?: (recipe: PublicRecipe) => void; // New prop for new view page
  onSave?: (recipeId: string) => void;
  onRateVersion?: (
    recipeId: string,
    versionNumber: number,
    rating: number,
    comment?: string
  ) => void;
  savingRecipeId?: string | null;
  className?: string;
}

export function VersionedRecipeCard({
  recipe,
  onView,
  onViewNew,
  onSave,
  onRateVersion,
  savingRecipeId,
  className = '',
}: VersionedRecipeCardProps) {
  const [showVersions, setShowVersions] = useState(false);
  const ingredientMatching = useIngredientMatching();

  // Calculate compatibility
  const compatibility = ingredientMatching.calculateCompatibility(recipe);
  const availabilityPercentage = compatibility.compatibilityScore;
  const hasGroceries = ingredientMatching.groceriesCount > 0;

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const renderStars = (rating: number | null, count?: number) => {
    const stars = Math.round(rating || 0);
    return (
      <div className="flex items-center space-x-1">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3 w-3 ${
                star <= stars
                  ? 'text-orange-400 fill-orange-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        {rating && (
          <span className="text-xs text-gray-600">
            {rating.toFixed(1)} {count !== undefined && `(${count})`}
          </span>
        )}
      </div>
    );
  };

  const handleVersionSelect = (version: RecipeVersion) => {
    // Create a PublicRecipe-compatible object from the version data
    const versionAsRecipe: PublicRecipe = {
      id: version.recipe_id,
      title: version.title,
      description: version.description || null,
      ingredients: version.ingredients,
      instructions: version.instructions,
      notes: version.notes || null,
      setup: version.setup || null,
      categories: version.categories,
      cooking_time: version.cooking_time || null,
      difficulty: version.difficulty || null,
      creator_rating: version.creator_rating || null,
      image_url: version.image_url || null,
      user_id: version.created_by,
      is_public: version.is_published,
      created_at: version.created_at,
      updated_at: version.created_at,
      current_version_id: version.id,
      author_name: 'Recipe Author', // Placeholder until we can fetch actual author name
    };
    onView?.(versionAsRecipe);
  };

  return (
    <div className={`${className}`}>
      <div
        className={`${createDaisyUICardClasses('bordered')} group relative overflow-hidden border border-gray-200 transition-all duration-200 hover:border-gray-300 hover:shadow-lg`}
      >
        {recipe.image_url &&
          (() => {
            const safeImageUrl = getSafeImageUrl(
              recipe.image_url,
              recipe.updated_at,
              recipe.created_at,
              FALLBACK_IMAGE_PATH
            );
            return (
              safeImageUrl && (
                <div
                  className="aspect-video overflow-hidden cursor-pointer"
                  onClick={() => onViewNew?.(recipe)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onViewNew?.(recipe);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="View recipe details (new view)"
                >
                  <ProgressiveImage
                    src={safeImageUrl}
                    alt={recipe.title}
                    className="h-full w-full transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                    placeholder={FALLBACK_IMAGE_PATH}
                  />
                </div>
              )
            );
          })()}

        {/* Recipe Title */}
        <div className="px-4 pt-4 pb-2">
          <h3
            className={`${createDaisyUICardTitleClasses()} text-lg font-semibold leading-tight text-gray-800`}
            title={recipe.title}
          >
            {recipe.title.length > RECIPE_TITLE_MAX_LENGTH
              ? `${recipe.title.substring(0, RECIPE_TITLE_MAX_LENGTH).trim()}...`
              : recipe.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">by {recipe.author_name}</p>
        </div>

        {/* Action Button - Top Right */}
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="btn btn-circle btn-ghost btn-sm bg-white/95 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-lg"
            aria-label="View versions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="card-body pb-3 pt-0">
          <div className="space-y-3">
            {/* Recipe Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span
                  className={createDaisyUIBadgeClasses('secondary', 'text-xs')}
                >
                  {recipe.ingredients.length} ingredients
                </span>

                {/* Version Badge */}
                {recipe.total_versions && recipe.total_versions > 1 && (
                  <Badge variant="outline" className="text-xs">
                    <GitBranch className="h-3 w-3 mr-1" />
                    {recipe.total_versions} versions
                  </Badge>
                )}

                {/* Grocery Compatibility Badge */}
                {hasGroceries && ingredientMatching.isReady && (
                  <Badge
                    variant="outline"
                    className={`text-xs border ${getCompatibilityColor(availabilityPercentage)}`}
                  >
                    {availabilityPercentage}% match
                  </Badge>
                )}
              </div>

              <span className="text-xs text-gray-500">
                {new Date(recipe.created_at).toLocaleDateString('en-US')}
              </span>
            </div>

            {/* Aggregate Rating & Stats */}
            {recipe.aggregate_rating && (
              <div className="flex items-center justify-between">
                {renderStars(recipe.aggregate_rating, recipe.total_ratings)}
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  {recipe.total_views && recipe.total_views > 0 && (
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{recipe.total_views}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Creator Rating (if no aggregate rating) */}
            {!recipe.aggregate_rating && recipe.creator_rating && (
              <div className="flex items-center justify-between">
                {renderStars(recipe.creator_rating)}
                <span className="text-xs text-gray-500">Creator rating</span>
              </div>
            )}

            {/* Categories */}
            {recipe.categories && recipe.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.categories.slice(0, 3).map((category, index) => (
                  <CategoryChip
                    key={`${category}-${index}`}
                    category={category}
                    variant="readonly"
                    size="sm"
                  />
                ))}
                {recipe.categories.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{recipe.categories.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Description Preview */}
            {recipe.description && (
              <p className="line-clamp-2 text-sm text-gray-600">
                {recipe.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => onView?.(recipe)}>
            <Eye className="h-4 w-4 mr-1" />
            View Recipe
          </Button>

          {recipe.total_versions && recipe.total_versions > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowVersions(!showVersions)}
            >
              <GitBranch className="h-4 w-4 mr-1" />
              Versions
            </Button>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onSave?.(recipe.id)}
          disabled={savingRecipeId === recipe.id}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {savingRecipeId === recipe.id ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Version Selector Modal */}
      {showVersions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recipe Versions</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVersions(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                <VersionSelector
                  recipeId={recipe.id}
                  currentVersionNumber={1}
                  onVersionSelect={handleVersionSelect}
                  onRateVersion={onRateVersion}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

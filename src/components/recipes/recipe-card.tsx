import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import { createDaisyUIBadgeClasses } from '@/lib/badge-migration';
import {
  Trash2,
  Edit,
  Eye,
  Share,
  Check,
  Loader2,
  MoreHorizontal,
  ShoppingCart,
} from 'lucide-react';
import CategoryChip from '@/components/ui/CategoryChip';
import { Badge } from '@/components/ui/badge';
import { useIngredientMatching } from '@/hooks/useIngredientMatching';
import type { Recipe, PublicRecipe } from '@/lib/types';
import { getOptimizedImageUrl } from '@/lib/image-cache-utils';
import { useDeleteRecipe } from '@/hooks/use-recipes';
import { useState } from 'react';
import { recipeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Constants
const RECIPE_TITLE_MAX_LENGTH = 45;

interface RecipeCardProps {
  recipe: Recipe | PublicRecipe;
  onEdit?: (recipe: Recipe) => void;
  onView?: (recipe: Recipe | PublicRecipe) => void;
  showShareButton?: boolean;
  onShareToggle?:
    | ((recipeId: string, isPublic: boolean) => void)
    | (() => void);
  showEditDelete?: boolean; // New prop to control Edit/Delete visibility
}

export function RecipeCard({
  recipe,
  onEdit,
  onView,
  showShareButton,
  onShareToggle,
  showEditDelete = true, // Default to true for backward compatibility
}: RecipeCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(recipe.is_public);
  const deleteRecipe = useDeleteRecipe();
  const { user } = useAuth();
  const ingredientMatching = useIngredientMatching();

  // Calculate compatibility
  const compatibility = ingredientMatching.calculateCompatibility(recipe);
  const availabilityPercentage = compatibility.compatibilityScore;
  const hasGroceries = ingredientMatching.groceriesCount > 0;

  // Only show share button if explicitly requested and user owns the recipe
  const canShare = showShareButton && user?.id === recipe.user_id;

  // Unique drawer ID for this recipe card
  const drawerId = `recipe-actions-${recipe.id}`;

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getCompatibilityIcon = (score: number) => {
    if (score >= 70) return <Check className="h-3 w-3" />;
    return <ShoppingCart className="h-3 w-3" />;
  };

  const handleDelete = () => {
    deleteRecipe.mutate(recipe.id);
    setShowDeleteDialog(false);
  };

  const handleShareToggle = async () => {
    setIsSharing(true);
    try {
      await recipeApi.toggleRecipePublic(recipe.id, !isPublic);
      setIsPublic(!isPublic);
      // Call the callback if it exists, handling both signature types
      if (onShareToggle) {
        if (onShareToggle.length === 2) {
          // Callback expects (recipeId, isPublic) parameters
          (onShareToggle as (recipeId: string, isPublic: boolean) => void)(
            recipe.id,
            !isPublic
          );
        } else {
          // Callback expects no parameters
          (onShareToggle as () => void)();
        }
      }
    } catch (error) {
      console.error('Error toggling recipe sharing:', error);
      // No need to revert state - it was never changed if API call failed
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      {/* DaisyUI Drawer Component - Mobile-First Action Menu */}
      <div className="drawer">
        {/* Hidden checkbox to control drawer state */}
        <input id={drawerId} type="checkbox" className="drawer-toggle" />

        {/* Main recipe card content */}
        <div className="drawer-content">
          <div
            className={`${createDaisyUICardClasses('bordered')} group relative overflow-hidden border border-gray-200 transition-all duration-200 hover:border-gray-300 hover:shadow-lg`}
          >
            {recipe.image_url && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={getOptimizedImageUrl(
                    recipe.image_url,
                    recipe.updated_at,
                    recipe.created_at
                  )}
                  alt={recipe.title}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            )}

            {/* Recipe Title - Above Image */}
            <div className="px-4 pt-4 pb-2">
              <h3
                className={`${createDaisyUICardTitleClasses()} text-lg font-semibold leading-tight text-gray-800`}
                title={recipe.title}
              >
                {recipe.title.length > RECIPE_TITLE_MAX_LENGTH
                  ? `${recipe.title.substring(0, RECIPE_TITLE_MAX_LENGTH).trim()}...`
                  : recipe.title}
              </h3>
            </div>

            {/* Mobile Action Trigger Button - Top Right */}
            <div className="absolute top-2 right-2 z-20">
              <label
                htmlFor={drawerId}
                className="btn btn-circle btn-ghost btn-sm bg-white/95 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-lg"
                aria-label="Recipe actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </label>
            </div>

            <div className="card-body pb-3 pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span
                      className={createDaisyUIBadgeClasses(
                        'secondary',
                        'text-xs'
                      )}
                    >
                      {recipe.ingredients.length} ingredients
                    </span>

                    {/* Grocery Compatibility Badge */}
                    {hasGroceries && ingredientMatching.isReady && (
                      <Badge
                        variant="outline"
                        className={`text-xs border ${getCompatibilityColor(availabilityPercentage)}`}
                      >
                        <div className="flex items-center space-x-1">
                          {getCompatibilityIcon(availabilityPercentage)}
                          <span>{availabilityPercentage}% match</span>
                        </div>
                      </Badge>
                    )}
                  </div>

                  <span className="text-xs">
                    {new Date(recipe.created_at).toLocaleDateString('en-US')}
                  </span>
                </div>

                {/* Available ingredients preview */}
                {hasGroceries &&
                  ingredientMatching.isReady &&
                  compatibility.availableIngredients.length > 0 && (
                    <div className="text-xs text-green-600">
                      <div className="flex items-center space-x-1">
                        <Check className="h-3 w-3" />
                        <span>
                          You have:{' '}
                          {compatibility.availableIngredients
                            .slice(0, 3)
                            .map(
                              (match) =>
                                match.matchedGroceryIngredient ||
                                match.recipeIngredient
                            )
                            .join(', ')}
                          {compatibility.availableIngredients.length > 3 &&
                            ` +${compatibility.availableIngredients.length - 3} more`}
                        </span>
                      </div>
                    </div>
                  )}

                {/* Creator Rating */}
                {recipe.creator_rating && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < recipe.creator_rating!
                              ? 'text-orange-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      {recipe.creator_rating}/5
                    </span>
                  </div>
                )}

                {recipe.categories && recipe.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.categories.map((category, index) => (
                      <CategoryChip
                        key={`${category}-${index}`}
                        category={category}
                        variant="readonly"
                        size="sm"
                      />
                    ))}
                  </div>
                )}

                {/* Description (primary preview) or Instructions (fallback) */}
                {recipe.description ? (
                  <p className="line-clamp-3 text-sm text-gray-600">
                    {recipe.description}
                  </p>
                ) : recipe.instructions ? (
                  <p className="line-clamp-3 text-sm text-gray-600">
                    {recipe.instructions}
                  </p>
                ) : null}

                {recipe.notes && (
                  <div className="border-t pt-2">
                    <p className="line-clamp-2 text-xs text-gray-500 italic">
                      {recipe.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Slide-out Action Panel - Right Side */}
        <div className="drawer-side">
          <label
            htmlFor={drawerId}
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <div className="menu p-4 w-80 min-h-full bg-base-100 text-base-content">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Recipe Actions
              </h3>
              <p className="text-sm text-gray-600">{recipe.title}</p>

              {/* Compatibility Info in Drawer */}
              {hasGroceries && ingredientMatching.isReady && (
                <div
                  className={`mt-3 p-3 rounded-lg border ${getCompatibilityColor(availabilityPercentage)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCompatibilityIcon(availabilityPercentage)}
                      <span className="font-medium">
                        {availabilityPercentage}% ingredient match
                      </span>
                    </div>
                  </div>
                  <div className="text-xs mt-1 opacity-80">
                    {compatibility.availableIngredients.length} of{' '}
                    {compatibility.totalIngredients} ingredients available
                  </div>
                  {compatibility.missingIngredients.length > 0 && (
                    <div className="text-xs mt-2 opacity-70">
                      Missing: {compatibility.missingIngredients.length}{' '}
                      ingredients
                    </div>
                  )}
                </div>
              )}
            </div>

            <ul className="space-y-2">
              {/* View Button */}
              <li>
                <button
                  onClick={() => onView?.(recipe)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span>View Recipe</span>
                </button>
              </li>

              {/* Edit Button - Only show if showEditDelete is true */}
              {showEditDelete && (
                <li>
                  <button
                    onClick={() => onEdit?.(recipe)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Edit className="h-5 w-5 text-green-600" />
                    <span>Edit Recipe</span>
                  </button>
                </li>
              )}

              {/* Share Button */}
              {canShare && (
                <li>
                  <button
                    onClick={handleShareToggle}
                    disabled={isSharing}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {isSharing ? (
                      <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                    ) : isPublic ? (
                      <Check className="h-5 w-5 text-purple-600" />
                    ) : (
                      <Share className="h-5 w-5 text-purple-600" />
                    )}
                    <span>
                      {isSharing
                        ? 'Updating...'
                        : isPublic
                          ? 'Unshare Recipe'
                          : 'Share Recipe'}
                    </span>
                  </button>
                </li>
              )}

              {/* Delete Button - Only show if showEditDelete is true */}
              {showEditDelete && (
                <li>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span>Delete Recipe</span>
                  </button>
                </li>
              )}
            </ul>

            {/* Close Button */}
            <div className="mt-6 pt-4 border-t">
              <label htmlFor={drawerId} className="btn btn-outline btn-block">
                Close
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipe.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

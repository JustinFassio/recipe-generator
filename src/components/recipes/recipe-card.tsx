import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import { createDaisyUIBadgeClasses } from '@/lib/badge-migration';
import { Trash2, Edit, Eye, Share, Check, Loader2 } from 'lucide-react';
import CategoryChip from '@/components/ui/CategoryChip';
import type { Recipe } from '@/lib/types';
import { useDeleteRecipe } from '@/hooks/use-recipes';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
  recipe: Recipe;
  onEdit?: (recipe: Recipe) => void;
  onView?: (recipe: Recipe) => void;
  showShareButton?: boolean;
  onShareToggle?:
    | ((recipeId: string, isPublic: boolean) => void)
    | (() => void);
}

export function RecipeCard({
  recipe,
  onEdit,
  onView,
  showShareButton,
  onShareToggle,
}: RecipeCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(recipe.is_public);
  const [isTouched, setIsTouched] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const deleteRecipe = useDeleteRecipe();
  const { user } = useAuth();

  // Only show share button if explicitly requested and user owns the recipe
  const canShare = showShareButton && user?.id === recipe.user_id;

  // Touch detection and device capabilities
  useEffect(() => {
    const detectDevice = () => {
      const isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice && isMobileScreen);
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);

    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // Touch event handlers
  const handleTouchStart = () => {
    if (isMobile) {
      setIsTouched(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isMobile) {
      e.preventDefault();
    }
  };

  const handleCardTap = () => {
    if (isMobile) {
      setIsTouched(!isTouched);
    }
  };

  // Click outside handler to hide buttons
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsTouched(false);
      }
    };

    if (isMobile && isTouched) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, isTouched]);

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
      <div
        ref={cardRef}
        className={`${createDaisyUICardClasses('bordered')} group relative overflow-hidden border border-gray-200 transition-all duration-200 hover:border-gray-300 hover:shadow-lg`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardTap}
      >
        {recipe.image_url && (
          <div className="aspect-video overflow-hidden">
            <img
              src={recipe.image_url}
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

        {/* Action Buttons - Top Right */}
        <div className="absolute top-2 right-2 z-10">
          <div
            className={`flex items-center space-x-1 transition-opacity ${
              isMobile
                ? isTouched
                  ? 'opacity-100'
                  : 'opacity-0'
                : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {canShare && (
              <Button
                variant={isPublic ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2 bg-white/90 hover:bg-white border-2 border-gray-200 hover:border-gray-300 shadow-sm"
                onClick={handleShareToggle}
                disabled={isSharing}
                aria-label={isPublic ? 'Unshare recipe' : 'Share recipe'}
              >
                {isSharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPublic ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Unshare
                  </>
                ) : (
                  <>
                    <Share className="mr-1 h-4 w-4" />
                    Share
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-sm"
              onClick={() => onView?.(recipe)}
              aria-label="View recipe"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-sm"
              onClick={() => onEdit?.(recipe)}
              aria-label="Edit recipe"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 bg-white/90 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-sm"
              onClick={() => setShowDeleteDialog(true)}
              aria-label="Delete recipe"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="card-body pb-3 pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span
                className={createDaisyUIBadgeClasses('secondary', 'text-xs')}
              >
                {recipe.ingredients.length} ingredients
              </span>
              <span className="text-xs">
                {new Date(recipe.created_at).toLocaleDateString('en-US')}
              </span>
            </div>

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

            {recipe.instructions && (
              <p className="line-clamp-3 text-sm text-gray-600">
                {recipe.instructions}
              </p>
            )}

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

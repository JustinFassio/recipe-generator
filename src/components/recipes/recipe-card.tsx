import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import { createDaisyUIBadgeClasses } from '@/lib/badge-migration';
import { Trash2, Edit, Eye, Share, Check, Loader2 } from 'lucide-react';
import CategoryChip from '@/components/ui/CategoryChip';
import type { Recipe } from '@/lib/types';
import { useDeleteRecipe } from '@/hooks/use-recipes';
import { useState } from 'react';
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

interface RecipeCardProps {
  recipe: Recipe;
  onEdit?: (recipe: Recipe) => void;
  onView?: (recipe: Recipe) => void;
  showShareButton?: boolean;
  onShareToggle?: (recipeId: string, isPublic: boolean) => void;
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
  const deleteRecipe = useDeleteRecipe();
  const { user } = useAuth();

  // Only show share button if explicitly requested and user owns the recipe
  const canShare = showShareButton && user?.id === recipe.user_id;

  const handleDelete = () => {
    deleteRecipe.mutate(recipe.id);
    setShowDeleteDialog(false);
  };

  const handleShareToggle = async () => {
    setIsSharing(true);
    try {
      await recipeApi.toggleRecipePublic(recipe.id, !isPublic);
      setIsPublic(!isPublic);
      onShareToggle?.(recipe.id, !isPublic);
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
        className={`${createDaisyUICardClasses('bordered')} group overflow-hidden border border-gray-200 transition-all duration-200 hover:border-gray-300 hover:shadow-lg`}
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

        <div className="card-body pb-3">
          <div className="flex items-start justify-between">
            <h3
              className={`${createDaisyUICardTitleClasses()} line-clamp-2 text-lg font-semibold`}
            >
              {recipe.title}
            </h3>
            <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              {canShare && (
                <Button
                  variant={isPublic ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-2"
                  onClick={handleShareToggle}
                  disabled={isSharing}
                  aria-label={isPublic ? 'Unshare recipe' : 'Share recipe'}
                >
                  {isSharing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPublic ? (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      Shared
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
                className="h-8 w-8 p-0"
                onClick={() => onView?.(recipe)}
                aria-label="View recipe"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onEdit?.(recipe)}
                aria-label="Edit recipe"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                onClick={() => setShowDeleteDialog(true)}
                aria-label="Delete recipe"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

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

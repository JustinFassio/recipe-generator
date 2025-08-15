import { createDaisyUIButtonClasses } from '@/lib/button-migration';
import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Eye } from 'lucide-react';
import type { Recipe } from '@/lib/supabase';
import { useDeleteRecipe } from '@/hooks/use-recipes';
import { useState } from 'react';
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
}

export function RecipeCard({ recipe, onEdit, onView }: RecipeCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteRecipe = useDeleteRecipe();

  const handleDelete = () => {
    deleteRecipe.mutate(recipe.id);
    setShowDeleteDialog(false);
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
            <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                className={`${createDaisyUIButtonClasses('ghost', 'sm')} h-8 w-8 p-0`}
                onClick={() => onView?.(recipe)}
                aria-label="View recipe"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                className={`${createDaisyUIButtonClasses('ghost', 'sm')} h-8 w-8 p-0`}
                onClick={() => onEdit?.(recipe)}
                aria-label="Edit recipe"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                className={`${createDaisyUIButtonClasses('ghost', 'sm')} h-8 w-8 p-0 text-red-500 hover:text-red-700`}
                onClick={() => setShowDeleteDialog(true)}
                aria-label="Delete recipe"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <Badge variant="secondary" className="text-xs">
                {recipe.ingredients.length} ingredients
              </Badge>
              <span className="text-xs">
                {new Date(recipe.created_at).toLocaleDateString('en-US')}
              </span>
            </div>

            {recipe.instructions && (
              <p className="line-clamp-3 text-sm text-gray-600">
                {recipe.instructions}
              </p>
            )}

            {recipe.notes && (
              <div className="border-t pt-2">
                <p className="line-clamp-2 text-xs italic text-gray-500">
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

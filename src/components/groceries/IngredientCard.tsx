import { Button } from '@/components/ui/button';
import { Plus, Check, Trash2, Shield } from 'lucide-react';
import type { GlobalIngredient } from '@/lib/groceries/enhanced-ingredient-matcher';

interface IngredientCardProps {
  ingredient: GlobalIngredient;
  isInUserCart: boolean;
  isSystemAvailable: boolean;
  isHidden: boolean;
  onAddToGroceries: (category: string, name: string) => Promise<void>;
  onRemoveFromGroceries: (name: string) => Promise<void>;
  onToggleHidden: (name: string, normalizedName: string) => Promise<void>;
  loading?: boolean;
  cartLoading?: boolean;
}

/**
 * Reusable ingredient card component used in Global Ingredients page
 * and potentially other places where individual ingredients need to be displayed
 */
export function IngredientCard({
  ingredient,
  isInUserCart,
  isSystemAvailable,
  isHidden,
  onAddToGroceries,
  onRemoveFromGroceries,
  onToggleHidden,
  loading = false,
  cartLoading = false,
}: IngredientCardProps) {
  return (
    <div
      key={ingredient.id}
      className="flex items-center justify-between rounded border p-2 bg-white"
    >
      {/* Left side - ingredient info */}
      <div className="min-w-0">
        <div className="font-medium truncate flex items-center gap-2">
          <span className="truncate">{ingredient.name}</span>
          {isHidden && (
            <Button
              size="sm"
              variant="ghost"
              className="text-blue-600 p-0 h-auto min-h-0"
              onClick={() =>
                onToggleHidden(ingredient.name, ingredient.normalized_name)
              }
            >
              <Trash2 className="h-3 w-3 mr-1" /> Restore
            </Button>
          )}
        </div>

        {/* Synonyms */}
        {ingredient.synonyms?.length > 0 && (
          <div className="text-xs text-gray-500 truncate">
            aka: {ingredient.synonyms.slice(0, 2).join(', ')}
            {ingredient.synonyms.length > 2 ? '…' : ''}
          </div>
        )}

        {/* System/Hidden badges */}
        {(ingredient.is_system || isHidden) && (
          <div className="mt-1 flex items-center gap-2">
            {ingredient.is_system && (
              <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                <Shield className="h-3 w-3 mr-1" /> System
              </span>
            )}
            {isHidden && (
              <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                Hidden
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right side - action buttons */}
      <div className="flex flex-col items-end gap-1">
        {/* Hide/Remove button for system ingredients */}
        {isSystemAvailable && (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600"
            onClick={() =>
              onToggleHidden(ingredient.name, ingredient.normalized_name)
            }
          >
            <Trash2 className="h-3 w-3" /> Hide
          </Button>
        )}

        {/* Remove from cart button for user-added ingredients */}
        {!ingredient.is_system && isInUserCart && (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600"
            onClick={() => onRemoveFromGroceries(ingredient.name)}
          >
            <Trash2 className="h-3 w-3" /> Remove
          </Button>
        )}

        {/* Status indicators and action buttons */}
        {isInUserCart && !isHidden ? (
          <span className="inline-flex items-center text-xs px-2 py-1 rounded border border-green-300 text-green-700 bg-green-50">
            <Check className="h-3 w-3 mr-1" /> Added
          </span>
        ) : isSystemAvailable && !isInUserCart ? (
          // Show "Add" button for system ingredients not in user's cart
          <Button
            size="sm"
            onClick={() =>
              onAddToGroceries(ingredient.category, ingredient.name)
            }
            disabled={loading || cartLoading}
          >
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        ) : !ingredient.is_system && !isInUserCart ? (
          // Show "Add" button for user-contributed ingredients not in cart
          <Button
            size="sm"
            onClick={() =>
              onAddToGroceries(ingredient.category, ingredient.name)
            }
            disabled={loading || cartLoading}
          >
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        ) : null}
      </div>
    </div>
  );
}

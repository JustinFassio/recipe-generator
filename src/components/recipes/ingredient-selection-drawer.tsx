import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NestedDrawer } from '@/components/ui/nested-drawer';
import { useGroceries } from '@/hooks/useGroceries';
import { GROCERY_CATEGORIES } from '@/lib/groceries/categories';

interface IngredientSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  selectedIngredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  className?: string;
}

export function IngredientSelectionDrawer({
  isOpen,
  onClose,
  onBack,
  selectedIngredients,
  onIngredientsChange,
  className = '',
}: IngredientSelectionDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isApplyFeedback, setIsApplyFeedback] = useState(false);
  const groceries = useGroceries();

  // Get available ingredients from selected groceries
  const availableIngredients = useMemo(() => {
    return Object.values(groceries.groceries).flat();
  }, [groceries.groceries]);

  // Group ingredients by category and filter based on search term
  const groupedIngredients = useMemo(() => {
    const groups: Record<string, string[]> = {};

    availableIngredients.forEach((ingredient) => {
      // Skip if doesn't match search term
      if (
        searchTerm &&
        !ingredient.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return;
      }

      // Find which category this ingredient belongs to
      let foundCategory = 'other';
      for (const [categoryKey, categoryData] of Object.entries(
        GROCERY_CATEGORIES
      )) {
        if (categoryData.items.includes(ingredient)) {
          foundCategory = categoryKey;
          break;
        }
      }

      if (!groups[foundCategory]) {
        groups[foundCategory] = [];
      }
      groups[foundCategory].push(ingredient);
    });

    // Sort ingredients within each category
    Object.keys(groups).forEach((category) => {
      groups[category].sort((a, b) => a.localeCompare(b));
    });

    return groups;
  }, [availableIngredients, searchTerm]);

  const toggleIngredient = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      onIngredientsChange(selectedIngredients.filter((i) => i !== ingredient));
    } else {
      onIngredientsChange([...selectedIngredients, ingredient]);
    }
  };

  const clearAll = () => {
    onIngredientsChange([]);
  };

  const selectAll = () => {
    onIngredientsChange([...availableIngredients]);
  };

  const handleApply = () => {
    setIsApplyFeedback(true);
    setTimeout(() => {
      setIsApplyFeedback(false);
      onClose();
    }, 1000);
  };

  return (
    <NestedDrawer
      id="ingredient-selection-drawer"
      isOpen={isOpen}
      onClose={onClose}
      onBack={onBack}
      title="Select Available Ingredients"
      className={className}
    >
      <div className="space-y-4 pb-20">
        {/* Search */}
        <div className="form-control">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Selection Controls */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedIngredients.length} of {availableIngredients.length}{' '}
            selected
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear All
            </Button>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select All
            </Button>
          </div>
        </div>

        {/* Ingredients List Grouped by Category */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.keys(groupedIngredients).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {availableIngredients.length === 0
                  ? 'No ingredients available. Add ingredients to your grocery list first.'
                  : 'No ingredients found matching your search.'}
              </p>
            </div>
          ) : (
            Object.entries(groupedIngredients).map(
              ([categoryKey, ingredients]) => {
                const categoryData =
                  GROCERY_CATEGORIES[
                    categoryKey as keyof typeof GROCERY_CATEGORIES
                  ];
                const categoryName = categoryData?.name || categoryKey;
                const categoryIcon = categoryData?.icon || '📦';

                return (
                  <div key={categoryKey} className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 sticky top-0 bg-base-100 py-1">
                      <span>{categoryIcon}</span>
                      <span>{categoryName}</span>
                      <span className="text-xs text-gray-500">
                        ({ingredients.length})
                      </span>
                    </h3>
                    <div className="space-y-1">
                      {ingredients.map((ingredient) => {
                        const isSelected =
                          selectedIngredients.includes(ingredient);
                        return (
                          <button
                            key={ingredient}
                            onClick={() => toggleIngredient(ingredient)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-content border-primary'
                                : 'bg-base-100 hover:bg-base-200 border-base-300'
                            }`}
                          >
                            <span className="text-left font-medium text-sm">
                              {ingredient}
                            </span>
                            {isSelected && <Check className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>

        {/* Apply Button */}
        <div className="sticky bottom-0 bg-base-100 pt-4 border-t">
          <Button
            onClick={handleApply}
            className={`w-full ${
              isApplyFeedback ? 'bg-success text-success-content' : ''
            }`}
            disabled={isApplyFeedback}
          >
            {isApplyFeedback ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Applied!
              </>
            ) : (
              `Apply ${selectedIngredients.length} ingredient${
                selectedIngredients.length !== 1 ? 's' : ''
              }`
            )}
          </Button>
        </div>
      </div>
    </NestedDrawer>
  );
}

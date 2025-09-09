import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NestedDrawer } from '@/components/ui/nested-drawer';
import { useGroceries } from '@/hooks/useGroceries';

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

  // Filter ingredients based on search term
  const filteredIngredients = useMemo(() => {
    if (!searchTerm) return availableIngredients;

    return availableIngredients.filter((ingredient) =>
      ingredient.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

        {/* Ingredients List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredIngredients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {availableIngredients.length === 0
                  ? 'No ingredients available. Add ingredients to your grocery list first.'
                  : 'No ingredients found matching your search.'}
              </p>
            </div>
          ) : (
            filteredIngredients.map((ingredient) => {
              const isSelected = selectedIngredients.includes(ingredient);
              return (
                <button
                  key={ingredient}
                  onClick={() => toggleIngredient(ingredient)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-content border-primary'
                      : 'bg-base-100 hover:bg-base-200 border-base-300'
                  }`}
                >
                  <span className="text-left font-medium">{ingredient}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })
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

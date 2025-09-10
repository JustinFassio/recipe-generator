import { useState, useMemo } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGroceries } from '@/hooks/useGroceries';
import { GROCERY_CATEGORIES } from '@/lib/groceries/categories';

interface IngredientFilterSectionProps {
  selectedIngredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  variant: 'dropdown' | 'accordion' | 'drawer';
  className?: string;
}

export function IngredientFilterSection({
  selectedIngredients,
  onIngredientsChange,
  variant,
  className = '',
}: IngredientFilterSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [isOpen, setIsOpen] = useState(false);
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
      let foundCategory = 'Other';
      for (const [, categoryData] of Object.entries(GROCERY_CATEGORIES)) {
        if (categoryData.items.includes(ingredient)) {
          foundCategory = categoryData.name;
          break;
        }
      }

      if (!groups[foundCategory]) {
        groups[foundCategory] = [];
      }
      groups[foundCategory].push(ingredient);
    });

    // Sort ingredients within each group
    Object.keys(groups).forEach((category) => {
      groups[category].sort();
    });

    return groups;
  }, [availableIngredients, searchTerm]);

  const toggleIngredient = (ingredient: string) => {
    const newIngredients = selectedIngredients.includes(ingredient)
      ? selectedIngredients.filter((i) => i !== ingredient)
      : [...selectedIngredients, ingredient];
    onIngredientsChange(newIngredients);
  };

  const clearAllIngredients = () => {
    onIngredientsChange([]);
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <span>
            Ingredients{' '}
            {selectedIngredients.length > 0 &&
              `(${selectedIngredients.length})`}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto w-96">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                <Input
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="p-4 space-y-4">
              {Object.entries(groupedIngredients).map(
                ([categoryName, ingredients]) => (
                  <div key={categoryName} className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700 border-b pb-1">
                      {categoryName}
                    </h5>
                    <div className="grid grid-cols-3 gap-2">
                      {ingredients.map((ingredient) => {
                        const isSelected =
                          selectedIngredients.includes(ingredient);
                        return (
                          <Button
                            key={ingredient}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className="justify-start text-xs h-9 hover:bg-gray-50 transition-colors"
                            onClick={() => toggleIngredient(ingredient)}
                          >
                            {isSelected && <Check className="h-3 w-3 mr-1" />}
                            <span className="truncate">{ingredient}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>

            {selectedIngredients.length > 0 && (
              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllIngredients}
                  className="w-full text-xs hover:bg-gray-50"
                >
                  Clear All Ingredients
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'accordion') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Available Ingredients</h4>
          {selectedIngredients.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllIngredients}
              className="text-xs"
            >
              Clear All ({selectedIngredients.length})
            </Button>
          )}
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
          <Input
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          {Object.entries(groupedIngredients).map(
            ([categoryName, ingredients]) => {
              const isExpanded = expandedCategories.has(categoryName);
              return (
                <div key={categoryName} className="border rounded-md">
                  <Button
                    variant="ghost"
                    onClick={() => toggleCategory(categoryName)}
                    className="w-full justify-between p-3 h-auto"
                  >
                    <span className="font-medium">{categoryName}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </Button>

                  {isExpanded && (
                    <div className="p-3 pt-0 grid grid-cols-2 gap-2">
                      {ingredients.map((ingredient) => {
                        const isSelected =
                          selectedIngredients.includes(ingredient);
                        return (
                          <Button
                            key={ingredient}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className="justify-start text-xs h-8"
                            onClick={() => toggleIngredient(ingredient)}
                          >
                            {isSelected && <Check className="h-3 w-3 mr-1" />}
                            <span className="truncate">{ingredient}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  }

  // Drawer variant - simplified for mobile
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Available Ingredients</h4>
        {selectedIngredients.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedIngredients.length} selected
          </span>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
        <Input
          placeholder="Search ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {Object.entries(groupedIngredients).map(
          ([categoryName, ingredients]) => (
            <div key={categoryName} className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">
                {categoryName}
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {ingredients.map((ingredient) => {
                  const isSelected = selectedIngredients.includes(ingredient);
                  return (
                    <Button
                      key={ingredient}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start text-xs h-9"
                      onClick={() => toggleIngredient(ingredient)}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-1" />}
                      <span className="truncate">{ingredient}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>

      {selectedIngredients.length > 0 && (
        <div className="pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllIngredients}
            className="w-full text-xs"
          >
            Clear All Ingredients
          </Button>
        </div>
      )}
    </div>
  );
}

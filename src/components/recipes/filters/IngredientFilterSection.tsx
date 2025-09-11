import { useState, useMemo } from 'react';
import { Search, Check, ChevronDown, Globe, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CHEF_ISABELLA_SYSTEM_CATALOG,
  CATEGORY_METADATA,
} from '@/lib/groceries/system-catalog';
import { useGroceries } from '@/hooks/useGroceries';

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
  const [viewMode, setViewMode] = useState<'global' | 'available'>('global');
  const groceries = useGroceries();

  // Get available ingredients organized by category (like groceries page structure)
  const availableIngredientsByCategory = useMemo(() => {
    const categoryGroups: Record<string, string[]> = {};
    
    // Safety check for groceries hook
    if (!groceries?.groceries || typeof groceries.hasIngredient !== 'function') {
      return categoryGroups;
    }
    
    Object.entries(groceries.groceries).forEach(([category, ingredients]) => {
      const availableInCategory = ingredients.filter((ingredient) =>
        groceries.hasIngredient(category, ingredient)
      );
      
      if (availableInCategory.length > 0) {
        const categoryMetadata = CATEGORY_METADATA[category as keyof typeof CATEGORY_METADATA];
        const categoryName = categoryMetadata?.name || category;
        categoryGroups[categoryName] = availableInCategory.sort();
      }
    });
    
    return categoryGroups;
  }, [groceries, groceries.groceries, groceries.hasIngredient]);

  // Group ingredients by category and filter based on search term
  const groupedIngredients = useMemo(() => {
    const groups: Record<string, string[]> = {};

    if (viewMode === 'available') {
      // Use available ingredients organized by category
      Object.entries(availableIngredientsByCategory).forEach(([categoryName, ingredients]) => {
        const filteredIngredients = ingredients.filter((ingredient) => {
          if (
            searchTerm &&
            !ingredient.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            return false;
          }
          return true;
        });

        if (filteredIngredients.length > 0) {
          groups[categoryName] = filteredIngredients;
        }
      });
    } else {
      // Use global system catalog
      Object.entries(CHEF_ISABELLA_SYSTEM_CATALOG).forEach(
        ([categoryKey, ingredients]) => {
          const categoryMetadata =
            CATEGORY_METADATA[categoryKey as keyof typeof CATEGORY_METADATA];
          const categoryName = categoryMetadata?.name || categoryKey;

          const filteredIngredients = ingredients.filter((ingredient) => {
            if (
              searchTerm &&
              !ingredient.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
              return false;
            }
            return true;
          });

          if (filteredIngredients.length > 0) {
            groups[categoryName] = filteredIngredients.sort();
          }
        }
      );
    }

    return groups;
  }, [searchTerm, viewMode, availableIngredientsByCategory]);

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

  const totalIngredients = Object.values(groupedIngredients).reduce(
    (sum, ingredients) => sum + ingredients.length,
    0
  );

  // Toggle buttons component
  const ViewModeToggle = () => (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
      <button
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'global'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        onClick={() => setViewMode('global')}
      >
        <Globe className="h-4 w-4" />
        Global Ingredients
      </button>
      <button
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'available'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        onClick={() => setViewMode('available')}
      >
        <ChefHat className="h-4 w-4" />
        Available Ingredients
      </button>
    </div>
  );

  // Search input component
  const SearchInput = () => (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder={`Search ${viewMode === 'global' ? 'global' : 'available'} ingredients...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  );

  // Category content component
  const CategoryContent = () => (
    <div className="space-y-4">
      {Object.entries(groupedIngredients).map(([categoryName, ingredients]) => (
        <div key={categoryName} className="space-y-2">
          {/* Category Header */}
          <button
            className="flex items-center justify-between w-full text-left p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => toggleCategory(categoryName)}
          >
            <span className="font-medium text-gray-900">
              {categoryName} ({ingredients.length})
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                expandedCategories.has(categoryName) ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Category Ingredients */}
          {expandedCategories.has(categoryName) && (
            <div className="grid grid-cols-3 gap-2">
              {ingredients.map((ingredient, index) => {
                const isSelected = selectedIngredients.includes(ingredient);
                return (
                  <Button
                    key={`${categoryName}-${ingredient}-${index}`}
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
          )}
        </div>
      ))}
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-8 text-gray-500">
      <div className="text-lg font-medium mb-2">
        {viewMode === 'available' 
          ? 'No available ingredients found' 
          : 'No ingredients found'
        }
      </div>
      <div className="text-sm">
        {viewMode === 'available' 
          ? 'Mark ingredients as available in your groceries to see them here.'
          : searchTerm 
            ? 'Try adjusting your search terms.'
            : 'No ingredients available in the system catalog.'
        }
      </div>
    </div>
  );

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
            {selectedIngredients.length > 0 && (
              <span className="text-blue-600">({selectedIngredients.length})</span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-96 overflow-y-auto">
            <div className="p-4">
              <ViewModeToggle />
              <SearchInput />
              
              {selectedIngredients.length > 0 && (
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <span className="text-sm text-gray-600">
                    {selectedIngredients.length} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllIngredients}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>
              )}

              {totalIngredients === 0 ? <EmptyState /> : <CategoryContent />}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'accordion') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Ingredients</h3>
          {selectedIngredients.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllIngredients}
              className="text-red-600 hover:text-red-700"
            >
              Clear All ({selectedIngredients.length})
            </Button>
          )}
        </div>

        <ViewModeToggle />
        <SearchInput />

        {totalIngredients === 0 ? <EmptyState /> : <CategoryContent />}
      </div>
    );
  }

  if (variant === 'drawer') {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Filter by Ingredients</h2>
          {selectedIngredients.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllIngredients}
              className="text-red-600 hover:text-red-700"
            >
              Clear All
            </Button>
          )}
        </div>

        {selectedIngredients.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <div className="text-sm font-medium text-blue-900">
              {selectedIngredients.length} ingredient{selectedIngredients.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        )}

        <ViewModeToggle />
        <SearchInput />

        <div className="flex-1 overflow-y-auto">
          {totalIngredients === 0 ? <EmptyState /> : <CategoryContent />}
        </div>
      </div>
    );
  }

  return null;
}
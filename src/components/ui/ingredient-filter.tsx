import { useState, useEffect, useRef } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from './button';
import { CategoryChip } from './category-chip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu';

export interface IngredientFilterProps {
  selectedIngredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  availableIngredients?: string[];
  placeholder?: string;
  className?: string;
}

export function IngredientFilter({
  selectedIngredients,
  onIngredientsChange,
  availableIngredients = [],
  placeholder = 'Filter by available ingredients...',
  className = '',
}: IngredientFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure dropdown is fully rendered
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filter ingredients based on search term
  const filteredIngredients = availableIngredients.filter((ingredient) =>
    ingredient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleIngredient = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      onIngredientsChange(selectedIngredients.filter((i) => i !== ingredient));
    } else {
      onIngredientsChange([...selectedIngredients, ingredient]);
    }
  };

  const clearAllFilters = () => {
    onIngredientsChange([]);
  };

  return (
    <div className={`relative ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="justify-start">
            <Filter className="mr-2 h-4 w-4" />
            Ingredients
            {selectedIngredients.length > 0 && (
              <span className="ml-1 badge badge-primary badge-xs">
                {selectedIngredients.length}
              </span>
            )}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 p-4">
          <div className="card-body p-0 space-y-4">
            {/* Search input */}
            <div className="form-control">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>

            {/* Selected ingredients */}
            {selectedIngredients.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Selected</span>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="btn btn-ghost btn-xs gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedIngredients.map((ingredient, index) => (
                    <CategoryChip
                      key={`selected-${ingredient}-${index}`}
                      category={ingredient}
                      variant="selected"
                      size="sm"
                      onClick={() => toggleIngredient(ingredient)}
                      onRemove={() => toggleIngredient(ingredient)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Available ingredients */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-base-content opacity-70 uppercase tracking-wide">
                  Available Ingredients
                </h4>
                <div className="flex flex-wrap gap-1">
                  {filteredIngredients.map((ingredient, index) => (
                    <CategoryChip
                      key={`ingredient-${ingredient}-${index}`}
                      category={ingredient}
                      variant={
                        selectedIngredients.includes(ingredient)
                          ? 'selected'
                          : 'clickable'
                      }
                      size="sm"
                      onClick={() => toggleIngredient(ingredient)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {filteredIngredients.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-base-content opacity-50">
                  {availableIngredients.length === 0
                    ? 'No ingredients available. Add ingredients to your grocery list first.'
                    : 'No ingredients found matching your search.'}
                </p>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

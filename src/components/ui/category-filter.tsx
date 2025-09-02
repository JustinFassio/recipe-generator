import { useState, useEffect, useRef } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from './button';
import { CategoryChip } from './category-chip';
import { parseCategory } from '@/lib/category-parsing';
import { CANONICAL_CATEGORIES } from '@/lib/categories';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu';

export interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  availableCategories?: string[];
  placeholder?: string;
  className?: string;
}

export function CategoryFilter({
  selectedCategories,
  onCategoriesChange,
  availableCategories = CANONICAL_CATEGORIES,
  placeholder = 'Filter by category...',
  className = '',
}: CategoryFilterProps) {
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

  // Group categories by namespace for better organization
  const groupedCategories = availableCategories.reduce(
    (groups, category) => {
      const { namespace } = parseCategory(category);
      const groupKey = namespace || 'Other';

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(category);

      return groups;
    },
    {} as Record<string, string[]>
  );

  // Filter categories based on search term
  const filteredGroups = Object.entries(groupedCategories).reduce(
    (filtered, [namespace, categories]) => {
      const matchingCategories = categories.filter((category) =>
        category.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (matchingCategories.length > 0) {
        filtered[namespace] = matchingCategories;
      }

      return filtered;
    },
    {} as Record<string, string[]>
  );

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const clearAllFilters = () => {
    onCategoriesChange([]);
  };



  return (
    <div className={`relative ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="justify-start">
            <Filter className="mr-2 h-4 w-4" />
            Categories
            {selectedCategories.length > 0 && (
              <span className="ml-1 badge badge-primary badge-xs">
                {selectedCategories.length}
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

              {/* Selected categories */}
              {selectedCategories.length > 0 && (
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
                    {selectedCategories.map((category, index) => (
                      <CategoryChip
                        key={`selected-${category}-${index}`}
                        category={category}
                        variant="selected"
                        size="sm"
                        onClick={() => toggleCategory(category)}
                        onRemove={() => toggleCategory(category)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Available categories grouped by namespace */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(filteredGroups).map(
                  ([namespace, categories]) => (
                    <div key={namespace} className="space-y-2">
                      <h4 className="text-xs font-semibold text-base-content opacity-70 uppercase tracking-wide">
                        {namespace}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {categories.map((category, index) => (
                          <CategoryChip
                            key={`${namespace}-${category}-${index}`}
                            category={category}
                            variant={
                              selectedCategories.includes(category)
                                ? 'selected'
                                : 'clickable'
                            }
                            size="sm"
                            onClick={() => toggleCategory(category)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              {Object.keys(filteredGroups).length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-base-content opacity-50">
                    No categories found
                  </p>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}

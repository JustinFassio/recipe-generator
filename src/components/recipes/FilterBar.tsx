import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CategoryFilterSection } from './filters/CategoryFilterSection';
import { CuisineFilterSection } from './filters/CuisineFilterSection';
import { MoodFilterSection } from './filters/MoodFilterSection';
import { IngredientFilterSection } from './filters/IngredientFilterSection';
import { useFilterBar } from '@/hooks/useFilterBar';
import type { RecipeFilters } from '@/lib/types';

interface FilterBarProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  variant?: 'horizontal' | 'accordion' | 'drawer' | 'auto';
  totalRecipes?: number;
  filteredCount?: number;
  className?: string;
}

export function FilterBar({
  filters,
  onFiltersChange,
  variant = 'auto',
  className = '',
}: FilterBarProps) {
  const {
    localFilters,
    updateFilter,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount,
    isTablet,
    isDesktop,
  } = useFilterBar(filters, onFiltersChange);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Determine effective variant based on screen size
  const effectiveVariant =
    variant === 'auto'
      ? isDesktop
        ? 'horizontal'
        : isTablet
          ? 'accordion'
          : 'drawer'
      : variant;

  // Desktop Horizontal Layout
  if (effectiveVariant === 'horizontal') {
    return (
      <div
        className={`filter-bar-horizontal ${className}`}
        data-testid="filter-bar-horizontal"
      >
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search recipes, ingredients, or instructions..."
              value={localFilters.searchTerm || ''}
              onChange={(e) => updateFilter({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0">
            {/* Main Filters */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:gap-2">
              <CategoryFilterSection
                selectedCategories={localFilters.categories || []}
                onCategoriesChange={(categories) =>
                  updateFilter({ categories })
                }
                variant="dropdown"
                className="w-full sm:w-36"
              />

              <CuisineFilterSection
                selectedCuisines={localFilters.cuisine || []}
                onCuisinesChange={(cuisines) =>
                  updateFilter({ cuisine: cuisines })
                }
                variant="dropdown"
                className="w-full sm:w-36"
              />

              <MoodFilterSection
                selectedMoods={localFilters.moods || []}
                onMoodsChange={(moods) => updateFilter({ moods })}
                variant="dropdown"
                className="w-full sm:w-36"
              />

              <IngredientFilterSection
                selectedIngredients={localFilters.availableIngredients || []}
                onIngredientsChange={(ingredients) =>
                  updateFilter({ availableIngredients: ingredients })
                }
                variant="dropdown"
                className="w-full sm:w-36"
              />
            </div>

            {/* Sort and Clear */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:gap-2 sm:ml-auto">
              {/* Sort controls will be added in PR 5 */}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="w-full sm:w-auto text-gray-500 hover:text-gray-700"
                >
                  <X className="mr-1 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display - will be added in PR 4 */}
        </div>
      </div>
    );
  }

  // Tablet Accordion Layout
  if (effectiveVariant === 'accordion') {
    return (
      <div
        className={`filter-bar-accordion ${className}`}
        data-testid="filter-bar-accordion"
      >
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search recipes..."
              value={localFilters.searchTerm || ''}
              onChange={(e) => updateFilter({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Collapsible Filter Sections */}
          <div className="space-y-2">
            <CategoryFilterSection
              selectedCategories={localFilters.categories || []}
              onCategoriesChange={(categories) => updateFilter({ categories })}
              variant="accordion"
            />

            <CuisineFilterSection
              selectedCuisines={localFilters.cuisine || []}
              onCuisinesChange={(cuisines) =>
                updateFilter({ cuisine: cuisines })
              }
              variant="accordion"
            />

            <MoodFilterSection
              selectedMoods={localFilters.moods || []}
              onMoodsChange={(moods) => updateFilter({ moods })}
              variant="accordion"
            />

            <IngredientFilterSection
              selectedIngredients={localFilters.availableIngredients || []}
              onIngredientsChange={(ingredients) =>
                updateFilter({ availableIngredients: ingredients })
              }
              variant="accordion"
            />
          </div>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Clear All Filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Mobile Drawer Layout
  return (
    <div
      className={`filter-bar-drawer ${className}`}
      data-testid="filter-bar-drawer"
    >
      {/* Filter Trigger Button */}
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => setIsDrawerOpen(true)}
      >
        <Filter className="mr-2 h-5 w-5" />
        Filters & Search
        {hasActiveFilters && (
          <Badge variant="secondary" className="ml-2">
            {activeFilterCount}
          </Badge>
        )}
        <ChevronDown className="ml-auto h-4 w-4" />
      </Button>

      {/* Drawer Implementation - will use existing NestedDrawer component */}
      {/* For now, show a placeholder - full drawer implementation will be added */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
          <div className="bg-white w-full max-h-[90vh] rounded-t-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Filters & Search</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDrawerOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search recipes..."
                value={localFilters.searchTerm || ''}
                onChange={(e) => updateFilter({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Filter Sections in Drawer Variant */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <CategoryFilterSection
                selectedCategories={localFilters.categories || []}
                onCategoriesChange={(categories) =>
                  updateFilter({ categories })
                }
                variant="drawer"
              />

              <CuisineFilterSection
                selectedCuisines={localFilters.cuisine || []}
                onCuisinesChange={(cuisines) =>
                  updateFilter({ cuisine: cuisines })
                }
                variant="drawer"
              />

              <MoodFilterSection
                selectedMoods={localFilters.moods || []}
                onMoodsChange={(moods) => updateFilter({ moods })}
                variant="drawer"
              />

              <IngredientFilterSection
                selectedIngredients={localFilters.availableIngredients || []}
                onIngredientsChange={(ingredients) =>
                  updateFilter({ availableIngredients: ingredients })
                }
                variant="drawer"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              )}
              <Button onClick={() => setIsDrawerOpen(false)} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

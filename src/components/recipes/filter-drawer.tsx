import { useState } from 'react';
import { Search, Filter, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NestedDrawer } from '@/components/ui/nested-drawer';
import { useFilterDrawer } from '@/hooks/use-filter-drawer';
import type { RecipeFilters } from '@/lib/types';

interface FilterDrawerProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenCategories: () => void;
  onOpenCuisines: () => void;
  onOpenMoods: () => void;
  totalRecipes?: number;
  filteredCount?: number;
  className?: string;
}

export function FilterDrawer({
  filters,
  onFiltersChange,
  isOpen,
  onClose,
  onOpenCategories,
  onOpenCuisines,
  onOpenMoods,
  totalRecipes = 0,
  filteredCount = 0,
  className = '',
}: FilterDrawerProps) {
  const { state, actions } = useFilterDrawer(filters, onFiltersChange);
  const [isApplied, setIsApplied] = useState(false);

  const handleApplyFilters = () => {
    actions.applyFilters();
    setIsApplied(true);

    // Reset applied state after 2 seconds
    setTimeout(() => {
      setIsApplied(false);
    }, 2000);
  };

  const handleClearAll = () => {
    actions.clearAllFilters();
  };

  return (
    <NestedDrawer
      id="filter-drawer"
      isOpen={isOpen}
      onClose={onClose}
      title="Search & Filters"
      className={className}
    >
      <div className="space-y-6 pb-20">
        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {filteredCount} of {totalRecipes} recipes
        </div>

        {/* Search Section */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Search</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search recipes, ingredients, or instructions..."
              value={state.searchTerm}
              onChange={(e) => actions.updateSearchTerm(e.target.value)}
              className="pl-10"
            />
            {state.searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={actions.clearSearch}
                className="absolute right-2 top-1/2 h-6 w-6 p-0 hover:bg-base-200"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Sections */}
        <div className="space-y-4">
          {/* Categories */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Categories</span>
              <span className="label-text-alt text-gray-500">
                {state.selectedCategories.length} selected
              </span>
            </label>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={onOpenCategories}
            >
              <span>
                {state.selectedCategories.length > 0
                  ? `${state.selectedCategories.length} categories selected`
                  : 'Select categories'}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Cuisines */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Cuisines</span>
              <span className="label-text-alt text-gray-500">
                {state.selectedCuisines.length} selected
              </span>
            </label>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={onOpenCuisines}
            >
              <span>
                {state.selectedCuisines.length > 0
                  ? `${state.selectedCuisines.length} cuisines selected`
                  : 'Select cuisines'}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Moods */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Moods</span>
              <span className="label-text-alt text-gray-500">
                {state.selectedMoods.length} selected
              </span>
            </label>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={onOpenMoods}
            >
              <span>
                {state.selectedMoods.length > 0
                  ? `${state.selectedMoods.length} moods selected`
                  : 'Select moods'}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {actions.hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Active Filters
                <Badge variant="secondary" className="ml-auto">
                  {actions.activeFilterCount}
                </Badge>
              </h4>

              {/* Active filter chips */}
              <div className="flex flex-wrap gap-2">
                {state.searchTerm && (
                  <Badge variant="outline" className="text-xs">
                    Search: "{state.searchTerm}"
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={actions.clearSearch}
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}

                {state.selectedCategories.map((category) => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {category}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => actions.toggleCategory(category)}
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}

                {state.selectedCuisines.map((cuisine) => (
                  <Badge key={cuisine} variant="outline" className="text-xs">
                    {cuisine}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => actions.toggleCuisine(cuisine)}
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}

                {state.selectedMoods.map((mood) => (
                  <Badge key={mood} variant="outline" className="text-xs">
                    {mood}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => actions.toggleMood(mood)}
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t space-y-2">
          {actions.hasActiveFilters && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleClearAll}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      {/* Persistent Action Buttons - Sticky Footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-base-100 border-t pt-4 pb-4 px-4 -mx-4 space-y-3">
        {/* Apply Button - Provides feedback that selections are applied */}
        <Button
          onClick={handleApplyFilters}
          size="lg"
          variant={isApplied ? 'secondary' : 'default'}
          disabled={isApplied}
          className="w-full transition-all duration-300"
        >
          {isApplied ? '✓ Applied' : 'Apply'}
        </Button>

        {/* Done Button - Closes the drawer */}
        <Button
          className="w-full"
          onClick={onClose}
          size="sm"
          variant="outline"
        >
          Done
        </Button>
      </div>
    </NestedDrawer>
  );
}

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
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
    isDesktop,
  } = useFilterBar(filters, onFiltersChange);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeNestedDrawer, setActiveNestedDrawer] = useState<
    'categories' | 'cuisines' | 'moods' | 'ingredients' | null
  >(null);

  // Accordion state management - only one filter section open at a time
  const [openFilterSection, setOpenFilterSection] = useState<
    'categories' | 'cuisines' | 'moods' | 'ingredients' | null
  >(null);

  // Handle keyboard events for drawer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDrawerOpen) {
        if (activeNestedDrawer) {
          // If in nested drawer, go back to main drawer
          setActiveNestedDrawer(null);
        } else {
          // If in main drawer, close completely
          setIsDrawerOpen(false);
        }
      }
    };

    if (isDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen, activeNestedDrawer]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      setIsDrawerOpen(false);
      setActiveNestedDrawer(null);
    }
  };

  // Helper functions for drawer management
  const openNestedDrawer = (
    drawerType: 'categories' | 'cuisines' | 'moods' | 'ingredients'
  ) => {
    setActiveNestedDrawer(drawerType);
  };

  const closeNestedDrawer = () => {
    setActiveNestedDrawer(null);
  };

  const closeAllDrawers = () => {
    setIsDrawerOpen(false);
    setActiveNestedDrawer(null);
  };

  // Accordion behavior handlers
  const handleFilterSectionToggle = (
    sectionType: 'categories' | 'cuisines' | 'moods' | 'ingredients',
    isCurrentlyOpen: boolean
  ) => {
    if (isCurrentlyOpen) {
      // If this section is open, close it
      setOpenFilterSection(null);
    } else {
      // If this section is closed, open it and close others
      setOpenFilterSection(sectionType);
    }
  };

  // FilterTypeButton component for main drawer
  const FilterTypeButton = ({
    label,
    count,
    onClick,
  }: {
    label: string;
    count: number;
    onClick: () => void;
  }) => (
    <Button
      variant="outline"
      className="w-full justify-between p-4 h-auto"
      onClick={onClick}
    >
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {count > 0 && <Badge variant="secondary">{count}</Badge>}
        <ChevronRight className="h-4 w-4" />
      </div>
    </Button>
  );

  // Determine effective variant based on screen size
  const effectiveVariant =
    variant === 'auto'
      ? isDesktop
        ? 'horizontal'
        : 'drawer' // Use drawer for both tablet and mobile
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
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:gap-3">
              <CategoryFilterSection
                selectedCategories={localFilters.categories || []}
                onCategoriesChange={(categories) =>
                  updateFilter({ categories })
                }
                variant="dropdown"
                className="w-full sm:w-40"
                isOpen={openFilterSection === 'categories'}
                onToggle={(isOpen) =>
                  handleFilterSectionToggle('categories', isOpen)
                }
              />

              <CuisineFilterSection
                selectedCuisines={localFilters.cuisine || []}
                onCuisinesChange={(cuisines) =>
                  updateFilter({ cuisine: cuisines })
                }
                variant="dropdown"
                className="w-full sm:w-40"
                isOpen={openFilterSection === 'cuisines'}
                onToggle={(isOpen) =>
                  handleFilterSectionToggle('cuisines', isOpen)
                }
              />

              <MoodFilterSection
                selectedMoods={localFilters.moods || []}
                onMoodsChange={(moods) => updateFilter({ moods })}
                variant="dropdown"
                className="w-full sm:w-40"
                isOpen={openFilterSection === 'moods'}
                onToggle={(isOpen) =>
                  handleFilterSectionToggle('moods', isOpen)
                }
              />

              <IngredientFilterSection
                selectedIngredients={localFilters.availableIngredients || []}
                onIngredientsChange={(ingredients) =>
                  updateFilter({ availableIngredients: ingredients })
                }
                variant="dropdown"
                className="w-full sm:w-40"
                isOpen={openFilterSection === 'ingredients'}
                onToggle={(isOpen) =>
                  handleFilterSectionToggle('ingredients', isOpen)
                }
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

      {/* Nested Drawer Implementation */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end"
          role="dialog"
          aria-modal="true"
          onClick={handleBackdropClick}
        >
          <div
            className="bg-white w-full max-h-[90vh] rounded-t-lg p-4 space-y-4"
            aria-labelledby="filter-bar-drawer-title"
          >
            {/* Main Drawer Content */}
            {!activeNestedDrawer && (
              <>
                <div className="flex justify-between items-center">
                  <h3
                    id="filter-bar-drawer-title"
                    className="text-lg font-semibold"
                  >
                    Filters & Search
                  </h3>
                  <Button variant="ghost" size="sm" onClick={closeAllDrawers}>
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
                    onChange={(e) =>
                      updateFilter({ searchTerm: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>

                {/* Filter Type Buttons */}
                <div className="space-y-2">
                  <FilterTypeButton
                    label="Categories"
                    count={localFilters.categories?.length || 0}
                    onClick={() => openNestedDrawer('categories')}
                  />
                  <FilterTypeButton
                    label="Cuisines"
                    count={localFilters.cuisine?.length || 0}
                    onClick={() => openNestedDrawer('cuisines')}
                  />
                  <FilterTypeButton
                    label="Moods"
                    count={localFilters.moods?.length || 0}
                    onClick={() => openNestedDrawer('moods')}
                  />
                  <FilterTypeButton
                    label="Available Ingredients"
                    count={localFilters.availableIngredients?.length || 0}
                    onClick={() => openNestedDrawer('ingredients')}
                  />
                </div>

                {/* Main Drawer Actions */}
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
                  <Button onClick={closeAllDrawers} className="flex-1">
                    Done
                  </Button>
                </div>
              </>
            )}

            {/* Nested Drawer Content */}
            {activeNestedDrawer && (
              <>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={closeNestedDrawer}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-semibold capitalize">
                    {activeNestedDrawer === 'ingredients'
                      ? 'Available Ingredients'
                      : activeNestedDrawer}
                  </h3>
                </div>

                {/* Filter-Specific Content */}
                <div className="max-h-[65vh] overflow-y-auto">
                  {activeNestedDrawer === 'categories' && (
                    <CategoryFilterSection
                      selectedCategories={localFilters.categories || []}
                      onCategoriesChange={(categories) =>
                        updateFilter({ categories })
                      }
                      variant="drawer"
                    />
                  )}
                  {activeNestedDrawer === 'cuisines' && (
                    <CuisineFilterSection
                      selectedCuisines={localFilters.cuisine || []}
                      onCuisinesChange={(cuisines) =>
                        updateFilter({ cuisine: cuisines })
                      }
                      variant="drawer"
                    />
                  )}
                  {activeNestedDrawer === 'moods' && (
                    <MoodFilterSection
                      selectedMoods={localFilters.moods || []}
                      onMoodsChange={(moods) => updateFilter({ moods })}
                      variant="drawer"
                    />
                  )}
                  {activeNestedDrawer === 'ingredients' && (
                    <IngredientFilterSection
                      selectedIngredients={
                        localFilters.availableIngredients || []
                      }
                      onIngredientsChange={(ingredients) =>
                        updateFilter({ availableIngredients: ingredients })
                      }
                      variant="drawer"
                    />
                  )}
                </div>

                {/* Nested Drawer Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Clear specific filter type
                      switch (activeNestedDrawer) {
                        case 'categories':
                          updateFilter({ categories: [] });
                          break;
                        case 'cuisines':
                          updateFilter({ cuisine: [] });
                          break;
                        case 'moods':
                          updateFilter({ moods: [] });
                          break;
                        case 'ingredients':
                          updateFilter({ availableIngredients: [] });
                          break;
                      }
                    }}
                    className="flex-1"
                  >
                    Clear{' '}
                    {activeNestedDrawer === 'ingredients'
                      ? 'Ingredients'
                      : activeNestedDrawer}
                  </Button>
                  <Button onClick={closeAllDrawers} className="flex-1">
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

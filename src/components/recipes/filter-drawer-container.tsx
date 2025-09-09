import { Filter, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterDrawer } from './filter-drawer';
import { CategorySelectionDrawer } from './category-selection-drawer';
import { CuisineSelectionDrawer } from './cuisine-selection-drawer';
import { MoodSelectionDrawer } from './mood-selection-drawer';
import { IngredientSelectionDrawer } from './ingredient-selection-drawer';
import { useNestedDrawer } from '@/hooks/use-nested-drawer';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import type { RecipeFilters } from '@/lib/types';

interface FilterDrawerContainerProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  totalRecipes?: number;
  filteredCount?: number;
  className?: string;
}

export function FilterDrawerContainer({
  filters,
  onFiltersChange,
  totalRecipes = 0,
  filteredCount = 0,
  className = '',
}: FilterDrawerContainerProps) {
  const { drawerState, actions } = useNestedDrawer();
  const { shouldShowDrawer } = useMobileDetection();

  // Only show drawer interface on mobile/tablet
  if (!shouldShowDrawer()) {
    return null;
  }

  const hasActiveFilters = !!(
    filters.searchTerm ||
    filters.categories?.length ||
    filters.cuisine?.length ||
    filters.moods?.length ||
    filters.availableIngredients?.length
  );

  const activeFilterCount = [
    filters.searchTerm ? 1 : 0,
    filters.categories?.length || 0,
    filters.cuisine?.length || 0,
    filters.moods?.length || 0,
    filters.availableIngredients?.length || 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <>
      {/* Filter Trigger Button */}
      <Button
        variant="outline"
        size="lg"
        className={`w-full sm:w-auto ${className}`}
        onClick={actions.openPrimary}
      >
        <Filter className="mr-2 h-5 w-5" />
        Filters & Search
        {hasActiveFilters && (
          <Badge variant="secondary" className="ml-2">
            {activeFilterCount}
          </Badge>
        )}
        <ChevronRight className="ml-auto h-4 w-4" />
      </Button>

      {/* Primary Filter Drawer */}
      <FilterDrawer
        filters={filters}
        onFiltersChange={onFiltersChange}
        isOpen={drawerState.isPrimaryOpen}
        onClose={actions.closePrimary}
        onOpenCategories={actions.openCategories}
        onOpenCuisines={actions.openCuisines}
        onOpenMoods={actions.openMoods}
        onOpenIngredients={actions.openIngredients}
        totalRecipes={totalRecipes}
        filteredCount={filteredCount}
      />

      {/* Category Selection Drawer */}
      <CategorySelectionDrawer
        isOpen={drawerState.isCategoriesOpen}
        onClose={actions.closeCategories}
        onCloseAll={actions.closeAll}
        onBack={actions.closeCategories}
        selectedCategories={filters.categories || []}
        onCategoriesChange={(categories) => {
          onFiltersChange({ ...filters, categories });
        }}
      />

      {/* Cuisine Selection Drawer */}
      <CuisineSelectionDrawer
        isOpen={drawerState.isCuisinesOpen}
        onClose={actions.closeCuisines}
        onCloseAll={actions.closeAll}
        onBack={actions.closeCuisines}
        selectedCuisines={filters.cuisine || []}
        onCuisinesChange={(cuisines) => {
          onFiltersChange({ ...filters, cuisine: cuisines });
        }}
      />

      {/* Mood Selection Drawer */}
      <MoodSelectionDrawer
        isOpen={drawerState.isMoodsOpen}
        onClose={actions.closeMoods}
        onCloseAll={actions.closeAll}
        onBack={actions.closeMoods}
        selectedMoods={filters.moods || []}
        onMoodsChange={(moods) => {
          onFiltersChange({ ...filters, moods });
        }}
      />

      {/* Ingredient Selection Drawer */}
      <IngredientSelectionDrawer
        isOpen={drawerState.isIngredientsOpen}
        onClose={actions.closeIngredients}
        onBack={actions.closeIngredients}
        selectedIngredients={filters.availableIngredients || []}
        onIngredientsChange={(ingredients) => {
          onFiltersChange({ ...filters, availableIngredients: ingredients });
        }}
      />
    </>
  );
}

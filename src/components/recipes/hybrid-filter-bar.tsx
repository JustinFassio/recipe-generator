import { FilterDrawerContainer } from './filter-drawer-container';
import { FilterBar } from './filter-bar';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import type { RecipeFilters } from '@/lib/types';

interface HybridFilterBarProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  totalRecipes?: number;
  filteredCount?: number;
  className?: string;
}

export function HybridFilterBar({
  filters,
  onFiltersChange,
  totalRecipes = 0,
  filteredCount = 0,
  className = '',
}: HybridFilterBarProps) {
  const { shouldShowDrawer, shouldShowTraditionalFilters } =
    useMobileDetection();

  // Show drawer interface on mobile/tablet
  if (shouldShowDrawer()) {
    return (
      <FilterDrawerContainer
        filters={filters}
        onFiltersChange={onFiltersChange}
        totalRecipes={totalRecipes}
        filteredCount={filteredCount}
        className={className}
      />
    );
  }

  // Show filter bar on desktop
  if (shouldShowTraditionalFilters()) {
    return (
      <FilterBar
        filters={filters}
        onFiltersChange={onFiltersChange}
        className={className}
      />
    );
  }

  // Fallback to filter bar
  return (
    <FilterBar
      filters={filters}
      onFiltersChange={onFiltersChange}
      className={className}
    />
  );
}

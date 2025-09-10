import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import type { RecipeFilters } from '@/lib/types';

export function useFilterBar(
  filters: RecipeFilters,
  onFiltersChange: (filters: RecipeFilters) => void
) {
  const [localFilters, setLocalFilters] = useState<RecipeFilters>(filters);
  const { isMobile, isDesktop, isTablet } = useMobileDetection();

  // Sync with external filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = useCallback(
    (updates: Partial<RecipeFilters>) => {
      const newFilters = { ...localFilters, ...updates };
      setLocalFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [localFilters, onFiltersChange]
  );

  const clearAllFilters = useCallback(() => {
    const clearedFilters: RecipeFilters = {
      searchTerm: undefined,
      categories: undefined,
      cuisine: undefined,
      moods: undefined,
      availableIngredients: undefined,
      sortBy: localFilters.sortBy || 'date',
      sortOrder: localFilters.sortOrder || 'desc',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [localFilters.sortBy, localFilters.sortOrder, onFiltersChange]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      localFilters.searchTerm ||
      localFilters.categories?.length ||
      localFilters.cuisine?.length ||
      localFilters.moods?.length ||
      localFilters.availableIngredients?.length
    );
  }, [localFilters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.searchTerm) count++;
    if (localFilters.categories?.length) count++;
    if (localFilters.cuisine?.length) count++;
    if (localFilters.moods?.length) count++;
    if (localFilters.availableIngredients?.length) count++;
    return count;
  }, [localFilters]);

  return {
    localFilters,
    updateFilter,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount,
    isMobile,
    isDesktop,
    isTablet,
  };
}

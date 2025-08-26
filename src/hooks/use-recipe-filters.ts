import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  RecipeFilters,
  CookingTime,
  Difficulty,
  SortOption,
} from '@/lib/types';

export function useRecipeFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<RecipeFilters>(() => {
    // Initialize from URL params
    return {
      searchTerm: searchParams.get('search') || undefined,
      categories:
        searchParams.get('categories')?.split(',').filter(Boolean) || undefined,
      cookingTime:
        (searchParams
          .get('cookingTime')
          ?.split(',')
          .filter(Boolean) as CookingTime[]) || undefined,
      difficulty:
        (searchParams
          .get('difficulty')
          ?.split(',')
          .filter(Boolean) as Difficulty[]) || undefined,
      sortBy: (searchParams.get('sortBy') as SortOption) || 'date',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };
  });

  // Update URL when filters change
  const updateFilters = useCallback(
    (newFilters: RecipeFilters) => {
      setFilters(newFilters);

      const params = new URLSearchParams();

      if (newFilters.searchTerm) {
        params.set('search', newFilters.searchTerm);
      }
      if (newFilters.categories?.length) {
        params.set('categories', newFilters.categories.join(','));
      }
      if (newFilters.cookingTime?.length) {
        params.set('cookingTime', newFilters.cookingTime.join(','));
      }
      if (newFilters.difficulty?.length) {
        params.set('difficulty', newFilters.difficulty.join(','));
      }
      if (newFilters.sortBy && newFilters.sortBy !== 'date') {
        params.set('sortBy', newFilters.sortBy);
      }
      if (newFilters.sortOrder && newFilters.sortOrder !== 'desc') {
        params.set('sortOrder', newFilters.sortOrder);
      }

      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // Clear all filters except search
  const clearFilters = useCallback(() => {
    const newFilters: RecipeFilters = {
      searchTerm: filters.searchTerm,
      sortBy: 'date',
      sortOrder: 'desc',
    };
    updateFilters(newFilters);
  }, [filters.searchTerm, updateFilters]);

  return {
    filters,
    updateFilters,
    clearFilters,
  };
}

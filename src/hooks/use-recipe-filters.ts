import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import type { RecipeFilters, Cuisine } from '@/lib/types';

export function useRecipeFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: RecipeFilters = useMemo(() => {
    return {
      searchTerm: searchParams.get('search') || undefined,
      categories: searchParams.getAll('category').filter(Boolean),
      cuisine: searchParams.getAll('cuisine').filter(Boolean) as Cuisine[],
      sortBy: (searchParams.get('sort') as RecipeFilters['sortBy']) || 'date',
      sortOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    };
  }, [searchParams]);

  const updateFilters = (newFilters: RecipeFilters) => {
    const params = new URLSearchParams(searchParams);

    // Update search term
    if (newFilters.searchTerm) {
      params.set('search', newFilters.searchTerm);
    } else {
      params.delete('search');
    }

    // Update categories
    params.delete('category');
    newFilters.categories?.forEach((category) => {
      params.append('category', category);
    });

    // Update cuisine
    params.delete('cuisine');
    newFilters.cuisine?.forEach((cuisine) => {
      params.append('cuisine', cuisine);
    });

    // Update sort
    if (newFilters.sortBy) {
      params.set('sort', newFilters.sortBy);
    } else {
      params.delete('sort');
    }

    // Update sort order
    if (newFilters.sortOrder) {
      params.set('order', newFilters.sortOrder);
    } else {
      params.delete('order');
    }

    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  return {
    filters,
    updateFilters,
    clearFilters,
  };
}

import { useMemo, useCallback } from 'react';
import { useSelections } from '@/contexts/SelectionContext';
import type { RecipeFilters, Cuisine, Mood } from '@/lib/types';

/**
 * Adapter hook that bridges SelectionContext with FilterBar's RecipeFilters interface
 *
 * This hook provides a clean interface between the ChatRecipePage's SelectionContext
 * and the new unified FilterBar component, handling type conversions and state mapping.
 */
export function useSelectionFilters() {
  const { selections, updateSelections } = useSelections();

  // Convert SelectionContext state to RecipeFilters format
  const filters: RecipeFilters = useMemo(
    () => ({
      categories: selections.categories,
      cuisine: selections.cuisines as Cuisine[],
      moods: selections.moods as Mood[],
      availableIngredients: selections.availableIngredients,
      searchTerm: undefined, // Search is not persisted in SelectionContext
      sortBy: 'date',
      sortOrder: 'desc',
    }),
    [selections]
  );

  // Convert RecipeFilters changes back to SelectionContext format
  const updateFilters = useCallback(
    (newFilters: RecipeFilters) => {
      updateSelections({
        categories: newFilters.categories || [],
        cuisines: (newFilters.cuisine as string[]) || [],
        moods: (newFilters.moods as string[]) || [],
        availableIngredients: newFilters.availableIngredients || [],
      });
    },
    [updateSelections]
  );

  return { filters, updateFilters };
}

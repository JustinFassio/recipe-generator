import { useState, useCallback, useMemo, useEffect } from 'react';
import type { RecipeFilters, Cuisine, Mood } from '@/lib/types';

export interface FilterDrawerState {
  searchTerm: string;
  selectedCategories: string[];
  selectedCuisines: Cuisine[];
  selectedMoods: Mood[];
  sortBy: RecipeFilters['sortBy'];
  sortOrder: RecipeFilters['sortOrder'];
}

export interface FilterDrawerActions {
  updateSearchTerm: (term: string) => void;
  toggleCategory: (category: string) => void;
  toggleCuisine: (cuisine: Cuisine) => void;
  toggleMood: (mood: Mood) => void;
  updateSortBy: (sortBy: RecipeFilters['sortBy']) => void;
  updateSortOrder: (sortOrder: RecipeFilters['sortOrder']) => void;
  clearAllFilters: () => void;
  clearSearch: () => void;
  applyFilters: () => RecipeFilters;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

export function useFilterDrawer(
  initialFilters: RecipeFilters,
  onFiltersChange: (filters: RecipeFilters) => void
) {
  const [localState, setLocalState] = useState<FilterDrawerState>({
    searchTerm: initialFilters.searchTerm || '',
    selectedCategories: initialFilters.categories || [],
    selectedCuisines: initialFilters.cuisine || [],
    selectedMoods: initialFilters.moods || [],
    sortBy: initialFilters.sortBy || 'date',
    sortOrder: initialFilters.sortOrder || 'desc',
  });

  // Sync local state with incoming filters
  useEffect(() => {
    setLocalState({
      searchTerm: initialFilters.searchTerm || '',
      selectedCategories: initialFilters.categories || [],
      selectedCuisines: initialFilters.cuisine || [],
      selectedMoods: initialFilters.moods || [],
      sortBy: initialFilters.sortBy || 'date',
      sortOrder: initialFilters.sortOrder || 'desc',
    });
  }, [
    initialFilters.searchTerm,
    initialFilters.categories,
    initialFilters.cuisine,
    initialFilters.moods,
    initialFilters.sortBy,
    initialFilters.sortOrder,
  ]);

  const updateSearchTerm = useCallback((term: string) => {
    setLocalState((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setLocalState((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter((c) => c !== category)
        : [...prev.selectedCategories, category],
    }));
  }, []);

  const toggleCuisine = useCallback((cuisine: Cuisine) => {
    setLocalState((prev) => ({
      ...prev,
      selectedCuisines: prev.selectedCuisines.includes(cuisine)
        ? prev.selectedCuisines.filter((c) => c !== cuisine)
        : [...prev.selectedCuisines, cuisine],
    }));
  }, []);

  const toggleMood = useCallback((mood: Mood) => {
    setLocalState((prev) => ({
      ...prev,
      selectedMoods: prev.selectedMoods.includes(mood)
        ? prev.selectedMoods.filter((m) => m !== mood)
        : [...prev.selectedMoods, mood],
    }));
  }, []);

  const updateSortBy = useCallback((sortBy: RecipeFilters['sortBy']) => {
    setLocalState((prev) => ({ ...prev, sortBy }));
  }, []);

  const updateSortOrder = useCallback(
    (sortOrder: RecipeFilters['sortOrder']) => {
      setLocalState((prev) => ({ ...prev, sortOrder }));
    },
    []
  );

  const clearAllFilters = useCallback(() => {
    const clearedState = {
      searchTerm: '',
      selectedCategories: [],
      selectedCuisines: [],
      selectedMoods: [],
      sortBy: localState.sortBy,
      sortOrder: localState.sortOrder,
    };

    setLocalState((prev) => ({
      ...prev,
      ...clearedState,
    }));

    // Also update the parent component's filter state
    const clearedFilters: RecipeFilters = {
      searchTerm: undefined,
      categories: undefined,
      cuisine: undefined,
      moods: undefined,
      sortBy: localState.sortBy,
      sortOrder: localState.sortOrder,
    };

    onFiltersChange(clearedFilters);
  }, [localState.sortBy, localState.sortOrder, onFiltersChange]);

  const clearSearch = useCallback(() => {
    setLocalState((prev) => ({ ...prev, searchTerm: '' }));

    // Also update the parent component's filter state
    const updatedFilters: RecipeFilters = {
      ...localState,
      searchTerm: undefined,
    };

    onFiltersChange(updatedFilters);
  }, [localState, onFiltersChange]);

  const applyFilters = useCallback(() => {
    const filters: RecipeFilters = {
      searchTerm: localState.searchTerm || undefined,
      categories:
        localState.selectedCategories.length > 0
          ? localState.selectedCategories
          : undefined,
      cuisine:
        localState.selectedCuisines.length > 0
          ? localState.selectedCuisines
          : undefined,
      moods:
        localState.selectedMoods.length > 0
          ? localState.selectedMoods
          : undefined,
      sortBy: localState.sortBy,
      sortOrder: localState.sortOrder,
    };

    onFiltersChange(filters);
    return filters;
  }, [localState, onFiltersChange]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      localState.searchTerm ||
      localState.selectedCategories.length > 0 ||
      localState.selectedCuisines.length > 0 ||
      localState.selectedMoods.length > 0
    );
  }, [localState]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localState.searchTerm) count++;
    if (localState.selectedCategories.length > 0) count++;
    if (localState.selectedCuisines.length > 0) count++;
    if (localState.selectedMoods.length > 0) count++;
    return count;
  }, [localState]);

  const actions: FilterDrawerActions = {
    updateSearchTerm,
    toggleCategory,
    toggleCuisine,
    toggleMood,
    updateSortBy,
    updateSortOrder,
    clearAllFilters,
    clearSearch,
    applyFilters,
    hasActiveFilters,
    activeFilterCount,
  };

  return {
    state: localState,
    actions,
  };
}

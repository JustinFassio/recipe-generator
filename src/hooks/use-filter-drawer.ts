import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { RecipeFilters, Cuisine, Mood } from '@/lib/types';

export interface FilterDrawerState {
  searchTerm: string;
  selectedCategories: string[];
  selectedCuisines: Cuisine[];
  selectedMoods: Mood[];
  selectedIngredients: string[];
  sortBy: RecipeFilters['sortBy'];
  sortOrder: RecipeFilters['sortOrder'];
}

export interface FilterDrawerActions {
  updateSearchTerm: (term: string) => void;
  toggleCategory: (category: string) => void;
  toggleCuisine: (cuisine: Cuisine) => void;
  toggleMood: (mood: Mood) => void;
  toggleIngredient: (ingredient: string) => void;
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
  // Store initial sort values to restore them when clearing filters
  const initialSortValues = useRef({
    sortBy: initialFilters.sortBy || 'date',
    sortOrder: initialFilters.sortOrder || 'desc',
  });

  const [localState, setLocalState] = useState<FilterDrawerState>({
    searchTerm: initialFilters.searchTerm || '',
    selectedCategories: initialFilters.categories || [],
    selectedCuisines: initialFilters.cuisine || [],
    selectedMoods: initialFilters.moods || [],
    selectedIngredients: initialFilters.availableIngredients || [],
    sortBy: initialSortValues.current.sortBy,
    sortOrder: initialSortValues.current.sortOrder,
  });

  // Sync local state with incoming filters
  useEffect(() => {
    // Update initial sort values if they change
    const newInitialSortBy = initialFilters.sortBy || 'date';
    const newInitialSortOrder = initialFilters.sortOrder || 'desc';

    setLocalState({
      searchTerm: initialFilters.searchTerm || '',
      selectedCategories: initialFilters.categories || [],
      selectedCuisines: initialFilters.cuisine || [],
      selectedMoods: initialFilters.moods || [],
      selectedIngredients: initialFilters.availableIngredients || [],
      sortBy: newInitialSortBy,
      sortOrder: newInitialSortOrder,
    });
  }, [
    initialFilters.searchTerm,
    initialFilters.categories,
    initialFilters.cuisine,
    initialFilters.moods,
    initialFilters.availableIngredients,
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

  const toggleIngredient = useCallback((ingredient: string) => {
    setLocalState((prev) => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.includes(ingredient)
        ? prev.selectedIngredients.filter((i) => i !== ingredient)
        : [...prev.selectedIngredients, ingredient],
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
      selectedIngredients: [],
      sortBy: initialSortValues.current.sortBy,
      sortOrder: initialSortValues.current.sortOrder,
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
      availableIngredients: undefined,
      sortBy: initialSortValues.current.sortBy,
      sortOrder: initialSortValues.current.sortOrder,
    };

    onFiltersChange(clearedFilters);
  }, [onFiltersChange]);

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
      availableIngredients:
        localState.selectedIngredients.length > 0
          ? localState.selectedIngredients
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
      localState.selectedMoods.length > 0 ||
      localState.selectedIngredients.length > 0
    );
  }, [localState]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localState.searchTerm) count++;
    if (localState.selectedCategories.length > 0) count++;
    if (localState.selectedCuisines.length > 0) count++;
    if (localState.selectedMoods.length > 0) count++;
    if (localState.selectedIngredients.length > 0) count++;
    return count;
  }, [localState]);

  const actions: FilterDrawerActions = {
    updateSearchTerm,
    toggleCategory,
    toggleCuisine,
    toggleMood,
    toggleIngredient,
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

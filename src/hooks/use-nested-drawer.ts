import { useState, useCallback } from 'react';

export interface DrawerState {
  isPrimaryOpen: boolean;
  isCategoriesOpen: boolean;
  isCuisinesOpen: boolean;
  isMoodsOpen: boolean;
  isIngredientsOpen: boolean;
}

export interface DrawerActions {
  openPrimary: () => void;
  closePrimary: () => void;
  openCategories: () => void;
  closeCategories: () => void;
  openCuisines: () => void;
  closeCuisines: () => void;
  openMoods: () => void;
  closeMoods: () => void;
  openIngredients: () => void;
  closeIngredients: () => void;
  closeAll: () => void;
}

export function useNestedDrawer() {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    isPrimaryOpen: false,
    isCategoriesOpen: false,
    isCuisinesOpen: false,
    isMoodsOpen: false,
    isIngredientsOpen: false,
  });

  const openPrimary = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isPrimaryOpen: true }));
  }, []);

  const closePrimary = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isPrimaryOpen: false }));
  }, []);

  const openCategories = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isCategoriesOpen: true }));
  }, []);

  const closeCategories = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isCategoriesOpen: false }));
  }, []);

  const openCuisines = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isCuisinesOpen: true }));
  }, []);

  const closeCuisines = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isCuisinesOpen: false }));
  }, []);

  const openMoods = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isMoodsOpen: true }));
  }, []);

  const closeMoods = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isMoodsOpen: false }));
  }, []);

  const openIngredients = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isIngredientsOpen: true }));
  }, []);

  const closeIngredients = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isIngredientsOpen: false }));
  }, []);

  const closeAll = useCallback(() => {
    setDrawerState({
      isPrimaryOpen: false,
      isCategoriesOpen: false,
      isCuisinesOpen: false,
      isMoodsOpen: false,
      isIngredientsOpen: false,
    });
  }, []);

  const actions: DrawerActions = {
    openPrimary,
    closePrimary,
    openCategories,
    closeCategories,
    openCuisines,
    closeCuisines,
    openMoods,
    closeMoods,
    openIngredients,
    closeIngredients,
    closeAll,
  };

  return {
    drawerState,
    actions,
  };
}

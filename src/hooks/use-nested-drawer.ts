import { useState, useCallback } from 'react';

export interface DrawerState {
  isPrimaryOpen: boolean;
  isCategoriesOpen: boolean;
  isCuisinesOpen: boolean;
  isMoodsOpen: boolean;
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
  closeAll: () => void;
}

export function useNestedDrawer() {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    isPrimaryOpen: false,
    isCategoriesOpen: false,
    isCuisinesOpen: false,
    isMoodsOpen: false,
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

  const closeAll = useCallback(() => {
    setDrawerState({
      isPrimaryOpen: false,
      isCategoriesOpen: false,
      isCuisinesOpen: false,
      isMoodsOpen: false,
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
    closeAll,
  };

  return {
    drawerState,
    actions,
  };
}

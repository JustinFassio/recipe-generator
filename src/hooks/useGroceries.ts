import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { getUserGroceries, updateUserGroceries } from '@/lib/user-preferences';
import { deduplicatedRequest } from '@/lib/request-deduplication';

// Global guard to prevent multiple hook instances from loading simultaneously
const globalLoadingState = {
  isLoading: false,
  loadedUserId: null as string | null,
};

export interface UseGroceriesReturn {
  // State
  groceries: Record<string, string[]>; // Available ingredients (kitchen inventory)
  shoppingList: Record<string, string>; // Unavailable ingredients (shopping list)
  allIngredients: Record<string, string[]>; // All ingredients ever added (persistent list)
  selectedCount: number;
  changeCount: number; // Net changes since last save
  loading: boolean;
  error: string | null;

  // Actions
  toggleIngredient: (category: string, ingredient: string) => void;
  addIngredients: (category: string, ingredients: string[]) => void;
  removeCategory: (category: string) => void;
  clearAll: () => void;
  saveGroceries: () => Promise<boolean>;
  loadGroceries: () => Promise<void>;

  // Utilities
  hasIngredient: (category: string, ingredient: string) => boolean;
  getCategoryCount: (category: string) => number;
  exportGroceries: () => string;
  importGroceries: (jsonData: string) => boolean;

  // Persistent list management
  addToPersistentList: (category: string, ingredient: string) => void;
  removeFromPersistentList: (category: string, ingredient: string) => void;
}

// Helper function to find category for an ingredient
function findCategoryForIngredient(
  ingredient: string,
  groceries: Record<string, string[]>
): string | null {
  for (const [category, items] of Object.entries(groceries)) {
    if (items.includes(ingredient)) {
      return category;
    }
  }
  return null;
}

export function useGroceries(): UseGroceriesReturn {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [groceries, setGroceries] = useState<Record<string, string[]>>({});
  const [shoppingList, setShoppingList] = useState<Record<string, string>>({});
  const [originalGroceries, setOriginalGroceries] = useState<
    Record<string, string[]>
  >({});
  const [allIngredients, setAllIngredients] = useState<
    Record<string, string[]>
  >({}); // Persistent list of all ingredients
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate loads and track state
  const loadedUserIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  // Computed values (unique ingredients across categories)
  const selectedCount = Array.from(
    new Set<string>(Object.values(groceries).flat())
  ).length;

  // Calculate net changes by comparing current state to original state
  const changeCount = useMemo(() => {
    const currentSet = new Set<string>(Object.values(groceries).flat());
    const originalSet = new Set<string>(
      Object.values(originalGroceries).flat()
    );

    // Count ingredients that were added (in current but not original)
    const added = Array.from(currentSet).filter(
      (item) => !originalSet.has(item)
    );

    // Count ingredients that were removed (in original but not current)
    const removed = Array.from(originalSet).filter(
      (item) => !currentSet.has(item)
    );

    const totalChanges = added.length + removed.length;

    // Debug logging in development
    if (import.meta.env.DEV && totalChanges > 0) {
      console.log('Change tracking debug:', {
        current: Array.from(currentSet),
        original: Array.from(originalSet),
        added,
        removed,
        totalChanges,
      });
    }

    return totalChanges;
  }, [groceries, originalGroceries]);

  // Load groceries from database with deduplication
  const loadGroceries = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      loadedUserIdRef.current = null;
      globalLoadingState.loadedUserId = null;
      return;
    }

    // GLOBAL GUARD: Prevent any instance from loading if already loaded for this user
    if (
      globalLoadingState.loadedUserId === user.id &&
      !globalLoadingState.isLoading
    ) {
      return;
    }

    // GLOBAL GUARD: Prevent concurrent loads across all instances
    if (globalLoadingState.isLoading) {
      return;
    }

    // LOCAL GUARD: Prevent duplicate loads within this instance
    if (loadedUserIdRef.current === user.id && !isLoadingRef.current) {
      return;
    }

    // LOCAL GUARD: Prevent concurrent loads within this instance
    if (isLoadingRef.current) {
      return;
    }

    // Set both global and local loading flags
    globalLoadingState.isLoading = true;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Use deduplication to prevent multiple simultaneous requests
      const groceryData = await deduplicatedRequest(
        `user-groceries-legacy-${user.id}`,
        async () => {
          return await getUserGroceries(user.id);
        },
        {
          timeout: 10000, // 10 second timeout
          retries: 2,
        }
      );

      const groceriesData = groceryData?.groceries || {};
      const shoppingListData = groceryData?.shopping_list || {};

      // Debug: Log what we're loading
      if (import.meta.env.DEV) {
        console.log('Loading groceries:', {
          userId: user.id,
          hasData: !!groceryData,
          groceriesData,
          shoppingListData,
          keys: Object.keys(groceriesData),
          isEmpty: Object.keys(groceriesData).length === 0,
          shoppingListKeys: Object.keys(shoppingListData),
          shoppingListEmpty: Object.keys(shoppingListData).length === 0,
        });
      }

      setGroceries(groceriesData);
      setShoppingList(shoppingListData);
      setOriginalGroceries(groceriesData); // Always set original state for change tracking

      // Initialize allIngredients with combined data
      const combinedIngredients: Record<string, string[]> = {
        ...groceriesData,
      };

      // Add ingredients from shopping list to their respective categories
      Object.entries(shoppingListData).forEach(([ingredient]) => {
        const category =
          findCategoryForIngredient(ingredient, groceriesData) ||
          'shopping_list';
        if (!combinedIngredients[category]) {
          combinedIngredients[category] = [];
        }
        if (!combinedIngredients[category].includes(ingredient)) {
          combinedIngredients[category].push(ingredient);
        }
      });

      setAllIngredients(combinedIngredients);

      // Update both global and local state
      loadedUserIdRef.current = user.id;
      globalLoadingState.loadedUserId = user.id;

      if (import.meta.env.DEV) {
        console.log('Initialized states:', {
          groceries: groceriesData,
          shoppingList: shoppingListData,
          allIngredients: combinedIngredients,
        });
      }
    } catch (err) {
      setError('Failed to load groceries');
      console.error('Error loading groceries:', err);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      globalLoadingState.isLoading = false;
    }
  }, [user?.id]);

  // Save groceries to database with deduplication
  const saveGroceries = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Use deduplication to prevent multiple simultaneous save requests
      const result = await deduplicatedRequest(
        `user-groceries-save-${user.id}`,
        async () => {
          return await updateUserGroceries(user.id, groceries, shoppingList);
        },
        {
          timeout: 10000, // 10 second timeout
          retries: 1, // Only retry once for saves
        }
      );

      if (result.success) {
        // Update original state to current state after successful save
        setOriginalGroceries(groceries);

        toast({
          title: 'Success',
          description: 'Kitchen inventory saved successfully!',
        });
        return true;
      } else {
        throw new Error(result.error || 'Failed to save groceries');
      }
    } catch (error) {
      console.error('Error updating groceries:', error);
      setError('Failed to save groceries');
      toast({
        title: 'Error',
        description: 'Failed to save groceries',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, groceries, shoppingList, toast]);

  // Toggle ingredient selection (shopping list workflow)
  const toggleIngredient = useCallback(
    (category: string, ingredient: string) => {
      if (import.meta.env.DEV) {
        console.log('Toggle ingredient called:', { category, ingredient });
      }

      const categoryItems = groceries[category] || [];
      const isSelected = categoryItems.includes(ingredient);
      const isInShoppingList = shoppingList[ingredient] === 'pending';

      if (import.meta.env.DEV) {
        console.log('Toggle state:', {
          category,
          ingredient,
          categoryItems,
          isSelected,
          isInShoppingList,
          currentGroceries: groceries,
          currentShoppingList: shoppingList,
        });
      }

      if (isSelected) {
        // Available → Unavailable: Move from groceries to shopping_list
        setGroceries((prev) => {
          const newItems = prev[category].filter((item) => item !== ingredient);
          return { ...prev, [category]: newItems };
        });

        setShoppingList((prev) => ({
          ...prev,
          [ingredient]: 'pending',
        }));

        if (import.meta.env.DEV) {
          console.log('Moved ingredient to shopping list (unavailable)');
        }
      } else {
        // Unavailable → Available: Move from shopping_list to groceries
        setShoppingList((prev) => {
          const { [ingredient]: removed, ...rest } = prev;
          console.log('Removed ingredient from shopping list:', removed);
          return rest;
        });

        setGroceries((prev) => ({
          ...prev,
          [category]: [...(prev[category] || []), ingredient],
        }));

        if (import.meta.env.DEV) {
          console.log('Moved ingredient to kitchen inventory (available)');
        }
      }
    },
    [groceries, shoppingList]
  );

  // Add multiple ingredients to a category
  const addIngredients = useCallback(
    (category: string, ingredients: string[]) => {
      setGroceries((prev) => {
        const existingItems = prev[category] || [];
        const newItems = ingredients.filter(
          (item) => !existingItems.includes(item)
        );
        return { ...prev, [category]: [...existingItems, ...newItems] };
      });
    },
    []
  );

  // Remove entire category
  const removeCategory = useCallback((category: string) => {
    setGroceries((prev) => {
      const { [category]: removed, ...rest } = prev;
      // Use the removed variable to avoid eslint warning
      void removed;
      return rest;
    });
  }, []);

  // Clear all groceries
  const clearAll = useCallback(() => {
    setGroceries({});
  }, []);

  // Check if ingredient is selected (available in kitchen)
  const hasIngredient = useCallback(
    (category: string, ingredient: string) => {
      return groceries[category]?.includes(ingredient) || false;
    },
    [groceries]
  );

  // Get count for a category
  const getCategoryCount = useCallback(
    (category: string) => {
      return groceries[category]?.length || 0;
    },
    [groceries]
  );

  // Export groceries as JSON
  const exportGroceries = useCallback(() => {
    return JSON.stringify(groceries, null, 2);
  }, [groceries]);

  // Import groceries from JSON
  const importGroceries = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (typeof parsed === 'object' && parsed !== null) {
        setGroceries(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Load groceries when user changes - FIXED: Only depend on user.id, not loadGroceries
  useEffect(() => {
    if (user?.id) {
      loadGroceries();
    } else {
      // Clear data when user logs out
      setGroceries({});
      setShoppingList({});
      setAllIngredients({});
      setOriginalGroceries({});
      loadedUserIdRef.current = null;
      globalLoadingState.loadedUserId = null;
      globalLoadingState.isLoading = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // CRITICAL FIX: Only depend on user.id, loadGroceries handles its own deduplication

  // Debug: Log state changes in development (reduced logging)
  useEffect(() => {
    if (import.meta.env.DEV && changeCount > 0) {
      console.log('Groceries state changed:', {
        groceries: Object.keys(groceries).length > 0 ? groceries : 'empty',
        originalGroceries:
          Object.keys(originalGroceries).length > 0
            ? originalGroceries
            : 'empty',
        changeCount,
      });
    }
  }, [groceries, originalGroceries, changeCount]);

  return {
    // State
    groceries,
    shoppingList,
    allIngredients,
    selectedCount,
    changeCount,
    loading,
    error,

    // Actions
    toggleIngredient,
    addIngredients,
    removeCategory,
    clearAll,
    saveGroceries,
    loadGroceries,

    // Utilities
    hasIngredient,
    getCategoryCount,
    exportGroceries,
    importGroceries,

    // Persistent list management
    addToPersistentList: useCallback((category: string, ingredient: string) => {
      setAllIngredients((prev) => {
        const categoryItems = prev[category] || [];
        if (!categoryItems.includes(ingredient)) {
          return { ...prev, [category]: [...categoryItems, ingredient] };
        }
        return prev;
      });
    }, []),

    removeFromPersistentList: useCallback(
      (category: string, ingredient: string) => {
        setAllIngredients((prev) => {
          const categoryItems = prev[category] || [];
          const newItems = categoryItems.filter((item) => item !== ingredient);
          if (newItems.length === 0) {
            const { [category]: removed, ...rest } = prev;
            void removed; // Avoid eslint warning
            return rest;
          }
          return { ...prev, [category]: newItems };
        });
      },
      []
    ),
  };
}

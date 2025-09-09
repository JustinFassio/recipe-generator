import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { getUserGroceries, updateUserGroceries } from '@/lib/user-preferences';

export interface UseGroceriesReturn {
  // State
  groceries: Record<string, string[]>;
  selectedCount: number;
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
}

export function useGroceries(): UseGroceriesReturn {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [groceries, setGroceries] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const selectedCount = Object.values(groceries).flat().length;

  // Load groceries from database
  const loadGroceries = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const groceryData = await getUserGroceries(user.id);
      setGroceries(groceryData?.groceries || {});
    } catch (err) {
      setError('Failed to load groceries');
      console.error('Error loading groceries:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Save groceries to database
  const saveGroceries = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await updateUserGroceries(user.id, groceries);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Groceries saved successfully!',
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
  }, [user?.id, groceries, toast]);

  // Toggle ingredient selection
  const toggleIngredient = useCallback(
    (category: string, ingredient: string) => {
      setGroceries((prev) => {
        const categoryItems = prev[category] || [];
        const isSelected = categoryItems.includes(ingredient);

        if (isSelected) {
          // Remove ingredient
          const newItems = categoryItems.filter((item) => item !== ingredient);
          if (newItems.length === 0) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [category]: _removed, ...rest } = prev;
            return rest;
          }
          return { ...prev, [category]: newItems };
        } else {
          // Add ingredient
          return { ...prev, [category]: [...categoryItems, ingredient] };
        }
      });
    },
    []
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [category]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // Clear all groceries
  const clearAll = useCallback(() => {
    setGroceries({});
  }, []);

  // Check if ingredient is selected
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

  // Load groceries on mount
  useEffect(() => {
    loadGroceries();
  }, [loadGroceries]);

  return {
    // State
    groceries,
    selectedCount,
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
  };
}

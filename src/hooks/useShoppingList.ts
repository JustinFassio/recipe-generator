import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from '@/hooks/use-toast';

// Shopping list item structure
export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  source: 'recipe' | 'ai-chat' | 'groceries-restock' | 'manual';
  sourceId?: string; // recipe ID, chat message ID, etc.
  sourceTitle?: string; // recipe title, AI suggestion context, etc.
  quantity?: string;
  notes?: string;
  completed: boolean;
  addedAt: string;
}

// Shopping contexts for AI understanding
export interface ShoppingContext {
  id: string;
  type: 'recipe-collection' | 'cuisine-exploration' | 'meal-planning';
  title: string;
  description?: string;
  recipes?: string[]; // recipe IDs
  createdAt: string;
}

export interface UseShoppingListReturn {
  // Shopping list state
  shoppingList: Record<string, ShoppingItem>;
  shoppingContexts: Record<string, ShoppingContext>;
  loading: boolean;
  error: string | null;

  // Shopping list operations
  addToShoppingList: (
    name: string,
    category: string,
    source: ShoppingItem['source'],
    options?: {
      sourceId?: string;
      sourceTitle?: string;
      quantity?: string;
      notes?: string;
    }
  ) => Promise<boolean>;

  removeFromShoppingList: (itemId: string) => Promise<boolean>;
  toggleItemCompleted: (itemId: string) => Promise<boolean>;
  updateShoppingItem: (
    itemId: string,
    updates: Partial<ShoppingItem>
  ) => Promise<boolean>;
  clearCompletedItems: () => Promise<boolean>;
  clearAllItems: () => Promise<boolean>;

  // Context operations
  createShoppingContext: (
    type: ShoppingContext['type'],
    title: string,
    options?: {
      description?: string;
      recipes?: string[];
    }
  ) => Promise<string | null>;

  updateShoppingContext: (
    contextId: string,
    updates: Partial<ShoppingContext>
  ) => Promise<boolean>;
  removeShoppingContext: (contextId: string) => Promise<boolean>;

  // Utility functions
  getItemsBySource: (source: ShoppingItem['source']) => ShoppingItem[];
  getIncompleteItems: () => ShoppingItem[];
  getCompletedItems: () => ShoppingItem[];
  isInShoppingList: (name: string) => boolean;
  getShoppingListCount: () => number;

  // Data loading
  loadShoppingData: () => Promise<void>;
  refreshShoppingData: () => Promise<void>;
}

/**
 * Hook for managing shopping list functionality
 * Extends user groceries with shopping cart capabilities
 */
export function useShoppingList(): UseShoppingListReturn {
  const { user } = useAuth();
  const [shoppingList, setShoppingList] = useState<
    Record<string, ShoppingItem>
  >({});
  const [shoppingContexts, setShoppingContexts] = useState<
    Record<string, ShoppingContext>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load shopping data from database
  const loadShoppingData = useCallback(async () => {
    if (!user?.id) {
      setShoppingList({});
      setShoppingContexts({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_groceries')
        .select('shopping_list, shopping_contexts')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (user has no data yet)
        throw fetchError;
      }

      // Convert simple format to complex format for internal use
      const simpleShoppingList = data?.shopping_list || {};
      const complexShoppingList: Record<string, ShoppingItem> = {};

      Object.entries(simpleShoppingList).forEach(([name, status]) => {
        const item: ShoppingItem = {
          id: `item_${name}_${Date.now()}`,
          name,
          category: 'unknown', // We'll need to track this separately
          source: 'manual',
          completed: status === 'purchased',
          addedAt: new Date().toISOString(),
        };
        complexShoppingList[item.id] = item;
      });

      setShoppingList(complexShoppingList);
      setShoppingContexts(data?.shopping_contexts || {});
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load shopping data';
      setError(errorMessage);
      console.error('Error loading shopping data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Add item to shopping list
  const addToShoppingList = useCallback(
    async (
      name: string,
      _category: string,
      _source: ShoppingItem['source'],
      options: {
        sourceId?: string;
        sourceTitle?: string;
        quantity?: string;
        notes?: string;
      } = {}
    ): Promise<boolean> => {
      if (!user?.id) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to manage your shopping list.',
          variant: 'destructive',
        });
        return false;
      }

      try {
        // Check if item already exists
        const existingItem = Object.values(shoppingList).find(
          (item) => item.name.toLowerCase() === name.toLowerCase()
        );

        console.log('Options received:', options);

        if (existingItem) {
          toast({
            title: 'Item Already in List',
            description: `"${name}" is already in your shopping list.`,
            variant: 'default',
          });
          return true;
        }

        // Create new shopping item in the simple format expected by the database
        const updatedShoppingList = {
          ...shoppingList,
          [name]: 'pending',
        };

        // Save to database
        console.log('Saving shopping list to database:', {
          user_id: user.id,
          shopping_list: updatedShoppingList,
          updated_at: new Date().toISOString(),
        });

        const { error: saveError } = await supabase
          .from('user_groceries')
          .upsert({
            user_id: user.id,
            shopping_list: updatedShoppingList,
            updated_at: new Date().toISOString(),
          });

        if (saveError) {
          console.error('Database save error:', saveError);
          throw saveError;
        }

        // Update local state
        setShoppingList(updatedShoppingList as Record<string, ShoppingItem>);

        toast({
          title: 'Added to Shopping List',
          description: `"${name}" added to your shopping list.`,
        });

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add to shopping list';
        setError(errorMessage);
        console.error('Error adding to shopping list:', err);

        toast({
          title: 'Error',
          description: 'Failed to add item to shopping list. Please try again.',
          variant: 'destructive',
        });

        return false;
      }
    },
    [user?.id, shoppingList]
  );

  // Remove item from shopping list
  const removeFromShoppingList = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!user?.id) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to manage your shopping list.',
          variant: 'destructive',
        });
        return false;
      }

      try {
        const updatedShoppingList = { ...shoppingList };
        const itemName = updatedShoppingList[itemId]?.name;
        delete updatedShoppingList[itemId];

        // Convert back to simple format for database
        const simpleShoppingList: Record<string, string> = {};
        Object.values(updatedShoppingList).forEach((shoppingItem) => {
          simpleShoppingList[shoppingItem.name] = shoppingItem.completed
            ? 'purchased'
            : 'pending';
        });

        // Save to database
        const { error: saveError } = await supabase
          .from('user_groceries')
          .upsert({
            user_id: user.id,
            shopping_list: simpleShoppingList,
            updated_at: new Date().toISOString(),
          });

        if (saveError) throw saveError;

        // Update local state
        setShoppingList(updatedShoppingList);

        toast({
          title: 'Removed from Shopping List',
          description: `"${itemName}" removed from your shopping list.`,
        });

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to remove from shopping list';
        setError(errorMessage);
        console.error('Error removing from shopping list:', err);

        toast({
          title: 'Error',
          description:
            'Failed to remove item from shopping list. Please try again.',
          variant: 'destructive',
        });

        return false;
      }
    },
    [user?.id, shoppingList]
  );

  // Toggle item completed status
  const toggleItemCompleted = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const item = shoppingList[itemId];
        if (!item) return false;

        const updatedShoppingList = {
          ...shoppingList,
          [itemId]: {
            ...item,
            completed: !item.completed,
          },
        };

        // Convert back to simple format for database
        const simpleShoppingList: Record<string, string> = {};
        Object.values(updatedShoppingList).forEach((shoppingItem) => {
          simpleShoppingList[shoppingItem.name] = shoppingItem.completed
            ? 'purchased'
            : 'pending';
        });

        // Save to database
        const { error: saveError } = await supabase
          .from('user_groceries')
          .upsert({
            user_id: user.id,
            shopping_list: simpleShoppingList,
            updated_at: new Date().toISOString(),
          });

        if (saveError) throw saveError;

        // Update local state
        setShoppingList(updatedShoppingList);

        // If this is a groceries-restock item being marked as completed,
        // we need to add it back to the kitchen inventory
        if (item.source === 'groceries-restock' && !item.completed) {
          // Import the groceries hook to add back to kitchen
          const { updateUserGroceries } = await import(
            '@/lib/user-preferences'
          );

          // Get current groceries data
          const { data: groceryData } = await supabase
            .from('user_groceries')
            .select('groceries')
            .eq('user_id', user.id)
            .single();

          const currentGroceries = groceryData?.groceries || {};
          const category = item.category;

          // Add the ingredient back to the kitchen
          const updatedGroceries = {
            ...currentGroceries,
            [category]: [...(currentGroceries[category] || []), item.name],
          };

          // Save updated groceries
          await updateUserGroceries(user.id, updatedGroceries);
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update item');
        return false;
      }
    },
    [user?.id, shoppingList]
  );

  // Update shopping item
  const updateShoppingItem = useCallback(
    async (
      itemId: string,
      updates: Partial<ShoppingItem>
    ): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const updatedShoppingList = {
          ...shoppingList,
          [itemId]: {
            ...shoppingList[itemId],
            ...updates,
          },
        };

        // Save to database
        const { error: saveError } = await supabase
          .from('user_groceries')
          .upsert({
            user_id: user.id,
            shopping_list: updatedShoppingList,
            updated_at: new Date().toISOString(),
          });

        if (saveError) throw saveError;

        // Update local state
        setShoppingList(updatedShoppingList);

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update item');
        return false;
      }
    },
    [user?.id, shoppingList]
  );

  // Clear completed items
  const clearCompletedItems = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const updatedShoppingList = Object.fromEntries(
        Object.entries(shoppingList).filter(([, item]) => !item.completed)
      );

      // Save to database
      const { error: saveError } = await supabase
        .from('user_groceries')
        .upsert({
          user_id: user.id,
          shopping_list: updatedShoppingList,
          updated_at: new Date().toISOString(),
        });

      if (saveError) throw saveError;

      // Update local state
      setShoppingList(updatedShoppingList);

      toast({
        title: 'Completed Items Cleared',
        description:
          'All completed items have been removed from your shopping list.',
      });

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to clear completed items'
      );
      return false;
    }
  }, [user?.id, shoppingList]);

  // Clear all items
  const clearAllItems = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Save to database
      const { error: saveError } = await supabase
        .from('user_groceries')
        .upsert({
          user_id: user.id,
          shopping_list: {},
          updated_at: new Date().toISOString(),
        });

      if (saveError) throw saveError;

      // Update local state
      setShoppingList({});

      toast({
        title: 'Shopping List Cleared',
        description: 'All items have been removed from your shopping list.',
      });

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to clear shopping list'
      );
      return false;
    }
  }, [user?.id]);

  // Create shopping context
  const createShoppingContext = useCallback(
    async (
      type: ShoppingContext['type'],
      title: string,
      options: {
        description?: string;
        recipes?: string[];
      } = {}
    ): Promise<string | null> => {
      if (!user?.id) return null;

      try {
        const newContext: ShoppingContext = {
          id: `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type,
          title,
          description: options.description,
          recipes: options.recipes,
          createdAt: new Date().toISOString(),
        };

        const updatedContexts = {
          ...shoppingContexts,
          [newContext.id]: newContext,
        };

        // Save to database
        const { error: saveError } = await supabase
          .from('user_groceries')
          .upsert({
            user_id: user.id,
            shopping_contexts: updatedContexts,
            updated_at: new Date().toISOString(),
          });

        if (saveError) throw saveError;

        // Update local state
        setShoppingContexts(updatedContexts);

        return newContext.id;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to create shopping context'
        );
        return null;
      }
    },
    [user?.id, shoppingContexts]
  );

  // Update shopping context
  const updateShoppingContext = useCallback(
    async (
      contextId: string,
      updates: Partial<ShoppingContext>
    ): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const updatedContexts = {
          ...shoppingContexts,
          [contextId]: {
            ...shoppingContexts[contextId],
            ...updates,
          },
        };

        // Save to database
        const { error: saveError } = await supabase
          .from('user_groceries')
          .upsert({
            user_id: user.id,
            shopping_contexts: updatedContexts,
            updated_at: new Date().toISOString(),
          });

        if (saveError) throw saveError;

        // Update local state
        setShoppingContexts(updatedContexts);

        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to update shopping context'
        );
        return false;
      }
    },
    [user?.id, shoppingContexts]
  );

  // Remove shopping context
  const removeShoppingContext = useCallback(
    async (contextId: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const updatedContexts = { ...shoppingContexts };
        delete updatedContexts[contextId];

        // Save to database
        const { error: saveError } = await supabase
          .from('user_groceries')
          .upsert({
            user_id: user.id,
            shopping_contexts: updatedContexts,
            updated_at: new Date().toISOString(),
          });

        if (saveError) throw saveError;

        // Update local state
        setShoppingContexts(updatedContexts);

        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to remove shopping context'
        );
        return false;
      }
    },
    [user?.id, shoppingContexts]
  );

  // Utility functions
  const getItemsBySource = useCallback(
    (source: ShoppingItem['source']): ShoppingItem[] => {
      return Object.values(shoppingList).filter(
        (item) => item.source === source
      );
    },
    [shoppingList]
  );

  const getIncompleteItems = useCallback((): ShoppingItem[] => {
    return Object.values(shoppingList).filter((item) => !item.completed);
  }, [shoppingList]);

  const getCompletedItems = useCallback((): ShoppingItem[] => {
    return Object.values(shoppingList).filter((item) => item.completed);
  }, [shoppingList]);

  const isInShoppingList = useCallback(
    (name: string): boolean => {
      return Object.values(shoppingList).some(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      );
    },
    [shoppingList]
  );

  const getShoppingListCount = useCallback((): number => {
    return Object.keys(shoppingList).length;
  }, [shoppingList]);

  // Refresh shopping data (alias for loadShoppingData)
  const refreshShoppingData = useCallback(async () => {
    await loadShoppingData();
  }, [loadShoppingData]);

  // Load shopping data when user changes
  useEffect(() => {
    loadShoppingData();
  }, [loadShoppingData]);

  return {
    // State
    shoppingList,
    shoppingContexts,
    loading,
    error,

    // Shopping list operations
    addToShoppingList,
    removeFromShoppingList,
    toggleItemCompleted,
    updateShoppingItem,
    clearCompletedItems,
    clearAllItems,

    // Context operations
    createShoppingContext,
    updateShoppingContext,
    removeShoppingContext,

    // Utility functions
    getItemsBySource,
    getIncompleteItems,
    getCompletedItems,
    isInShoppingList,
    getShoppingListCount,

    // Data loading
    loadShoppingData,
    refreshShoppingData,
  };
}

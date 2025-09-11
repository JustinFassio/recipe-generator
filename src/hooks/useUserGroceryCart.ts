import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from '@/hooks/use-toast';
import {
  addIngredientToCart,
  removeIngredientFromCart,
  isIngredientInCart,
} from '@/lib/groceries/multi-category-ingredients';

export interface UserGroceryCartReturn {
  userGroceryCart: Record<string, string[]>;
  loading: boolean;
  error: string | null;
  loadUserGroceryCart: () => Promise<void>;
  addToCart: (category: string, name: string) => Promise<boolean>;
  removeFromCart: (name: string) => Promise<boolean>;
  updateCart: (updatedCart: Record<string, string[]>) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  isInCart: (name: string) => boolean;
}

/**
 * Shared hook for managing user grocery cart state across components.
 * Provides consistent data loading, caching, and operations for both
 * global-ingredients-page and groceries-page.
 */
export function useUserGroceryCart(): UserGroceryCartReturn {
  const { user } = useAuth();
  const [userGroceryCart, setUserGroceryCart] = useState<
    Record<string, string[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's grocery cart from database
  const loadUserGroceryCart = useCallback(async () => {
    if (!user?.id) {
      setUserGroceryCart({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_groceries')
        .select('groceries')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (user has no groceries yet)
        throw fetchError;
      }

      setUserGroceryCart(data?.groceries || {});
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load grocery cart';
      setError(errorMessage);
      console.error('Error loading grocery cart:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Add ingredient to cart (with multi-category support)
  const addToCart = useCallback(
    async (category: string, name: string): Promise<boolean> => {
      if (!user?.id) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to manage your grocery cart.',
          variant: 'destructive',
        });
        return false;
      }

      try {
        // Get current cart data
        const { data: currentData, error: fetchError } = await supabase
          .from('user_groceries')
          .select('groceries')
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        // Add ingredient using multi-category logic
        const currentCart = currentData?.groceries || {};
        const updatedCart = addIngredientToCart(name, category, currentCart);

        // Save to database
        const { error: saveError } = await supabase
          .from('user_groceries')
          .upsert({
            user_id: user.id,
            groceries: updatedCart,
            updated_at: new Date().toISOString(),
          });

        if (saveError) throw saveError;

        // Update local state
        setUserGroceryCart(updatedCart);

        toast({
          title: 'Added to Cart',
          description: `"${name}" added to your grocery cart.`,
        });

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add to cart';
        setError(errorMessage);
        console.error('Error adding to cart:', err);

        toast({
          title: 'Error',
          description: 'Failed to add ingredient to cart. Please try again.',
          variant: 'destructive',
        });

        return false;
      }
    },
    [user?.id]
  );

  // Remove ingredient from cart (with multi-category support)
  const removeFromCart = useCallback(
    async (name: string): Promise<boolean> => {
      if (!user?.id) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to manage your grocery cart.',
          variant: 'destructive',
        });
        return false;
      }

      try {
        // Remove using multi-category logic
        const updatedCart = removeIngredientFromCart(name, userGroceryCart);

        // Save to database
        const { error: saveError } = await supabase
          .from('user_groceries')
          .upsert({
            user_id: user.id,
            groceries: updatedCart,
            updated_at: new Date().toISOString(),
          });

        if (saveError) throw saveError;

        // Update local state
        setUserGroceryCart(updatedCart);

        toast({
          title: 'Removed from Cart',
          description: `"${name}" removed from your grocery cart.`,
        });

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to remove from cart';
        setError(errorMessage);
        console.error('Error removing from cart:', err);

        toast({
          title: 'Error',
          description:
            'Failed to remove ingredient from cart. Please try again.',
          variant: 'destructive',
        });

        return false;
      }
    },
    [user?.id, userGroceryCart]
  );

  // Update entire cart (for bulk operations)
  const updateCart = useCallback(
    async (updatedCart: Record<string, string[]>): Promise<boolean> => {
      if (!user?.id) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to manage your grocery cart.',
          variant: 'destructive',
        });
        return false;
      }

      try {
        // Save to database
        const { error: saveError } = await supabase
          .from('user_groceries')
          .upsert({
            user_id: user.id,
            groceries: updatedCart,
            updated_at: new Date().toISOString(),
          });

        if (saveError) throw saveError;

        // Update local state
        setUserGroceryCart(updatedCart);

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update cart';
        setError(errorMessage);
        console.error('Error updating cart:', err);

        toast({
          title: 'Error',
          description: 'Failed to update grocery cart. Please try again.',
          variant: 'destructive',
        });

        return false;
      }
    },
    [user?.id]
  );

  // Refresh cart (alias for loadUserGroceryCart for clarity)
  const refreshCart = useCallback(async () => {
    await loadUserGroceryCart();
  }, [loadUserGroceryCart]);

  // Check if ingredient is in cart (with multi-category support)
  const isInCart = useCallback(
    (name: string): boolean => {
      return isIngredientInCart(name, userGroceryCart);
    },
    [userGroceryCart]
  );

  // Load cart when user changes
  useEffect(() => {
    loadUserGroceryCart();
  }, [loadUserGroceryCart]);

  return {
    userGroceryCart,
    loading,
    error,
    loadUserGroceryCart,
    addToCart,
    removeFromCart,
    updateCart,
    refreshCart,
    isInCart,
  };
}

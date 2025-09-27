import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import {
  EnhancedIngredientMatcher,
  GlobalIngredient,
} from '@/lib/groceries/enhanced-ingredient-matcher';
import { useGroceries } from './useGroceries';
import type { Recipe } from '@/lib/types';

export interface UseGlobalIngredientsReturn {
  // State
  globalIngredients: GlobalIngredient[];
  hiddenNormalizedNames: Set<string>;
  loading: boolean;
  error: string | null;

  // Actions
  saveIngredientToGlobal: (
    ingredient: string,
    category: string,
    recipeContext?: { recipeId: string; recipeCategories: string[] }
  ) => Promise<boolean>;

  extractIngredientsFromRecipe: (recipe: Recipe) => Promise<{
    extracted: Array<{
      ingredient: string;
      suggestedCategory: string;
      confidence: number;
    }>;
    unknown: string[];
  }>;

  searchGlobalIngredients: (query: string) => Promise<GlobalIngredient[]>;

  // Utilities
  getGlobalIngredient: (normalizedName: string) => GlobalIngredient | null;
  refreshGlobalIngredients: () => Promise<void>;

  // Actions for user hidden list
  hideIngredient: (name: string) => Promise<boolean>;
  unhideIngredient: (name: string) => Promise<boolean>;
}

export function useGlobalIngredients(): UseGlobalIngredientsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const { groceries } = useGroceries();

  const [globalIngredients, setGlobalIngredients] = useState<
    GlobalIngredient[]
  >([]);
  const [hiddenNormalizedNames, setHiddenNormalizedNames] = useState<
    Set<string>
  >(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matcher, setMatcher] = useState<EnhancedIngredientMatcher | null>(
    null
  );

  // Initialize matcher when groceries change or immediately with empty groceries for new users
  useEffect(() => {
    const initializeMatcher = async () => {
      // Always initialize matcher, even with empty groceries for new users
      // This allows global ingredients to load for users who haven't set up groceries yet
      const newMatcher = new EnhancedIngredientMatcher(groceries);
      await newMatcher.initialize();
      setMatcher(newMatcher);
    };

    initializeMatcher();
  }, [groceries]);

  // Load global ingredients when matcher is ready
  useEffect(() => {
    if (matcher) {
      loadGlobalIngredients();
      loadHidden();
    }
  }, [matcher]);

  const loadGlobalIngredients = useCallback(async () => {
    if (!matcher) return;

    setLoading(true);
    setError(null);

    try {
      const ingredients = await matcher.getGlobalIngredients();
      setGlobalIngredients(ingredients);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load global ingredients';
      setError(errorMessage);
      console.error('Error loading global ingredients:', err);
    } finally {
      setLoading(false);
    }
  }, [matcher]);

  const loadHidden = useCallback(async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('user_hidden_ingredients')
        .select('normalized_name');
      if (error) throw error;
      setHiddenNormalizedNames(
        new Set(
          (data || []).map(
            (d: { normalized_name: string }) => d.normalized_name
          )
        )
      );
    } catch (err) {
      console.error('Error loading hidden ingredients:', err);
    }
  }, []);

  const saveIngredientToGlobal = useCallback(
    async (
      ingredient: string,
      category: string,
      recipeContext?: { recipeId: string; recipeCategories: string[] }
    ): Promise<boolean> => {
      if (!matcher) {
        toast({
          title: 'Error',
          description: 'Ingredient matcher not initialized',
          variant: 'destructive',
        });
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await matcher.saveIngredientToGlobal(
          ingredient,
          category,
          recipeContext
        );

        if (result.success) {
          toast({
            title: 'Success',
            description: `"${ingredient}" added to global ingredients!`,
          });

          // Refresh the global ingredients list
          await loadGlobalIngredients();
          return true;
        } else {
          throw new Error(result.error || 'Failed to save ingredient');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: 'Failed to save ingredient to global list',
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [matcher, toast, loadGlobalIngredients]
  );

  const extractIngredientsFromRecipe = useCallback(
    async (recipe: Recipe) => {
      if (!matcher) {
        return { extracted: [], unknown: [] };
      }

      try {
        return await matcher.extractIngredientsFromRecipe(recipe);
      } catch (error) {
        console.error('Error extracting ingredients from recipe:', error);
        return { extracted: [], unknown: [] };
      }
    },
    [matcher]
  );

  const searchGlobalIngredients = useCallback(
    async (query: string): Promise<GlobalIngredient[]> => {
      if (!matcher || !query.trim()) {
        return [];
      }

      try {
        return await matcher.searchGlobalIngredients(query);
      } catch (error) {
        console.error('Error searching global ingredients:', error);
        return [];
      }
    },
    [matcher]
  );

  const getGlobalIngredient = useCallback(
    (normalizedName: string): GlobalIngredient | null => {
      return (
        globalIngredients.find(
          (ing) => ing.normalized_name === normalizedName
        ) || null
      );
    },
    [globalIngredients]
  );

  const hideIngredient = useCallback(
    async (name: string): Promise<boolean> => {
      if (!matcher || !user) return false;
      try {
        const normalized = matcher.normalizeName(name);
        const { error } = await (await import('@/lib/supabase')).supabase
          .from('user_hidden_ingredients')
          .insert({ user_id: user.id, normalized_name: normalized });
        if (error) throw error;
        setHiddenNormalizedNames((prev) => new Set(prev).add(normalized));
        return true;
      } catch (err) {
        console.error('Failed to hide ingredient:', err);
        return false;
      }
    },
    [matcher, user]
  );

  const unhideIngredient = useCallback(
    async (name: string): Promise<boolean> => {
      if (!matcher || !user) return false;
      try {
        const normalized = matcher.normalizeName(name);
        const { error } = await (await import('@/lib/supabase')).supabase
          .from('user_hidden_ingredients')
          .delete()
          .eq('user_id', user.id)
          .eq('normalized_name', normalized);
        if (error) throw error;
        setHiddenNormalizedNames((prev) => {
          const next = new Set(prev);
          next.delete(normalized);
          return next;
        });
        return true;
      } catch (err) {
        console.error('Failed to unhide ingredient:', err);
        return false;
      }
    },
    [matcher, user]
  );

  const refreshGlobalIngredients = useCallback(async () => {
    await loadGlobalIngredients();
  }, [loadGlobalIngredients]);

  return {
    globalIngredients,
    hiddenNormalizedNames,
    loading,
    error,
    saveIngredientToGlobal,
    extractIngredientsFromRecipe,
    searchGlobalIngredients,
    getGlobalIngredient,
    refreshGlobalIngredients,
    hideIngredient,
    unhideIngredient,
  };
}

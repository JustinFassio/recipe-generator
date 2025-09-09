import { useMemo } from 'react';
import { useGroceries } from './useGroceries';
import {
  IngredientMatcher,
  RecipeCompatibility,
  IngredientMatch,
} from '@/lib/groceries/ingredient-matcher';
import type { Recipe } from '@/lib/types';

export interface UseIngredientMatchingReturn {
  // Single ingredient matching
  matchIngredient: (ingredient: string) => IngredientMatch;

  // Recipe compatibility
  calculateCompatibility: (recipe: Recipe) => RecipeCompatibility;

  // Bulk recipe analysis
  analyzeRecipes: (recipes: Recipe[]) => RecipeCompatibility[];

  // Utility functions
  hasIngredient: (ingredient: string) => boolean;
  getAvailabilityPercentage: (recipe: Recipe) => number;
  getMissingIngredients: (recipe: Recipe) => string[];

  // State
  isReady: boolean;
  groceriesCount: number;
}

export function useIngredientMatching(): UseIngredientMatchingReturn {
  const { groceries, loading } = useGroceries();

  const matcher = useMemo(() => {
    if (Object.keys(groceries).length === 0) return null;
    return new IngredientMatcher(groceries);
  }, [groceries]);

  const matchIngredient = useMemo(() => {
    return (ingredient: string): IngredientMatch => {
      if (!matcher) {
        return {
          recipeIngredient: ingredient,
          confidence: 0,
          matchType: 'none',
        };
      }
      return matcher.matchIngredient(ingredient);
    };
  }, [matcher]);

  const calculateCompatibility = useMemo(() => {
    return (recipe: Recipe): RecipeCompatibility => {
      if (!matcher) {
        return {
          recipeId: recipe.id,
          totalIngredients: recipe.ingredients.length,
          availableIngredients: [],
          missingIngredients: recipe.ingredients.map((ing) => ({
            recipeIngredient: ing,
            confidence: 0,
            matchType: 'none' as const,
          })),
          compatibilityScore: 0,
          confidenceScore: 0,
        };
      }
      return matcher.calculateRecipeCompatibility(recipe);
    };
  }, [matcher]);

  const analyzeRecipes = useMemo(() => {
    return (recipes: Recipe[]): RecipeCompatibility[] => {
      if (!matcher) return [];
      return recipes
        .map((recipe) => matcher.calculateRecipeCompatibility(recipe))
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    };
  }, [matcher]);

  const hasIngredient = useMemo(() => {
    return (ingredient: string): boolean => {
      const match = matchIngredient(ingredient);
      return match.matchType !== 'none' && match.confidence >= 50;
    };
  }, [matchIngredient]);

  const getAvailabilityPercentage = useMemo(() => {
    return (recipe: Recipe): number => {
      const compatibility = calculateCompatibility(recipe);
      return compatibility.compatibilityScore;
    };
  }, [calculateCompatibility]);

  const getMissingIngredients = useMemo(() => {
    return (recipe: Recipe): string[] => {
      const compatibility = calculateCompatibility(recipe);
      return compatibility.missingIngredients.map(
        (match) => match.recipeIngredient
      );
    };
  }, [calculateCompatibility]);

  const groceriesCount = Object.values(groceries).flat().length;

  return {
    matchIngredient,
    calculateCompatibility,
    analyzeRecipes,
    hasIngredient,
    getAvailabilityPercentage,
    getMissingIngredients,
    isReady: !loading && matcher !== null,
    groceriesCount,
  };
}

# Automatic Ingredient Matching - Implementation Plan

**Project:** Recipe Generator  
**Feature:** Automatic Ingredient Matching in Recipes  
**Author:** AI Assistant  
**Date:** January 2025  
**Status:** Planning Phase

---

## 🎯 **Executive Summary**

This document outlines the implementation plan for automatic ingredient matching between user grocery selections and recipe ingredients. This feature will enhance the Recipe Generator by providing visual indicators of ingredient availability, compatibility scores, and smart shopping list generation.

### **Key Value Propositions**

- **Visual Availability Indicators**: Clear "You have this" badges on recipe ingredients
- **Recipe Compatibility Scoring**: Percentage-based matching for recipe selection
- **Smart Shopping Lists**: Automatic generation of missing ingredients
- **Enhanced Recipe Discovery**: Prioritize recipes based on available ingredients
- **Reduced Cognitive Load**: No more manual ingredient checking

---

## 🏗️ **Current State Analysis**

### **Recipe Ingredient Structure**

Based on codebase analysis, recipe ingredients are stored as:

```typescript
interface Recipe {
  ingredients: string[]; // Array of ingredient strings
  // Examples:
  // - "2 cups all-purpose flour"
  // - "1 large onion, diced"
  // - "3 cloves garlic, minced"
  // - "Salt and pepper to taste"
}
```

### **Grocery Data Structure**

```typescript
interface UserGroceries {
  groceries: Record<string, string[]>; // Category -> ingredients
  // Example:
  // {
  //   "proteins": ["chicken breast", "eggs", "tofu"],
  //   "vegetables": ["onions", "garlic", "tomatoes"],
  //   "spices": ["salt", "black pepper", "basil"]
  // }
}
```

### **Current Recipe Display**

- **Recipe View**: Displays ingredients as a simple list with bullet points
- **Recipe Card**: Shows ingredient count but no availability info
- **Recipe Form**: Basic ingredient input with add/remove functionality

---

## 📋 **Technical Implementation Plan**

### **Phase 1: Core Matching Engine** ⏱️ _Week 1_

#### **1.1 Ingredient Matching Algorithm**

##### **File**: `src/lib/groceries/ingredient-matcher.ts`

```typescript
export interface IngredientMatch {
  recipeIngredient: string;
  matchedGroceryIngredient?: string;
  matchedCategory?: string;
  confidence: number; // 0-100
  matchType: 'exact' | 'partial' | 'fuzzy' | 'none';
}

export interface RecipeCompatibility {
  recipeId: string;
  totalIngredients: number;
  availableIngredients: IngredientMatch[];
  missingIngredients: IngredientMatch[];
  compatibilityScore: number; // 0-100
  confidenceScore: number; // Average confidence of matches
}

/**
 * Core ingredient matching engine with multiple matching strategies
 */
export class IngredientMatcher {
  private groceries: Record<string, string[]>;
  private preprocessedGroceries: Map<
    string,
    { category: string; normalized: string }
  >;

  constructor(groceries: Record<string, string[]>) {
    this.groceries = groceries;
    this.preprocessedGroceries = this.preprocessGroceries();
  }

  /**
   * Match a single recipe ingredient against user groceries
   */
  matchIngredient(recipeIngredient: string): IngredientMatch {
    const normalized = this.normalizeIngredient(recipeIngredient);

    // Strategy 1: Exact match
    const exactMatch = this.findExactMatch(normalized);
    if (exactMatch) {
      return {
        recipeIngredient,
        matchedGroceryIngredient: exactMatch.ingredient,
        matchedCategory: exactMatch.category,
        confidence: 100,
        matchType: 'exact',
      };
    }

    // Strategy 2: Partial match (contains)
    const partialMatch = this.findPartialMatch(normalized);
    if (partialMatch) {
      return {
        recipeIngredient,
        matchedGroceryIngredient: partialMatch.ingredient,
        matchedCategory: partialMatch.category,
        confidence: partialMatch.confidence,
        matchType: 'partial',
      };
    }

    // Strategy 3: Fuzzy match (synonyms, plurals, etc.)
    const fuzzyMatch = this.findFuzzyMatch(normalized);
    if (fuzzyMatch) {
      return {
        recipeIngredient,
        matchedGroceryIngredient: fuzzyMatch.ingredient,
        matchedCategory: fuzzyMatch.category,
        confidence: fuzzyMatch.confidence,
        matchType: 'fuzzy',
      };
    }

    // No match found
    return {
      recipeIngredient,
      confidence: 0,
      matchType: 'none',
    };
  }

  /**
   * Calculate compatibility for entire recipe
   */
  calculateRecipeCompatibility(recipe: Recipe): RecipeCompatibility {
    const matches = recipe.ingredients.map((ingredient) =>
      this.matchIngredient(ingredient)
    );

    const availableMatches = matches.filter(
      (match) => match.matchType !== 'none'
    );
    const missingMatches = matches.filter(
      (match) => match.matchType === 'none'
    );

    const compatibilityScore =
      recipe.ingredients.length > 0
        ? Math.round(
            (availableMatches.length / recipe.ingredients.length) * 100
          )
        : 0;

    const confidenceScore =
      availableMatches.length > 0
        ? Math.round(
            availableMatches.reduce((sum, match) => sum + match.confidence, 0) /
              availableMatches.length
          )
        : 0;

    return {
      recipeId: recipe.id,
      totalIngredients: recipe.ingredients.length,
      availableIngredients: availableMatches,
      missingIngredients: missingMatches,
      compatibilityScore,
      confidenceScore,
    };
  }

  private preprocessGroceries(): Map<
    string,
    { category: string; normalized: string }
  > {
    const processed = new Map();

    Object.entries(this.groceries).forEach(([category, ingredients]) => {
      ingredients.forEach((ingredient) => {
        const normalized = this.normalizeIngredient(ingredient);
        processed.set(normalized, { category, normalized });

        // Add plurals and singulars
        const variants = this.generateVariants(ingredient);
        variants.forEach((variant) => {
          const normalizedVariant = this.normalizeIngredient(variant);
          if (!processed.has(normalizedVariant)) {
            processed.set(normalizedVariant, {
              category,
              normalized: normalizedVariant,
            });
          }
        });
      });
    });

    return processed;
  }

  private normalizeIngredient(ingredient: string): string {
    return ingredient
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(
        /\b(fresh|dried|ground|whole|chopped|diced|sliced|minced)\b/g,
        ''
      ) // Remove prep words
      .replace(
        /\b(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g)\b/g,
        ''
      ) // Remove measurements
      .replace(/\b(large|medium|small|extra)\b/g, '') // Remove size descriptors
      .replace(/\b(\d+)\b/g, '') // Remove numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private findExactMatch(
    normalized: string
  ): { ingredient: string; category: string } | null {
    const match = this.preprocessedGroceries.get(normalized);
    if (match) {
      const originalIngredient = Object.entries(this.groceries)
        .find(([cat]) => cat === match.category)?.[1]
        ?.find((ing) => this.normalizeIngredient(ing) === normalized);

      if (originalIngredient) {
        return { ingredient: originalIngredient, category: match.category };
      }
    }
    return null;
  }

  private findPartialMatch(
    normalized: string
  ): { ingredient: string; category: string; confidence: number } | null {
    const words = normalized.split(' ').filter((word) => word.length > 2);
    let bestMatch: {
      ingredient: string;
      category: string;
      confidence: number;
    } | null = null;

    for (const [groceryNormalized, { category }] of this
      .preprocessedGroceries) {
      const groceryWords = groceryNormalized.split(' ');

      // Check if recipe ingredient contains grocery ingredient
      if (normalized.includes(groceryNormalized)) {
        const confidence = Math.round(
          (groceryNormalized.length / normalized.length) * 80
        );
        if (!bestMatch || confidence > bestMatch.confidence) {
          const originalIngredient = Object.entries(this.groceries)
            .find(([cat]) => cat === category)?.[1]
            ?.find(
              (ing) => this.normalizeIngredient(ing) === groceryNormalized
            );

          if (originalIngredient) {
            bestMatch = {
              ingredient: originalIngredient,
              category,
              confidence,
            };
          }
        }
      }

      // Check if grocery ingredient contains recipe ingredient words
      const matchingWords = words.filter((word) =>
        groceryNormalized.includes(word)
      );
      if (matchingWords.length > 0) {
        const confidence = Math.round(
          (matchingWords.length / words.length) * 70
        );
        if (!bestMatch || confidence > bestMatch.confidence) {
          const originalIngredient = Object.entries(this.groceries)
            .find(([cat]) => cat === category)?.[1]
            ?.find(
              (ing) => this.normalizeIngredient(ing) === groceryNormalized
            );

          if (originalIngredient) {
            bestMatch = {
              ingredient: originalIngredient,
              category,
              confidence,
            };
          }
        }
      }
    }

    return bestMatch && bestMatch.confidence >= 50 ? bestMatch : null;
  }

  private findFuzzyMatch(
    normalized: string
  ): { ingredient: string; category: string; confidence: number } | null {
    // Implement fuzzy matching with synonyms and common variations
    const synonyms = this.getIngredientSynonyms(normalized);

    for (const synonym of synonyms) {
      const match = this.findPartialMatch(synonym);
      if (match) {
        return { ...match, confidence: Math.max(match.confidence - 10, 40) }; // Reduce confidence for fuzzy matches
      }
    }

    return null;
  }

  private generateVariants(ingredient: string): string[] {
    const variants = [ingredient];
    const lower = ingredient.toLowerCase();

    // Add plural/singular variants
    if (lower.endsWith('s') && lower.length > 3) {
      variants.push(lower.slice(0, -1)); // Remove 's'
    } else if (!lower.endsWith('s')) {
      variants.push(lower + 's'); // Add 's'
    }

    // Add common variations
    if (lower.includes(' ')) {
      variants.push(lower.replace(' ', '')); // Remove spaces
    }

    return variants;
  }

  private getIngredientSynonyms(ingredient: string): string[] {
    // Common ingredient synonyms mapping
    const synonymMap: Record<string, string[]> = {
      onion: ['yellow onion', 'white onion', 'sweet onion'],
      tomato: ['tomatoes', 'roma tomato', 'cherry tomato'],
      pepper: ['bell pepper', 'sweet pepper'],
      garlic: ['garlic clove', 'garlic bulb'],
      chicken: ['chicken breast', 'chicken thigh', 'poultry'],
      beef: ['ground beef', 'beef chuck', 'steak'],
      oil: ['olive oil', 'vegetable oil', 'cooking oil'],
      salt: ['sea salt', 'table salt', 'kosher salt'],
      pepper: ['black pepper', 'white pepper', 'ground pepper'],
      cheese: ['cheddar', 'mozzarella', 'parmesan'],
      milk: ['whole milk', '2% milk', 'dairy milk'],
      butter: ['salted butter', 'unsalted butter'],
      flour: ['all purpose flour', 'wheat flour', 'plain flour'],
      sugar: ['white sugar', 'granulated sugar'],
      egg: ['eggs', 'chicken egg'],
      lemon: ['lemon juice', 'fresh lemon'],
      lime: ['lime juice', 'fresh lime'],
    };

    const words = ingredient.split(' ');
    const synonyms = [ingredient];

    words.forEach((word) => {
      if (synonymMap[word]) {
        synonyms.push(...synonymMap[word]);
      }
    });

    return synonyms;
  }
}
```

#### **1.2 React Hook Integration**

##### **File**: `src/hooks/useIngredientMatching.ts`

```typescript
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
```

### **Phase 2: UI Component Integration** ⏱️ _Week 2_

#### **2.1 Enhanced Recipe View with Availability Indicators**

##### **File**: `src/components/recipes/enhanced-recipe-view.tsx`

```typescript
import React from 'react';
import { Check, ShoppingCart, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIngredientMatching } from '@/hooks/useIngredientMatching';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import type { Recipe } from '@/lib/types';

interface EnhancedRecipeViewProps {
  recipe: Recipe;
  onEdit?: () => void;
  onBack?: () => void;
}

export function EnhancedRecipeView({ recipe, onEdit, onBack }: EnhancedRecipeViewProps) {
  const ingredientMatching = useIngredientMatching();

  const compatibility = ingredientMatching.calculateCompatibility(recipe);
  const availabilityPercentage = compatibility.compatibilityScore;
  const missingIngredients = compatibility.missingIngredients;

  const getIngredientStatusIcon = (match: any) => {
    switch (match.matchType) {
      case 'exact':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'partial':
      case 'fuzzy':
        return <Check className="h-4 w-4 text-yellow-600" />;
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-400" />;
    }
  };

  const getIngredientBadge = (match: any) => {
    if (match.matchType === 'none') return null;

    const variant = match.matchType === 'exact' ? 'default' : 'secondary';
    const text = match.matchType === 'exact' ? 'You have this' : 'Similar item';

    return (
      <Badge variant={variant} className="ml-2 text-xs">
        {text}
      </Badge>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Existing header code... */}

      {/* Grocery Compatibility Section */}
      {ingredientMatching.isReady && ingredientMatching.groceriesCount > 0 && (
        <div className={createDaisyUICardClasses('bordered bg-gradient-to-r from-green-50 to-blue-50')}>
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-green-800">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Grocery Compatibility
              </h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {availabilityPercentage}%
                </div>
                <div className="text-sm text-green-700">
                  {compatibility.availableIngredients.length} of {compatibility.totalIngredients} ingredients
                </div>
              </div>
            </div>

            {/* Compatibility Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  availabilityPercentage >= 80 ? 'bg-green-500' :
                  availabilityPercentage >= 60 ? 'bg-yellow-500' :
                  availabilityPercentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${availabilityPercentage}%` }}
              />
            </div>

            {/* Compatibility Messages */}
            {availabilityPercentage >= 80 && (
              <div className="alert alert-success">
                <Check className="h-4 w-4" />
                <span>Excellent match! You have most ingredients needed.</span>
              </div>
            )}

            {availabilityPercentage >= 50 && availabilityPercentage < 80 && (
              <div className="alert alert-info">
                <AlertCircle className="h-4 w-4" />
                <span>Good match! You have many of the ingredients needed.</span>
              </div>
            )}

            {availabilityPercentage < 50 && (
              <div className="alert alert-warning">
                <AlertCircle className="h-4 w-4" />
                <span>You'll need to shop for several ingredients for this recipe.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Ingredients Section */}
      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3 className="card-title text-xl font-semibold mb-4">
            Ingredients
            {ingredientMatching.isReady && (
              <span className="text-sm font-normal text-gray-600">
                ({compatibility.availableIngredients.length} available)
              </span>
            )}
          </h3>

          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => {
              const match = ingredientMatching.matchIngredient(ingredient);
              const isAvailable = match.matchType !== 'none' && match.confidence >= 50;

              return (
                <div key={index} className="flex items-start">
                  {ingredient.startsWith('---') && ingredient.endsWith('---') ? (
                    // Category header (existing code)
                    <div className="w-full">
                      <div className="divider" />
                      <h4 className="mb-2 text-lg font-semibold text-gray-800">
                        {ingredient.replace(/^---\s*/, '').replace(/\s*---$/, '')}
                      </h4>
                    </div>
                  ) : (
                    // Enhanced ingredient with availability indicator
                    <div className="flex items-center w-full">
                      <div className="mt-0.5 mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center">
                        {getIngredientStatusIcon(match)}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <p className={`leading-relaxed ${
                          isAvailable ? 'text-gray-900 font-medium' : 'text-gray-700'
                        }`}>
                          {ingredient}
                        </p>
                        <div className="flex items-center">
                          {getIngredientBadge(match)}
                          {match.matchedGroceryIngredient && (
                            <span className="text-xs text-gray-500 ml-2">
                              (matches: {match.matchedGroceryIngredient})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Shopping List for Missing Ingredients */}
          {missingIngredients.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Shopping List ({missingIngredients.length} items)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {missingIngredients.map((match, index) => (
                  <div key={index} className="flex items-center text-sm text-blue-700">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                    {match.recipeIngredient}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  // Future: Export shopping list functionality
                  console.log('Export shopping list:', missingIngredients);
                }}
              >
                Export Shopping List
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Rest of existing recipe view components... */}
    </div>
  );
}
```

#### **2.2 Enhanced Recipe Cards with Compatibility Scores**

##### **File**: `src/components/recipes/enhanced-recipe-card.tsx`

```typescript
import React from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIngredientMatching } from '@/hooks/useIngredientMatching';
import { createDaisyUICardClasses, createDaisyUIBadgeClasses } from '@/lib/card-migration';
import type { Recipe } from '@/lib/types';

interface EnhancedRecipeCardProps {
  recipe: Recipe;
  onEdit?: () => void;
  onView?: () => void;
  showShareButton?: boolean;
  onShareToggle?: () => void;
}

export function EnhancedRecipeCard({
  recipe,
  onEdit,
  onView,
  showShareButton,
  onShareToggle
}: EnhancedRecipeCardProps) {
  const ingredientMatching = useIngredientMatching();

  const compatibility = ingredientMatching.calculateCompatibility(recipe);
  const availabilityPercentage = compatibility.compatibilityScore;
  const hasGroceries = ingredientMatching.groceriesCount > 0;

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getCompatibilityIcon = (score: number) => {
    if (score >= 70) return <Check className="h-3 w-3" />;
    return <ShoppingCart className="h-3 w-3" />;
  };

  return (
    <div className={createDaisyUICardClasses('bordered hover:shadow-lg transition-shadow')}>
      {/* Existing card content... */}

      <div className="card-body pb-3 pt-0">
        <div className="space-y-3">
          {/* Enhanced ingredient count with compatibility */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <span className={createDaisyUIBadgeClasses('secondary', 'text-xs')}>
                {recipe.ingredients.length} ingredients
              </span>

              {/* Grocery Compatibility Badge */}
              {hasGroceries && ingredientMatching.isReady && (
                <Badge
                  variant="outline"
                  className={`text-xs ${getCompatibilityColor(availabilityPercentage)}`}
                >
                  <div className="flex items-center space-x-1">
                    {getCompatibilityIcon(availabilityPercentage)}
                    <span>{availabilityPercentage}% match</span>
                  </div>
                </Badge>
              )}
            </div>

            <span className="text-xs">
              {new Date(recipe.created_at).toLocaleDateString('en-US')}
            </span>
          </div>

          {/* Available ingredients preview */}
          {hasGroceries && ingredientMatching.isReady && compatibility.availableIngredients.length > 0 && (
            <div className="text-xs text-green-600">
              <div className="flex items-center space-x-1">
                <Check className="h-3 w-3" />
                <span>
                  You have: {compatibility.availableIngredients.slice(0, 3).map(match =>
                    match.matchedGroceryIngredient || match.recipeIngredient
                  ).join(', ')}
                  {compatibility.availableIngredients.length > 3 &&
                    ` +${compatibility.availableIngredients.length - 3} more`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Existing categories, instructions, notes... */}

        </div>
      </div>

      {/* Rest of existing card content... */}
    </div>
  );
}
```

### **Phase 3: Recipe Discovery Enhancement** ⏱️ _Week 3_

#### **3.1 Smart Recipe Sorting Hook**

##### **File**: `src/hooks/useSmartRecipeSort.ts`

```typescript
import { useMemo } from 'react';
import { useIngredientMatching } from './useIngredientMatching';
import type { Recipe, RecipeFilters } from '@/lib/types';

export interface SmartSortOptions {
  prioritizeAvailable: boolean;
  minimumCompatibility: number; // 0-100
  sortBy: 'compatibility' | 'confidence' | 'date' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface UseSmartRecipeSortReturn {
  sortedRecipes: Recipe[];
  compatibilityData: Map<string, any>;
  highCompatibilityRecipes: Recipe[];
  mediumCompatibilityRecipes: Recipe[];
  lowCompatibilityRecipes: Recipe[];
  noGroceryRecipes: Recipe[];
}

const DEFAULT_SORT_OPTIONS: SmartSortOptions = {
  prioritizeAvailable: true,
  minimumCompatibility: 0,
  sortBy: 'compatibility',
  sortOrder: 'desc',
};

export function useSmartRecipeSort(
  recipes: Recipe[],
  options: Partial<SmartSortOptions> = {}
): UseSmartRecipeSortReturn {
  const ingredientMatching = useIngredientMatching();
  const sortOptions = { ...DEFAULT_SORT_OPTIONS, ...options };

  const { sortedRecipes, compatibilityData } = useMemo(() => {
    if (!ingredientMatching.isReady || recipes.length === 0) {
      return {
        sortedRecipes: recipes,
        compatibilityData: new Map(),
      };
    }

    // Calculate compatibility for all recipes
    const recipesWithCompatibility = recipes.map((recipe) => {
      const compatibility = ingredientMatching.calculateCompatibility(recipe);
      return { recipe, compatibility };
    });

    // Filter by minimum compatibility if specified
    const filtered = recipesWithCompatibility.filter(
      ({ compatibility }) =>
        compatibility.compatibilityScore >= sortOptions.minimumCompatibility
    );

    // Sort based on options
    const sorted = filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortOptions.sortBy) {
        case 'compatibility':
          comparison =
            b.compatibility.compatibilityScore -
            a.compatibility.compatibilityScore;
          break;
        case 'confidence':
          comparison =
            b.compatibility.confidenceScore - a.compatibility.confidenceScore;
          break;
        case 'date':
          comparison =
            new Date(b.recipe.created_at).getTime() -
            new Date(a.recipe.created_at).getTime();
          break;
        case 'title':
          comparison = a.recipe.title.localeCompare(b.recipe.title);
          break;
      }

      return sortOptions.sortOrder === 'asc' ? -comparison : comparison;
    });

    // If prioritizing available ingredients, boost high-compatibility recipes
    if (sortOptions.prioritizeAvailable) {
      const highCompatibility = sorted.filter(
        ({ compatibility }) => compatibility.compatibilityScore >= 70
      );
      const mediumCompatibility = sorted.filter(
        ({ compatibility }) =>
          compatibility.compatibilityScore >= 40 &&
          compatibility.compatibilityScore < 70
      );
      const lowCompatibility = sorted.filter(
        ({ compatibility }) => compatibility.compatibilityScore < 40
      );

      const reordered = [
        ...highCompatibility,
        ...mediumCompatibility,
        ...lowCompatibility,
      ];
      const compatibilityMap = new Map(
        reordered.map(({ recipe, compatibility }) => [recipe.id, compatibility])
      );

      return {
        sortedRecipes: reordered.map(({ recipe }) => recipe),
        compatibilityData: compatibilityMap,
      };
    }

    const compatibilityMap = new Map(
      sorted.map(({ recipe, compatibility }) => [recipe.id, compatibility])
    );

    return {
      sortedRecipes: sorted.map(({ recipe }) => recipe),
      compatibilityData: compatibilityMap,
    };
  }, [recipes, ingredientMatching, sortOptions]);

  const categorizedRecipes = useMemo(() => {
    if (!ingredientMatching.isReady) {
      return {
        highCompatibilityRecipes: [],
        mediumCompatibilityRecipes: [],
        lowCompatibilityRecipes: [],
        noGroceryRecipes: recipes,
      };
    }

    const high = sortedRecipes.filter((recipe) => {
      const compatibility = compatibilityData.get(recipe.id);
      return compatibility && compatibility.compatibilityScore >= 70;
    });

    const medium = sortedRecipes.filter((recipe) => {
      const compatibility = compatibilityData.get(recipe.id);
      return (
        compatibility &&
        compatibility.compatibilityScore >= 40 &&
        compatibility.compatibilityScore < 70
      );
    });

    const low = sortedRecipes.filter((recipe) => {
      const compatibility = compatibilityData.get(recipe.id);
      return compatibility && compatibility.compatibilityScore < 40;
    });

    return {
      highCompatibilityRecipes: high,
      mediumCompatibilityRecipes: medium,
      lowCompatibilityRecipes: low,
      noGroceryRecipes: ingredientMatching.groceriesCount === 0 ? recipes : [],
    };
  }, [sortedRecipes, compatibilityData, ingredientMatching, recipes]);

  return {
    sortedRecipes,
    compatibilityData,
    ...categorizedRecipes,
  };
}
```

#### **3.2 Enhanced Recipes Page with Smart Sorting**

##### **File**: `src/pages/enhanced-recipes-page.tsx`

```typescript
import React, { useState } from 'react';
import { useRecipes } from '@/hooks/use-recipes';
import { useRecipeFilters } from '@/hooks/use-recipe-filters';
import { useSmartRecipeSort } from '@/hooks/useSmartRecipeSort';
import { useIngredientMatching } from '@/hooks/useIngredientMatching';
import { EnhancedRecipeCard } from '@/components/recipes/enhanced-recipe-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Filter, SortAsc } from 'lucide-react';

export function EnhancedRecipesPage() {
  const { filters, updateFilters } = useRecipeFilters();
  const { data: recipes = [], isLoading, error } = useRecipes(filters);
  const ingredientMatching = useIngredientMatching();

  const [sortOptions, setSortOptions] = useState({
    prioritizeAvailable: true,
    minimumCompatibility: 0,
    sortBy: 'compatibility' as const,
    sortOrder: 'desc' as const
  });

  const {
    sortedRecipes,
    compatibilityData,
    highCompatibilityRecipes,
    mediumCompatibilityRecipes,
    lowCompatibilityRecipes,
    noGroceryRecipes
  } = useSmartRecipeSort(recipes, sortOptions);

  const [viewMode, setViewMode] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const getDisplayRecipes = () => {
    switch (viewMode) {
      case 'high': return highCompatibilityRecipes;
      case 'medium': return mediumCompatibilityRecipes;
      case 'low': return lowCompatibilityRecipes;
      default: return sortedRecipes;
    }
  };

  const displayRecipes = getDisplayRecipes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Enhanced Header with Grocery Status */}
        <div className="mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Recipes</h1>
              <p className="text-gray-600">
                {ingredientMatching.groceriesCount > 0
                  ? `Showing recipes sorted by compatibility with your ${ingredientMatching.groceriesCount} grocery items`
                  : 'Add groceries to see recipe compatibility scores'
                }
              </p>
            </div>

            {/* Grocery Status Indicator */}
            {ingredientMatching.groceriesCount > 0 && (
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  {ingredientMatching.groceriesCount} ingredients available
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Compatibility Filter Tabs */}
        {ingredientMatching.isReady && ingredientMatching.groceriesCount > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                onClick={() => setViewMode('all')}
                size="sm"
              >
                All Recipes ({sortedRecipes.length})
              </Button>

              {highCompatibilityRecipes.length > 0 && (
                <Button
                  variant={viewMode === 'high' ? 'default' : 'outline'}
                  onClick={() => setViewMode('high')}
                  size="sm"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <Badge variant="secondary" className="mr-2 bg-green-100 text-green-800">
                    70%+
                  </Badge>
                  High Match ({highCompatibilityRecipes.length})
                </Button>
              )}

              {mediumCompatibilityRecipes.length > 0 && (
                <Button
                  variant={viewMode === 'medium' ? 'default' : 'outline'}
                  onClick={() => setViewMode('medium')}
                  size="sm"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                >
                  <Badge variant="secondary" className="mr-2 bg-yellow-100 text-yellow-800">
                    40-69%
                  </Badge>
                  Medium Match ({mediumCompatibilityRecipes.length})
                </Button>
              )}

              {lowCompatibilityRecipes.length > 0 && (
                <Button
                  variant={viewMode === 'low' ? 'default' : 'outline'}
                  onClick={() => setViewMode('low')}
                  size="sm"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Badge variant="secondary" className="mr-2 bg-orange-100 text-orange-800">
                    &lt;40%
                  </Badge>
                  Low Match ({lowCompatibilityRecipes.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Sort Controls */}
        {ingredientMatching.isReady && (
          <div className="mb-6 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <SortAsc className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Sort by:</span>
              <select
                value={sortOptions.sortBy}
                onChange={(e) => setSortOptions(prev => ({
                  ...prev,
                  sortBy: e.target.value as any
                }))}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="compatibility">Compatibility</option>
                <option value="confidence">Match Confidence</option>
                <option value="date">Date Created</option>
                <option value="title">Recipe Name</option>
              </select>
            </div>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={sortOptions.prioritizeAvailable}
                onChange={(e) => setSortOptions(prev => ({
                  ...prev,
                  prioritizeAvailable: e.target.checked
                }))}
                className="rounded"
              />
              <span>Prioritize available ingredients</span>
            </label>
          </div>
        )}

        {/* Recipe Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Loading skeletons */}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading recipes</p>
          </div>
        ) : displayRecipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {viewMode === 'all' ? 'No recipes found' : `No ${viewMode} compatibility recipes found`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRecipes.map((recipe) => (
              <EnhancedRecipeCard
                key={recipe.id}
                recipe={recipe}
                onView={() => {/* Navigate to recipe view */}}
                onEdit={() => {/* Navigate to recipe edit */}}
                showShareButton={true}
                onShareToggle={() => {/* Handle share toggle */}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### **Phase 4: Shopping List Generation** ⏱️ _Week 4_

#### **4.1 Shopping List Generator**

##### **File**: `src/lib/groceries/shopping-list-generator.ts`

```typescript
import type { Recipe } from '@/lib/types';
import { IngredientMatcher, RecipeCompatibility } from './ingredient-matcher';

export interface ShoppingListItem {
  ingredient: string;
  normalizedName: string;
  recipes: string[]; // Recipe titles that need this ingredient
  priority: 'high' | 'medium' | 'low';
  category?: string; // Suggested grocery category
  estimatedQuantity?: string;
  notes?: string[];
}

export interface ShoppingList {
  items: ShoppingListItem[];
  totalItems: number;
  recipeCount: number;
  estimatedCost?: number;
  generatedAt: Date;
}

export interface ShoppingListOptions {
  selectedRecipeIds?: string[];
  groupByCategory: boolean;
  includePriority: boolean;
  minimumRecipeCount: number; // Only include items needed by X+ recipes
  excludeCategories: string[]; // Categories to exclude (e.g., user already has these)
}

const DEFAULT_OPTIONS: ShoppingListOptions = {
  groupByCategory: true,
  includePriority: true,
  minimumRecipeCount: 1,
  excludeCategories: [],
};

export class ShoppingListGenerator {
  private matcher: IngredientMatcher;
  private recipes: Recipe[];

  constructor(userGroceries: Record<string, string[]>, recipes: Recipe[]) {
    this.matcher = new IngredientMatcher(userGroceries);
    this.recipes = recipes;
  }

  generateShoppingList(
    options: Partial<ShoppingListOptions> = {}
  ): ShoppingList {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const targetRecipes = opts.selectedRecipeIds
      ? this.recipes.filter((recipe) =>
          opts.selectedRecipeIds!.includes(recipe.id)
        )
      : this.recipes;

    // Get missing ingredients from all recipes
    const missingIngredients = new Map<string, ShoppingListItem>();

    targetRecipes.forEach((recipe) => {
      const compatibility = this.matcher.calculateRecipeCompatibility(recipe);

      compatibility.missingIngredients.forEach((match) => {
        const normalizedName = this.normalizeForShopping(
          match.recipeIngredient
        );

        if (missingIngredients.has(normalizedName)) {
          const existing = missingIngredients.get(normalizedName)!;
          existing.recipes.push(recipe.title);
          existing.priority = this.calculatePriority(existing.recipes.length);

          // Add any additional notes about preparation differences
          const prepNote = this.extractPrepNote(match.recipeIngredient);
          if (prepNote && !existing.notes?.includes(prepNote)) {
            existing.notes = existing.notes || [];
            existing.notes.push(prepNote);
          }
        } else {
          const category = this.suggestCategory(match.recipeIngredient);
          const quantity = this.extractQuantity(match.recipeIngredient);
          const prepNote = this.extractPrepNote(match.recipeIngredient);

          missingIngredients.set(normalizedName, {
            ingredient: this.cleanIngredientForShopping(match.recipeIngredient),
            normalizedName,
            recipes: [recipe.title],
            priority: 'low',
            category,
            estimatedQuantity: quantity,
            notes: prepNote ? [prepNote] : undefined,
          });
        }
      });
    });

    // Filter by minimum recipe count
    const filteredItems = Array.from(missingIngredients.values())
      .filter((item) => item.recipes.length >= opts.minimumRecipeCount)
      .filter((item) => !opts.excludeCategories.includes(item.category || ''));

    // Sort items
    const sortedItems = this.sortShoppingListItems(filteredItems, opts);

    return {
      items: sortedItems,
      totalItems: sortedItems.length,
      recipeCount: targetRecipes.length,
      generatedAt: new Date(),
    };
  }

  generateShoppingListForRecipe(recipe: Recipe): ShoppingList {
    return this.generateShoppingList({ selectedRecipeIds: [recipe.id] });
  }

  generateShoppingListForMultipleRecipes(recipeIds: string[]): ShoppingList {
    return this.generateShoppingList({ selectedRecipeIds: recipeIds });
  }

  exportAsText(shoppingList: ShoppingList): string {
    const lines = [
      '# Shopping List',
      `Generated: ${shoppingList.generatedAt.toLocaleDateString()}`,
      `For ${shoppingList.recipeCount} recipe${shoppingList.recipeCount !== 1 ? 's' : ''}`,
      `Total Items: ${shoppingList.totalItems}`,
      '',
    ];

    // Group by category if items have categories
    const categorizedItems = this.groupItemsByCategory(shoppingList.items);

    if (categorizedItems.size > 1) {
      // Multiple categories - organize by category
      categorizedItems.forEach((items, category) => {
        lines.push(`## ${category || 'Other'}`);
        items.forEach((item) => {
          const priority =
            item.priority === 'high'
              ? ' (!)'
              : item.priority === 'medium'
                ? ' (*)'
                : '';
          const recipes =
            item.recipes.length > 1 ? ` (${item.recipes.length} recipes)` : '';
          const quantity = item.estimatedQuantity
            ? `${item.estimatedQuantity} `
            : '';
          lines.push(`- ${quantity}${item.ingredient}${priority}${recipes}`);
        });
        lines.push('');
      });
    } else {
      // Single category or no categories - simple list
      shoppingList.items.forEach((item) => {
        const priority =
          item.priority === 'high'
            ? ' (!)'
            : item.priority === 'medium'
              ? ' (*)'
              : '';
        const recipes =
          item.recipes.length > 1 ? ` (${item.recipes.length} recipes)` : '';
        const quantity = item.estimatedQuantity
          ? `${item.estimatedQuantity} `
          : '';
        lines.push(`- ${quantity}${item.ingredient}${priority}${recipes}`);
      });
    }

    if (shoppingList.items.some((item) => item.priority === 'high')) {
      lines.push('', '(!) = High priority (needed by multiple recipes)');
    }
    if (shoppingList.items.some((item) => item.priority === 'medium')) {
      lines.push('(*) = Medium priority');
    }

    return lines.join('\n');
  }

  exportAsJSON(shoppingList: ShoppingList): string {
    return JSON.stringify(shoppingList, null, 2);
  }

  private normalizeForShopping(ingredient: string): string {
    return ingredient
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(
        /\b(fresh|dried|ground|whole|chopped|diced|sliced|minced|organic|raw)\b/g,
        ''
      )
      .replace(
        /\b(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g|ml|liters?)\b/g,
        ''
      )
      .replace(/\b(large|medium|small|extra|about|approximately)\b/g, '')
      .replace(/\b(\d+)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanIngredientForShopping(ingredient: string): string {
    // Keep the original ingredient but clean it up for shopping
    return ingredient
      .replace(/^\d+\.?\s*/, '') // Remove leading numbers
      .replace(/^[-*•]\s*/, '') // Remove bullet points
      .replace(
        /,?\s*(chopped|diced|sliced|minced|finely chopped|roughly chopped).*$/i,
        ''
      ) // Remove prep instructions
      .replace(/,?\s*(to taste|as needed|for serving).*$/i, '') // Remove serving notes
      .trim();
  }

  private extractQuantity(ingredient: string): string | undefined {
    const quantityMatch = ingredient.match(
      /^(\d+(?:\.\d+)?\s*(?:cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g|ml|liters?|large|medium|small))/i
    );
    return quantityMatch ? quantityMatch[1] : undefined;
  }

  private extractPrepNote(ingredient: string): string | undefined {
    const prepMatch = ingredient.match(
      /,\s*(chopped|diced|sliced|minced|finely chopped|roughly chopped|grated|shredded)/i
    );
    return prepMatch ? prepMatch[1] : undefined;
  }

  private suggestCategory(ingredient: string): string {
    const lower = ingredient.toLowerCase();

    // Category mapping based on common ingredients
    const categoryMap = {
      Produce: [
        'onion',
        'garlic',
        'tomato',
        'lettuce',
        'carrot',
        'celery',
        'pepper',
        'spinach',
        'broccoli',
        'potato',
        'lemon',
        'lime',
        'apple',
        'banana',
      ],
      'Meat & Seafood': [
        'chicken',
        'beef',
        'pork',
        'fish',
        'salmon',
        'shrimp',
        'turkey',
        'bacon',
        'ham',
      ],
      Dairy: ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'eggs'],
      Pantry: [
        'flour',
        'sugar',
        'salt',
        'pepper',
        'oil',
        'vinegar',
        'rice',
        'pasta',
        'bread',
        'stock',
        'broth',
      ],
      'Spices & Condiments': [
        'basil',
        'oregano',
        'thyme',
        'cumin',
        'paprika',
        'soy sauce',
        'mustard',
        'ketchup',
      ],
      Frozen: ['frozen'],
      'Canned Goods': ['canned', 'can of'],
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((keyword) => lower.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }

  private calculatePriority(recipeCount: number): 'high' | 'medium' | 'low' {
    if (recipeCount >= 3) return 'high';
    if (recipeCount >= 2) return 'medium';
    return 'low';
  }

  private sortShoppingListItems(
    items: ShoppingListItem[],
    options: ShoppingListOptions
  ): ShoppingListItem[] {
    return items.sort((a, b) => {
      // First sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by number of recipes
      const recipeDiff = b.recipes.length - a.recipes.length;
      if (recipeDiff !== 0) return recipeDiff;

      // Finally alphabetically
      return a.ingredient.localeCompare(b.ingredient);
    });
  }

  private groupItemsByCategory(
    items: ShoppingListItem[]
  ): Map<string, ShoppingListItem[]> {
    const grouped = new Map<string, ShoppingListItem[]>();

    items.forEach((item) => {
      const category = item.category || 'Other';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });

    // Sort categories by common shopping order
    const categoryOrder = [
      'Produce',
      'Meat & Seafood',
      'Dairy',
      'Frozen',
      'Pantry',
      'Canned Goods',
      'Spices & Condiments',
      'Other',
    ];

    const sortedGrouped = new Map<string, ShoppingListItem[]>();
    categoryOrder.forEach((category) => {
      if (grouped.has(category)) {
        sortedGrouped.set(category, grouped.get(category)!);
      }
    });

    // Add any categories not in the predefined order
    grouped.forEach((items, category) => {
      if (!sortedGrouped.has(category)) {
        sortedGrouped.set(category, items);
      }
    });

    return sortedGrouped;
  }
}
```

#### **4.2 Shopping List Component**

##### **File**: `src/components/groceries/shopping-list-modal.tsx`

```typescript
import React, { useState } from 'react';
import { ShoppingCart, Download, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShoppingListGenerator, ShoppingList } from '@/lib/groceries/shopping-list-generator';
import { useGroceries } from '@/hooks/useGroceries';
import { useToast } from '@/hooks/use-toast';
import type { Recipe } from '@/lib/types';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  selectedRecipeIds?: string[];
}

export function ShoppingListModal({
  isOpen,
  onClose,
  recipes,
  selectedRecipeIds
}: ShoppingListModalProps) {
  const { groceries } = useGroceries();
  const { toast } = useToast();
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && recipes.length > 0) {
      generateShoppingList();
    }
  }, [isOpen, recipes, selectedRecipeIds, groceries]);

  const generateShoppingList = async () => {
    setLoading(true);
    try {
      const generator = new ShoppingListGenerator(groceries.groceries, recipes);
      const list = selectedRecipeIds
        ? generator.generateShoppingListForMultipleRecipes(selectedRecipeIds)
        : generator.generateShoppingList();
      setShoppingList(list);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate shopping list',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!shoppingList) return;

    const generator = new ShoppingListGenerator(groceries.groceries, recipes);
    const text = generator.exportAsText(shoppingList);

    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied!',
        description: 'Shopping list copied to clipboard'
      });
    });
  };

  const handleDownload = () => {
    if (!shoppingList) return;

    const generator = new ShoppingListGenerator(groceries.groceries, recipes);
    const text = generator.exportAsText(shoppingList);

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopping-list-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedItems = React.useMemo(() => {
    if (!shoppingList) return new Map();

    const grouped = new Map<string, typeof shoppingList.items>();
    shoppingList.items.forEach(item => {
      const category = item.category || 'Other';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });

    return grouped;
  }, [shoppingList]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Shopping List
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : !shoppingList ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No shopping list generated</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Shopping List Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">
                  {shoppingList.totalItems} items needed
                </h3>
                <p className="text-sm text-gray-600">
                  For {shoppingList.recipeCount} recipe{shoppingList.recipeCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Shopping List Items */}
            <div className="space-y-6">
              {Array.from(groupedItems.entries()).map(([category, items]) => (
                <div key={category}>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    {category}
                    <Badge variant="secondary" className="ml-2">
                      {items.length}
                    </Badge>
                  </h4>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {item.estimatedQuantity && `${item.estimatedQuantity} `}
                              {item.ingredient}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getPriorityColor(item.priority)}`}
                            >
                              {item.priority}
                            </Badge>
                          </div>

                          {item.recipes.length > 1 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Needed for: {item.recipes.slice(0, 2).join(', ')}
                              {item.recipes.length > 2 && ` +${item.recipes.length - 2} more`}
                            </p>
                          )}

                          {item.notes && item.notes.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Note: {item.notes.join(', ')}
                            </p>
                          )}
                        </div>

                        <div className="text-sm text-gray-500">
                          {item.recipes.length} recipe{item.recipes.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Priority Legend */}
            {shoppingList.items.some(item => item.priority !== 'low') && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-800 mb-2">Priority Guide:</h5>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <Badge variant="outline" className="bg-red-100 text-red-800">high</Badge>
                    <span className="text-blue-700">Needed by 3+ recipes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">medium</Badge>
                    <span className="text-blue-700">Needed by 2 recipes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">low</Badge>
                    <span className="text-blue-700">Needed by 1 recipe</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🎯 **Success Criteria & Testing Strategy**

### **Functional Requirements**

- [ ] **Ingredient Matching**: 90%+ accuracy for exact matches, 70%+ for partial matches
- [ ] **Recipe Compatibility**: Accurate percentage calculation for all recipes
- [ ] **Visual Indicators**: Clear availability badges on all recipe ingredients
- [ ] **Shopping Lists**: Complete and organized lists for missing ingredients
- [ ] **Performance**: <200ms for ingredient matching, <500ms for recipe analysis

### **User Experience Requirements**

- [ ] **Intuitive Interface**: Clear visual distinction between available/unavailable ingredients
- [ ] **Mobile Responsive**: Full functionality on mobile devices
- [ ] **Loading States**: Smooth loading indicators during analysis
- [ ] **Error Handling**: Graceful fallback when grocery data unavailable
- [ ] **Accessibility**: Screen reader support and keyboard navigation

### **Integration Requirements**

- [ ] **Seamless Integration**: No breaking changes to existing recipe views
- [ ] **Data Consistency**: Accurate sync between grocery selections and matching
- [ ] **Performance Impact**: <10% increase in page load times
- [ ] **Cross-Component**: Consistent matching logic across all components

---

## 🚀 **Implementation Timeline**

### **Week 1: Core Matching Engine**

- Implement `IngredientMatcher` class with multiple matching strategies
- Create `useIngredientMatching` hook with React integration
- Unit tests for matching algorithms
- Basic ingredient availability detection

### **Week 2: UI Component Integration**

- Enhanced Recipe View with availability indicators
- Enhanced Recipe Cards with compatibility scores
- Visual feedback system for ingredient matching
- Mobile responsive design implementation

### **Week 3: Recipe Discovery Enhancement**

- Smart recipe sorting based on compatibility
- Enhanced Recipes Page with filtering options
- Recipe categorization by compatibility level
- Advanced sorting and filtering controls

### **Week 4: Shopping List Generation**

- Shopping list generator with categorization
- Shopping list modal component
- Export functionality (text, JSON)
- Priority-based organization and optimization

---

This comprehensive implementation plan provides a structured approach to building automatic ingredient matching that enhances the Recipe Generator's core value proposition while maintaining excellent user experience and system performance.

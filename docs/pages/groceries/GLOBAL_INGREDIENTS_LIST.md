# Global Ingredients List - Implementation Plan

**Project:** Recipe Generator  
**Feature:** Global Ingredients List with Auto-Learning  
**Author:** AI Assistant  
**Date:** January 2025  
**Status:** Design Phase

---

## 🎯 **Executive Summary**

This document outlines the implementation of a global ingredients list that automatically learns from user recipes. When an ingredient isn't recognized in the matching system, users can save it to the global list with automatic categorization based on recipe context.

### **Key Value Propositions**

- **Auto-Learning System**: Ingredients are automatically extracted from recipes and categorized
- **Smart Categorization**: AI-powered categorization based on recipe context and tags
- **Community Knowledge**: Shared ingredient database that benefits all users
- **Seamless Integration**: Works with existing ingredient matching system
- **User Empowerment**: Users can contribute to and improve the system

---

## 🏗️ **System Architecture**

### **Database Schema**

```sql
-- Global ingredients table
CREATE TABLE global_ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  normalized_name text NOT NULL,
  category text NOT NULL,
  synonyms text[] DEFAULT '{}',
  usage_count integer DEFAULT 1,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT global_ingredients_name_check CHECK (length(name) >= 2),
  CONSTRAINT global_ingredients_category_check CHECK (category IN (
    'proteins', 'vegetables', 'spices', 'pantry', 'dairy', 'fruits', 'other'
  )),
  CONSTRAINT global_ingredients_usage_count_check CHECK (usage_count > 0)
);

-- Indexes for performance
CREATE INDEX idx_global_ingredients_normalized_name ON global_ingredients(normalized_name);
CREATE INDEX idx_global_ingredients_category ON global_ingredients(category);
CREATE INDEX idx_global_ingredients_usage_count ON global_ingredients(usage_count DESC);
CREATE INDEX idx_global_ingredients_created_at ON global_ingredients(created_at DESC);

-- Unique constraint on normalized name
CREATE UNIQUE INDEX idx_global_ingredients_unique_normalized
ON global_ingredients(normalized_name);

-- RLS Policies
ALTER TABLE global_ingredients ENABLE ROW LEVEL SECURITY;

-- Everyone can read global ingredients
CREATE POLICY "Global ingredients are readable by everyone" ON global_ingredients
FOR SELECT USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can add global ingredients" ON global_ingredients
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only the creator or admin can update
CREATE POLICY "Users can update their own global ingredients" ON global_ingredients
FOR UPDATE USING (auth.uid() = created_by);

-- Auto-update timestamp trigger
CREATE TRIGGER global_ingredients_set_updated_at
  BEFORE UPDATE ON global_ingredients
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
```

### **Ingredient Learning System**

```sql
-- Track ingredient learning from recipes
CREATE TABLE ingredient_learning_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_text text NOT NULL,
  extracted_name text NOT NULL,
  suggested_category text,
  confidence_score numeric(3,2) DEFAULT 0.0,
  was_saved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for learning analytics
CREATE INDEX idx_ingredient_learning_recipe_id ON ingredient_learning_log(recipe_id);
CREATE INDEX idx_ingredient_learning_was_saved ON ingredient_learning_log(was_saved);
```

---

## 🔧 **Technical Implementation**

### **1. Enhanced Ingredient Matcher**

```typescript
// src/lib/groceries/enhanced-ingredient-matcher.ts
import { IngredientMatcher } from './ingredient-matcher';
import { supabase } from '@/lib/supabase';

export interface GlobalIngredient {
  id: string;
  name: string;
  normalized_name: string;
  category: string;
  synonyms: string[];
  usage_count: number;
  is_verified: boolean;
}

export interface IngredientMatchWithGlobal extends IngredientMatch {
  isGlobalIngredient?: boolean;
  globalIngredient?: GlobalIngredient;
  canSaveToGlobal?: boolean;
}

export class EnhancedIngredientMatcher extends IngredientMatcher {
  private globalIngredients: Map<string, GlobalIngredient> = new Map();
  private globalIngredientsLoaded = false;

  constructor(groceries: Record<string, string[]>) {
    super(groceries);
    this.loadGlobalIngredients();
  }

  /**
   * Enhanced matching that includes global ingredients
   */
  async matchIngredientWithGlobal(
    recipeIngredient: string
  ): Promise<IngredientMatchWithGlobal> {
    // First try regular matching
    const regularMatch = this.matchIngredient(recipeIngredient);

    if (regularMatch.matchType !== 'none') {
      return {
        ...regularMatch,
        isGlobalIngredient: false,
        canSaveToGlobal: false,
      };
    }

    // Try global ingredients matching
    await this.ensureGlobalIngredientsLoaded();
    const globalMatch = this.findGlobalIngredientMatch(recipeIngredient);

    if (globalMatch) {
      return {
        recipeIngredient,
        matchedGroceryIngredient: globalMatch.name,
        matchedCategory: globalMatch.category,
        confidence: 85, // High confidence for global ingredients
        matchType: 'global' as any,
        isGlobalIngredient: true,
        globalIngredient: globalMatch,
        canSaveToGlobal: false,
      };
    }

    // No match found - can be saved to global
    return {
      ...regularMatch,
      canSaveToGlobal: true,
    };
  }

  /**
   * Save ingredient to global list
   */
  async saveIngredientToGlobal(
    ingredientText: string,
    category: string,
    recipeContext?: {
      recipeId: string;
      recipeCategories: string[];
    }
  ): Promise<{
    success: boolean;
    ingredient?: GlobalIngredient;
    error?: string;
  }> {
    try {
      const normalizedName = this.normalizeIngredient(ingredientText);

      // Check if already exists
      const existing = await supabase
        .from('global_ingredients')
        .select('*')
        .eq('normalized_name', normalizedName)
        .single();

      if (existing.data) {
        // Update usage count
        await supabase
          .from('global_ingredients')
          .update({
            usage_count: existing.data.usage_count + 1,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', existing.data.id);

        return { success: true, ingredient: existing.data };
      }

      // Create new global ingredient
      const { data, error } = await supabase
        .from('global_ingredients')
        .insert({
          name: ingredientText,
          normalized_name: normalizedName,
          category,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the learning
      if (recipeContext) {
        await supabase.from('ingredient_learning_log').insert({
          recipe_id: recipeContext.recipeId,
          ingredient_text: ingredientText,
          extracted_name: ingredientText,
          suggested_category: category,
          confidence_score: 0.8,
          was_saved: true,
        });
      }

      // Refresh global ingredients cache
      await this.loadGlobalIngredients();

      return { success: true, ingredient: data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Auto-extract and categorize ingredients from recipe
   */
  async extractIngredientsFromRecipe(recipe: Recipe): Promise<{
    extracted: Array<{
      ingredient: string;
      suggestedCategory: string;
      confidence: number;
    }>;
    unknown: string[];
  }> {
    const extracted: Array<{
      ingredient: string;
      suggestedCategory: string;
      confidence: number;
    }> = [];
    const unknown: string[] = [];

    for (const ingredient of recipe.ingredients) {
      const match = await this.matchIngredientWithGlobal(ingredient);

      if (match.matchType === 'none' && match.canSaveToGlobal) {
        // Suggest category based on recipe context
        const suggestedCategory = this.suggestCategoryFromContext(
          ingredient,
          recipe
        );
        unknown.push(ingredient);

        extracted.push({
          ingredient,
          suggestedCategory,
          confidence: 0.7,
        });
      }
    }

    return { extracted, unknown };
  }

  private async loadGlobalIngredients(): Promise<void> {
    if (this.globalIngredientsLoaded) return;

    try {
      const { data, error } = await supabase
        .from('global_ingredients')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;

      this.globalIngredients.clear();
      data?.forEach((ingredient) => {
        this.globalIngredients.set(ingredient.normalized_name, ingredient);
      });

      this.globalIngredientsLoaded = true;
    } catch (error) {
      console.error('Failed to load global ingredients:', error);
    }
  }

  private async ensureGlobalIngredientsLoaded(): Promise<void> {
    if (!this.globalIngredientsLoaded) {
      await this.loadGlobalIngredients();
    }
  }

  private findGlobalIngredientMatch(
    recipeIngredient: string
  ): GlobalIngredient | null {
    const normalized = this.normalizeIngredient(recipeIngredient);

    // Direct match
    if (this.globalIngredients.has(normalized)) {
      return this.globalIngredients.get(normalized)!;
    }

    // Partial match
    for (const [key, ingredient] of this.globalIngredients) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return ingredient;
      }
    }

    return null;
  }

  private suggestCategoryFromContext(
    ingredient: string,
    recipe: Recipe
  ): string {
    const categories = recipe.categories || [];
    const ingredientLower = ingredient.toLowerCase();

    // Category-based suggestions
    if (categories.some((cat) => cat.includes('Course: Breakfast'))) {
      if (ingredientLower.includes('egg') || ingredientLower.includes('bacon'))
        return 'proteins';
      if (
        ingredientLower.includes('milk') ||
        ingredientLower.includes('cheese')
      )
        return 'dairy';
      if (
        ingredientLower.includes('bread') ||
        ingredientLower.includes('toast')
      )
        return 'pantry';
    }

    if (categories.some((cat) => cat.includes('Course: Dessert'))) {
      if (
        ingredientLower.includes('sugar') ||
        ingredientLower.includes('flour')
      )
        return 'pantry';
      if (
        ingredientLower.includes('chocolate') ||
        ingredientLower.includes('vanilla')
      )
        return 'pantry';
    }

    // Ingredient-based suggestions
    if (
      ingredientLower.includes('meat') ||
      ingredientLower.includes('chicken') ||
      ingredientLower.includes('beef') ||
      ingredientLower.includes('fish')
    ) {
      return 'proteins';
    }

    if (
      ingredientLower.includes('vegetable') ||
      ingredientLower.includes('onion') ||
      ingredientLower.includes('carrot') ||
      ingredientLower.includes('tomato')
    ) {
      return 'vegetables';
    }

    if (
      ingredientLower.includes('spice') ||
      ingredientLower.includes('herb') ||
      ingredientLower.includes('salt') ||
      ingredientLower.includes('pepper')
    ) {
      return 'spices';
    }

    if (
      ingredientLower.includes('milk') ||
      ingredientLower.includes('cheese') ||
      ingredientLower.includes('yogurt') ||
      ingredientLower.includes('butter')
    ) {
      return 'dairy';
    }

    if (
      ingredientLower.includes('fruit') ||
      ingredientLower.includes('apple') ||
      ingredientLower.includes('banana') ||
      ingredientLower.includes('berry')
    ) {
      return 'fruits';
    }

    // Default to pantry for unknown items
    return 'pantry';
  }
}
```

### **2. React Hook for Global Ingredients**

```typescript
// src/hooks/useGlobalIngredients.ts
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import {
  EnhancedIngredientMatcher,
  GlobalIngredient,
} from '@/lib/groceries/enhanced-ingredient-matcher';
import { useGroceries } from './useGroceries';

export interface UseGlobalIngredientsReturn {
  // State
  globalIngredients: GlobalIngredient[];
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

  // Utilities
  getGlobalIngredient: (normalizedName: string) => GlobalIngredient | null;
  isGlobalIngredient: (ingredient: string) => boolean;
}

export function useGlobalIngredients(): UseGlobalIngredientsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const { groceries } = useGroceries();

  const [globalIngredients, setGlobalIngredients] = useState<
    GlobalIngredient[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matcher, setMatcher] = useState<EnhancedIngredientMatcher | null>(
    null
  );

  // Initialize matcher when groceries change
  useEffect(() => {
    if (Object.keys(groceries).length > 0) {
      setMatcher(new EnhancedIngredientMatcher(groceries));
    }
  }, [groceries]);

  const saveIngredientToGlobal = useCallback(
    async (
      ingredient: string,
      category: string,
      recipeContext?: { recipeId: string; recipeCategories: string[] }
    ): Promise<boolean> => {
      if (!matcher) return false;

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
    [matcher, toast]
  );

  const extractIngredientsFromRecipe = useCallback(
    async (recipe: Recipe) => {
      if (!matcher) return { extracted: [], unknown: [] };
      return await matcher.extractIngredientsFromRecipe(recipe);
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

  const isGlobalIngredient = useCallback(
    (ingredient: string): boolean => {
      return globalIngredients.some(
        (ing) =>
          ing.normalized_name === matcher?.normalizeIngredient(ingredient)
      );
    },
    [globalIngredients, matcher]
  );

  return {
    globalIngredients,
    loading,
    error,
    saveIngredientToGlobal,
    extractIngredientsFromRecipe,
    getGlobalIngredient,
    isGlobalIngredient,
  };
}
```

### **3. UI Components**

```typescript
// src/components/groceries/save-to-global-button.tsx
import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
import { GROCERY_CATEGORIES } from '@/lib/groceries/categories';

interface SaveToGlobalButtonProps {
  ingredient: string;
  recipeContext?: {
    recipeId: string;
    recipeCategories: string[];
  };
  onSaved?: () => void;
}

export function SaveToGlobalButton({
  ingredient,
  recipeContext,
  onSaved
}: SaveToGlobalButtonProps) {
  const { saveIngredientToGlobal, loading } = useGlobalIngredients();
  const [selectedCategory, setSelectedCategory] = useState<string>('pantry');
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async () => {
    const success = await saveIngredientToGlobal(ingredient, selectedCategory, recipeContext);
    if (success) {
      setIsOpen(false);
      onSaved?.();
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-blue-600 border-blue-300 hover:bg-blue-50"
      >
        <Plus className="h-3 w-3 mr-1" />
        Save as Global
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
      <span className="text-sm text-blue-800">Category:</span>

      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="text-sm border rounded px-2 py-1"
      >
        {Object.entries(GROCERY_CATEGORIES).map(([key, category]) => (
          <option key={key} value={key}>
            {category.icon} {category.name}
          </option>
        ))}
      </select>

      <Button
        size="sm"
        onClick={handleSave}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Plus className="h-3 w-3" />
        )}
        Save
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(false)}
        className="text-gray-500"
      >
        Cancel
      </Button>
    </div>
  );
}
```

### **4. Enhanced Recipe View Integration**

```typescript
// src/components/recipes/enhanced-recipe-view-with-global.tsx
import React from 'react';
import { Check, ShoppingCart, AlertCircle, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIngredientMatching } from '@/hooks/useIngredientMatching';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
import { SaveToGlobalButton } from '@/components/groceries/save-to-global-button';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import type { Recipe } from '@/lib/types';

interface EnhancedRecipeViewWithGlobalProps {
  recipe: Recipe;
  onEdit?: () => void;
  onBack?: () => void;
}

export function EnhancedRecipeViewWithGlobal({
  recipe,
  onEdit,
  onBack
}: EnhancedRecipeViewWithGlobalProps) {
  const ingredientMatching = useIngredientMatching();
  const { extractIngredientsFromRecipe } = useGlobalIngredients();

  const compatibility = ingredientMatching.calculateCompatibility(recipe);
  const availabilityPercentage = compatibility.compatibilityScore;

  const getIngredientStatusIcon = (match: any) => {
    switch (match.matchType) {
      case 'exact':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'partial':
      case 'fuzzy':
        return <Check className="h-4 w-4 text-yellow-600" />;
      case 'global':
        return <Globe className="h-4 w-4 text-blue-600" />;
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-400" />;
    }
  };

  const getIngredientBadge = (match: any) => {
    if (match.matchType === 'none') {
      return (
        <Badge variant="outline" className="text-red-600 bg-red-50">
          Not Available
        </Badge>
      );
    }

    if (match.matchType === 'global') {
      return (
        <Badge variant="outline" className="text-blue-600 bg-blue-50">
          Global Ingredient
        </Badge>
      );
    }

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
                    // Category header
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
                        <div className="flex items-center space-x-2">
                          {getIngredientBadge(match)}
                          {match.matchedGroceryIngredient && (
                            <span className="text-xs text-gray-500">
                              (matches: {match.matchedGroceryIngredient})
                            </span>
                          )}
                          {match.matchType === 'none' && (
                            <SaveToGlobalButton
                              ingredient={ingredient}
                              recipeContext={{
                                recipeId: recipe.id,
                                recipeCategories: recipe.categories || []
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 **Implementation Phases**

### **Phase 1: Database & Core Logic** ⏱️ _Week 1_

- [ ] Create database migrations
- [ ] Implement EnhancedIngredientMatcher
- [ ] Create useGlobalIngredients hook
- [ ] Basic save functionality

### **Phase 2: UI Integration** ⏱️ _Week 2_

- [ ] SaveToGlobalButton component
- [ ] Enhanced recipe view integration
- [ ] Category selection interface
- [ ] Success/error feedback

### **Phase 3: Auto-Learning** ⏱️ _Week 3_

- [ ] Recipe ingredient extraction
- [ ] AI-powered categorization
- [ ] Learning analytics
- [ ] Admin interface for verification

### **Phase 4: Advanced Features** ⏱️ _Week 4_

- [ ] Ingredient synonyms management
- [ ] Usage statistics
- [ ] Community contributions
- [ ] Quality assurance system

---

## 🎯 **Success Metrics**

- **Coverage**: 90%+ of common ingredients recognized
- **Accuracy**: 85%+ correct auto-categorization
- **User Engagement**: 50%+ of users contribute ingredients
- **Performance**: <100ms ingredient matching with global list
- **Quality**: <5% false positive rate for ingredient suggestions

---

This global ingredients list feature would transform your recipe generator into a truly intelligent system that learns and improves from every user interaction! 🚀

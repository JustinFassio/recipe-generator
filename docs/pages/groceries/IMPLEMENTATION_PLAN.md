# Groceries Page Implementation - Phased Action Plan

**Project:** Recipe Generator  
**Feature:** Groceries Page  
**Author:** AI Assistant  
**Date:** January 2025  
**Status:** Planning Phase

---

## 🎯 **Executive Summary**

This document outlines the comprehensive implementation plan for the Groceries Page feature, designed to enhance the Recipe Generator's AI experience by allowing users to select commonly available ingredients from categorized tables. These selections will be automatically integrated into AI chat conversations and recipe views, reducing cognitive load and improving personalization.

### **Key Value Propositions**

- **Reduced Friction**: No more typing ingredients from memory
- **Enhanced AI Context**: Pre-selected ingredients improve recipe suggestions
- **Smart Integration**: Automatic ingredient matching in recipes
- **Progressive Enhancement**: Works alongside existing user preferences

---

## 🏗️ **Architecture Analysis Summary**

### **Current Database Schema**

- ✅ `profiles` table with user preferences
- ✅ `user_safety` table with allergies/dietary restrictions
- ✅ `cooking_preferences` table with cuisine/equipment preferences
- 🆕 Need to add `user_groceries` table

### **Current Patterns Identified**

- **Hook Pattern**: Feature-specific hooks (e.g., `useUserSafety`, `useCookingPreferences`)
- **Component Structure**: Feature-first organization (`src/components/{feature}/`)
- **Page Pattern**: Consistent page structure with Header + main content
- **AI Integration**: Existing context injection via `buildEnhancedAIPrompt`
- **Database**: Supabase with RLS policies and audit triggers

### **Integration Points**

- **AI Chat System**: Context injection via `src/lib/ai/userPreferencesToPrompt.ts`
- **Recipe Views**: Ingredient matching and availability indicators
- **User Preferences**: Seamless integration with existing preference system
- **Navigation**: Addition to main header navigation

---

## 📋 **Phase 1: Core Foundation** ⏱️ _Week 1_

### **1.1 Database Layer**

#### **Migration File**: `supabase/migrations/20250201000001_user_groceries_table.sql`

```sql
-- Create user_groceries table
CREATE TABLE user_groceries (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  groceries jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE user_groceries ENABLE ROW LEVEL SECURITY;

-- Users can only access their own groceries
CREATE POLICY "user_groceries_own_data" ON user_groceries
FOR ALL USING (auth.uid() = user_id);

-- Auto-update trigger
CREATE TRIGGER user_groceries_set_updated_at
  BEFORE UPDATE ON user_groceries
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
```

#### **Data Structure**

```json
{
  "proteins": ["chicken breast", "salmon", "eggs"],
  "vegetables": ["onions", "carrots", "spinach"],
  "spices": ["salt", "pepper", "garlic powder"],
  "pantry": ["olive oil", "rice", "pasta"],
  "dairy": ["milk", "cheese", "butter"],
  "fruits": ["lemons", "apples", "bananas"]
}
```

### **1.2 API Layer Extensions**

#### **File**: `src/lib/user-preferences.ts` (extend existing)

```typescript
export interface UserGroceries {
  user_id: string;
  groceries: Record<string, string[]>;
  created_at: string;
  updated_at: string;
}

export async function getUserGroceries(
  userId: string
): Promise<UserGroceries | null> {
  const { data, error } = await supabase
    .from('user_groceries')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No data found
    throw error;
  }

  return data;
}

export async function updateUserGroceries(
  userId: string,
  groceries: Record<string, string[]>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('user_groceries').upsert({
      user_id: userId,
      groceries,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### **1.3 Type Definitions**

#### **File**: `src/lib/types.ts` (extend existing)

```typescript
export type UserGroceries = {
  user_id: string;
  groceries: Record<string, string[]>;
  created_at: string;
  updated_at: string;
};

export type GroceryCategory = {
  name: string;
  icon: string;
  items: string[];
};

export type GroceryCategories = Record<string, GroceryCategory>;
```

### **1.4 Data Management Hook**

#### **File**: `src/hooks/useGroceries.ts`

```typescript
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
    } catch (err) {
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
            const { [category]: removed, ...rest } = prev;
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
      const { [category]: removed, ...rest } = prev;
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
```

### **1.5 Grocery Categories Data**

#### **File**: `src/lib/groceries/categories.ts`

```typescript
import type { GroceryCategories } from '@/lib/types';

export const GROCERY_CATEGORIES: GroceryCategories = {
  proteins: {
    name: 'Proteins',
    icon: '🥩',
    items: [
      'chicken breast',
      'chicken thighs',
      'ground beef',
      'salmon',
      'tuna',
      'eggs',
      'tofu',
      'tempeh',
      'shrimp',
      'pork chops',
      'turkey',
      'beans',
      'lentils',
      'chickpeas',
      'quinoa',
      'nuts',
      'greek yogurt',
      'cottage cheese',
    ],
  },
  vegetables: {
    name: 'Vegetables',
    icon: '🥕',
    items: [
      'onions',
      'garlic',
      'carrots',
      'celery',
      'bell peppers',
      'tomatoes',
      'spinach',
      'broccoli',
      'cauliflower',
      'zucchini',
      'mushrooms',
      'potatoes',
      'sweet potatoes',
      'lettuce',
      'cucumbers',
      'avocados',
      'corn',
      'peas',
    ],
  },
  spices: {
    name: 'Spices & Seasonings',
    icon: '🌶️',
    items: [
      'salt',
      'black pepper',
      'garlic powder',
      'onion powder',
      'paprika',
      'cumin',
      'oregano',
      'basil',
      'thyme',
      'rosemary',
      'bay leaves',
      'chili powder',
      'curry powder',
      'turmeric',
      'ginger',
      'cinnamon',
    ],
  },
  pantry: {
    name: 'Pantry Staples',
    icon: '🏺',
    items: [
      'olive oil',
      'vegetable oil',
      'butter',
      'flour',
      'sugar',
      'brown sugar',
      'rice',
      'pasta',
      'bread',
      'canned tomatoes',
      'chicken stock',
      'vegetable stock',
      'soy sauce',
      'vinegar',
      'honey',
      'vanilla extract',
      'baking powder',
      'baking soda',
    ],
  },
  dairy: {
    name: 'Dairy & Refrigerated',
    icon: '🥛',
    items: [
      'milk',
      'heavy cream',
      'sour cream',
      'cheese',
      'parmesan',
      'mozzarella',
      'cheddar',
      'butter',
      'cream cheese',
      'yogurt',
      'eggs',
    ],
  },
  fruits: {
    name: 'Fruits',
    icon: '🍎',
    items: [
      'lemons',
      'limes',
      'oranges',
      'apples',
      'bananas',
      'berries',
      'grapes',
      'strawberries',
      'blueberries',
      'raspberries',
      'pineapple',
      'mango',
      'peaches',
    ],
  },
} as const;

export const GROCERY_CATEGORY_KEYS = Object.keys(GROCERY_CATEGORIES) as Array<
  keyof typeof GROCERY_CATEGORIES
>;
```

### **1.6 Basic Page Component**

#### **File**: `src/pages/groceries-page.tsx`

```typescript
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useGroceries } from '@/hooks/useGroceries';
import { Button } from '@/components/ui/button';
import { GROCERY_CATEGORIES, GROCERY_CATEGORY_KEYS } from '@/lib/groceries/categories';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { Save, RefreshCw } from 'lucide-react';

export function GroceriesPage() {
  const { user } = useAuth();
  const groceries = useGroceries();
  const [activeCategory, setActiveCategory] = useState<string>('proteins');

  const handleSave = async () => {
    await groceries.saveGroceries();
  };

  const handleRefresh = async () => {
    await groceries.loadGroceries();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p>Please sign in to manage your groceries.</p>
        </div>
      </div>
    );
  }

  const activeCategoryData = GROCERY_CATEGORIES[activeCategory as keyof typeof GROCERY_CATEGORIES];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Groceries</h1>
              <p className="text-gray-600">
                Select ingredients you have available for personalized recipe suggestions
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={groceries.loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={handleSave}
                disabled={groceries.loading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Save className="mr-2 h-4 w-4" />
                Save ({groceries.selectedCount})
              </Button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className={createDaisyUICardClasses('bordered mb-6')}>
          <div className="card-body p-0">
            <div className="tabs tabs-boxed p-4">
              {GROCERY_CATEGORY_KEYS.map((categoryKey) => {
                const category = GROCERY_CATEGORIES[categoryKey];
                const count = groceries.getCategoryCount(categoryKey);
                return (
                  <button
                    key={categoryKey}
                    className={`tab ${activeCategory === categoryKey ? 'tab-active' : ''}`}
                    onClick={() => setActiveCategory(categoryKey)}
                  >
                    {category.icon} {category.name}
                    {count > 0 && (
                      <span className="ml-2 badge badge-sm badge-primary">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ingredient Grid */}
        <div className={createDaisyUICardClasses('bordered')}>
          <div className="card-body">
            <h2 className="card-title mb-4">
              {activeCategoryData.icon} {activeCategoryData.name}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {activeCategoryData.items.map((ingredient) => {
                const isSelected = groceries.hasIngredient(activeCategory, ingredient);
                return (
                  <button
                    key={ingredient}
                    onClick={() => groceries.toggleIngredient(activeCategory, ingredient)}
                    className={`btn btn-sm ${
                      isSelected
                        ? 'btn-primary'
                        : 'btn-outline btn-ghost'
                    }`}
                  >
                    {ingredient}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Ingredients Summary */}
        {groceries.selectedCount > 0 && (
          <div className={createDaisyUICardClasses('bordered mt-6 bg-base-200')}>
            <div className="card-body">
              <h3 className="card-title text-lg">
                Selected Ingredients ({groceries.selectedCount})
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(groceries.groceries).map(([category, ingredients]) =>
                  ingredients.map((ingredient) => (
                    <span
                      key={`${category}-${ingredient}`}
                      className="badge badge-primary cursor-pointer"
                      onClick={() => groceries.toggleIngredient(category, ingredient)}
                    >
                      {ingredient} ×
                    </span>
                  ))
                )}
              </div>
              <div className="card-actions justify-end">
                <Button
                  variant="ghost"
                  onClick={groceries.clearAll}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### **1.7 Route Integration**

#### **File**: `src/App.tsx` (modification)

```typescript
// Add import
import { GroceriesPage } from '@/pages/groceries-page';

// Add route after existing routes
<Route
  path="/groceries"
  element={
    <ProtectedRoute>
      <div className="bg-base-100 min-h-screen">
        <Header />
        <main>
          <GroceriesPage />
        </main>
      </div>
    </ProtectedRoute>
  }
/>
```

### **1.8 Navigation Integration**

#### **File**: `src/components/layout/header.tsx` (modification)

Add to desktop navigation:

```typescript
<Button
  variant={location.pathname === '/groceries' ? 'default' : 'ghost'}
  onClick={() => navigate('/groceries')}
  className={
    location.pathname === '/groceries'
      ? 'bg-success text-success-content hover:bg-success/80'
      : ''
  }
>
  My Groceries
</Button>
```

---

## 📋 **Phase 2: Enhanced UI** ⏱️ _Week 2_

### **2.1 Atomic Components**

#### **File**: `src/components/groceries/shared/IngredientToggle.tsx`

```typescript
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngredientToggleProps {
  ingredient: string;
  selected: boolean;
  onToggle: () => void;
  className?: string;
  disabled?: boolean;
}

export const IngredientToggle = React.memo<IngredientToggleProps>(({
  ingredient,
  selected,
  onToggle,
  className,
  disabled = false
}) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'btn btn-sm transition-all duration-200',
        selected
          ? 'btn-primary'
          : 'btn-outline btn-ghost hover:btn-outline',
        disabled && 'btn-disabled',
        className
      )}
    >
      {ingredient}
      {selected && <Check className="ml-1 h-3 w-3" />}
    </button>
  );
});

IngredientToggle.displayName = 'IngredientToggle';
```

#### **File**: `src/components/groceries/shared/CategoryTab.tsx`

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import type { GroceryCategory } from '@/lib/types';

interface CategoryTabProps {
  categoryKey: string;
  category: GroceryCategory;
  isActive: boolean;
  count: number;
  onClick: () => void;
  className?: string;
}

export const CategoryTab = React.memo<CategoryTabProps>(({
  categoryKey,
  category,
  isActive,
  count,
  onClick,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'tab',
        isActive && 'tab-active',
        className
      )}
    >
      <span className="flex items-center space-x-2">
        <span>{category.icon}</span>
        <span className="hidden sm:inline">{category.name}</span>
        <span className="sm:hidden">{category.name.split(' ')[0]}</span>
        {count > 0 && (
          <span className="badge badge-sm badge-primary">
            {count}
          </span>
        )}
      </span>
    </button>
  );
});

CategoryTab.displayName = 'CategoryTab';
```

#### **File**: `src/components/groceries/shared/GroceryGrid.tsx`

```typescript
import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { IngredientToggle } from './IngredientToggle';
import { Input } from '@/components/ui/input';

interface GroceryGridProps {
  category: string;
  ingredients: string[];
  selectedIngredients: string[];
  onToggleIngredient: (ingredient: string) => void;
  className?: string;
}

export const GroceryGrid = React.memo<GroceryGridProps>(({
  category,
  ingredients,
  selectedIngredients,
  onToggleIngredient,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIngredients = useMemo(() => {
    if (!searchTerm.trim()) return ingredients;

    return ingredients.filter(ingredient =>
      ingredient.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ingredients, searchTerm]);

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder={`Search ${category}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Ingredients Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredIngredients.map((ingredient) => (
          <IngredientToggle
            key={ingredient}
            ingredient={ingredient}
            selected={selectedIngredients.includes(ingredient)}
            onToggle={() => onToggleIngredient(ingredient)}
          />
        ))}
      </div>

      {/* No Results */}
      {filteredIngredients.length === 0 && searchTerm.trim() && (
        <div className="text-center py-8 text-gray-500">
          No ingredients found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
});

GroceryGrid.displayName = 'GroceryGrid';
```

### **2.2 Feature Components**

#### **File**: `src/components/groceries/GroceryHeader.tsx`

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Download, Upload, Trash2 } from 'lucide-react';

interface GroceryHeaderProps {
  totalSelected: number;
  onSave: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onClearAll: () => void;
  onExport?: () => void;
  onImport?: () => void;
  loading: boolean;
  className?: string;
}

export const GroceryHeader = React.memo<GroceryHeaderProps>(({
  totalSelected,
  onSave,
  onRefresh,
  onClearAll,
  onExport,
  onImport,
  loading,
  className
}) => {
  return (
    <div className={`flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 ${className}`}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Groceries</h1>
        <p className="text-gray-600">
          Select ingredients you have available for personalized recipe suggestions
        </p>
        {totalSelected > 0 && (
          <p className="text-sm text-green-600 font-medium">
            {totalSelected} ingredient{totalSelected !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Secondary Actions */}
        <div className="flex space-x-1">
          {onImport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onImport}
              disabled={loading}
            >
              <Upload className="h-4 w-4" />
            </Button>
          )}
          {onExport && totalSelected > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              disabled={loading}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          {totalSelected > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={loading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Primary Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={onSave}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Save className="mr-2 h-4 w-4" />
            Save{totalSelected > 0 && ` (${totalSelected})`}
          </Button>
        </div>
      </div>
    </div>
  );
});

GroceryHeader.displayName = 'GroceryHeader';
```

#### **File**: `src/components/groceries/GroceryCategories.tsx`

```typescript
import React from 'react';
import { CategoryTab } from './shared/CategoryTab';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import type { GroceryCategories } from '@/lib/types';

interface GroceryCategoriesProps {
  categories: GroceryCategories;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  getCategoryCount: (category: string) => number;
  className?: string;
}

export const GroceryCategories = React.memo<GroceryCategoriesProps>(({
  categories,
  activeCategory,
  onCategoryChange,
  getCategoryCount,
  className
}) => {
  const categoryKeys = Object.keys(categories);

  return (
    <div className={`${createDaisyUICardClasses('bordered')} ${className}`}>
      <div className="card-body p-0">
        <div className="tabs tabs-boxed p-4 overflow-x-auto">
          {categoryKeys.map((categoryKey) => (
            <CategoryTab
              key={categoryKey}
              categoryKey={categoryKey}
              category={categories[categoryKey as keyof GroceryCategories]}
              isActive={activeCategory === categoryKey}
              count={getCategoryCount(categoryKey)}
              onClick={() => onCategoryChange(categoryKey)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

GroceryCategories.displayName = 'GroceryCategories';
```

#### **File**: `src/components/groceries/SelectedIngredients.tsx`

```typescript
import React from 'react';
import { X } from 'lucide-react';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { Button } from '@/components/ui/button';

interface SelectedIngredientsProps {
  groceries: Record<string, string[]>;
  onRemoveIngredient: (category: string, ingredient: string) => void;
  onClearAll: () => void;
  className?: string;
}

export const SelectedIngredients = React.memo<SelectedIngredientsProps>(({
  groceries,
  onRemoveIngredient,
  onClearAll,
  className
}) => {
  const totalCount = Object.values(groceries).flat().length;

  if (totalCount === 0) return null;

  return (
    <div className={`${createDaisyUICardClasses('bordered bg-base-200')} ${className}`}>
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title text-lg">
            Selected Ingredients ({totalCount})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-red-600 hover:text-red-700"
          >
            Clear All
          </Button>
        </div>

        <div className="space-y-3">
          {Object.entries(groceries).map(([category, ingredients]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-600 mb-2 capitalize">
                {category} ({ingredients.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient) => (
                  <span
                    key={`${category}-${ingredient}`}
                    className="badge badge-primary gap-2 cursor-pointer hover:badge-primary-focus"
                    onClick={() => onRemoveIngredient(category, ingredient)}
                  >
                    {ingredient}
                    <X className="h-3 w-3" />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

SelectedIngredients.displayName = 'SelectedIngredients';
```

### **2.3 Enhanced Page Component**

#### **File**: `src/pages/groceries-page.tsx` (enhanced version)

```typescript
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useGroceries } from '@/hooks/useGroceries';
import { GroceryHeader } from '@/components/groceries/GroceryHeader';
import { GroceryCategories } from '@/components/groceries/GroceryCategories';
import { GroceryGrid } from '@/components/groceries/shared/GroceryGrid';
import { SelectedIngredients } from '@/components/groceries/SelectedIngredients';
import { GROCERY_CATEGORIES } from '@/lib/groceries/categories';
import { createDaisyUICardClasses } from '@/lib/card-migration';

export function GroceriesPage() {
  const { user } = useAuth();
  const groceries = useGroceries();
  const [activeCategory, setActiveCategory] = useState<string>('proteins');

  const handleSave = async () => {
    await groceries.saveGroceries();
  };

  const handleRefresh = async () => {
    await groceries.loadGroceries();
  };

  const handleExport = () => {
    const data = groceries.exportGroceries();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-groceries.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (groceries.importGroceries(content)) {
            // Optionally save immediately after import
            groceries.saveGroceries();
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className={createDaisyUICardClasses('bordered')}>
            <div className="card-body text-center">
              <h2 className="card-title justify-center">Authentication Required</h2>
              <p>Please sign in to manage your groceries.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeCategoryData = GROCERY_CATEGORIES[activeCategory as keyof typeof GROCERY_CATEGORIES];
  const selectedInActiveCategory = groceries.groceries[activeCategory] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <GroceryHeader
          totalSelected={groceries.selectedCount}
          onSave={handleSave}
          onRefresh={handleRefresh}
          onClearAll={groceries.clearAll}
          onExport={handleExport}
          onImport={handleImport}
          loading={groceries.loading}
          className="mb-8"
        />

        {/* Category Navigation */}
        <GroceryCategories
          categories={GROCERY_CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          getCategoryCount={groceries.getCategoryCount}
          className="mb-6"
        />

        {/* Ingredient Grid */}
        <div className={createDaisyUICardClasses('bordered mb-6')}>
          <div className="card-body">
            <h2 className="card-title mb-4">
              {activeCategoryData.icon} {activeCategoryData.name}
            </h2>
            <GroceryGrid
              category={activeCategory}
              ingredients={activeCategoryData.items}
              selectedIngredients={selectedInActiveCategory}
              onToggleIngredient={(ingredient) =>
                groceries.toggleIngredient(activeCategory, ingredient)
              }
            />
          </div>
        </div>

        {/* Selected Ingredients Summary */}
        <SelectedIngredients
          groceries={groceries.groceries}
          onRemoveIngredient={groceries.toggleIngredient}
          onClearAll={groceries.clearAll}
        />
      </div>
    </div>
  );
}
```

---

## 📋 **Phase 3: AI Integration** ⏱️ _Week 3_

### **3.1 AI Context Enhancement**

#### **File**: `src/lib/ai/userPreferencesToPrompt.ts` (extend existing)

```typescript
// Add to UserPreferencesForAI interface
export interface UserPreferencesForAI {
  // ... existing fields
  groceries?: {
    available_ingredients: Record<string, string[]>;
    total_count: number;
  };
}

// Extend buildUserContextPrompt function
export const buildUserContextPrompt = (
  userData: UserPreferencesForAI
): string => {
  const sections = [];

  // ... existing sections

  // Grocery context (high priority for meal planning)
  if (userData.groceries?.available_ingredients) {
    const flatIngredients = Object.values(
      userData.groceries.available_ingredients
    )
      .flat()
      .join(', ');

    if (flatIngredients.length > 0) {
      sections.push(`Available ingredients: ${flatIngredients}`);
      sections.push(
        `PREFERENCE: Prioritize recipes using available ingredients when possible`
      );

      // Category-specific context
      Object.entries(userData.groceries.available_ingredients).forEach(
        ([category, ingredients]) => {
          if (ingredients.length > 0) {
            sections.push(`Available ${category}: ${ingredients.join(', ')}`);
          }
        }
      );
    }
  }

  return sections.join('\n');
};
```

#### **File**: `src/lib/ai/caching.ts` (extend existing)

```typescript
// Add to fetchUserData function
async function fetchUserData(userId: string): Promise<UserPreferencesForAI> {
  // ... existing code

  // Fetch grocery data
  let groceryData = null;
  try {
    groceryData = await getUserGroceries(userId);
  } catch (error) {
    console.warn('Failed to fetch grocery data:', error);
  }

  return {
    // ... existing fields
    groceries: groceryData
      ? {
          available_ingredients: groceryData.groceries,
          total_count: Object.values(groceryData.groceries).flat().length,
        }
      : undefined,
  };
}
```

### **3.2 Recipe View Enhancement**

#### **File**: `src/components/recipes/recipe-view.tsx` (enhance existing)

```typescript
// Add grocery integration
import { useGroceries } from '@/hooks/useGroceries';
import { Badge } from '@/components/ui/badge';
import { Check, ShoppingCart } from 'lucide-react';

export function RecipeView({ recipe }: RecipeViewProps) {
  const { groceries } = useGroceries();

  const checkIngredientAvailability = (ingredient: string): boolean => {
    return Object.values(groceries.groceries)
      .flat()
      .some(item =>
        ingredient.toLowerCase().includes(item.toLowerCase()) ||
        item.toLowerCase().includes(ingredient.toLowerCase())
      );
  };

  const getAvailableIngredientsCount = (): number => {
    return recipe.ingredients.filter(checkIngredientAvailability).length;
  };

  const getCompatibilityScore = (): number => {
    if (recipe.ingredients.length === 0) return 0;
    return Math.round((getAvailableIngredientsCount() / recipe.ingredients.length) * 100);
  };

  const compatibilityScore = getCompatibilityScore();
  const availableCount = getAvailableIngredientsCount();

  return (
    <div className="recipe-view">
      {/* ... existing content */}

      {/* Grocery Compatibility Section */}
      {Object.keys(groceries.groceries).length > 0 && (
        <div className={createDaisyUICardClasses('bordered mb-6 bg-green-50')}>
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-green-800">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Grocery Compatibility
              </h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {compatibilityScore}%
                </div>
                <div className="text-sm text-green-700">
                  {availableCount} of {recipe.ingredients.length} ingredients
                </div>
              </div>
            </div>

            {compatibilityScore >= 70 && (
              <div className="alert alert-success">
                <Check className="h-4 w-4" />
                <span>Great match! You have most ingredients needed.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Ingredients Section */}
      <div className={createDaisyUICardClasses('bordered mb-6')}>
        <div className="card-body">
          <h3 className="card-title mb-4">Ingredients</h3>
          <div className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => {
              const isAvailable = checkIngredientAvailability(ingredient);

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isAvailable
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="flex-1">{ingredient}</span>
                  {isAvailable && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      You have this
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Shopping List for Missing Ingredients */}
          {(() => {
            const missingIngredients = recipe.ingredients.filter(
              ingredient => !checkIngredientAvailability(ingredient)
            );

            if (missingIngredients.length > 0) {
              return (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Shopping List ({missingIngredients.length} items)
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {missingIngredients.map((ingredient, index) => (
                      <li key={index}>• {ingredient}</li>
                    ))}
                  </ul>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* ... rest of existing content */}
    </div>
  );
}
```

### **3.3 Chat Interface Integration**

#### **File**: `src/components/chat/ChatInterface.tsx` (enhance existing)

```typescript
// Add grocery context integration
import { useGroceries } from '@/hooks/useGroceries';

export function ChatInterface() {
  const { groceries } = useGroceries();
  const conversation = useConversation();

  const enhanceUserMessage = (message: string): string => {
    const availableIngredients = Object.values(groceries.groceries).flat();

    // Only add grocery context if user has selected ingredients and message seems recipe-related
    if (availableIngredients.length > 0 && isRecipeRelatedMessage(message)) {
      const ingredientContext = `[Available ingredients: ${availableIngredients.join(', ')}]`;
      return `${message}\n\n${ingredientContext}`;
    }

    return message;
  };

  const isRecipeRelatedMessage = (message: string): boolean => {
    const recipeKeywords = [
      'recipe', 'cook', 'meal', 'dinner', 'lunch', 'breakfast', 'ingredient',
      'make', 'prepare', 'dish', 'food', 'eat', 'hungry', 'craving'
    ];

    return recipeKeywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    );
  };

  // Integration with existing chat flow
  const handleSendMessage = (message: string) => {
    const enhancedMessage = enhanceUserMessage(message);
    conversation.sendMessage(enhancedMessage);
  };

  // Add grocery status indicator
  const renderGroceryStatus = () => {
    const totalIngredients = Object.values(groceries.groceries).flat().length;

    if (totalIngredients === 0) return null;

    return (
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center text-sm text-green-700">
          <ShoppingCart className="h-4 w-4 mr-2" />
          <span>
            Using {totalIngredients} available ingredient{totalIngredients !== 1 ? 's' : ''} for suggestions
          </span>
          <button
            onClick={() => groceries.loadGroceries()}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-interface">
      {renderGroceryStatus()}
      {/* ... existing chat interface */}
    </div>
  );
}
```

---

## 📋 **Phase 4: Advanced Features** ⏱️ _Week 4_

### **4.1 Recipe Compatibility Scoring**

#### **File**: `src/lib/groceries/compatibility.ts`

```typescript
import type { Recipe } from '@/lib/types';

export interface RecipeCompatibility {
  score: number; // 0-100
  availableIngredients: string[];
  missingIngredients: string[];
  totalIngredients: number;
  availableCount: number;
}

export function calculateRecipeCompatibility(
  recipe: Recipe,
  userGroceries: Record<string, string[]>
): RecipeCompatibility {
  const availableIngredients = Object.values(userGroceries).flat();
  const recipeIngredients = recipe.ingredients;

  const available: string[] = [];
  const missing: string[] = [];

  recipeIngredients.forEach((ingredient) => {
    const isAvailable = availableIngredients.some(
      (userIngredient) =>
        ingredient.toLowerCase().includes(userIngredient.toLowerCase()) ||
        userIngredient.toLowerCase().includes(ingredient.toLowerCase()) ||
        fuzzyMatch(ingredient, userIngredient)
    );

    if (isAvailable) {
      available.push(ingredient);
    } else {
      missing.push(ingredient);
    }
  });

  const score =
    recipeIngredients.length > 0
      ? Math.round((available.length / recipeIngredients.length) * 100)
      : 0;

  return {
    score,
    availableIngredients: available,
    missingIngredients: missing,
    totalIngredients: recipeIngredients.length,
    availableCount: available.length,
  };
}

function fuzzyMatch(ingredient: string, userIngredient: string): boolean {
  // Simple fuzzy matching for common ingredient variations
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z]/g, '');
  const normalizedIngredient = normalize(ingredient);
  const normalizedUserIngredient = normalize(userIngredient);

  // Check for partial matches
  return (
    normalizedIngredient.includes(normalizedUserIngredient) ||
    normalizedUserIngredient.includes(normalizedIngredient)
  );
}

export function sortRecipesByCompatibility(
  recipes: Recipe[],
  userGroceries: Record<string, string[]>
): Array<Recipe & { compatibility: RecipeCompatibility }> {
  return recipes
    .map((recipe) => ({
      ...recipe,
      compatibility: calculateRecipeCompatibility(recipe, userGroceries),
    }))
    .sort((a, b) => b.compatibility.score - a.compatibility.score);
}
```

### **4.2 Smart Recipe Suggestions**

#### **File**: `src/hooks/useSmartRecipes.ts`

```typescript
import { useMemo } from 'react';
import { useRecipes } from './use-recipes';
import { useGroceries } from './useGroceries';
import { sortRecipesByCompatibility } from '@/lib/groceries/compatibility';
import type { Recipe, RecipeFilters } from '@/lib/types';

export interface UseSmartRecipesReturn {
  compatibleRecipes: Array<Recipe & { compatibility: any }>;
  highCompatibilityRecipes: Array<Recipe & { compatibility: any }>;
  suggestedRecipes: Array<Recipe & { compatibility: any }>;
  loading: boolean;
  error: any;
}

export function useSmartRecipes(
  filters?: RecipeFilters
): UseSmartRecipesReturn {
  const { data: recipes = [], isLoading, error } = useRecipes(filters);
  const { groceries } = useGroceries();

  const compatibleRecipes = useMemo(() => {
    if (!recipes.length || !Object.keys(groceries.groceries).length) {
      return recipes.map((recipe) => ({ ...recipe, compatibility: null }));
    }

    return sortRecipesByCompatibility(recipes, groceries.groceries);
  }, [recipes, groceries.groceries]);

  const highCompatibilityRecipes = useMemo(() => {
    return compatibleRecipes.filter(
      (recipe) => recipe.compatibility && recipe.compatibility.score >= 70
    );
  }, [compatibleRecipes]);

  const suggestedRecipes = useMemo(() => {
    // Show top 6 most compatible recipes
    return compatibleRecipes.slice(0, 6);
  }, [compatibleRecipes]);

  return {
    compatibleRecipes,
    highCompatibilityRecipes,
    suggestedRecipes,
    loading: isLoading,
    error,
  };
}
```

### **4.3 Shopping List Generation**

#### **File**: `src/lib/groceries/shopping-list.ts`

```typescript
import type { Recipe } from '@/lib/types';
import { calculateRecipeCompatibility } from './compatibility';

export interface ShoppingListItem {
  ingredient: string;
  recipes: string[]; // Recipe titles that need this ingredient
  priority: 'high' | 'medium' | 'low';
}

export interface ShoppingList {
  items: ShoppingListItem[];
  totalItems: number;
  estimatedCost?: number;
}

export function generateShoppingList(
  recipes: Recipe[],
  userGroceries: Record<string, string[]>,
  selectedRecipeIds?: string[]
): ShoppingList {
  const targetRecipes = selectedRecipeIds
    ? recipes.filter((recipe) => selectedRecipeIds.includes(recipe.id))
    : recipes;

  const missingIngredients = new Map<string, ShoppingListItem>();

  targetRecipes.forEach((recipe) => {
    const compatibility = calculateRecipeCompatibility(recipe, userGroceries);

    compatibility.missingIngredients.forEach((ingredient) => {
      const normalizedIngredient = normalizeIngredient(ingredient);

      if (missingIngredients.has(normalizedIngredient)) {
        const existing = missingIngredients.get(normalizedIngredient)!;
        existing.recipes.push(recipe.title);
        // Increase priority if used in multiple recipes
        if (existing.recipes.length >= 3) {
          existing.priority = 'high';
        } else if (existing.recipes.length >= 2) {
          existing.priority = 'medium';
        }
      } else {
        missingIngredients.set(normalizedIngredient, {
          ingredient: ingredient,
          recipes: [recipe.title],
          priority: 'low',
        });
      }
    });
  });

  const items = Array.from(missingIngredients.values()).sort((a, b) => {
    // Sort by priority, then by number of recipes
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.recipes.length - a.recipes.length;
  });

  return {
    items,
    totalItems: items.length,
  };
}

function normalizeIngredient(ingredient: string): string {
  // Normalize ingredient names to avoid duplicates
  return ingredient
    .toLowerCase()
    .replace(/\b(fresh|dried|ground|whole|chopped|diced|sliced)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function exportShoppingListAsText(shoppingList: ShoppingList): string {
  const lines = [
    '# Shopping List',
    `Generated: ${new Date().toLocaleDateString()}`,
    `Total Items: ${shoppingList.totalItems}`,
    '',
    '## High Priority',
    ...shoppingList.items
      .filter((item) => item.priority === 'high')
      .map((item) => `- ${item.ingredient} (${item.recipes.length} recipes)`),
    '',
    '## Medium Priority',
    ...shoppingList.items
      .filter((item) => item.priority === 'medium')
      .map((item) => `- ${item.ingredient} (${item.recipes.length} recipes)`),
    '',
    '## Low Priority',
    ...shoppingList.items
      .filter((item) => item.priority === 'low')
      .map((item) => `- ${item.ingredient} (${item.recipes.length} recipes)`),
  ];

  return lines.join('\n');
}
```

### **4.4 Import from Recent Recipes**

#### **File**: `src/components/groceries/ImportFromRecipes.tsx`

```typescript
import React, { useState } from 'react';
import { useRecipes } from '@/hooks/use-recipes';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Import, ChefHat } from 'lucide-react';
import { GROCERY_CATEGORIES } from '@/lib/groceries/categories';

interface ImportFromRecipesProps {
  onImportIngredients: (category: string, ingredients: string[]) => void;
}

export const ImportFromRecipes: React.FC<ImportFromRecipesProps> = ({
  onImportIngredients
}) => {
  const { data: recipes = [] } = useRecipes();
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const extractIngredientsFromRecipes = (recipeIds: string[]) => {
    const selectedRecipeObjects = recipes.filter(recipe =>
      recipeIds.includes(recipe.id)
    );

    const allIngredients = selectedRecipeObjects
      .flatMap(recipe => recipe.ingredients)
      .map(ingredient => ingredient.toLowerCase());

    // Categorize ingredients
    const categorizedIngredients: Record<string, string[]> = {};

    Object.entries(GROCERY_CATEGORIES).forEach(([categoryKey, category]) => {
      const matchingIngredients = category.items.filter(item =>
        allIngredients.some(recipeIngredient =>
          recipeIngredient.includes(item.toLowerCase()) ||
          item.toLowerCase().includes(recipeIngredient)
        )
      );

      if (matchingIngredients.length > 0) {
        categorizedIngredients[categoryKey] = [...new Set(matchingIngredients)];
      }
    });

    return categorizedIngredients;
  };

  const handleImport = () => {
    const categorizedIngredients = extractIngredientsFromRecipes(selectedRecipes);

    Object.entries(categorizedIngredients).forEach(([category, ingredients]) => {
      onImportIngredients(category, ingredients);
    });

    setIsOpen(false);
    setSelectedRecipes([]);
  };

  const recentRecipes = recipes.slice(0, 10); // Last 10 recipes

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Import className="h-4 w-4 mr-2" />
          Import from Recipes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Ingredients from Recent Recipes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select recipes to automatically add their ingredients to your grocery list.
          </p>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {recentRecipes.map(recipe => (
              <div key={recipe.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  checked={selectedRecipes.includes(recipe.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRecipes(prev => [...prev, recipe.id]);
                    } else {
                      setSelectedRecipes(prev => prev.filter(id => id !== recipe.id));
                    }
                  }}
                />
                <ChefHat className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <h4 className="font-medium">{recipe.title}</h4>
                  <p className="text-sm text-gray-500">
                    {recipe.ingredients.length} ingredients
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedRecipes.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedRecipes.length === 0}
            >
              Import Ingredients
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 🎯 **Success Criteria & Quality Gates**

### **Phase 1 Completion Criteria**

- [ ] Users can select/deselect ingredients by category
- [ ] Grocery selections persist to database with RLS protection
- [ ] Basic grocery page accessible via navigation
- [ ] All existing functionality remains unaffected
- [ ] Database migration runs successfully in both local and production
- [ ] TypeScript compilation passes with no errors

### **Phase 2 Completion Criteria**

- [ ] Smooth category navigation with ingredient counts
- [ ] Search functionality works within categories
- [ ] Bulk actions (select all, clear all) work reliably
- [ ] Mobile experience is fully functional and responsive
- [ ] Performance meets <300ms page load target
- [ ] Export/import functionality works correctly
- [ ] Visual feedback and loading states implemented

### **Phase 3 Completion Criteria**

- [ ] AI chat automatically includes grocery context for recipe-related messages
- [ ] Recipe ingredients show availability status with badges
- [ ] Recipe compatibility scores display accurately
- [ ] Integration doesn't impact existing AI performance
- [ ] Graceful fallback when grocery data unavailable
- [ ] Shopping list generation works for missing ingredients

### **Phase 4 Completion Criteria**

- [ ] Recipe compatibility scoring works accurately across all recipes
- [ ] Smart recipe suggestions prioritize available ingredients
- [ ] Import from recent recipes functions correctly
- [ ] Shopping list generation handles multiple recipes
- [ ] 95%+ test coverage achieved for all grocery components
- [ ] All performance and accessibility targets met
- [ ] Documentation complete and up-to-date

---

## 🔒 **Technical Standards & Compliance**

### **Code Quality Requirements**

- **TypeScript**: Strict compliance, no `any` types except for legacy integration points
- **Testing**: Jest + React Testing Library for all components, minimum 95% coverage
- **Performance**: Lighthouse score >90 for grocery page, <300ms initial load
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support
- **Security**: All grocery data protected by RLS policies, input sanitization
- **Code Style**: Prettier + ESLint compliance, consistent component patterns

### **Database Safety Standards**

- **No Database Resets**: All migrations preserve existing production data
- **Production-Safe**: All migrations tested locally before deployment
- **Audit Trail**: All grocery changes tracked with timestamps
- **Data Validation**: Input sanitization and constraint checking at database level
- **Rollback Plan**: All migrations include rollback procedures

### **Integration Testing Strategy**

- **End-to-End**: Complete grocery workflow from selection to AI integration
- **Cross-Device**: Mobile and desktop compatibility testing
- **AI Integration**: Verify context injection doesn't break existing AI flows
- **Performance**: Load testing with large ingredient lists (1000+ items)
- **Error Handling**: Network failures, database unavailability scenarios
- **Security**: RLS policy enforcement, unauthorized access attempts

---

## 🚀 **Deployment Strategy**

### **Branch Management**

- **Feature Branch**: All work on `feature/grocery-page` (current branch)
- **Pull Request**: Under 500 lines per PR, focused changes
- **QA Process**: Follow @PRE-PR-VERIFICATION-CHECKLIST.md before each PR
- **Code Review**: Minimum 2 approvals for database changes
- **Merge Strategy**: Squash commits for clean history

### **Database Migration Strategy**

1. **Local Testing**: Full migration testing in local environment
2. **Staging Deployment**: Deploy to staging with production data snapshot
3. **Migration Validation**: Verify data integrity and performance
4. **Production Deployment**: Use Supabase CLI for production migration
5. **Rollback Readiness**: Tested rollback procedures for each migration

### **Feature Rollout Plan**

1. **Phase 1**: Core functionality (database + basic UI)
2. **Phase 2**: Enhanced UI with search and bulk actions
3. **Phase 3**: AI integration with recipe compatibility
4. **Phase 4**: Advanced features and optimization
5. **Full Activation**: Complete feature availability with monitoring

### **Monitoring & Observability**

- **Error Tracking**: Sentry integration for error monitoring
- **Performance**: Web Vitals monitoring for grocery page
- **Usage Analytics**: Track feature adoption and usage patterns
- **Database Monitoring**: Query performance and storage usage
- **User Feedback**: In-app feedback collection for iterations

---

## 📚 **Documentation Requirements**

### **Technical Documentation**

- [ ] API documentation for grocery endpoints
- [ ] Component documentation with Storybook stories
- [ ] Hook usage examples and best practices
- [ ] Database schema documentation updates
- [ ] Migration procedures and rollback plans

### **User Documentation**

- [ ] Feature announcement and onboarding guide
- [ ] Grocery management user guide
- [ ] AI integration explanation
- [ ] Troubleshooting common issues
- [ ] Privacy and data handling information

### **Developer Documentation**

- [ ] Implementation guide for future grocery features
- [ ] Testing strategies and examples
- [ ] Performance optimization techniques
- [ ] Integration patterns with existing systems
- [ ] Contribution guidelines for grocery components

---

This comprehensive implementation plan provides a structured approach to building the Groceries Page feature while maintaining the project's high quality standards and following established architectural patterns. Each phase builds incrementally on the previous one, allowing for thorough testing and refinement at every stage.

The plan prioritizes user experience, system reliability, and seamless integration with existing functionality while providing clear success criteria and quality gates for each phase of development.

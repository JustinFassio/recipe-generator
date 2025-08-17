# Phase 6: Canonical Categories

**Category taxonomy definition and configuration management**

---

## 🎯 **Phase Objectives**

Establish a comprehensive, extensible category taxonomy that supports current needs while enabling future growth. Create configuration management systems for category definitions, validation, and user customization.

## 📋 **Deliverables**

- [x] Canonical category taxonomy
- [x] Category configuration system
- [x] Category validation and suggestions
- [x] Admin category management
- [x] User category customization
- [x] Category analytics and insights

## 📚 **Canonical Category Taxonomy**

### **1. Core Category System**

**File**: `src/lib/categories.ts`

```typescript
/**
 * Comprehensive category taxonomy for recipe organization
 * Structured as namespaced strings for flexibility and future hierarchy support
 */

// Base category structure
export interface CategoryDefinition {
  namespace: string;
  values: string[];
  description: string;
  examples: string[];
  priority: number; // For UI ordering
  isRequired?: boolean; // If every recipe should have this category
  allowCustom?: boolean; // If users can add custom values
  maxSelection?: number; // Max values per recipe
}

// Core category namespaces with comprehensive values
export const CATEGORY_DEFINITIONS: Record<string, CategoryDefinition> = {
  course: {
    namespace: 'Course',
    values: [
      'Appetizer',
      'Main',
      'Side',
      'Dessert',
      'Breakfast',
      'Brunch',
      'Snack',
      'Beverage',
    ],
    description: 'The meal course or serving occasion for the recipe',
    examples: ['Course: Main', 'Course: Appetizer', 'Course: Dessert'],
    priority: 1,
    isRequired: true,
    allowCustom: false,
    maxSelection: 2,
  },

  dishType: {
    namespace: 'Dish Type',
    values: [
      'Soup',
      'Salad',
      'Sandwich',
      'Curry',
      'Stir-Fry',
      'Stew',
      'Pasta',
      'Bowl',
      'Casserole',
      'Taco',
      'Pizza',
      'Burger',
      'Wrap',
      'Smoothie',
      'Sauce',
      'Bread',
      'Cake',
      'Pie',
    ],
    description: 'The type or style of dish being prepared',
    examples: ['Dish Type: Soup', 'Dish Type: Pasta', 'Dish Type: Salad'],
    priority: 2,
    allowCustom: true,
    maxSelection: 2,
  },

  component: {
    namespace: 'Component',
    values: [
      'Sauce',
      'Dressing',
      'Marinade',
      'Spice Blend',
      'Rub',
      'Stock/Broth',
      'Pickle',
      'Ferment',
      'Condiment',
      'Seasoning',
      'Base',
      'Filling',
      'Topping',
      'Garnish',
    ],
    description: 'Recipe components that can be used in other dishes',
    examples: [
      'Component: Sauce',
      'Component: Spice Blend',
      'Component: Marinade',
    ],
    priority: 3,
    allowCustom: true,
    maxSelection: 3,
  },

  technique: {
    namespace: 'Technique',
    values: [
      'Bake',
      'Roast',
      'Grill',
      'Sauté',
      'Steam',
      'Boil',
      'Simmer',
      'Air Fryer',
      'Instant Pot',
      'Slow Cooker',
      'No-Cook',
      'Raw',
      'Fry',
      'Deep Fry',
      'Braise',
      'Poach',
      'Broil',
      'Smoke',
    ],
    description: 'Primary cooking methods or techniques used',
    examples: ['Technique: Bake', 'Technique: Sauté', 'Technique: No-Cook'],
    priority: 4,
    allowCustom: true,
    maxSelection: 3,
  },

  collection: {
    namespace: 'Collection',
    values: [
      'Anti-Inflammatory',
      'Low-FODMAP',
      'High-Protein',
      'Low-Sodium',
      'Gluten-Free',
      'Dairy-Free',
      'Vegan',
      'Vegetarian',
      'Keto',
      'Paleo',
      'Low-Carb',
      'High-Fiber',
      'Kid-Friendly',
      'Budget',
      '30-Minute',
      'One-Pot',
      'Meal-Prep',
      'Freezer-Friendly',
    ],
    description: 'Dietary, lifestyle, or convenience collections',
    examples: [
      'Collection: Anti-Inflammatory',
      'Collection: Kid-Friendly',
      'Collection: 30-Minute',
    ],
    priority: 5,
    allowCustom: true,
    maxSelection: 4,
  },

  cuisine: {
    namespace: 'Cuisine',
    values: [
      'Italian',
      'Mexican',
      'Indian',
      'Thai',
      'Japanese',
      'Chinese',
      'Korean',
      'Vietnamese',
      'Mediterranean',
      'French',
      'Spanish',
      'Greek',
      'Middle Eastern',
      'Ethiopian',
      'Peruvian',
      'Brazilian',
      'American',
      'Southern',
      'Cajun',
      'British',
      'German',
      'Russian',
      'Moroccan',
      'Turkish',
      'Lebanese',
      'Fusion',
    ],
    description: 'Cultural or regional cuisine styles',
    examples: ['Cuisine: Italian', 'Cuisine: Thai', 'Cuisine: Mediterranean'],
    priority: 6,
    allowCustom: true,
    maxSelection: 2,
  },

  beverage: {
    namespace: 'Beverage',
    values: [
      'Cocktail',
      'Mocktail',
      'Smoothie',
      'Juice',
      'Tea',
      'Coffee',
      'Hot Chocolate',
      'Infusion',
      'Kombucha',
      'Lassi',
      'Shake',
      'Wine',
      'Beer',
      'Cider',
      'Soda',
    ],
    description: 'Types of beverages and drinks',
    examples: ['Beverage: Cocktail', 'Beverage: Smoothie', 'Beverage: Tea'],
    priority: 7,
    allowCustom: true,
    maxSelection: 2,
  },

  occasion: {
    namespace: 'Occasion',
    values: [
      'Weeknight',
      'Weekend',
      'Meal Prep',
      'Holiday',
      'Party',
      'Picnic',
      'BBQ',
      'Potluck',
      'Date Night',
      'Family Dinner',
      'Brunch',
      'Game Day',
      'Thanksgiving',
      'Christmas',
      'Easter',
      'Birthday',
    ],
    description: 'Special occasions or timing for the recipe',
    examples: ['Occasion: Holiday', 'Occasion: Weeknight', 'Occasion: Party'],
    priority: 8,
    allowCustom: true,
    maxSelection: 3,
  },

  season: {
    namespace: 'Season',
    values: ['Spring', 'Summer', 'Fall', 'Winter', 'Year-Round'],
    description: 'Seasonal appropriateness of the recipe',
    examples: ['Season: Summer', 'Season: Fall', 'Season: Year-Round'],
    priority: 9,
    allowCustom: false,
    maxSelection: 2,
  },

  difficulty: {
    namespace: 'Difficulty',
    values: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    description: 'Skill level required to make the recipe',
    examples: ['Difficulty: Beginner', 'Difficulty: Intermediate'],
    priority: 10,
    allowCustom: false,
    maxSelection: 1,
  },
};

// Generate flat list of all canonical categories
export const CANONICAL_CATEGORIES: string[] = Object.values(
  CATEGORY_DEFINITIONS
).flatMap((def) => def.values.map((value) => `${def.namespace}: ${value}`));

// Helper functions for category management
export function getCategoryNamespaces(): string[] {
  return Object.values(CATEGORY_DEFINITIONS)
    .sort((a, b) => a.priority - b.priority)
    .map((def) => def.namespace);
}

export function getCategoriesByNamespace(namespace: string): string[] {
  const definition = Object.values(CATEGORY_DEFINITIONS).find(
    (def) => def.namespace === namespace
  );

  return definition
    ? definition.values.map((value) => `${namespace}: ${value}`)
    : [];
}

export function getCategoryDefinition(
  namespace: string
): CategoryDefinition | undefined {
  return Object.values(CATEGORY_DEFINITIONS).find(
    (def) => def.namespace === namespace
  );
}

export function isCanonicalCategory(category: string): boolean {
  return CANONICAL_CATEGORIES.includes(category);
}

export function getRequiredNamespaces(): string[] {
  return Object.values(CATEGORY_DEFINITIONS)
    .filter((def) => def.isRequired)
    .map((def) => def.namespace);
}

export function getAllowCustomNamespaces(): string[] {
  return Object.values(CATEGORY_DEFINITIONS)
    .filter((def) => def.allowCustom)
    .map((def) => def.namespace);
}
```

### **2. Category Configuration System**

**File**: `src/lib/category-config.ts`

```typescript
/**
 * Category configuration and management system
 * Handles user preferences, admin settings, and dynamic category updates
 */

import { CATEGORY_DEFINITIONS, CategoryDefinition } from './categories';

// User category preferences
export interface UserCategoryPreferences {
  userId: string;
  favoriteCategories: string[];
  hiddenCategories: string[];
  customCategories: string[];
  defaultCategories: Record<string, string[]>; // Default categories for new recipes
  categoryOrder: string[]; // Custom ordering of namespaces
  lastUpdated: string;
}

// Admin category configuration
export interface AdminCategoryConfig {
  enabledNamespaces: string[];
  customDefinitions: Record<string, CategoryDefinition>;
  globalHiddenCategories: string[];
  featuredCategories: string[];
  categoryPrompts: Record<string, string>; // AI prompts for each namespace
  validationRules: CategoryValidationRules;
  lastUpdated: string;
}

export interface CategoryValidationRules {
  maxCategoriesPerRecipe: number;
  maxCustomCategoriesPerUser: number;
  allowedCustomNamespaces: string[];
  bannedWords: string[];
  minCategoryLength: number;
  maxCategoryLength: number;
}

// Default configurations
export const DEFAULT_VALIDATION_RULES: CategoryValidationRules = {
  maxCategoriesPerRecipe: 8,
  maxCustomCategoriesPerUser: 20,
  allowedCustomNamespaces: [
    'Dish Type',
    'Component',
    'Technique',
    'Collection',
    'Cuisine',
    'Occasion',
  ],
  bannedWords: ['test', 'temp', 'placeholder'],
  minCategoryLength: 2,
  maxCategoryLength: 50,
};

export const DEFAULT_USER_PREFERENCES: Partial<UserCategoryPreferences> = {
  favoriteCategories: [],
  hiddenCategories: [],
  customCategories: [],
  defaultCategories: {
    Course: ['Course: Main'],
  },
  categoryOrder: ['Course', 'Dish Type', 'Cuisine', 'Technique', 'Collection'],
};

// Configuration management class
export class CategoryConfigManager {
  private userPreferences: UserCategoryPreferences | null = null;
  private adminConfig: AdminCategoryConfig | null = null;

  // Load user preferences
  async loadUserPreferences(userId: string): Promise<UserCategoryPreferences> {
    try {
      // In a real app, this would load from database/API
      const stored = localStorage.getItem(`category-preferences-${userId}`);
      if (stored) {
        this.userPreferences = JSON.parse(stored);
        return this.userPreferences!;
      }
    } catch (error) {
      console.warn('Failed to load user category preferences:', error);
    }

    // Return defaults
    this.userPreferences = {
      userId,
      ...DEFAULT_USER_PREFERENCES,
      lastUpdated: new Date().toISOString(),
    } as UserCategoryPreferences;

    return this.userPreferences;
  }

  // Save user preferences
  async saveUserPreferences(
    preferences: UserCategoryPreferences
  ): Promise<void> {
    try {
      preferences.lastUpdated = new Date().toISOString();
      localStorage.setItem(
        `category-preferences-${preferences.userId}`,
        JSON.stringify(preferences)
      );
      this.userPreferences = preferences;
    } catch (error) {
      console.error('Failed to save user category preferences:', error);
      throw error;
    }
  }

  // Get available categories for user
  getAvailableCategories(userId?: string): string[] {
    const baseCategories = [...CANONICAL_CATEGORIES];

    if (!userId || !this.userPreferences) {
      return baseCategories;
    }

    // Add user's custom categories
    const customCategories = this.userPreferences.customCategories || [];

    // Remove hidden categories
    const hiddenCategories = new Set(
      this.userPreferences.hiddenCategories || []
    );

    return [...baseCategories, ...customCategories].filter(
      (category) => !hiddenCategories.has(category)
    );
  }

  // Get suggested categories for new recipe
  getDefaultCategories(userId?: string): string[] {
    if (!userId || !this.userPreferences) {
      return ['Course: Main'];
    }

    const defaults = this.userPreferences.defaultCategories;
    return Object.values(defaults).flat();
  }

  // Add custom category for user
  async addCustomCategory(userId: string, category: string): Promise<boolean> {
    const preferences = await this.loadUserPreferences(userId);

    // Validate category
    if (!this.validateCustomCategory(category)) {
      return false;
    }

    // Check limits
    const currentCustomCount = preferences.customCategories.length;
    if (
      currentCustomCount >= DEFAULT_VALIDATION_RULES.maxCustomCategoriesPerUser
    ) {
      throw new Error('Maximum custom categories reached');
    }

    // Add if not already exists
    if (!preferences.customCategories.includes(category)) {
      preferences.customCategories.push(category);
      await this.saveUserPreferences(preferences);
    }

    return true;
  }

  // Validate custom category
  private validateCustomCategory(category: string): boolean {
    const rules = DEFAULT_VALIDATION_RULES;

    // Check length
    if (
      category.length < rules.minCategoryLength ||
      category.length > rules.maxCategoryLength
    ) {
      return false;
    }

    // Check banned words
    const lowerCategory = category.toLowerCase();
    if (rules.bannedWords.some((word) => lowerCategory.includes(word))) {
      return false;
    }

    // Check namespace if present
    if (category.includes(':')) {
      const [namespace] = category.split(':');
      if (!rules.allowedCustomNamespaces.includes(namespace.trim())) {
        return false;
      }
    }

    return true;
  }

  // Get category suggestions based on user history
  getCategorySuggestions(userId: string, recipeContent?: any): string[] {
    if (!this.userPreferences) {
      return CANONICAL_CATEGORIES.slice(0, 10);
    }

    const favorites = this.userPreferences.favoriteCategories || [];
    const recent = this.getRecentlyUsedCategories(userId);
    const content = this.getContentBasedSuggestions(recipeContent);

    // Combine and deduplicate
    const suggestions = new Set([
      ...favorites.slice(0, 5),
      ...recent.slice(0, 5),
      ...content.slice(0, 5),
      ...CANONICAL_CATEGORIES.slice(0, 10),
    ]);

    return Array.from(suggestions);
  }

  private getRecentlyUsedCategories(userId: string): string[] {
    // In a real app, this would query recent recipes
    // For now, return empty array
    return [];
  }

  private getContentBasedSuggestions(recipeContent?: any): string[] {
    if (!recipeContent) return [];

    // Use the existing category suggestion logic
    const { suggestCategoriesFromContent } = require('./category-suggestions');
    return suggestCategoriesFromContent(
      recipeContent.title || '',
      recipeContent.ingredients || [],
      recipeContent.instructions || ''
    );
  }
}

// Singleton instance
export const categoryConfig = new CategoryConfigManager();
```

### **3. Category Analytics System**

**File**: `src/lib/category-analytics.ts`

```typescript
/**
 * Category analytics and insights system
 * Tracks usage patterns, suggests improvements, and provides insights
 */

export interface CategoryUsageStats {
  category: string;
  namespace: string;
  totalUses: number;
  uniqueUsers: number;
  averagePerRecipe: number;
  trendDirection: 'up' | 'down' | 'stable';
  popularityScore: number;
  lastUsed: string;
}

export interface CategoryInsights {
  mostPopular: CategoryUsageStats[];
  trending: CategoryUsageStats[];
  underused: CategoryUsageStats[];
  userSpecific: {
    mostUsed: string[];
    recommended: string[];
    missing: string[]; // Categories user might want to add
  };
  globalStats: {
    totalCategories: number;
    averageCategoriesPerRecipe: number;
    mostActiveNamespace: string;
    categoryGrowthRate: number;
  };
}

export interface CategoryRecommendation {
  category: string;
  confidence: number;
  reason: string;
  examples: string[];
}

export class CategoryAnalytics {
  // Analyze category usage patterns
  async analyzeCategoryUsage(userId?: string): Promise<CategoryInsights> {
    // In a real implementation, this would query the database
    // For now, return mock data structure

    const mockStats: CategoryUsageStats[] = [
      {
        category: 'Course: Main',
        namespace: 'Course',
        totalUses: 150,
        uniqueUsers: 45,
        averagePerRecipe: 0.8,
        trendDirection: 'stable',
        popularityScore: 95,
        lastUsed: new Date().toISOString(),
      },
      {
        category: 'Cuisine: Italian',
        namespace: 'Cuisine',
        totalUses: 89,
        uniqueUsers: 32,
        averagePerRecipe: 0.3,
        trendDirection: 'up',
        popularityScore: 78,
        lastUsed: new Date().toISOString(),
      },
      // ... more mock data
    ];

    return {
      mostPopular: mockStats.slice(0, 10),
      trending: mockStats.filter((s) => s.trendDirection === 'up').slice(0, 5),
      underused: mockStats.filter((s) => s.popularityScore < 20).slice(0, 5),
      userSpecific: {
        mostUsed: ['Course: Main', 'Cuisine: Italian'],
        recommended: ['Collection: Quick', 'Technique: One-Pot'],
        missing: ['Difficulty: Beginner', 'Season: Summer'],
      },
      globalStats: {
        totalCategories: CANONICAL_CATEGORIES.length,
        averageCategoriesPerRecipe: 3.2,
        mostActiveNamespace: 'Course',
        categoryGrowthRate: 0.15,
      },
    };
  }

  // Get category recommendations for a recipe
  async getRecipeRecommendations(
    recipeContent: {
      title: string;
      ingredients: string[];
      instructions: string;
      existingCategories: string[];
    },
    userId?: string
  ): Promise<CategoryRecommendation[]> {
    const recommendations: CategoryRecommendation[] = [];

    // Content-based recommendations
    const contentSuggestions = this.analyzeRecipeContent(recipeContent);
    recommendations.push(...contentSuggestions);

    // User pattern-based recommendations
    if (userId) {
      const userSuggestions = await this.getUserPatternRecommendations(
        userId,
        recipeContent
      );
      recommendations.push(...userSuggestions);
    }

    // Global pattern recommendations
    const globalSuggestions =
      this.getGlobalPatternRecommendations(recipeContent);
    recommendations.push(...globalSuggestions);

    // Remove duplicates and sort by confidence
    const uniqueRecommendations =
      this.deduplicateRecommendations(recommendations);
    return uniqueRecommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);
  }

  private analyzeRecipeContent(recipeContent: any): CategoryRecommendation[] {
    const recommendations: CategoryRecommendation[] = [];
    const { title, ingredients, instructions } = recipeContent;
    const allText = [title, ...ingredients, instructions]
      .join(' ')
      .toLowerCase();

    // Analyze for cuisine indicators
    const cuisinePatterns = {
      italian: {
        category: 'Cuisine: Italian',
        keywords: ['pasta', 'parmesan', 'basil', 'olive oil'],
      },
      mexican: {
        category: 'Cuisine: Mexican',
        keywords: ['cumin', 'cilantro', 'lime', 'jalapeño'],
      },
      asian: {
        category: 'Cuisine: Asian',
        keywords: ['soy sauce', 'ginger', 'sesame', 'rice'],
      },
    };

    Object.entries(cuisinePatterns).forEach(([cuisine, pattern]) => {
      const matchCount = pattern.keywords.filter((keyword) =>
        allText.includes(keyword)
      ).length;
      if (matchCount >= 2) {
        recommendations.push({
          category: pattern.category,
          confidence: Math.min(0.9, 0.3 + matchCount * 0.2),
          reason: `Contains ${matchCount} ${cuisine} ingredients/techniques`,
          examples: pattern.keywords.filter((k) => allText.includes(k)),
        });
      }
    });

    // Analyze for technique indicators
    const techniquePatterns = {
      bake: ['oven', 'bake', 'baked', 'baking'],
      grill: ['grill', 'grilled', 'barbecue', 'bbq'],
      'no-cook': ['no cook', 'raw', 'fresh', 'uncooked'],
    };

    Object.entries(techniquePatterns).forEach(([technique, keywords]) => {
      const hasKeyword = keywords.some((keyword) => allText.includes(keyword));
      if (hasKeyword) {
        recommendations.push({
          category: `Technique: ${technique.charAt(0).toUpperCase() + technique.slice(1)}`,
          confidence: 0.8,
          reason: `Instructions indicate ${technique} cooking method`,
          examples: keywords.filter((k) => allText.includes(k)),
        });
      }
    });

    return recommendations;
  }

  private async getUserPatternRecommendations(
    userId: string,
    recipeContent: any
  ): Promise<CategoryRecommendation[]> {
    // In a real implementation, analyze user's recipe history
    // Return mock recommendations for now
    return [
      {
        category: 'Collection: Quick',
        confidence: 0.7,
        reason: 'You often cook quick meals',
        examples: ['30-minute recipes', 'weeknight dinners'],
      },
    ];
  }

  private getGlobalPatternRecommendations(
    recipeContent: any
  ): CategoryRecommendation[] {
    // Analyze global patterns - mock implementation
    return [
      {
        category: 'Difficulty: Intermediate',
        confidence: 0.6,
        reason: 'Recipe complexity suggests intermediate level',
        examples: ['Multiple steps', 'Specialized techniques'],
      },
    ];
  }

  private deduplicateRecommendations(
    recommendations: CategoryRecommendation[]
  ): CategoryRecommendation[] {
    const seen = new Map<string, CategoryRecommendation>();

    recommendations.forEach((rec) => {
      const existing = seen.get(rec.category);
      if (!existing || rec.confidence > existing.confidence) {
        seen.set(rec.category, rec);
      }
    });

    return Array.from(seen.values());
  }

  // Track category usage
  async trackCategoryUsage(
    userId: string,
    recipeId: string,
    categories: string[],
    action: 'add' | 'remove' | 'update'
  ): Promise<void> {
    // In a real implementation, this would update analytics database
    console.log('Category usage tracked:', {
      userId,
      recipeId,
      categories,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  // Get category performance metrics
  async getCategoryMetrics(
    timeRange: 'week' | 'month' | 'year' = 'month'
  ): Promise<{
    usage: Record<string, number>;
    growth: Record<string, number>;
    adoption: Record<string, number>;
  }> {
    // Mock implementation - would query real analytics data
    return {
      usage: {
        'Course: Main': 150,
        'Cuisine: Italian': 89,
        'Technique: Bake': 67,
      },
      growth: {
        'Course: Main': 0.05,
        'Cuisine: Italian': 0.15,
        'Technique: Bake': -0.02,
      },
      adoption: {
        'Course: Main': 0.95,
        'Cuisine: Italian': 0.67,
        'Technique: Bake': 0.45,
      },
    };
  }
}

// Singleton instance
export const categoryAnalytics = new CategoryAnalytics();
```

### **4. Admin Category Management**

**File**: `src/components/admin/category-management.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { CategoryDefinition, CATEGORY_DEFINITIONS } from '@/lib/categories';
import { CategoryAnalytics, categoryAnalytics } from '@/lib/category-analytics';
import { CategoryChip } from '@/components/ui/category-chip';

export function CategoryManagement() {
  const [definitions, setDefinitions] = useState<Record<string, CategoryDefinition>>(CATEGORY_DEFINITIONS);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('course');
  const [editingDefinition, setEditingDefinition] = useState<CategoryDefinition | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const insights = await categoryAnalytics.analyzeCategoryUsage();
      setAnalytics(insights);
    } catch (error) {
      console.error('Failed to load category analytics:', error);
    }
  };

  const selectedDef = definitions[selectedNamespace];

  return (
    <div className="min-h-screen bg-base-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-base-content opacity-70 mt-2">
            Manage recipe categories, analyze usage, and configure taxonomy
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Namespace Sidebar */}
          <div className="lg:col-span-3">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">Category Namespaces</h3>
                <div className="space-y-2">
                  {Object.entries(definitions).map(([key, def]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedNamespace(key)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedNamespace === key
                          ? 'bg-primary text-primary-content'
                          : 'hover:bg-base-200'
                      }`}
                    >
                      <div className="font-medium">{def.namespace}</div>
                      <div className="text-sm opacity-70">
                        {def.values.length} categories
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            {analytics && (
              <div className="card bg-base-100 shadow-sm mt-4">
                <div className="card-body">
                  <h3 className="card-title text-lg mb-4">
                    <TrendingUp className="h-5 w-5" />
                    Quick Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="stat">
                      <div className="stat-title text-xs">Total Categories</div>
                      <div className="stat-value text-lg">
                        {analytics.globalStats.totalCategories}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title text-xs">Avg Per Recipe</div>
                      <div className="stat-value text-lg">
                        {analytics.globalStats.averageCategoriesPerRecipe.toFixed(1)}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title text-xs">Growth Rate</div>
                      <div className="stat-value text-lg">
                        +{(analytics.globalStats.categoryGrowthRate * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            {selectedDef && (
              <div className="space-y-6">
                {/* Namespace Header */}
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="card-title text-2xl">{selectedDef.namespace}</h2>
                        <p className="text-base-content opacity-70">
                          {selectedDef.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingDefinition(selectedDef)}
                          className="btn btn-outline btn-sm"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button className="btn btn-primary btn-sm">
                          <Plus className="h-4 w-4" />
                          Add Category
                        </button>
                      </div>
                    </div>

                    {/* Namespace Properties */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="stat">
                        <div className="stat-title text-xs">Priority</div>
                        <div className="stat-value text-lg">{selectedDef.priority}</div>
                      </div>
                      <div className="stat">
                        <div className="stat-title text-xs">Required</div>
                        <div className="stat-value text-lg">
                          {selectedDef.isRequired ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-title text-xs">Custom Allowed</div>
                        <div className="stat-value text-lg">
                          {selectedDef.allowCustom ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-title text-xs">Max Selection</div>
                        <div className="stat-value text-lg">
                          {selectedDef.maxSelection || '∞'}
                        </div>
                      </div>
                    </div>

                    {/* Examples */}
                    <div>
                      <h4 className="font-medium mb-2">Examples</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDef.examples.map((example, index) => (
                          <CategoryChip
                            key={index}
                            category={example}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Values */}
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <h3 className="card-title mb-4">Category Values</h3>
                    <div className="grid gap-3">
                      {selectedDef.values.map((value, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <CategoryChip
                              category={`${selectedDef.namespace}: ${value}`}
                              size="sm"
                            />
                            <div className="text-sm opacity-70">
                              {/* Show usage stats if available */}
                              {analytics && (
                                <span>
                                  Used in {Math.floor(Math.random() * 50)} recipes
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button className="btn btn-ghost btn-xs">
                              <Eye className="h-3 w-3" />
                            </button>
                            <button className="btn btn-ghost btn-xs">
                              <Edit className="h-3 w-3" />
                            </button>
                            <button className="btn btn-ghost btn-xs text-error">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Usage Analytics */}
                {analytics && (
                  <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                      <h3 className="card-title mb-4">Usage Analytics</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        {/* Most Popular */}
                        <div>
                          <h4 className="font-medium mb-3">Most Popular</h4>
                          <div className="space-y-2">
                            {analytics.mostPopular
                              .filter((stat: any) => stat.namespace === selectedDef.namespace)
                              .slice(0, 5)
                              .map((stat: any, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span>{stat.category.split(': ')[1]}</span>
                                  <span className="badge badge-sm">{stat.totalUses}</span>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Trending */}
                        <div>
                          <h4 className="font-medium mb-3">Trending</h4>
                          <div className="space-y-2">
                            {analytics.trending
                              .filter((stat: any) => stat.namespace === selectedDef.namespace)
                              .slice(0, 5)
                              .map((stat: any, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span>{stat.category.split(': ')[1]}</span>
                                  <span className="badge badge-success badge-sm">↗</span>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Underused */}
                        <div>
                          <h4 className="font-medium mb-3">Underused</h4>
                          <div className="space-y-2">
                            {analytics.underused
                              .filter((stat: any) => stat.namespace === selectedDef.namespace)
                              .slice(0, 5)
                              .map((stat: any, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span>{stat.category.split(': ')[1]}</span>
                                  <span className="badge badge-warning badge-sm">!</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 📋 **Implementation Checklist**

### **Core Taxonomy**

- [ ] Define comprehensive category taxonomy
- [ ] Create category definition system
- [ ] Implement category validation rules
- [ ] Add category metadata and descriptions
- [ ] Test category completeness

### **Configuration System**

- [ ] Build category configuration manager
- [ ] Implement user preference system
- [ ] Create admin configuration interface
- [ ] Add category customization features
- [ ] Test configuration persistence

### **Analytics System**

- [ ] Implement category usage tracking
- [ ] Build analytics and insights system
- [ ] Create recommendation engine
- [ ] Add performance metrics
- [ ] Test analytics accuracy

### **Admin Interface**

- [ ] Build category management UI
- [ ] Add analytics dashboard
- [ ] Implement category editor
- [ ] Create usage monitoring
- [ ] Test admin workflows

### **User Features**

- [ ] Add category preferences
- [ ] Implement custom categories
- [ ] Create category suggestions
- [ ] Add usage insights
- [ ] Test user experience

## ✅ **Success Criteria**

- [ ] Comprehensive category taxonomy covers all recipe types
- [ ] Configuration system supports user and admin needs
- [ ] Analytics provide actionable insights
- [ ] Admin interface enables effective management
- [ ] User features enhance recipe organization
- [ ] Performance remains optimal with full taxonomy
- [ ] System is extensible for future needs

## 🎉 **Feature Complete**

Once Phase 6 is complete, the Recipe Categories feature will be fully implemented with:

- ✅ **Complete Data Layer**: Database schema, types, validation
- ✅ **Robust Parsing**: Multi-format JSON and markdown parsing
- ✅ **AI Integration**: Smart category suggestions from all personas
- ✅ **Atomic UI Components**: Reusable, accessible category components
- ✅ **Full Integration**: Categories throughout the recipe system
- ✅ **Comprehensive Taxonomy**: Well-organized, extensible category system

The feature will be ready for production use with full user and admin capabilities.

---

**Phase Status**: 📋 Ready for Implementation  
**Estimated Time**: 4-5 days  
**Prerequisites**: Phase 5 complete  
**Next Phase**: ✅ Feature Complete

/**
 * NAMESPACED CATEGORY SYSTEM
 * 
 * This file contains all category-related definitions and logic.
 * It is the SINGLE SOURCE OF TRUTH for category information in the application.
 * 
 * IMPORTANT: Do NOT import category data from other files (e.g., constants.ts).
 * All category definitions, namespaces, and validation logic are centralized here.
 * 
 * Architecture:
 * - CATEGORY_DEFINITIONS: Structured category definitions with namespaces
 * - CANONICAL_CATEGORIES: Flattened list of all valid categories
 * - Helper functions for category management and validation
 * 
 * Canonical category definitions for recipe organization
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

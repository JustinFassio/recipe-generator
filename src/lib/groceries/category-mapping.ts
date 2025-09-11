import { GROCERY_CATEGORIES } from '@/lib/groceries/categories';

/**
 * Chef Isabella's "Kitchen Reality" category keys
 * These are the canonical categories used in the database
 */
export const CHEF_ISABELLA_CATEGORIES = [
  'proteins',
  'fresh_produce',
  'flavor_builders',
  'cooking_essentials',
  'bakery_grains',
  'dairy_cold',
  'pantry_staples',
  'frozen',
] as const;

export type ChefIsabellaCategory = (typeof CHEF_ISABELLA_CATEGORIES)[number];

/**
 * Validates if a category is a valid Chef Isabella category
 */
export function isValidCategory(
  category: string
): category is ChefIsabellaCategory {
  return CHEF_ISABELLA_CATEGORIES.includes(category as ChefIsabellaCategory);
}

/**
 * Gets the UI metadata for a category
 * Falls back to a default if category is not found
 */
export function getCategoryMetadata(category: string) {
  const categoryMeta =
    GROCERY_CATEGORIES[category as keyof typeof GROCERY_CATEGORIES];

  if (categoryMeta) {
    return categoryMeta;
  }

  // Fallback for unknown categories
  return {
    name:
      category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
    subtitle: 'Unknown Category',
    icon: '📦',
    items: [],
  };
}

/**
 * Normalizes a category name to ensure consistency
 * Converts legacy category names to Chef Isabella's system
 */
export function normalizeCategory(category: string): ChefIsabellaCategory {
  const normalized = category.toLowerCase().trim();

  // Legacy category mappings (if any exist)
  const legacyMappings: Record<string, ChefIsabellaCategory> = {
    vegetables: 'fresh_produce',
    fruits: 'fresh_produce',
    spices: 'flavor_builders',
    dairy: 'dairy_cold',
    pantry: 'pantry_staples',
    other: 'pantry_staples',
    meat: 'proteins',
    seafood: 'proteins',
    grains: 'bakery_grains',
    bread: 'bakery_grains',
  };

  // Check if it's a legacy category that needs mapping
  if (legacyMappings[normalized]) {
    return legacyMappings[normalized];
  }

  // Check if it's already a valid Chef Isabella category
  if (isValidCategory(normalized)) {
    return normalized;
  }

  // Default fallback
  console.warn(`Unknown category "${category}", defaulting to pantry_staples`);
  return 'pantry_staples';
}

/**
 * Gets all available categories from global ingredients data
 * Ensures they are all valid Chef Isabella categories
 */
export function getAvailableCategories(
  globalIngredients: Array<{ category: string }>
): ChefIsabellaCategory[] {
  const categories = [
    ...new Set(globalIngredients.map((g) => normalizeCategory(g.category))),
  ];
  return categories.sort();
}

/**
 * Validates and normalizes category data consistency
 * Used for debugging and data validation
 */
export function validateCategoryConsistency(
  globalIngredients: Array<{ id: string; name: string; category: string }>,
  userGroceryCart: Record<string, string[]>
) {
  const issues: string[] = [];

  // Check global ingredients categories
  const invalidGlobalCategories = globalIngredients
    .filter((ing) => !isValidCategory(ing.category))
    .map((ing) => ({ id: ing.id, name: ing.name, category: ing.category }));

  if (invalidGlobalCategories.length > 0) {
    issues.push(
      `Invalid categories in global ingredients: ${invalidGlobalCategories.map((i) => `${i.name} (${i.category})`).join(', ')}`
    );
  }

  // Check user grocery cart categories
  const invalidCartCategories = Object.keys(userGroceryCart).filter(
    (category) => !isValidCategory(category)
  );

  if (invalidCartCategories.length > 0) {
    issues.push(
      `Invalid categories in user grocery cart: ${invalidCartCategories.join(', ')}`
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    invalidGlobalCategories,
    invalidCartCategories,
  };
}

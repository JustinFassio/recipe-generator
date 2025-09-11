/**
 * Multi-Category Ingredient Management
 *
 * Handles ingredients that appear in multiple categories (like "Chicken Stock"
 * in both cooking_essentials and pantry_staples) and keeps their state synchronized.
 */

// Ingredients that appear in multiple categories based on Chef Isabella's catalog
export const MULTI_CATEGORY_INGREDIENTS: Record<string, string[]> = {
  // Stocks and broths - appear in both cooking essentials and pantry staples
  'Chicken Stock': ['cooking_essentials', 'pantry_staples'],
  'Chicken Broth': ['cooking_essentials', 'pantry_staples'],
  'Vegetable Stock': ['cooking_essentials', 'pantry_staples'],
  'Vegetable Broth': ['cooking_essentials', 'pantry_staples'],
  'Beef Stock': ['cooking_essentials', 'pantry_staples'],
  'Beef Broth': ['cooking_essentials', 'pantry_staples'],
  'Bone Broth': ['cooking_essentials', 'pantry_staples'],

  // Cooking oils - could appear in cooking essentials and pantry
  'Coconut Oil': ['cooking_essentials', 'pantry_staples'],
  'Sesame Oil': ['cooking_essentials', 'pantry_staples'],

  // Common seasonings that cross categories
  'Vanilla Extract': ['cooking_essentials', 'pantry_staples'],
  'Almond Extract': ['cooking_essentials', 'pantry_staples'],

  // Versatile ingredients
  'Coconut Milk': ['dairy_cold', 'pantry_staples'],

  // Add more as needed based on Chef Isabella's catalog
};

/**
 * Get all categories where an ingredient appears
 */
export function getIngredientCategories(ingredientName: string): string[] {
  return MULTI_CATEGORY_INGREDIENTS[ingredientName] || [];
}

/**
 * Check if an ingredient appears in multiple categories
 */
export function isMultiCategoryIngredient(ingredientName: string): boolean {
  return (MULTI_CATEGORY_INGREDIENTS[ingredientName]?.length || 0) > 1;
}

/**
 * Check if an ingredient is in the user's cart (checking all possible categories)
 */
export function isIngredientInCart(
  ingredientName: string,
  userGroceryCart: Record<string, string[]>
): boolean {
  const categories = getIngredientCategories(ingredientName);

  // If it's not a multi-category ingredient, check all categories
  if (categories.length === 0) {
    return Object.values(userGroceryCart).some((items) =>
      items?.includes(ingredientName)
    );
  }

  // For multi-category ingredients, check if it exists in any of its categories
  return categories.some((category) =>
    userGroceryCart[category]?.includes(ingredientName)
  );
}

/**
 * Add ingredient to cart (adds to primary category, ensures it's not duplicated in others)
 */
export function addIngredientToCart(
  ingredientName: string,
  primaryCategory: string,
  userGroceryCart: Record<string, string[]>
): Record<string, string[]> {
  const updatedCart = { ...userGroceryCart };
  const categories = getIngredientCategories(ingredientName);

  // If it's not a multi-category ingredient, add to specified category
  if (categories.length === 0) {
    if (!updatedCart[primaryCategory]) {
      updatedCart[primaryCategory] = [];
    }
    if (!updatedCart[primaryCategory].includes(ingredientName)) {
      updatedCart[primaryCategory].push(ingredientName);
    }
    return updatedCart;
  }

  // For multi-category ingredients, add to primary category and remove from others
  categories.forEach((category) => {
    if (!updatedCart[category]) {
      updatedCart[category] = [];
    }

    if (category === primaryCategory) {
      // Add to primary category
      if (!updatedCart[category].includes(ingredientName)) {
        updatedCart[category].push(ingredientName);
      }
    } else {
      // Remove from other categories to avoid duplication
      updatedCart[category] = updatedCart[category].filter(
        (item) => item !== ingredientName
      );
    }
  });

  return updatedCart;
}

/**
 * Remove ingredient from cart (removes from all categories)
 */
export function removeIngredientFromCart(
  ingredientName: string,
  userGroceryCart: Record<string, string[]>
): Record<string, string[]> {
  const updatedCart = { ...userGroceryCart };

  // Remove from all categories
  Object.keys(updatedCart).forEach((category) => {
    updatedCart[category] =
      updatedCart[category]?.filter((item) => item !== ingredientName) || [];
  });

  return updatedCart;
}

/**
 * Get the primary category for a multi-category ingredient based on where it currently exists in the cart
 */
export function getPrimaryCategory(
  ingredientName: string,
  userGroceryCart: Record<string, string[]>
): string | null {
  const categories = getIngredientCategories(ingredientName);

  // Find which category currently contains this ingredient
  for (const category of categories) {
    if (userGroceryCart[category]?.includes(ingredientName)) {
      return category;
    }
  }

  return null;
}

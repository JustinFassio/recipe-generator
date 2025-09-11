/**
 * Multi-Category Ingredient Management
 *
 * Handles ingredients that appear in multiple UI categories based on user mental models.
 * This is NOT about duplicate ingredients - each ingredient is unique, but users may
 * logically categorize the same ingredient in different ways.
 *
 * Examples:
 * - "Vanilla Extract": Users think of it as both a cooking tool AND a pantry item
 * - "Garlic": Fresh vs dried forms create different mental categorization
 * - "Chicken Stock": Fresh (cooking essential) vs shelf-stable (pantry staple)
 *
 * This system maps one database ingredient to multiple UI categories to match
 * how different users naturally think about ingredient organization.
 */

/**
 * Multi-Category Ingredient Mapping
 *
 * Maps ingredients to multiple UI categories based on user mental models.
 * Each entry represents how users naturally categorize ingredients differently.
 *
 * IMPORTANT: This is the single source of truth for multi-category behavior.
 * Do NOT auto-derive this - it represents intentional UX design decisions.
 */
export const MULTI_CATEGORY_INGREDIENTS: Record<string, string[]> = {
  // === COOKING FOUNDATIONS (Fresh vs Shelf-Stable Mental Model) ===
  // Users think: "Fresh from deli" vs "Shelf-stable backup"
  'Chicken Stock': ['cooking_essentials', 'pantry_staples'],
  'Chicken Broth': ['cooking_essentials', 'pantry_staples'],
  'Vegetable Stock': ['cooking_essentials', 'pantry_staples'],
  'Vegetable Broth': ['cooking_essentials', 'pantry_staples'],
  'Beef Stock': ['cooking_essentials', 'pantry_staples'],
  'Beef Broth': ['cooking_essentials', 'pantry_staples'],
  'Bone Broth': ['cooking_essentials', 'pantry_staples'],

  // === SPECIALTY OILS (Cooking Tool vs Pantry Item Mental Model) ===
  // Users think: "Daily cooking" vs "Special occasion ingredient"
  'Coconut Oil': ['cooking_essentials', 'pantry_staples'],
  'Sesame Oil': ['cooking_essentials', 'pantry_staples'],

  // === EXTRACTS (Baking Tool vs Pantry Ingredient Mental Model) ===
  // Users think: "Baking essential" vs "Pantry flavoring"
  'Vanilla Extract': ['cooking_essentials', 'pantry_staples'],
  'Almond Extract': ['cooking_essentials', 'pantry_staples'],

  // === VERSATILE LIQUIDS (Fresh vs Shelf-Stable Mental Model) ===
  // Users think: "Refrigerated section" vs "Canned goods"
  'Coconut Milk': ['dairy_cold', 'pantry_staples'],

  // === Add new mappings here with clear mental model reasoning ===
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

/**
 * Validation: Check if all multi-category ingredients exist in the system catalog
 * Returns array of missing ingredients for debugging/development
 */
export async function validateMultiCategoryIngredients(): Promise<string[]> {
  // Dynamic import to avoid circular dependencies
  const { CHEF_ISABELLA_SYSTEM_CATALOG } = await import('./system-catalog');
  const allSystemIngredients = new Set<string>();

  // Collect all ingredients from system catalog
  Object.values(CHEF_ISABELLA_SYSTEM_CATALOG).forEach(
    (ingredients: string[]) => {
      ingredients.forEach((ingredient) => allSystemIngredients.add(ingredient));
    }
  );

  // Find multi-category ingredients that don't exist in system catalog
  const missingIngredients: string[] = [];
  Object.keys(MULTI_CATEGORY_INGREDIENTS).forEach((ingredient) => {
    if (!allSystemIngredients.has(ingredient)) {
      missingIngredients.push(ingredient);
    }
  });

  return missingIngredients;
}

/**
 * Validation: Check if multi-category mappings reference valid categories
 * Returns array of invalid categories for debugging/development
 */
export async function validateMultiCategoryMappings(): Promise<string[]> {
  // Dynamic import to avoid circular dependencies
  const { CHEF_ISABELLA_SYSTEM_CATALOG } = await import('./system-catalog');
  const validCategories = new Set(Object.keys(CHEF_ISABELLA_SYSTEM_CATALOG));
  const invalidCategories: string[] = [];

  Object.entries(MULTI_CATEGORY_INGREDIENTS).forEach(
    ([ingredient, categories]) => {
      categories.forEach((category) => {
        if (!validCategories.has(category)) {
          invalidCategories.push(`${ingredient} -> ${category}`);
        }
      });
    }
  );

  return invalidCategories;
}

/**
 * Development helper: Run all validations and log results
 * Should be called during development to ensure consistency
 */
export async function runMultiCategoryValidations(): Promise<boolean> {
  const missingIngredients = await validateMultiCategoryIngredients();
  const invalidMappings = await validateMultiCategoryMappings();

  if (missingIngredients.length > 0) {
    console.warn(
      '⚠️ Multi-category ingredients not found in system catalog:',
      missingIngredients
    );
  }

  if (invalidMappings.length > 0) {
    console.warn(
      '⚠️ Multi-category mappings reference invalid categories:',
      invalidMappings
    );
  }

  const isValid =
    missingIngredients.length === 0 && invalidMappings.length === 0;
  if (isValid) {
    console.log('✅ Multi-category ingredient validations passed');
  }

  return isValid;
}

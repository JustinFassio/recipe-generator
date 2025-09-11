# Grocery Workflow System Documentation

**Project:** Recipe Generator  
**Feature:** Complete Grocery Management Workflow  
**Author:** AI Assistant  
**Date:** September 2025  
**Status:** System Analysis & Documentation

---

## 🎯 **System Overview**

The Recipe Generator uses a three-tier grocery management system that mirrors real-world shopping and cooking behavior:

1. **🏪 Global Ingredients** - The "Grocery Store" (Source of Truth)
2. **🛒 Grocery Cart** - The "Virtual Shopping Cart" (User's Grocery List)
3. **🍽️ Groceries Page** - The "Kitchen Inventory" (Availability Management)

---

## 🏗️ **Data Architecture**

### **Database Tables**

```sql
-- Global ingredients catalog (Chef Isabella's system)
CREATE TABLE global_ingredients (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  normalized_name text NOT NULL UNIQUE,
  category text NOT NULL, -- Chef Isabella's 8 categories
  synonyms text[] DEFAULT '{}',
  is_system boolean DEFAULT true,
  usage_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- User's grocery cart/list
CREATE TABLE user_groceries (
  user_id uuid PRIMARY KEY REFERENCES profiles(id),
  groceries jsonb NOT NULL DEFAULT '{}', -- Record<category, string[]>
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### **Data Flow Structure**

```typescript
// Global Ingredients (System Catalog)
interface GlobalIngredient {
  id: string;
  name: string;
  normalized_name: string;
  category: string; // Chef Isabella's categories
  synonyms: string[];
  is_system: boolean;
  usage_count: number;
}

// User Grocery Cart (Shopping List)
interface UserGroceries {
  user_id: string;
  groceries: Record<string, string[]>; // category -> ingredient names
  created_at: string;
  updated_at: string;
}

// Available Groceries (Kitchen Inventory - State Only)
interface AvailableGroceries {
  groceries: Record<string, string[]>; // Only ingredients marked as "available"
}
```

---

## 🔄 **Complete Workflow**

### **Phase 1: Global Ingredients Page (The Grocery Store)**

**File:** `src/pages/global-ingredients-page.tsx`

**Purpose:** Browse and manage the master catalog of ingredients

**Key Features:**

- **System Catalog Display**: Shows Chef Isabella's 448+ ingredients organized by 8 "Kitchen Reality" categories
- **Add to Cart**: Users can add ingredients from global catalog to their grocery cart
- **Remove from Cart**: Users can remove ingredients from their grocery cart
- **Hide/Restore System Items**: Users can hide system ingredients they don't want to see
- **Search & Filter**: Find ingredients by name or category

**Data Sources:**

```typescript
// Primary data source
const { globalIngredients } = useGlobalIngredients(); // From global_ingredients table

// User's grocery cart state
const [userGroceryCart, setUserGroceryCart] = useState<
  Record<string, string[]>
>({});
// Loaded from user_groceries.groceries
```

**Key Operations:**

```typescript
// Add ingredient to grocery cart
const handleAddToGroceries = async (category: string, name: string) => {
  // Direct database update to user_groceries table
  const updatedGroceries = {
    ...(currentData?.groceries || {}),
    [category]: [...(currentData?.groceries[category] || []), name],
  };

  await supabase.from('user_groceries').upsert({
    user_id: user?.id,
    groceries: updatedGroceries,
  });
};

// Remove ingredient from grocery cart
const handleRemoveFromGroceries = async (name: string) => {
  // Remove from all categories in user's cart
  // Update user_groceries table
};
```

### **Phase 2: Groceries Page (The Kitchen Inventory)**

**File:** `src/pages/groceries-page.tsx`

**Purpose:** Manage availability of ingredients in the user's grocery cart

**Key Features:**

- **Availability Toggle**: Mark ingredients as "available" (have it) or "unavailable" (need to buy)
- **Category Tabs**: Organized by Chef Isabella's categories, plus "All Categories" view
- **All Categories View**: Shows all ingredients from user's cart across all categories
- **Available Summary**: Shows count of available ingredients
- **Save State**: Persists availability selections

**Data Sources:**

```typescript
// User's grocery cart (source of ingredients to manage)
const [userGroceryCart] = useState<Record<string, string[]>>({});
// Loaded from user_groceries.groceries

// Availability state (which cart items are marked as available)
const groceries = useGroceries(); // groceries.groceries contains available items only
```

**Key Operations:**

```typescript
// Toggle ingredient availability
const toggleIngredient = (category: string, ingredient: string) => {
  // Updates useGroceries state (groceries.groceries)
  // This represents "available" ingredients only
  // Saved to user_groceries table on Save action
};

// Display logic
const userCategoryItems = userGroceryCart[activeCategory] || []; // All cart items
const isSelected = groceries.hasIngredient(activeCategory, ingredient); // Available?
```

### **Phase 3: Recipe-to-Global Ingredient Addition**

**Files:**

- `src/components/recipes/recipe-view.tsx`
- `src/components/groceries/save-to-global-button.tsx`
- `src/lib/groceries/ingredient-parser.ts`
- `src/lib/groceries/enhanced-ingredient-matcher.ts`

**Purpose:** Allow users to add recipe ingredients to the global catalog when ingredients are not found

**Key Features:**

- **Ingredient Parsing**: Raw recipe ingredients are parsed to extract clean names
- **Missing Ingredient Detection**: Enhanced matcher identifies ingredients not in global catalog
- **Save to Global**: Users can categorize and save missing ingredients
- **Auto-categorization**: Smart category suggestions based on recipe context
- **Learning Log**: Tracks ingredient additions for system improvement

**Workflow Process:**

```typescript
// 1. Recipe ingredient parsing
const parsedIngredient = parseIngredientText('2 cups diced yellow onions');
// Result: { name: "yellow onions", quantity: "2", unit: "cups", size: null, original: "..." }

// 2. Enhanced matching with global ingredients
const enhancedMatcher = new EnhancedIngredientMatcher(groceries);
const match = enhancedMatcher.matchIngredient(ingredient);

// 3. If no match found (matchType === 'none'), show SaveToGlobalButton
if (match.matchType === 'none') {
  // User can save ingredient to global catalog with category selection
}
```

**Save Process:**

```typescript
// SaveToGlobalButton workflow
const handleSave = async () => {
  // 1. Save to global_ingredients table
  const success = await saveIngredientToGlobal(
    editableIngredient.trim(),
    selectedCategory,
    recipeContext
  );

  // 2. Automatically add to user's grocery cart
  if (success) {
    groceries.toggleIngredient(selectedCategory, editableIngredient.trim());
    await groceries.saveGroceries();
  }
};
```

**Data Sources:**

```typescript
// Recipe context for learning
interface RecipeContext {
  recipeId: string;
  recipeCategories: string[];
}

// Parsed ingredient data
interface ParsedIngredient {
  name: string; // Clean ingredient name
  quantity: string | null;
  unit: string | null;
  size: string | null;
  original: string; // Original recipe text
}
```

### **Phase 4: Recipe Filtering & Matching**

**Files:**

- `src/hooks/useIngredientMatching.ts`
- `src/components/recipes/filters/IngredientFilterSection.tsx`
- `src/lib/groceries/ingredient-matcher.ts`

**Purpose:** Use available ingredients for recipe compatibility and filtering

**Data Source:**

```typescript
const { groceries } = useGroceries(); // Only available ingredients
// groceries.groceries: Record<string, string[]> - ingredients marked as available

// Used by ingredient matcher
const matcher = new IngredientMatcher(groceries.groceries);
```

**Filter Integration:**

```typescript
// IngredientFilterSection uses available ingredients for filtering
const availableIngredients = Object.values(groceries.groceries).flat();
// Only shows ingredients that user marked as "available"
```

---

## 🎯 **Workflow States**

### **State 1: Ingredient in Global Catalog Only**

```
Global Ingredients: ✅ "Chicken Breast" (system ingredient)
Recipe View: 🔵 "Chicken Breast" (shows global ingredient badge)
Grocery Cart: ❌ (not added)
Kitchen Inventory: ❌ (not available)
Recipe Filters: ❌ (not available for matching)
```

### **State 2: Ingredient Added to Cart**

```
Global Ingredients: ✅ "Chicken Breast" (shows "Added" badge)
Recipe View: 🔵 "Chicken Breast" (shows global ingredient badge)
Grocery Cart: ✅ "Chicken Breast" (in user_groceries.groceries)
Kitchen Inventory: ⚪ "Chicken Breast" (shows as button, not selected)
Recipe Filters: ❌ (not available for matching)
```

### **State 3: Ingredient Marked as Available**

```
Global Ingredients: ✅ "Chicken Breast" (shows "Added" badge)
Recipe View: ✅ "Chicken Breast" (shows exact match badge)
Grocery Cart: ✅ "Chicken Breast" (in user_groceries.groceries)
Kitchen Inventory: ✅ "Chicken Breast" (selected/active button)
Recipe Filters: ✅ (available for ingredient matching)
```

### **State 4: Ingredient Removed from Cart**

```
Global Ingredients: ✅ "Chicken Breast" (shows "Add" button)
Recipe View: 🔵 "Chicken Breast" (shows global ingredient badge)
Grocery Cart: ❌ (removed from user_groceries.groceries)
Kitchen Inventory: ❌ (no longer shows)
Recipe Filters: ❌ (not available for matching)
```

### **State 5: Recipe Ingredient Not in Global Catalog**

```
Global Ingredients: ❌ "Exotic Mushrooms" (not in catalog)
Recipe View: 🛒 "Exotic Mushrooms" (shows "Save as Global" button)
Grocery Cart: ❌ (not added)
Kitchen Inventory: ❌ (not available)
Recipe Filters: ❌ (not available for matching)
```

### **State 6: User Adds Recipe Ingredient to Global Catalog**

```
Global Ingredients: ✅ "Exotic Mushrooms" (newly added, user-contributed)
Recipe View: 🔵 "Exotic Mushrooms" (now shows global ingredient badge)
Grocery Cart: ✅ "Exotic Mushrooms" (auto-added to cart)
Kitchen Inventory: ⚪ "Exotic Mushrooms" (shows as button, not selected)
Recipe Filters: ❌ (not available until marked as available)
Learning Log: 📝 Logged addition with recipe context for system learning
```

---

## 🔧 **Technical Implementation Details**

### **Data Synchronization**

**Global → Cart:**

```typescript
// In global-ingredients-page.tsx
const handleAddToGroceries = async (category: string, name: string) => {
  // Direct database write to user_groceries table
  await supabase.from('user_groceries').upsert({
    user_id: user?.id,
    groceries: updatedGroceries,
  });

  // Reload cart state
  await loadUserGroceryCart();
};
```

**Cart → Kitchen:**

```typescript
// In groceries-page.tsx
// Cart items are displayed as toggleable buttons
const userCategoryItems = userGroceryCart[activeCategory] || [];

// Availability is managed by useGroceries hook
const isSelected = groceries.hasIngredient(activeCategory, ingredient);
```

**Kitchen → Filters:**

```typescript
// In useIngredientMatching.ts
const { groceries } = useGroceries(); // Only available ingredients
const matcher = new IngredientMatcher(groceries.groceries);

// In IngredientFilterSection.tsx
const availableIngredients = Object.values(groceries.groceries).flat();
```

**Recipe → Global:**

```typescript
// In recipe-view.tsx
const enhancedMatcher = new EnhancedIngredientMatcher(groceries);
const match = enhancedMatcher.matchIngredient(ingredient);

// If ingredient not found in global catalog
if (match.matchType === 'none') {
  // Show SaveToGlobalButton
  <SaveToGlobalButton
    ingredient={parseIngredientText(ingredient).name}
    recipeContext={{
      recipeId: recipe.id,
      recipeCategories: recipe.categories || [],
    }}
    onSaved={refreshGlobalIngredients}
  />
}
```

**Global → Learning:**

```typescript
// In enhanced-ingredient-matcher.ts
const saveResult = await supabase.from('global_ingredients').insert({
  name: ingredientText,
  normalized_name: normalizedName,
  category,
  created_by: user?.id,
});

// Log for system learning
await supabase.from('ingredient_learning_log').insert({
  recipe_id: recipeContext.recipeId,
  ingredient_text: ingredientText,
  extracted_name: ingredientText,
  suggested_category: category,
  confidence_score: 0.8,
  was_saved: true,
});
```

### **Key Hooks & Their Roles**

```typescript
// useGlobalIngredients() - Manages global catalog
interface UseGlobalIngredientsReturn {
  globalIngredients: GlobalIngredient[]; // Chef Isabella's catalog + user additions
  hideIngredient: (name: string) => Promise<boolean>;
  unhideIngredient: (name: string) => Promise<boolean>;
  saveIngredientToGlobal: (
    ingredient: string,
    category: string,
    recipeContext?: RecipeContext
  ) => Promise<boolean>;
  extractIngredientsFromRecipe: (
    recipe: Recipe
  ) => Promise<ExtractedIngredients>;
}

// useGroceries() - Manages availability state
interface UseGroceriesReturn {
  groceries: Record<string, string[]>; // ONLY available ingredients
  toggleIngredient: (category: string, ingredient: string) => void;
  hasIngredient: (category: string, ingredient: string) => boolean;
  saveGroceries: () => Promise<boolean>; // Persist availability state
}

// useIngredientMatching() - Uses available ingredients for matching
interface UseIngredientMatchingReturn {
  matchIngredient: (ingredient: string) => IngredientMatch;
  calculateCompatibility: (recipe: Recipe) => RecipeCompatibility;
}

// Enhanced ingredient matcher - Includes global ingredients
interface EnhancedIngredientMatcher {
  matchIngredient: (ingredient: string) => IngredientMatch; // Includes global matching
  saveIngredientToGlobal: (
    ingredient: string,
    category: string,
    context?: RecipeContext
  ) => Promise<SaveResult>;
  calculateRecipeCompatibility: (recipe: Recipe) => RecipeCompatibility;
}
```

### **Database Operations**

```typescript
// user_groceries table structure
{
  user_id: "uuid",
  groceries: {
    "proteins": ["chicken breast", "eggs", "tofu"],
    "fresh_produce": ["onions", "garlic", "tomatoes"],
    "flavor_builders": ["salt", "black pepper", "cumin"]
  },
  created_at: "timestamp",
  updated_at: "timestamp"
}

// useGroceries.groceries state (subset of cart items marked as available)
{
  "proteins": ["chicken breast", "eggs"], // Only available items
  "fresh_produce": ["onions", "garlic"], // tofu and tomatoes not marked available
  "flavor_builders": ["salt"] // Only salt marked as available
}

// global_ingredients table structure
{
  id: "uuid",
  name: "Exotic Mushrooms",
  normalized_name: "exotic mushrooms",
  category: "fresh_produce", // Chef Isabella's categories
  synonyms: ["shiitake", "oyster mushrooms"],
  is_system: false, // User-contributed ingredient
  usage_count: 1,
  created_by: "user_uuid",
  created_at: "timestamp"
}

// ingredient_learning_log table structure
{
  id: "uuid",
  recipe_id: "recipe_uuid",
  ingredient_text: "2 cups exotic mushrooms, sliced",
  extracted_name: "Exotic Mushrooms",
  suggested_category: "fresh_produce",
  confidence_score: 0.8,
  was_saved: true,
  created_at: "timestamp"
}
```

---

## 🎨 **UI/UX Flow**

### **Global Ingredients Page**

1. **Browse Catalog**: User sees Chef Isabella's organized ingredient catalog
2. **Add to Cart**: Click "Add" button → ingredient goes to grocery cart
3. **Visual Feedback**: Button changes to "Added" with green badge
4. **Remove Option**: Click "Remove" button to remove from cart

### **Groceries Page**

1. **View Cart Items**: Only shows ingredients previously added to cart
2. **Toggle Availability**: Click ingredient buttons to mark available/unavailable
3. **Visual States**:
   - Active (available): Primary button style
   - Inactive (unavailable): Outline button style
4. **Save Changes**: Persist availability selections to database

### **Recipe Views**

1. **Ingredient Analysis**: Enhanced matcher checks each ingredient against global catalog
2. **Visual Indicators**:
   - ✅ Green check: Available in user's kitchen
   - 🔵 Blue globe: Available in global catalog (but not in user's cart/kitchen)
   - 🛒 Gray cart: Missing from both (shows "Save as Global" button)
3. **Save to Global**: Users can add missing ingredients to global catalog with category selection
4. **Auto-Cart Addition**: Successfully saved ingredients automatically added to user's grocery cart

### **Recipe Filters**

1. **Available Ingredients**: Only shows ingredients marked as available
2. **Filter Selection**: User can filter recipes by available ingredients
3. **Recipe Matching**: Ingredient matcher uses available ingredients only

---

## 🚨 **Current Issues Identified**

### **1. ✅ RESOLVED: Sync Issues Between Pages**

**Problem:** Global ingredients show "Added" but groceries page doesn't show all items
**Root Cause:** Different data loading mechanisms and timing issues
**Solution:** Implemented shared `useUserGroceryCart` hook for consistent cart state management

### **2. ✅ RESOLVED: Category Mismatch**

**Problem:** Ingredients added under one category system, displayed under another
**Root Cause:** Different category definitions between global and local systems
**Solution:** Implemented consistent category mapping with `getCategoryMetadata()` and `getAvailableCategories()`

### **3. ✅ RESOLVED: Redundant Visual Indicators**

**Problem:** Pill badges showing available items are redundant
**Solution:** Removed redundant visual indicators, rely on button states only

### **4. ✅ RESOLVED: Incorrect "Added" State Logic**

**Problem:** All system ingredients show as "Added" with "Remove" buttons, regardless of actual cart membership
**Root Cause:** Flawed logic conflates "system availability" with "user cart membership"

**Solution Implemented:**

```typescript
// Separated system availability from cart membership
const isInUserCart = hasCanonical || hasSynonym; // Actually in user's cart
const isSystemAvailable = ing.is_system && !hiddenNormalizedNames.has(ing.normalized_name); // Available system ingredient
const isHidden = hiddenNormalizedNames.has(ing.normalized_name); // Explicitly hidden

// Correct button logic:
{isInUserCart && !isHidden ? (
  <span className="badge-green">✓ Added</span>
) : isSystemAvailable && !isInUserCart ? (
  <Button>+ Add</Button>
) : isHidden ? (
  <Button>Restore</Button>
) : null}
```

**Result:**

- ✅ Only ingredients actually in user's cart show "Added" + "Remove"
- ✅ System ingredients not in cart show "Add" button
- ✅ Hidden ingredients show "Restore" button
- ✅ Clean test user now shows correct state (only 5 ingredients as "Added")

### **5. Recipe-to-Global Integration Issues**

**Problem:** Inconsistent ingredient parsing and categorization suggestions
**Root Cause:** Different parsing logic between recipe display and global ingredient saving

**Fix Required:**

```typescript
// Standardize ingredient parsing across all components
const standardizeIngredientParsing = (recipeIngredient: string) => {
  const parsed = parseIngredientText(recipeIngredient);
  return {
    cleanName: parsed.name,
    suggestedCategory: inferCategoryFromRecipe(parsed, recipeContext),
    confidence: calculateCategoryConfidence(parsed, recipeContext),
  };
};
```

### **6. Learning System Data Quality**

**Problem:** Ingredient learning log may contain inconsistent data
**Solution:** Implement validation and normalization before logging ingredient additions

### **7. ✅ IMPLEMENTED: Multi-Category Ingredient Synchronization**

**Problem:** Ingredients like "Chicken Stock" appear in multiple categories (cooking_essentials + pantry_staples) but are treated as separate items
**Root Cause:** Current system creates separate database entries for the same ingredient in different categories

**Solution Implemented:**

```typescript
// Multi-category ingredients mapping (src/lib/groceries/multi-category-ingredients.ts)
export const MULTI_CATEGORY_INGREDIENTS: Record<string, string[]> = {
  'Chicken Stock': ['cooking_essentials', 'pantry_staples'],
  'Chicken Broth': ['cooking_essentials', 'pantry_staples'],
  'Vegetable Stock': ['cooking_essentials', 'pantry_staples'],
  // ... more ingredients
};

// Smart cart operations:
// - addIngredientToCart(): Adds to primary category, removes from others (no duplicates)
// - removeIngredientFromCart(): Removes from all categories
// - isIngredientInCart(): Checks all relevant categories

// Updated useUserGroceryCart hook with multi-category awareness:
const { isInCart, addToCart, removeFromCart } = useUserGroceryCart();
// Now handles multi-category ingredients automatically
```

**Key Features:**

- ✅ **Single ingredient, multiple appearances**: Chicken Stock appears in both categories
- ✅ **Synchronized state**: Adding/removing updates status across all categories
- ✅ **No duplicates**: Smart logic prevents duplicate entries
- ✅ **Backward compatible**: Works with existing category-based storage
- ✅ **Configurable**: Easy to add new multi-category ingredients

**Result:** Users can now add "Chicken Stock" from either cooking_essentials or pantry_staples, and it will show as "Added" in both categories while being stored only once in the database.

---

## ✅ **Recommended Improvements**

### **1. Unified Data Management**

```typescript
// Create shared hook for grocery cart management
const useUserGroceryCart = () => {
  const [userGroceryCart, setUserGroceryCart] = useState<
    Record<string, string[]>
  >({});

  const loadCart = useCallback(async () => {
    // Standardized loading logic
  }, []);

  const addToCart = useCallback(async (category: string, name: string) => {
    // Standardized add logic
  }, []);

  const removeFromCart = useCallback(async (name: string) => {
    // Standardized remove logic
  }, []);

  return { userGroceryCart, loadCart, addToCart, removeFromCart };
};
```

### **2. Clear Data Flow Documentation**

```typescript
// Add clear type definitions for each data layer
type GlobalCatalogItem = GlobalIngredient; // Source of truth
type GroceryCartItem = string; // Items user wants to manage
type AvailableItem = string; // Items user has available
type FilterableItem = string; // Items available for recipe matching
```

### **3. Consistent Category Handling**

```typescript
// Ensure all components use Chef Isabella's categories consistently
const CHEF_ISABELLA_CATEGORIES = [
  'proteins',
  'fresh_produce',
  'flavor_builders',
  'cooking_essentials',
  'bakery_grains',
  'dairy_cold',
  'pantry_staples',
  'frozen',
] as const;
```

### **4. Enhanced Recipe-to-Global Workflow**

```typescript
// Implement smart category inference for recipe ingredients
const inferIngredientCategory = (
  ingredient: string,
  recipeContext: RecipeContext
) => {
  const parsed = parseIngredientText(ingredient);
  const suggestions = analyzeCategoryFromContext(parsed.name, recipeContext);

  return {
    suggestedCategory: suggestions.primary,
    alternatives: suggestions.alternatives,
    confidence: suggestions.confidence,
  };
};

// Standardized ingredient learning pipeline
const logIngredientLearning = async (data: IngredientLearningData) => {
  const normalized = normalizeIngredientForLearning(data);
  await supabase.from('ingredient_learning_log').insert(normalized);
};
```

### **5. Comprehensive Testing Framework**

```typescript
// Test the complete workflow end-to-end
describe('Complete Grocery Workflow', () => {
  it('should handle recipe ingredient → global catalog → cart → kitchen → filters', async () => {
    // Test complete pipeline
  });

  it('should maintain data consistency across all components', async () => {
    // Test sync between global-ingredients-page and groceries-page
  });
});
```

---

## 📊 **Success Metrics**

- **Data Consistency**: 100% sync between global ingredients and groceries pages
- **User Experience**: Clear visual feedback at each stage
- **Performance**: <200ms for cart operations
- **Accuracy**: Correct ingredient availability for recipe matching
- **Learning Quality**: >85% accuracy in ingredient categorization suggestions
- **User Adoption**: Successful recipe-to-global ingredient additions
- **System Growth**: Expanding global catalog through user contributions

---

## 🔄 **Complete Workflow Summary**

This system implements a comprehensive four-phase grocery management workflow:

1. **🏪 Global Ingredients** → Browse Chef Isabella's catalog + user additions
2. **🛒 Grocery Cart** → Manage personal shopping list
3. **🍽️ Kitchen Inventory** → Track ingredient availability
4. **📝 Recipe Integration** → Add missing ingredients from recipes to global catalog

The workflow seamlessly connects recipe viewing, ingredient discovery, grocery planning, and cooking preparation - creating an intuitive experience that mirrors real-world kitchen behavior while leveraging community knowledge and smart matching algorithms.

**Key Innovation:** The recipe-to-global ingredient addition feature allows the system to grow organically through user contributions, creating a comprehensive, community-driven ingredient database that becomes more valuable over time.

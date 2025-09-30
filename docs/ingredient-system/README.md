### Ingredient System

The ingredient system powers matching, filtering, global catalogs, and recipe compatibility. It blends user groceries, a curated system catalog, and a global ingredient store with AI-assisted extraction and learning.

## **📊 Current Coverage Status**

- **Total Cuisines**: 81 cuisines supported
- **Total Ingredients**: 1,296+ authentic ingredients
- **Categories**: 8 Chef Isabella categories
- **Coverage**: Complete culinary diversity and dietary inclusivity

## **📋 Documentation**

- **[Global Ingredients Audit Report](./GLOBAL_INGREDIENTS_AUDIT_REPORT.md)**: Comprehensive audit of the current global ingredients system
- **[Global Ingredients Expansion Plan](./GLOBAL_INGREDIENTS_EXPANSION_PLAN.md)**: Strategic plan to align global ingredients with cuisine staples coverage
- **[Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md)**: Detailed checklist for implementing the global ingredients expansion

### Core Modules

- **Matching Engine**
  - `src/lib/groceries/ingredient-matcher.ts`: Core matcher (exact/partial/fuzzy) and recipe compatibility scoring.
  - `src/lib/groceries/enhanced-ingredient-matcher.ts`: Adds global ingredient support (Supabase-backed), async matching, learning logs, and extraction helpers.

- **System Catalog**
  - `src/lib/groceries/system-catalog.ts`: Chef Isabella’s kitchen-behavior catalog API surface.
  - `src/lib/groceries/categories/index.ts`: Aggregates categories, exposes `CHEF_ISABELLA_SYSTEM_CATALOG`, `CATEGORY_METADATA`, and helpers.

- **Hooks**
  - `src/hooks/useIngredientMatching.ts`: Wraps the core matcher for component use; provides single-match, compatibility, and analysis helpers.
  - `src/hooks/useGlobalIngredients.ts`: Manages global ingredients (load/search/save/hide/unhide) with `EnhancedIngredientMatcher`.
  - `src/hooks/useGroceries.ts`: User groceries state (availability, categories).

- **UI Components**
  - `src/components/recipes/filters/IngredientFilterSection.tsx`: Filter UI with Global vs Available modes, search, and category grouping.
  - `src/components/groceries/save-to-global-button.tsx`: Save unmatched items into global catalog.
  - `src/components/groceries/ingredient-matching-test.tsx`: Diagnostic/demo matching.

- **Parsing & Agents**
  - `src/lib/groceries/ingredient-parser.ts`: Ingredient text parsing and normalization.
  - `src/lib/ai-agents/ingredients-agent.ts`: AI agent for ingredient extraction/learning.

### Database Tables (Supabase)

- `global_ingredients`
  - Columns (typical): `id`, `name`, `normalized_name`, `category`, `synonyms[]`, `usage_count`, `first_seen_at`, `last_seen_at`, `created_by`, `is_verified`, `is_system`, `created_at`, `updated_at`.
  - Purpose: Canonical cross-user ingredient catalog (system + learned entries).

- `user_hidden_ingredients`
  - Columns: `user_id`, `normalized_name`.
  - Purpose: User-level preference to hide specific ingredients from suggestions/matching.

- `ingredient_learning_log`
  - Columns: `recipe_id`, `ingredient_text`, `extracted_name`, `suggested_category`, `confidence_score`, `was_saved`.
  - Purpose: Telemetry to improve suggestions and audit extraction decisions.

### Key Flows

- **Ingredient Matching (single)**
  1. Normalize text → exact match → partial match → fuzzy synonyms.
  2. If none: enhanced matcher checks `global_ingredients` (sync cache).
  3. Returns `{ matchedGroceryIngredient, matchedCategory, confidence, matchType }`.

- **Recipe Compatibility**
  - Scores availability across all recipe ingredients; returns available/missing lists and confidence aggregate.

- **Global Ingredient Save**
  - For unmatched items, `EnhancedIngredientMatcher.saveIngredientToGlobal()` upserts to `global_ingredients`, bumps `usage_count`, logs learning, refreshes cache.

- **Global vs Available Filtering**
  - IngredientFilterSection supports:
    - Global: `CHEF_ISABELLA_SYSTEM_CATALOG` grouped by behavior-based categories.
    - Available: user groceries by category via `useGroceries()`.

### Important APIs

- `IngredientMatcher.matchIngredient(ingredient: string)`
- `IngredientMatcher.calculateRecipeCompatibility(recipe)`
- `EnhancedIngredientMatcher.matchIngredientWithGlobal(ingredient)`
- `EnhancedIngredientMatcher.saveIngredientToGlobal(text, category, context?)`
- `EnhancedIngredientMatcher.extractIngredientsFromRecipe(recipe)`
- `useIngredientMatching()` returned helpers:
  - `matchIngredient`, `calculateCompatibility`, `analyzeRecipes`, `hasIngredient`, `getAvailabilityPercentage`, `getMissingIngredients`.
- `useGlobalIngredients()` returned helpers:
  - `globalIngredients`, `saveIngredientToGlobal`, `extractIngredientsFromRecipe`, `searchGlobalIngredients`, `getGlobalIngredient`, `refreshGlobalIngredients`, `hideIngredient`, `unhideIngredient`.

### Category Model

- Source of truth: `CHEF_ISABELLA_SYSTEM_CATALOG` with behavior-first categories such as `proteins`, `fresh_produce`, `flavor_builders`, `cooking_essentials`, `bakery_grains`, `dairy_cold`, `pantry_staples`, `frozen`.
- Metadata: `CATEGORY_METADATA` provides UI labels, icons, and subcues.

### Design Principles

- Behavior-first categorization (kitchen reality) vs biology/taxonomy.
- Non-destructive migrations; do not reset data. Additive changes only.
- Preference-driven: user hidden lists, availability, and matching confidence thresholds.
- DRY + reusable hooks/components across filters, parsing, and matching.

### Integration Points

- Filters: `IngredientFilterSection` (dropdown/accordion/drawer variants).
- Profile/Groceries: availability flows via `useGroceries` and cart interactions.
- AI: extraction and suggestion logging via agent + learning log.

### Operational Notes

- Global cache is loaded on demand in `EnhancedIngredientMatcher` and kept in-memory with a simple loaded flag; call `refreshGlobalIngredients()` after writes.
- Hidden list uses `user_hidden_ingredients`; normalize names via matcher’s `normalizeName`.
- Keep redundant aliases in the catalog per team preference; do not merge away synonyms.

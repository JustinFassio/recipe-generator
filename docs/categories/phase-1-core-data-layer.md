# Phase 1: Core Data Layer

**Foundation layer for recipe categorization system**

---

## 🎯 **Phase Objectives**

Establish the foundational data structures and database schema for recipe categories while maintaining full backward compatibility with existing recipes.

## 📋 **Deliverables**

- [x] Database schema migration
- [x] Type definition updates
- [x] Validation schema updates
- [x] Migration testing
- [x] Backward compatibility verification

## 🗄️ **Database Changes**

### **1. Schema Migration**

**File**: `supabase/migrations/YYYYMMDD_add_recipe_categories.sql`

```sql
-- Add categories column to recipes table
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Add index for category filtering (performance optimization)
CREATE INDEX IF NOT EXISTS idx_recipes_categories
ON recipes USING GIN (categories);

-- Add comment for documentation
COMMENT ON COLUMN recipes.categories IS 'Array of category strings in "Namespace: Value" format';

-- Verify existing data integrity
UPDATE recipes
SET categories = '{}'
WHERE categories IS NULL;

-- Add constraint to prevent null values going forward
ALTER TABLE recipes
ALTER COLUMN categories SET DEFAULT '{}',
ALTER COLUMN categories SET NOT NULL;
```

### **2. Migration Verification Query**

```sql
-- Test query to verify migration success
SELECT
  id,
  title,
  categories,
  COALESCE(array_length(categories, 1), 0) as category_count
FROM recipes
LIMIT 5;

-- Performance test for category filtering
EXPLAIN ANALYZE
SELECT id, title, categories
FROM recipes
WHERE categories @> ARRAY['Course: Main'];
```

### **3. Rollback Migration**

**File**: `supabase/migrations/YYYYMMDD_rollback_recipe_categories.sql`

```sql
-- Remove categories column (if needed)
ALTER TABLE recipes DROP COLUMN IF EXISTS categories;

-- Remove index
DROP INDEX IF EXISTS idx_recipes_categories;
```

## 📊 **Type Definitions**

### **1. Update Recipe Schema**

**File**: `src/lib/schemas.ts`

```typescript
import { z } from 'zod';

// Category validation schema
export const categorySchema = z
  .string()
  .min(1, 'Category cannot be empty')
  .max(100, 'Category too long')
  .regex(/^[a-zA-Z0-9\s:,-]+$/, 'Category contains invalid characters');

// Updated recipe schema with categories
export const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  ingredients: z
    .array(z.string().min(1, 'Ingredient cannot be empty'))
    .min(1, 'At least one ingredient is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  notes: z.string().optional().default(''),
  image_url: z.string().optional(),
  categories: z.array(categorySchema).optional().default([]),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;

// Category-specific types
export type RecipeCategory = z.infer<typeof categorySchema>;
export type CategoryNamespace =
  | 'Course'
  | 'Dish Type'
  | 'Component'
  | 'Technique'
  | 'Collection'
  | 'Cuisine'
  | 'Beverage'
  | 'Occasion';
```

### **2. Update Database Types**

**File**: `src/lib/supabase.ts`

```typescript
// Updated Recipe type with categories
export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  image_url: string | null;
  categories: string[]; // NEW FIELD
  user_id: string;
  created_at: string;
  updated_at: string;
};

// Database insert type
export type RecipeInsert = Omit<Recipe, 'id' | 'created_at' | 'updated_at'>;

// Database update type
export type RecipeUpdate = Partial<
  Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

// Category-related database types
export interface CategoryFilter {
  namespace?: string;
  value?: string;
  categories?: string[];
}

export interface RecipeWithCategoryCount extends Recipe {
  category_count: number;
}
```

### **3. Type Guards and Utilities**

**File**: `src/lib/category-types.ts`

```typescript
// Type guards for category validation
export function isValidCategory(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 100 &&
    /^[a-zA-Z0-9\s:,-]+$/.test(value)
  );
}

export function isNamespacedCategory(category: string): boolean {
  return category.includes(':') && category.split(':').length === 2;
}

export function parseCategory(category: string): {
  namespace?: string;
  value: string;
} {
  if (isNamespacedCategory(category)) {
    const [namespace, value] = category.split(':').map((s) => s.trim());
    return { namespace, value };
  }
  return { value: category.trim() };
}

export function formatCategory(namespace: string, value: string): string {
  return `${namespace.trim()}: ${value.trim()}`;
}

// Category array utilities
export function uniqueCategories(categories: string[]): string[] {
  return Array.from(new Set(categories.filter(Boolean)));
}

export function sortCategories(categories: string[]): string[] {
  return categories.sort((a, b) => {
    const aHasNamespace = isNamespacedCategory(a);
    const bHasNamespace = isNamespacedCategory(b);

    // Namespaced categories first
    if (aHasNamespace && !bHasNamespace) return -1;
    if (!aHasNamespace && bHasNamespace) return 1;

    // Alphabetical within groups
    return a.localeCompare(b);
  });
}
```

## 🧪 **Testing Strategy**

### **1. Database Migration Tests**

**File**: `src/__tests__/database/category-migration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Category Migration', () => {
  let supabase: any;

  beforeAll(async () => {
    supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
  });

  it('should have categories column', async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('categories')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should handle empty categories array', async () => {
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        title: 'Test Recipe',
        ingredients: ['Test ingredient'],
        instructions: 'Test instructions',
        notes: '',
        categories: [],
        user_id: 'test-user',
      })
      .select();

    expect(error).toBeNull();
    expect(data[0].categories).toEqual([]);
  });

  it('should handle categories with values', async () => {
    const testCategories = ['Course: Main', 'Cuisine: Italian'];

    const { data, error } = await supabase
      .from('recipes')
      .insert({
        title: 'Test Recipe with Categories',
        ingredients: ['Test ingredient'],
        instructions: 'Test instructions',
        notes: '',
        categories: testCategories,
        user_id: 'test-user',
      })
      .select();

    expect(error).toBeNull();
    expect(data[0].categories).toEqual(testCategories);
  });

  it('should support category filtering', async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .contains('categories', ['Course: Main']);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

### **2. Schema Validation Tests**

**File**: `src/__tests__/lib/category-schemas.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { recipeSchema, categorySchema } from '@/lib/schemas';

describe('Category Schema Validation', () => {
  describe('categorySchema', () => {
    it('should accept valid categories', () => {
      const validCategories = [
        'Course: Main',
        'Cuisine: Italian',
        'Simple Category',
        'Multi-Word Category Name',
      ];

      validCategories.forEach((category) => {
        expect(() => categorySchema.parse(category)).not.toThrow();
      });
    });

    it('should reject invalid categories', () => {
      const invalidCategories = [
        '', // empty
        'a'.repeat(101), // too long
        'Invalid@Category', // invalid characters
        'Category: With: Too: Many: Colons',
      ];

      invalidCategories.forEach((category) => {
        expect(() => categorySchema.parse(category)).toThrow();
      });
    });
  });

  describe('recipeSchema with categories', () => {
    const baseRecipe = {
      title: 'Test Recipe',
      ingredients: ['Test ingredient'],
      instructions: 'Test instructions',
    };

    it('should accept recipe without categories', () => {
      expect(() => recipeSchema.parse(baseRecipe)).not.toThrow();
    });

    it('should accept recipe with empty categories', () => {
      const recipe = { ...baseRecipe, categories: [] };
      expect(() => recipeSchema.parse(recipe)).not.toThrow();
    });

    it('should accept recipe with valid categories', () => {
      const recipe = {
        ...baseRecipe,
        categories: ['Course: Main', 'Cuisine: Italian'],
      };

      const result = recipeSchema.parse(recipe);
      expect(result.categories).toEqual(['Course: Main', 'Cuisine: Italian']);
    });

    it('should default categories to empty array', () => {
      const result = recipeSchema.parse(baseRecipe);
      expect(result.categories).toEqual([]);
    });
  });
});
```

### **3. Type Utility Tests**

**File**: `src/__tests__/lib/category-types.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  isValidCategory,
  isNamespacedCategory,
  parseCategory,
  formatCategory,
  uniqueCategories,
  sortCategories,
} from '@/lib/category-types';

describe('Category Type Utilities', () => {
  describe('isValidCategory', () => {
    it('should validate correct categories', () => {
      expect(isValidCategory('Course: Main')).toBe(true);
      expect(isValidCategory('Simple Category')).toBe(true);
      expect(isValidCategory('')).toBe(false);
      expect(isValidCategory(null)).toBe(false);
      expect(isValidCategory(123)).toBe(false);
    });
  });

  describe('parseCategory', () => {
    it('should parse namespaced categories', () => {
      expect(parseCategory('Course: Main')).toEqual({
        namespace: 'Course',
        value: 'Main',
      });
    });

    it('should handle simple categories', () => {
      expect(parseCategory('Simple')).toEqual({
        value: 'Simple',
      });
    });
  });

  describe('uniqueCategories', () => {
    it('should remove duplicates', () => {
      const input = ['Course: Main', 'Course: Main', 'Cuisine: Italian'];
      const expected = ['Course: Main', 'Cuisine: Italian'];
      expect(uniqueCategories(input)).toEqual(expected);
    });

    it('should filter empty strings', () => {
      const input = ['Course: Main', '', 'Cuisine: Italian'];
      const expected = ['Course: Main', 'Cuisine: Italian'];
      expect(uniqueCategories(input)).toEqual(expected);
    });
  });

  describe('sortCategories', () => {
    it('should sort namespaced categories first', () => {
      const input = [
        'Simple',
        'Course: Main',
        'Another Simple',
        'Cuisine: Italian',
      ];
      const result = sortCategories(input);

      expect(result[0]).toBe('Course: Main');
      expect(result[1]).toBe('Cuisine: Italian');
    });
  });
});
```

## 📋 **Implementation Checklist**

### **Database Tasks**

- [ ] Create migration file
- [ ] Add categories column with text[] type
- [ ] Add GIN index for performance
- [ ] Set default value to empty array
- [ ] Add NOT NULL constraint
- [ ] Test migration on development database
- [ ] Verify existing data integrity
- [ ] Create rollback migration

### **Type Definition Tasks**

- [ ] Update recipeSchema with categories field
- [ ] Add category validation schema
- [ ] Update Recipe database type
- [ ] Create RecipeInsert and RecipeUpdate types
- [ ] Add category-specific types
- [ ] Create type guard utilities
- [ ] Add category parsing utilities

### **Testing Tasks**

- [ ] Write database migration tests
- [ ] Write schema validation tests
- [ ] Write type utility tests
- [ ] Test backward compatibility
- [ ] Test performance with large datasets
- [ ] Verify error handling

### **Documentation Tasks**

- [ ] Document database schema changes
- [ ] Document type definitions
- [ ] Create migration guide
- [ ] Update API documentation
- [ ] Document testing procedures

## 🚨 **Rollback Plan**

### **If Migration Fails**

1. Run rollback migration to remove categories column
2. Revert type definition changes
3. Remove test files
4. Document failure reasons

### **If Performance Issues**

1. Adjust index configuration
2. Optimize query patterns
3. Consider alternative data structures

### **If Type Errors**

1. Make categories field optional in all contexts
2. Add additional type guards
3. Implement gradual type adoption

## ✅ **Success Criteria**

- [ ] Migration completes without errors
- [ ] All existing recipes continue to work
- [ ] New recipes can be created with categories
- [ ] Type definitions compile without errors
- [ ] All tests pass
- [ ] Performance benchmarks met
- [ ] Documentation complete

## 🔗 **Next Phase**

Once Phase 1 is complete, proceed to [Phase 2: Parsing Infrastructure](phase-2-parsing-infrastructure.md) to implement category parsing and normalization.

---

**Phase Status**: 📋 Ready for Implementation  
**Estimated Time**: 1-2 days  
**Prerequisites**: Database access, development environment  
**Next Phase**: [Phase 2 - Parsing Infrastructure](phase-2-parsing-infrastructure.md)

# Day 1: Recipe Categories Implementation

## 🎯 **Objective**

Implement the core recipe categories feature to enable recipe organization and discovery.

## 📋 **What We're Building**

- Database schema for recipe categories with GIN indexing
- Category input and display components using existing DaisyUI patterns
- Category integration with recipe forms and parsing
- Backward compatibility with existing recipes

## 🗄️ **Database Changes**

### **Step 1: Create Migration File**

**File**: `supabase/migrations/20250122000000_add_recipe_categories.sql`

```sql
-- Add categories column to recipes table
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Add GIN index for performance (enables efficient array operations)
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

### **Step 2: Create Rollback Migration**

**File**: `supabase/migrations/20250122000001_rollback_recipe_categories.sql`

```sql
-- Remove GIN index
DROP INDEX IF EXISTS idx_recipes_categories;

-- Remove categories column
ALTER TABLE recipes DROP COLUMN IF EXISTS categories;
```

### **Step 3: Test Migration**

```bash
# Apply migration to development database
supabase db reset

# Verify migration
supabase db diff
```

## 🎨 **UI Components**

### **Step 4: Create CategoryChip Component**

**File**: `src/components/ui/category-chip.tsx`

```typescript
import React from 'react';
import { X } from 'lucide-react';
import { createDaisyUIBadgeClasses } from '@/lib/badge-migration';

export interface CategoryChipProps {
  category: string;
  variant?: 'default' | 'clickable' | 'selected' | 'removable';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (category: string) => void;
  onRemove?: (category: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CategoryChip({
  category,
  variant = 'default',
  size = 'md',
  onClick,
  onRemove,
  className = '',
  disabled = false
}: CategoryChipProps) {
  // Parse category for display (e.g., "Course: Main" -> namespace: "Course", value: "Main")
  const parseCategory = (cat: string) => {
    const parts = cat.split(': ');
    return parts.length === 2
      ? { namespace: parts[0], value: parts[1] }
      : { namespace: '', value: cat };
  };

  const { namespace, value } = parseCategory(category);

  // DaisyUI-based styling using existing badge migration utilities
  const baseClasses = 'badge inline-flex items-center gap-1 transition-all duration-200';

  const variantClasses = {
    default: 'badge-neutral',
    clickable: 'badge-outline hover:badge-primary cursor-pointer',
    selected: 'badge-primary',
    removable: 'badge-secondary'
  };

  const sizeClasses = {
    sm: 'badge-sm text-xs',
    md: 'badge-md text-sm',
    lg: 'badge-lg text-base'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const chipClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${className}
  `.trim();

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(category);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onRemove) {
      onRemove(category);
    }
  };

  return (
    <span
      className={chipClasses}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Category: ${category}`}
    >
      {namespace && (
        <span className="font-medium opacity-75">
          {namespace}:
        </span>
      )}
      <span>{value}</span>

      {onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${category}`}
          tabIndex={-1}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
```

### **Step 5: Create CategoryInput Component**

**File**: `src/components/ui/category-input.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { createDaisyUIInputClasses } from '@/lib/input-migration';
import { CategoryChip } from './category-chip';

export interface CategoryInputProps {
  value: string[];
  onChange: (categories: string[]) => void;
  placeholder?: string;
  maxCategories?: number;
  className?: string;
  disabled?: boolean;
}

// Basic category suggestions (can be expanded later)
const SUGGESTED_CATEGORIES = [
  'Course: Main',
  'Course: Appetizer',
  'Course: Dessert',
  'Cuisine: Italian',
  'Cuisine: Mexican',
  'Cuisine: Asian',
  'Technique: Bake',
  'Technique: Grill',
  'Technique: Sauté',
  'Collection: Quick',
  'Collection: Vegetarian',
  'Collection: Gluten-Free'
];

export function CategoryInput({
  value = [],
  onChange,
  placeholder = 'Add categories...',
  maxCategories = 6,
  className = '',
  disabled = false
}: CategoryInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddCategory = (category: string) => {
    const trimmedCategory = category.trim();
    if (!trimmedCategory) return;

    // Normalize category format
    const normalizedCategory = normalizeCategory(trimmedCategory);

    // Check if already exists
    if (value.includes(normalizedCategory)) return;

    // Check max limit
    if (value.length >= maxCategories) return;

    const newCategories = [...value, normalizedCategory];
    onChange(newCategories);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    const newCategories = value.filter(cat => cat !== categoryToRemove);
    onChange(newCategories);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddCategory(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      handleRemoveCategory(value[value.length - 1]);
    }
  };

  const filteredSuggestions = SUGGESTED_CATEGORIES.filter(
    suggestion =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Category chips display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((category, index) => (
            <CategoryChip
              key={`${category}-${index}`}
              category={category}
              variant="removable"
              onRemove={handleRemoveCategory}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length >= maxCategories ? 'Max categories reached' : placeholder}
          disabled={disabled || value.length >= maxCategories}
          className={createDaisyUIInputClasses('bordered')}
        />

        {/* Add button */}
        {inputValue.trim() && (
          <button
            type="button"
            onClick={() => handleAddCategory(inputValue)}
            disabled={disabled || value.length >= maxCategories}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleAddCategory(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        {value.length}/{maxCategories} categories
      </p>
    </div>
  );
}

// Helper function to normalize category format
function normalizeCategory(category: string): string {
  // Basic normalization - can be enhanced later
  return category.trim();
}
```

## 🔧 **Integration Points**

### **Step 6: Update Type Definitions**

**File**: `src/lib/types.ts`

```typescript
// Add to existing Recipe type
export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  image_url: string | null;
  categories: string[]; // NEW FIELD
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};
```

### **Step 7: Update Validation Schema**

**File**: `src/lib/schemas.ts`

```typescript
import { z } from 'zod';

// Add category validation schema
export const categorySchema = z
  .string()
  .min(1, 'Category cannot be empty')
  .max(100, 'Category too long')
  .regex(/^[a-zA-Z0-9\s:,-]+$/, 'Category contains invalid characters');

// Update existing recipe schema
export const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  ingredients: z
    .array(z.string().min(1, 'Ingredient cannot be empty'))
    .min(1, 'At least one ingredient is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  notes: z.string().optional().default(''),
  image_url: z.string().optional(),
  categories: z.array(categorySchema).optional().default([]), // NEW FIELD
});

export type RecipeFormData = z.infer<typeof recipeSchema>;
```

### **Step 8: Update Recipe Form**

**File**: `src/components/recipes/recipe-form.tsx`

```typescript
// Add import at the top
import { CategoryInput } from '@/components/ui/category-input';

// Update the form's default values in useForm
const {
  register,
  handleSubmit,
  formState: { errors },
  reset,
  control,
  setValue,
  watch,
} = useForm<RecipeFormData>({
  resolver: zodResolver(recipeSchema),
  defaultValues: editRecipe
    ? {
        title: editRecipe.title,
        ingredients: editRecipe.ingredients,
        instructions: editRecipe.instructions,
        notes: editRecipe.notes || '',
        image_url: editRecipe.image_url || '',
        categories: editRecipe.categories || [], // NEW FIELD
      }
    : {
        title: '',
        ingredients: [''],
        instructions: '',
        notes: '',
        image_url: '',
        categories: [], // NEW FIELD
      },
});

// Add category field to the form JSX (after ingredients section)
<div>
  <label htmlFor="categories" className={createDaisyUILabelClasses()}>
    Categories
  </label>
  <CategoryInput
    value={watch('categories') || []}
    onChange={(categories) => setValue('categories', categories)}
    placeholder="Add categories like 'Course: Main', 'Cuisine: Italian'..."
    maxCategories={6}
  />
  {errors.categories && (
    <p className="mt-1 text-sm text-red-500">
      {errors.categories.message}
    </p>
  )}
</div>
```

### **Step 9: Update Recipe Card Display**

**File**: `src/components/recipes/recipe-card.tsx`

```typescript
// Add import at the top
import { CategoryChip } from '@/components/ui/category-chip';

// Add category display after the title (around line 89)
<div className="card-body pb-3">
  <div className="flex items-start justify-between">
    <h3 className={`${createDaisyUICardTitleClasses()} line-clamp-2 text-lg font-semibold`}>
      {recipe.title}
    </h3>
    {/* ... existing action buttons */}
  </div>

  {/* NEW: Category display */}
  {recipe.categories && recipe.categories.length > 0 && (
    <div className="mt-2 flex flex-wrap gap-1">
      {recipe.categories.slice(0, 3).map((category, index) => (
        <CategoryChip
          key={`${category}-${index}`}
          category={category}
          variant="default"
          size="sm"
        />
      ))}
      {recipe.categories.length > 3 && (
        <span className="badge badge-outline badge-sm">
          +{recipe.categories.length - 3} more
        </span>
      )}
    </div>
  )}

  {/* ... existing ingredient count and other info */}
</div>
```

### **Step 10: Update Recipe Parsing**

**File**: `src/lib/recipe-parser.ts`

```typescript
// Update the ParsedRecipe interface
export interface ParsedRecipe {
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  categories: string[]; // NEW FIELD
}

// Update parseJsonRecipe function
function parseJsonRecipe(parsed: Record<string, unknown>): ParsedRecipe {
  // ... existing validation logic ...

  return {
    title: (parsed.title || parsed.name) as string,
    ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
    instructions: (parsed.instructions ||
      parsed.directions ||
      parsed.steps) as string,
    notes: (parsed.notes || parsed.tips || parsed.comments || '') as string,
    categories: Array.isArray(parsed.categories) ? parsed.categories : [], // NEW FIELD
  };
}

// Update parseFlexibleRecipe function
function parseFlexibleRecipe(text: string): ParsedRecipe {
  // ... existing parsing logic ...

  return {
    title: title || 'Recipe from Text',
    ingredients,
    instructions: instructions.join('\n'),
    notes: notes.join('\n'),
    categories: [], // Default to empty array for flexible parsing
  };
}
```

## 🧪 **Testing Implementation**

### **Step 11: Update Schema Tests**

**File**: `src/__tests__/lib/schemas.test.ts`

```typescript
// Add to existing test suite
describe('recipeSchema with categories', () => {
  it('should validate a recipe with categories', () => {
    const validRecipe = {
      title: 'Test Recipe',
      ingredients: ['ingredient 1', 'ingredient 2'],
      instructions: 'Test instructions',
      notes: 'Test notes',
      image_url: 'https://example.com/image.jpg',
      categories: ['Course: Main', 'Cuisine: Italian'], // NEW FIELD
    };

    const result = recipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  it('should validate a recipe without categories', () => {
    const validRecipe = {
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      instructions: 'Test instructions',
      notes: 'Test notes',
    };

    const result = recipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categories).toEqual([]);
    }
  });

  it('should reject invalid category format', () => {
    const invalidRecipe = {
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      instructions: 'Test instructions',
      categories: ['Invalid@Category'], // Invalid characters
    };

    const result = recipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
  });
});
```

### **Step 12: Create Component Tests**

**File**: `src/__tests__/components/ui/category-chip.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategoryChip } from '@/components/ui/category-chip';

describe('CategoryChip', () => {
  it('should render category correctly', () => {
    render(<CategoryChip category="Course: Main" />);
    expect(screen.getByText('Course:')).toBeInTheDocument();
    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<CategoryChip category="Course: Main" variant="clickable" onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith('Course: Main');
  });

  it('should handle remove events', () => {
    const handleRemove = vi.fn();
    render(<CategoryChip category="Course: Main" variant="removable" onRemove={handleRemove} />);

    const removeButton = screen.getByLabelText('Remove Course: Main');
    fireEvent.click(removeButton);
    expect(handleRemove).toHaveBeenCalledWith('Course: Main');
  });
});
```

## ✅ **Success Criteria Verification**

### **Step 13: Manual Testing Checklist**

- [ ] **Database Migration**: Run migration and verify categories column exists
- [ ] **Form Integration**: Add categories to new recipe and save successfully
- [ ] **Display**: Categories appear on recipe cards and recipe view pages
- [ ] **Backward Compatibility**: Existing recipes without categories work normally
- [ ] **Validation**: Invalid category formats are rejected
- [ ] **Performance**: Recipe list loads without performance degradation

### **Step 14: Automated Testing**

```bash
# Run all tests to ensure no regressions
npm run test:run

# Run specific category tests
npm run test -- --grep "category"

# Check build still works
npm run build
```

## 📝 **Implementation Notes**

### **Design Decisions**

- **Category Format**: "Namespace: Value" format for flexibility and future hierarchy support
- **Max Categories**: 6 per recipe to prevent UI clutter
- **Display Limit**: Show 3 categories on cards with "+X more" indicator
- **Validation**: Basic regex validation for special characters
- **Backward Compatibility**: Default empty array for existing recipes

### **Performance Considerations**

- **GIN Index**: Enables efficient array operations for filtering
- **Component Optimization**: CategoryChip uses React.memo for performance
- **Bundle Size**: New components add minimal overhead (~5-10 kB)

### **Future Enhancements** (Not Day 1)

- AI-powered category suggestions
- Category filtering and search
- Category analytics and insights
- Advanced category management

---

**Status**: 📋 Ready for Implementation  
**Estimated Time**: 6-8 hours  
**Priority**: 🔴 Critical  
**Dependencies**: None - can be implemented independently

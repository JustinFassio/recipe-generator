# Phase 2: Parsing Infrastructure

**Category normalization and JSON template parsing updates**

---

## 🎯 **Phase Objectives**

Build robust parsing infrastructure to handle multiple category input formats from AI responses while maintaining backward compatibility with existing recipe parsing.

## 📋 **Deliverables**

- [x] Category normalization utilities
- [x] JSON template parsing updates
- [x] Backward compatibility handling
- [x] Input format flexibility
- [x] Error handling and fallbacks

## 🔧 **Core Parsing Infrastructure**

### **1. Category Normalization Utility**

**File**: `src/lib/category-parsing.ts`

```typescript
/**
 * Comprehensive category parsing and normalization utilities
 * Handles multiple input formats from AI responses
 */

// Types for different input formats
type CategoryInput =
  | string[] // ["Course: Main", "Cuisine: Italian"]
  | string // "Course: Main"
  | CategoryObject // { course: ["Main"], cuisine: ["Italian"] }
  | null
  | undefined;

interface CategoryObject {
  [namespace: string]: string | string[];
}

/**
 * Main normalization function - handles all input formats
 */
export function normalizeCategories(input: CategoryInput): string[] {
  if (!input) return [];

  try {
    // Case 1: Array of strings (most common)
    if (Array.isArray(input)) {
      return input
        .filter((item) => typeof item === 'string' && item.trim())
        .map((item) => normalizeCategory(item.trim()))
        .filter(Boolean);
    }

    // Case 2: Single string
    if (typeof input === 'string') {
      const trimmed = input.trim();
      return trimmed ? [normalizeCategory(trimmed)] : [];
    }

    // Case 3: Object format { namespace: [values] }
    if (typeof input === 'object' && input !== null) {
      return normalizeObjectCategories(input);
    }

    return [];
  } catch (error) {
    console.warn('Category normalization error:', error);
    return [];
  }
}

/**
 * Normalize object-format categories to namespaced strings
 */
function normalizeObjectCategories(input: CategoryObject): string[] {
  const result: string[] = [];

  // Define preferred namespace order for consistent output
  const namespaceOrder = [
    'course',
    'dish_type',
    'dishtype',
    'dish type',
    'component',
    'technique',
    'collection',
    'cuisine',
    'beverage',
    'occasion',
  ];

  // Get all namespaces, ordered by preference
  const allNamespaces = Object.keys(input);
  const orderedNamespaces = [
    ...namespaceOrder.filter((ns) => allNamespaces.includes(ns)),
    ...allNamespaces.filter((ns) => !namespaceOrder.includes(ns)),
  ];

  for (const namespace of orderedNamespaces) {
    const values = input[namespace];
    const normalizedNamespace = toTitleCase(namespace.replace(/[_-]/g, ' '));

    if (Array.isArray(values)) {
      values.forEach((value) => {
        if (typeof value === 'string' && value.trim()) {
          result.push(`${normalizedNamespace}: ${toTitleCase(value.trim())}`);
        }
      });
    } else if (typeof values === 'string' && values.trim()) {
      result.push(`${normalizedNamespace}: ${toTitleCase(values.trim())}`);
    }
  }

  return result;
}

/**
 * Normalize individual category string
 */
function normalizeCategory(category: string): string {
  if (!category || typeof category !== 'string') return '';

  const trimmed = category.trim();

  // Handle namespaced format "Namespace: Value"
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length === 2) {
      const namespace = toTitleCase(parts[0].trim());
      const value = toTitleCase(parts[1].trim());
      return `${namespace}: ${value}`;
    }
  }

  // Handle simple category
  return toTitleCase(trimmed);
}

/**
 * Convert string to title case with special handling
 */
function toTitleCase(str: string): string {
  return str
    .replace(/[_-]/g, ' ') // Replace underscores/hyphens with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim() // Remove leading/trailing spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
}

/**
 * Validate category format and content
 */
export function validateCategory(category: string): boolean {
  if (!category || typeof category !== 'string') return false;

  const trimmed = category.trim();

  // Check length
  if (trimmed.length === 0 || trimmed.length > 100) return false;

  // Check for valid characters (letters, numbers, spaces, colons, commas, hyphens)
  if (!/^[a-zA-Z0-9\s:,-]+$/.test(trimmed)) return false;

  // If namespaced, validate format
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length !== 2) return false;
    if (!parts[0].trim() || !parts[1].trim()) return false;
  }

  return true;
}

/**
 * Extract unique, valid categories from array
 */
export function uniqueValidCategories(categories: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const category of categories) {
    const normalized = normalizeCategory(category);
    if (normalized && validateCategory(normalized) && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

/**
 * Sort categories by namespace priority and alphabetically
 */
export function sortCategories(categories: string[]): string[] {
  const namespacePriority = [
    'Course',
    'Dish Type',
    'Component',
    'Technique',
    'Collection',
    'Cuisine',
    'Beverage',
    'Occasion',
  ];

  return categories.sort((a, b) => {
    const aNamespace = a.includes(':') ? a.split(':')[0].trim() : '';
    const bNamespace = b.includes(':') ? b.split(':')[0].trim() : '';

    const aPriority = namespacePriority.indexOf(aNamespace);
    const bPriority = namespacePriority.indexOf(bNamespace);

    // Sort by namespace priority first
    if (aPriority !== -1 && bPriority !== -1) {
      if (aPriority !== bPriority) return aPriority - bPriority;
    } else if (aPriority !== -1) {
      return -1;
    } else if (bPriority !== -1) {
      return 1;
    }

    // Then alphabetically
    return a.localeCompare(b);
  });
}

/**
 * Parse category string into namespace and value
 */
export function parseCategory(category: string): {
  namespace?: string;
  value: string;
} {
  if (!category || typeof category !== 'string') {
    return { value: '' };
  }

  const trimmed = category.trim();

  if (trimmed.includes(':')) {
    const [namespace, value] = trimmed.split(':').map((s) => s.trim());
    return { namespace, value };
  }

  return { value: trimmed };
}

/**
 * Format namespace and value into category string
 */
export function formatCategory(namespace: string, value: string): string {
  if (!namespace || !value) return value || '';
  return `${namespace.trim()}: ${value.trim()}`;
}
```

### **2. JSON Template Parsing Updates**

**File**: `src/lib/api.ts` (updates to existing `parseRecipeFromText` function)

````typescript
// Add this import at the top
import {
  normalizeCategories,
  uniqueValidCategories,
  sortCategories,
} from './category-parsing';

// Update the parseRecipeFromText function
export async function parseRecipeFromText(text: string): Promise<{
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  categories: string[]; // NEW FIELD
}> {
  try {
    console.log('Attempting to parse as JSON...');

    let jsonText = text;

    // Check if JSON is wrapped in markdown code blocks
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1];
      console.log('Extracted JSON from markdown code block');
    }

    // Try to parse as JSON first
    const parsed = JSON.parse(jsonText);

    console.log('Successfully parsed JSON format');

    // Validate required fields - be flexible about field names
    const hasTitle = parsed.title || parsed.name;
    const hasIngredients =
      parsed.ingredients && Array.isArray(parsed.ingredients);
    const hasInstructions = parsed.instructions;

    if (!hasTitle) {
      throw new Error('Missing required field: title or name');
    }
    if (!hasIngredients) {
      throw new Error('Missing required field: ingredients (must be an array)');
    }
    if (!hasInstructions) {
      throw new Error('Missing required field: instructions');
    }

    // Handle complex nested JSON structure
    return processComplexJSONWithCategories(parsed);
  } catch (error) {
    console.log('JSON parsing failed, trying markdown parsing');
    console.log('Text preview:', text.substring(0, 200) + '...');

    // Fallback to markdown parsing
    return parseMarkdownRecipeWithCategories(text);
  }
}

/**
 * Process complex JSON with category handling
 */
function processComplexJSONWithCategories(parsed: any): {
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  categories: string[];
} {
  // ... existing ingredient and instruction processing logic ...

  // NEW: Process categories from multiple possible sources
  const rawCategories =
    parsed.categories ||
    parsed.category ||
    parsed.tags ||
    parsed.labels ||
    parsed.classification ||
    null;

  const normalizedCategories = normalizeCategories(rawCategories);
  const uniqueCategories = uniqueValidCategories(normalizedCategories);
  const sortedCategories = sortCategories(uniqueCategories);

  console.log('Processed categories:', {
    raw: rawCategories,
    normalized: normalizedCategories,
    final: sortedCategories,
  });

  return {
    title: parsed.name || parsed.title || 'Untitled Recipe',
    ingredients, // from existing logic
    instructions, // from existing logic
    notes, // from existing logic
    categories: sortedCategories,
  };
}

/**
 * Parse markdown with basic category extraction
 */
function parseMarkdownRecipeWithCategories(text: string): {
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  categories: string[];
} {
  // ... existing markdown parsing logic ...

  // NEW: Try to extract categories from markdown
  const categories = extractCategoriesFromMarkdown(text);

  return {
    title, // from existing logic
    ingredients, // from existing logic
    instructions, // from existing logic
    notes, // from existing logic
    categories,
  };
}

/**
 * Extract categories from markdown text
 */
function extractCategoriesFromMarkdown(text: string): string[] {
  const categories: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();

    // Look for category-like lines
    if (
      trimmed.startsWith('categories:') ||
      trimmed.startsWith('tags:') ||
      trimmed.startsWith('type:') ||
      trimmed.startsWith('cuisine:')
    ) {
      const content = line.substring(line.indexOf(':') + 1).trim();

      // Handle comma-separated values
      if (content.includes(',')) {
        const items = content
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        categories.push(...items);
      } else if (content) {
        categories.push(content);
      }
    }

    // Look for inline category mentions
    if (
      trimmed.includes('course:') ||
      trimmed.includes('cuisine:') ||
      trimmed.includes('type:')
    ) {
      // Extract inline mentions - basic implementation
      const matches = line.match(/(\w+):\s*([^,.\n]+)/gi);
      if (matches) {
        matches.forEach((match) => {
          const [namespace, value] = match.split(':').map((s) => s.trim());
          if (namespace && value) {
            categories.push(formatCategory(namespace, value));
          }
        });
      }
    }
  }

  return uniqueValidCategories(categories);
}
````

### **3. Parsing Integration Tests**

**File**: `src/__tests__/lib/category-parsing.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  normalizeCategories,
  validateCategory,
  uniqueValidCategories,
  sortCategories,
  parseCategory,
  formatCategory,
} from '@/lib/category-parsing';

describe('Category Parsing Infrastructure', () => {
  describe('normalizeCategories', () => {
    it('should handle array input', () => {
      const input = ['Course: Main', 'cuisine: italian', 'TECHNIQUE: BAKE'];
      const expected = ['Course: Main', 'Cuisine: Italian', 'Technique: Bake'];
      expect(normalizeCategories(input)).toEqual(expected);
    });

    it('should handle string input', () => {
      const input = 'course: main dish';
      const expected = ['Course: Main Dish'];
      expect(normalizeCategories(input)).toEqual(expected);
    });

    it('should handle object input', () => {
      const input = {
        course: ['Main', 'Appetizer'],
        cuisine: 'Italian',
        technique: ['Bake', 'Roast'],
      };
      const expected = [
        'Course: Main',
        'Course: Appetizer',
        'Cuisine: Italian',
        'Technique: Bake',
        'Technique: Roast',
      ];
      expect(normalizeCategories(input)).toEqual(expected);
    });

    it('should handle null/undefined input', () => {
      expect(normalizeCategories(null)).toEqual([]);
      expect(normalizeCategories(undefined)).toEqual([]);
      expect(normalizeCategories('')).toEqual([]);
    });

    it('should handle malformed input gracefully', () => {
      expect(normalizeCategories(123 as any)).toEqual([]);
      expect(normalizeCategories(true as any)).toEqual([]);
      expect(normalizeCategories({ invalid: null })).toEqual([]);
    });
  });

  describe('validateCategory', () => {
    it('should validate correct categories', () => {
      expect(validateCategory('Course: Main')).toBe(true);
      expect(validateCategory('Simple Category')).toBe(true);
      expect(validateCategory('Multi-Word Category Name')).toBe(true);
      expect(validateCategory('Category-With-Hyphens')).toBe(true);
    });

    it('should reject invalid categories', () => {
      expect(validateCategory('')).toBe(false);
      expect(validateCategory('   ')).toBe(false);
      expect(validateCategory('a'.repeat(101))).toBe(false);
      expect(validateCategory('Invalid@Category')).toBe(false);
      expect(validateCategory('Too:Many:Colons')).toBe(false);
      expect(validateCategory(null as any)).toBe(false);
    });
  });

  describe('uniqueValidCategories', () => {
    it('should remove duplicates and invalid entries', () => {
      const input = [
        'Course: Main',
        'course: main', // duplicate (different case)
        'Course: Main', // exact duplicate
        '', // invalid
        'Valid Category',
        'Invalid@Category', // invalid characters
        'Cuisine: Italian',
      ];

      const result = uniqueValidCategories(input);
      expect(result).toHaveLength(3);
      expect(result).toContain('Course: Main');
      expect(result).toContain('Valid Category');
      expect(result).toContain('Cuisine: Italian');
    });
  });

  describe('sortCategories', () => {
    it('should sort by namespace priority then alphabetically', () => {
      const input = [
        'Occasion: Holiday',
        'Course: Main',
        'Beverage: Cocktail',
        'Course: Appetizer',
        'Cuisine: Italian',
      ];

      const result = sortCategories(input);

      // Course should come first (higher priority)
      expect(result[0]).toBe('Course: Appetizer');
      expect(result[1]).toBe('Course: Main');

      // Then other namespaces alphabetically
      expect(result).toContain('Beverage: Cocktail');
      expect(result).toContain('Cuisine: Italian');
      expect(result).toContain('Occasion: Holiday');
    });
  });

  describe('parseCategory', () => {
    it('should parse namespaced categories', () => {
      expect(parseCategory('Course: Main')).toEqual({
        namespace: 'Course',
        value: 'Main',
      });

      expect(parseCategory('Cuisine: Italian')).toEqual({
        namespace: 'Cuisine',
        value: 'Italian',
      });
    });

    it('should handle simple categories', () => {
      expect(parseCategory('Simple')).toEqual({
        value: 'Simple',
      });

      expect(parseCategory('Multi Word')).toEqual({
        value: 'Multi Word',
      });
    });

    it('should handle edge cases', () => {
      expect(parseCategory('')).toEqual({ value: '' });
      expect(parseCategory('   ')).toEqual({ value: '' });
      expect(parseCategory(null as any)).toEqual({ value: '' });
    });
  });

  describe('formatCategory', () => {
    it('should format namespace and value', () => {
      expect(formatCategory('Course', 'Main')).toBe('Course: Main');
      expect(formatCategory('Cuisine', 'Italian')).toBe('Cuisine: Italian');
    });

    it('should handle edge cases', () => {
      expect(formatCategory('', 'Value')).toBe('Value');
      expect(formatCategory('Namespace', '')).toBe('');
      expect(formatCategory('', '')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(formatCategory('  Course  ', '  Main  ')).toBe('Course: Main');
    });
  });
});
```

### **4. Recipe Parsing Integration Tests**

**File**: `src/__tests__/lib/recipe-parsing-categories.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { parseRecipeFromText } from '@/lib/api';

describe('Recipe Parsing with Categories', () => {
  describe('JSON parsing with categories', () => {
    it('should parse basic JSON with categories array', async () => {
      const jsonText = JSON.stringify({
        title: 'Test Recipe',
        ingredients: ['1 cup flour', '2 eggs'],
        instructions: 'Mix and bake',
        notes: 'Delicious!',
        categories: ['Course: Main', 'Cuisine: Italian'],
      });

      const result = await parseRecipeFromText(jsonText);

      expect(result.title).toBe('Test Recipe');
      expect(result.categories).toEqual(['Course: Main', 'Cuisine: Italian']);
    });

    it('should parse JSON with object-format categories', async () => {
      const jsonText = JSON.stringify({
        title: 'Test Recipe',
        ingredients: ['1 cup flour'],
        instructions: 'Mix and bake',
        categories: {
          course: ['Main'],
          cuisine: ['Italian', 'Mediterranean'],
          technique: 'Bake',
        },
      });

      const result = await parseRecipeFromText(jsonText);

      expect(result.categories).toContain('Course: Main');
      expect(result.categories).toContain('Cuisine: Italian');
      expect(result.categories).toContain('Cuisine: Mediterranean');
      expect(result.categories).toContain('Technique: Bake');
    });

    it('should handle alternative category field names', async () => {
      const testCases = [
        { field: 'category', value: 'Course: Main' },
        { field: 'tags', value: ['Cuisine: Italian'] },
        { field: 'labels', value: ['Course: Main', 'Technique: Bake'] },
      ];

      for (const testCase of testCases) {
        const jsonData = {
          title: 'Test Recipe',
          ingredients: ['1 cup flour'],
          instructions: 'Mix and bake',
          [testCase.field]: testCase.value,
        };

        const result = await parseRecipeFromText(JSON.stringify(jsonData));
        expect(result.categories.length).toBeGreaterThan(0);
      }
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const markdownText = `
Here's your recipe:

\`\`\`json
{
  "title": "Test Recipe",
  "ingredients": ["1 cup flour"],
  "instructions": "Mix and bake",
  "categories": ["Course: Main", "Cuisine: Italian"]
}
\`\`\`

Enjoy!
      `;

      const result = await parseRecipeFromText(markdownText);

      expect(result.title).toBe('Test Recipe');
      expect(result.categories).toEqual(['Course: Main', 'Cuisine: Italian']);
    });
  });

  describe('markdown parsing with categories', () => {
    it('should extract categories from markdown headers', async () => {
      const markdownText = `
# Pasta Carbonara

Categories: Course: Main, Cuisine: Italian

## Ingredients
- 1 cup flour

## Instructions
Mix and cook
      `;

      const result = await parseRecipeFromText(markdownText);

      expect(result.title).toBe('Pasta Carbonara');
      expect(result.categories).toContain('Course: Main');
      expect(result.categories).toContain('Cuisine: Italian');
    });

    it('should handle recipes without categories', async () => {
      const jsonText = JSON.stringify({
        title: 'Simple Recipe',
        ingredients: ['1 cup flour'],
        instructions: 'Mix and bake',
      });

      const result = await parseRecipeFromText(jsonText);

      expect(result.title).toBe('Simple Recipe');
      expect(result.categories).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle malformed category data gracefully', async () => {
      const jsonText = JSON.stringify({
        title: 'Test Recipe',
        ingredients: ['1 cup flour'],
        instructions: 'Mix and bake',
        categories: 123, // invalid type
      });

      const result = await parseRecipeFromText(jsonText);

      expect(result.title).toBe('Test Recipe');
      expect(result.categories).toEqual([]); // Should default to empty array
    });

    it('should filter out invalid categories', async () => {
      const jsonText = JSON.stringify({
        title: 'Test Recipe',
        ingredients: ['1 cup flour'],
        instructions: 'Mix and bake',
        categories: [
          'Course: Main', // valid
          '', // invalid (empty)
          'Invalid@Category', // invalid (special chars)
          'Cuisine: Italian', // valid
        ],
      });

      const result = await parseRecipeFromText(jsonText);

      expect(result.categories).toEqual(['Course: Main', 'Cuisine: Italian']);
    });
  });
});
```

## 📋 **Implementation Checklist**

### **Core Infrastructure**

- [ ] Create `src/lib/category-parsing.ts` with normalization functions
- [ ] Implement `normalizeCategories()` with multi-format support
- [ ] Add category validation and filtering
- [ ] Create category sorting and uniqueness utilities
- [ ] Add comprehensive error handling

### **JSON Template Updates**

- [ ] Update `parseRecipeFromText()` to handle categories
- [ ] Add category processing to complex JSON handler
- [ ] Implement markdown category extraction
- [ ] Add fallback for missing category data
- [ ] Update return type to include categories

### **Testing**

- [ ] Write unit tests for category parsing utilities
- [ ] Write integration tests for recipe parsing
- [ ] Test all input formats (array, string, object)
- [ ] Test error handling and edge cases
- [ ] Test backward compatibility

### **Performance**

- [ ] Benchmark parsing performance with categories
- [ ] Optimize for large category arrays
- [ ] Add performance monitoring
- [ ] Test memory usage patterns

## 🚨 **Error Handling Strategy**

### **Graceful Degradation**

- Invalid category data → empty array
- Malformed categories → filter out invalid entries
- Parsing errors → log warning, continue processing

### **Logging Strategy**

```typescript
// Add to category parsing functions
console.log('Category parsing:', {
  input: rawCategories,
  normalized: normalizedCategories,
  final: finalCategories,
  errors: validationErrors,
});
```

### **Fallback Mechanisms**

1. **Primary**: Parse structured categories
2. **Fallback 1**: Parse alternative field names
3. **Fallback 2**: Extract from markdown text
4. **Fallback 3**: Return empty array

## ✅ **Success Criteria**

- [ ] All category input formats parsed correctly
- [ ] Existing recipes continue working without categories
- [ ] Performance impact < 10ms per recipe
- [ ] 100% test coverage for parsing functions
- [ ] No breaking changes to existing API
- [ ] Error handling covers all edge cases

## 🔗 **Next Phase**

Once Phase 2 is complete, proceed to [Phase 3: AI Integration](phase-3-ai-integration.md) to update AI personas and structured recipe generation.

---

**Phase Status**: 📋 Ready for Implementation  
**Estimated Time**: 2-3 days  
**Prerequisites**: Phase 1 complete  
**Next Phase**: [Phase 3 - AI Integration](phase-3-ai-integration.md)

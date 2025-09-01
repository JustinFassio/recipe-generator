import { describe, it, expect } from 'vitest';
import { recipeSchema } from '@/lib/schemas';
import {
  isValidCategory,
  isNamespacedCategory,
  parseCategory,
  formatCategory,
  uniqueCategories,
  sortCategories,
  validateCategory,
  validateCategories,
  filterCategoriesByNamespace,
  getCategoryNamespaces,
  getCategoryStats,
  normalizeCategoryCase,
  normalizeCategories,
} from '@/lib/category-types';

describe('Category Schema Validation', () => {
  describe('recipeSchema with categories', () => {
    const baseRecipe = {
      title: 'Test Recipe',
      ingredients: ['Test ingredient'],
      instructions: 'Test instructions',
      notes: '',
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

    it('should reject recipe with invalid categories', () => {
      const recipe = {
        ...baseRecipe,
        categories: ['Course: Main', ''], // Empty category
      };

      expect(() => recipeSchema.parse(recipe)).toThrow();
    });

    it('should reject recipe with too many categories', () => {
      const recipe = {
        ...baseRecipe,
        categories: [
          'Course: Main',
          'Cuisine: Italian',
          'Technique: Bake',
          'Collection: High-Protein',
          'Difficulty: Intermediate',
          'Occasion: Weeknight',
          'Extra: Category', // 7th category should fail
        ],
      };

      expect(() => recipeSchema.parse(recipe)).toThrow();
    });

    it('should reject recipe with category that is too long', () => {
      const longCategory = 'A'.repeat(51); // 51 characters (MAX_CATEGORY_LENGTH + 1)
      const recipe = {
        ...baseRecipe,
        categories: [longCategory],
      };

      expect(() => recipeSchema.parse(recipe)).toThrow();
    });
  });
});

describe('Category Type Utilities', () => {
  describe('isValidCategory', () => {
    it('should validate correct categories', () => {
      expect(isValidCategory('Course: Main')).toBe(true);
      expect(isValidCategory('Simple Category')).toBe(true);
      expect(isValidCategory('Multi-Word Category Name')).toBe(true);
      expect(isValidCategory('Category with numbers 123')).toBe(true);
    });

    it('should reject invalid categories', () => {
      expect(isValidCategory('')).toBe(false);
      expect(isValidCategory(null)).toBe(false);
      expect(isValidCategory(123)).toBe(false);
      expect(isValidCategory('Invalid@Category')).toBe(false);
      expect(isValidCategory('A'.repeat(51))).toBe(false); // Too long (MAX_CATEGORY_LENGTH + 1)
    });
  });

  describe('isNamespacedCategory', () => {
    it('should identify namespaced categories', () => {
      expect(isNamespacedCategory('Course: Main')).toBe(true);
      expect(isNamespacedCategory('Cuisine: Italian')).toBe(true);
      expect(isNamespacedCategory('Technique: Bake')).toBe(true);
    });

    it('should reject non-namespaced categories', () => {
      expect(isNamespacedCategory('Simple Category')).toBe(false);
      expect(isNamespacedCategory('Category: With: Too: Many: Colons')).toBe(
        false
      );
      expect(isNamespacedCategory('')).toBe(false);
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
      expect(parseCategory('Multi Word Category')).toEqual({
        value: 'Multi Word Category',
      });
    });

    it('should handle whitespace', () => {
      expect(parseCategory('  Course :  Main  ')).toEqual({
        namespace: 'Course',
        value: 'Main',
      });
    });
  });

  describe('formatCategory', () => {
    it('should format category correctly', () => {
      expect(formatCategory('Course', 'Main')).toBe('Course: Main');
      expect(formatCategory('  Cuisine  ', '  Italian  ')).toBe(
        'Cuisine: Italian'
      );
    });
  });

  describe('uniqueCategories', () => {
    it('should remove duplicates', () => {
      const input = ['Course: Main', 'Course: Main', 'Cuisine: Italian'];
      const expected = ['Course: Main', 'Cuisine: Italian'];
      expect(uniqueCategories(input)).toEqual(expected);
    });

    it('should filter empty strings', () => {
      const input = ['Course: Main', '', 'Cuisine: Italian', null as unknown];
      const expected = ['Course: Main', 'Cuisine: Italian'];
      expect(uniqueCategories(input)).toEqual(expected);
    });

    it('should preserve order', () => {
      const input = ['A', 'B', 'A', 'C'];
      const expected = ['A', 'B', 'C'];
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
      expect(result[2]).toBe('Another Simple');
      expect(result[3]).toBe('Simple');
    });

    it('should sort alphabetically within groups', () => {
      const input = [
        'Cuisine: Italian',
        'Course: Main',
        'Course: Appetizer',
        'Cuisine: Mexican',
      ];
      const result = sortCategories(input);

      expect(result[0]).toBe('Course: Appetizer');
      expect(result[1]).toBe('Course: Main');
      expect(result[2]).toBe('Cuisine: Italian');
      expect(result[3]).toBe('Cuisine: Mexican');
    });
  });

  describe('validateCategory', () => {
    it('should validate correct categories', () => {
      expect(validateCategory('Course: Main')).toBe(true);
      expect(validateCategory('Simple Category')).toBe(true);
      expect(validateCategory('Category with numbers 123')).toBe(true);
    });

    it('should reject invalid categories', () => {
      expect(validateCategory('')).toBe(false);
      expect(validateCategory('Invalid@Category')).toBe(false);
      expect(validateCategory('Category: With: Too: Many: Colons')).toBe(false);
      expect(validateCategory('A'.repeat(51))).toBe(false); // MAX_CATEGORY_LENGTH + 1
    });

    it('should validate namespaced categories properly', () => {
      expect(validateCategory('Course: Main')).toBe(true);
      expect(validateCategory('Course:')).toBe(false); // Missing value
      expect(validateCategory(': Main')).toBe(false); // Missing namespace
    });
  });

  describe('validateCategories', () => {
    it('should separate valid and invalid categories', () => {
      const input = [
        'Course: Main',
        'Invalid@Category',
        'Cuisine: Italian',
        '',
        'Simple Category',
      ];

      const result = validateCategories(input);

      expect(result.valid).toEqual([
        'Course: Main',
        'Cuisine: Italian',
        'Simple Category',
      ]);
      expect(result.invalid).toEqual(['Invalid@Category', '']);
    });
  });

  describe('filterCategoriesByNamespace', () => {
    it('should filter by namespace', () => {
      const categories = [
        'Course: Main',
        'Course: Appetizer',
        'Cuisine: Italian',
        'Technique: Bake',
      ];

      const courseCategories = filterCategoriesByNamespace(
        categories,
        'Course'
      );
      expect(courseCategories).toEqual(['Course: Main', 'Course: Appetizer']);

      const cuisineCategories = filterCategoriesByNamespace(
        categories,
        'Cuisine'
      );
      expect(cuisineCategories).toEqual(['Cuisine: Italian']);
    });

    it('should be case insensitive', () => {
      const categories = ['Course: Main', 'Cuisine: Italian'];

      const result = filterCategoriesByNamespace(categories, 'course');
      expect(result).toEqual(['Course: Main']);
    });

    it('should return empty array for non-existent namespace', () => {
      const categories = ['Course: Main', 'Cuisine: Italian'];

      const result = filterCategoriesByNamespace(categories, 'NonExistent');
      expect(result).toEqual([]);
    });
  });

  describe('getCategoryNamespaces', () => {
    it('should extract unique namespaces', () => {
      const categories = [
        'Course: Main',
        'Course: Appetizer',
        'Cuisine: Italian',
        'Technique: Bake',
        'Simple Category', // Should be ignored
      ];

      const namespaces = getCategoryNamespaces(categories);
      expect(namespaces).toEqual(['Course', 'Cuisine', 'Technique']);
    });

    it('should return empty array for no namespaced categories', () => {
      const categories = ['Simple Category', 'Another Simple'];

      const namespaces = getCategoryNamespaces(categories);
      expect(namespaces).toEqual([]);
    });
  });

  describe('getCategoryStats', () => {
    it('should calculate category statistics', () => {
      const categories = [
        'Course: Main',
        'Course: Appetizer',
        'Cuisine: Italian',
        'Simple Category',
        'Another Simple',
      ];

      const stats = getCategoryStats(categories);

      expect(stats.total).toBe(5);
      expect(stats.namespaced).toBe(3);
      expect(stats.simple).toBe(2);
      expect(stats.namespaces).toEqual({
        Course: 2,
        Cuisine: 1,
      });
    });
  });

  describe('normalizeCategoryCase', () => {
    it('should normalize namespaced categories', () => {
      expect(normalizeCategoryCase('course: main')).toBe('Course: Main');
      expect(normalizeCategoryCase('CUISINE: ITALIAN')).toBe(
        'Cuisine: Italian'
      );
      expect(normalizeCategoryCase('technique: air_fryer')).toBe(
        'Technique: Air Fryer'
      );
    });

    it('should handle simple categories', () => {
      expect(normalizeCategoryCase('simple category')).toBe('simple category');
      expect(normalizeCategoryCase('SIMPLE CATEGORY')).toBe('SIMPLE CATEGORY');
    });
  });

  describe('normalizeCategories', () => {
    it('should normalize multiple categories', () => {
      const input = ['course: main', 'cuisine: italian', 'simple category'];

      const result = normalizeCategories(input);
      expect(result).toEqual([
        'Course: Main',
        'Cuisine: Italian',
        'simple category',
      ]);
    });

    it('should filter empty categories', () => {
      const input = ['Course: Main', '', 'Cuisine: Italian', null as unknown];

      const result = normalizeCategories(input);
      expect(result).toEqual(['Course: Main', 'Cuisine: Italian']);
    });
  });
});

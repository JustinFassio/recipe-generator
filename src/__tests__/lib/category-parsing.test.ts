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
      const expected = ['Course: Main', 'Cuisine: Italian', 'TECHNIQUE: BAKE'];
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
        'Technique: Bake',
        'Technique: Roast',
        'Cuisine: Italian',
      ];
      expect(normalizeCategories(input)).toEqual(expected);
    });

    it('should handle null/undefined input', () => {
      expect(normalizeCategories(null)).toEqual([]);
      expect(normalizeCategories(undefined)).toEqual([]);
      expect(normalizeCategories('')).toEqual([]);
    });

    it('should handle malformed input gracefully', () => {
      expect(normalizeCategories(123 as unknown)).toEqual([]);
      expect(normalizeCategories(true as unknown)).toEqual([]);
      expect(normalizeCategories({ invalid: null })).toEqual([]);
    });

    it('should normalize object with mixed value types', () => {
      const input = {
        course: 'Main',
        cuisine: ['Italian', 'Mediterranean'],
        technique: 'Bake',
        occasion: ['Holiday', 'Weekend'],
      };
      const result = normalizeCategories(input);

      expect(result).toContain('Course: Main');
      expect(result).toContain('Cuisine: Italian');
      expect(result).toContain('Cuisine: Mediterranean');
      expect(result).toContain('Technique: Bake');
      expect(result).toContain('Occasion: Holiday');
      expect(result).toContain('Occasion: Weekend');
    });

    it('should handle namespaced categories with underscores and hyphens', () => {
      const input = [
        'dish_type: main_course',
        'cooking-technique: pan_fry',
        'cuisine: italian-american',
      ];
      const expected = [
        'Dish Type: Main Course',
        'Cooking Technique: Pan Fry',
        'Cuisine: Italian American',
      ];
      expect(normalizeCategories(input)).toEqual(expected);
    });
  });

  describe('validateCategory', () => {
    it('should validate correct categories', () => {
      expect(validateCategory('Course: Main')).toBe(true);
      expect(validateCategory('Simple Category')).toBe(true);
      expect(validateCategory('Multi-Word Category Name')).toBe(true);
      expect(validateCategory('Category-With-Hyphens')).toBe(true);
      expect(validateCategory('Category With, Commas')).toBe(true);
    });

    it('should reject invalid categories', () => {
      expect(validateCategory('')).toBe(false);
      expect(validateCategory('   ')).toBe(false);
      expect(validateCategory('a'.repeat(101))).toBe(false);
      expect(validateCategory('Invalid@Category')).toBe(false);
      expect(validateCategory('Too:Many:Colons')).toBe(false);
      expect(validateCategory(null as unknown)).toBe(false);
      expect(validateCategory('Category:')).toBe(false); // Missing value
      expect(validateCategory(': Value')).toBe(false); // Missing namespace
    });

    it('should validate namespaced categories properly', () => {
      expect(validateCategory('Course: Main')).toBe(true);
      expect(validateCategory('Cuisine: Italian')).toBe(true);
      expect(validateCategory('Technique: Bake')).toBe(true);
      expect(validateCategory('Course:')).toBe(false);
      expect(validateCategory(': Main')).toBe(false);
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

    it('should normalize categories during deduplication', () => {
      const input = [
        'course: main',
        'Course: Main',
        'COURSE: MAIN',
        'cuisine: italian',
        'Cuisine: Italian',
      ];

      const result = uniqueValidCategories(input);
      expect(result).toHaveLength(3);
      expect(result).toContain('Course: Main');
      expect(result).toContain('Cuisine: Italian');
      expect(result).toContain('COURSE: MAIN');
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

    it('should handle categories without namespaces', () => {
      const input = [
        'Simple Category',
        'Course: Main',
        'Another Simple',
        'Cuisine: Italian',
      ];

      const result = sortCategories(input);

      // Namespaced categories should come first
      expect(result[0]).toBe('Course: Main');
      expect(result[1]).toBe('Cuisine: Italian');

      // Then simple categories alphabetically
      expect(result).toContain('Another Simple');
      expect(result).toContain('Simple Category');
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
      expect(parseCategory(null as unknown)).toEqual({ value: '' });
    });

    it('should handle whitespace in namespaced categories', () => {
      expect(parseCategory('  Course  :  Main  ')).toEqual({
        namespace: 'Course',
        value: 'Main',
      });
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

  describe('error handling', () => {
    it('should handle malformed object input gracefully', () => {
      const input = {
        course: null,
        cuisine: undefined,
        technique: 123,
        valid: 'Bake',
      };

      const result = normalizeCategories(input);
      expect(result).toContain('Valid: Bake');
      expect(result.length).toBe(1);
    });

    it('should handle array with mixed types', () => {
      const input = [
        'Course: Main',
        null,
        undefined,
        '',
        'Cuisine: Italian',
        123,
        true,
      ];

      const result = normalizeCategories(input);
      expect(result).toEqual(['Course: Main', 'Cuisine: Italian']);
    });
  });
});

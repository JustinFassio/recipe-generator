import { describe, it, expect } from 'vitest';
import { recipeSchema, recipeFormSchema } from '@/lib/schemas';

describe('Recipe Schemas', () => {
  describe('recipeSchema', () => {
    it('should validate recipe with description', () => {
      const validRecipe = {
        title: 'Test Recipe',
        description: 'A delicious, creamy pasta dish',
        ingredients: ['pasta', 'cream'],
        instructions: 'Cook the pasta',
        notes: 'Great recipe!',
        categories: ['Course: Main'],
      };

      const result = recipeSchema.safeParse(validRecipe);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('A delicious, creamy pasta dish');
      }
    });

    it('should default description to empty string when not provided', () => {
      const recipeWithoutDescription = {
        title: 'Test Recipe',
        ingredients: ['pasta', 'cream'],
        instructions: 'Cook the pasta',
        notes: 'Great recipe!',
        categories: ['Course: Main'],
      };

      const result = recipeSchema.safeParse(recipeWithoutDescription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });

    it('should validate empty description', () => {
      const recipeWithEmptyDescription = {
        title: 'Test Recipe',
        description: '',
        ingredients: ['pasta', 'cream'],
        instructions: 'Cook the pasta',
        notes: 'Great recipe!',
        categories: ['Course: Main'],
      };

      const result = recipeSchema.safeParse(recipeWithEmptyDescription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });
  });

  describe('recipeFormSchema', () => {
    it('should validate form data with description', () => {
      const validFormData = {
        title: 'Test Recipe',
        description: 'A delicious, creamy pasta dish',
        ingredients: ['pasta', 'cream'],
        instructions: 'Cook the pasta',
        notes: 'Great recipe!',
        setup: ['Prep time: 10 minutes'],
        categories: ['Course: Main'],
        creator_rating: 5,
      };

      const result = recipeFormSchema.safeParse(validFormData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('A delicious, creamy pasta dish');
      }
    });

    it('should default description to empty string when not provided in form', () => {
      const formWithoutDescription = {
        title: 'Test Recipe',
        ingredients: ['pasta', 'cream'],
        instructions: 'Cook the pasta',
        notes: 'Great recipe!',
        setup: ['Prep time: 10 minutes'],
        categories: ['Course: Main'],
        creator_rating: 5,
      };

      const result = recipeFormSchema.safeParse(formWithoutDescription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });

    it('should require title', () => {
      const invalidFormData = {
        description: 'A delicious, creamy pasta dish',
        ingredients: ['pasta', 'cream'],
        instructions: 'Cook the pasta',
        notes: 'Great recipe!',
        setup: ['Prep time: 10 minutes'],
        categories: ['Course: Main'],
        creator_rating: 5,
      };

      const result = recipeFormSchema.safeParse(invalidFormData);
      expect(result.success).toBe(false);
    });

    it('should require at least one ingredient', () => {
      const invalidFormData = {
        title: 'Test Recipe',
        description: 'A delicious, creamy pasta dish',
        ingredients: [],
        instructions: 'Cook the pasta',
        notes: 'Great recipe!',
        setup: ['Prep time: 10 minutes'],
        categories: ['Course: Main'],
        creator_rating: 5,
      };

      const result = recipeFormSchema.safeParse(invalidFormData);
      expect(result.success).toBe(false);
    });

    it('should require instructions', () => {
      const invalidFormData = {
        title: 'Test Recipe',
        description: 'A delicious, creamy pasta dish',
        ingredients: ['pasta', 'cream'],
        instructions: '',
        notes: 'Great recipe!',
        setup: ['Prep time: 10 minutes'],
        categories: ['Course: Main'],
        creator_rating: 5,
      };

      const result = recipeFormSchema.safeParse(invalidFormData);
      expect(result.success).toBe(false);
    });
  });
});

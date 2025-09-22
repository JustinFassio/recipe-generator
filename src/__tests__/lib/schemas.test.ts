import { describe, it, expect } from 'vitest';
import { recipeSchema, parseRecipeSchema } from '@/lib/schemas';

describe('recipeSchema', () => {
  it('should validate a valid recipe', () => {
    const validRecipe = {
      title: 'Test Recipe',
      ingredients: ['ingredient 1', 'ingredient 2'],
      instructions: 'Test instructions',
      notes: 'Test notes',
      image_url: 'https://example.com/image.jpg',
      categories: ['Italian', 'Quick'],
    };

    const result = recipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  it('should enforce maximum categories limit', () => {
    const invalidRecipe = {
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      instructions: 'Test instructions',
      notes: 'Test notes',
      categories: ['Cat1', 'Cat2', 'Cat3', 'Cat4', 'Cat5', 'Cat6', 'Cat7'], // 7 categories
    };

    const result = recipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['categories']);
      expect(result.error.issues[0].message).toContain(
        'Maximum 6 categories allowed'
      );
    }
  });

  it('should enforce maximum category length', () => {
    const invalidRecipe = {
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      instructions: 'Test instructions',
      notes: 'Test notes',
      categories: ['A'.repeat(51)], // 51 characters
    };

    const result = recipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['categories', 0]);
      expect(result.error.issues[0].message).toContain('50 characters or less');
    }
  });

  it('should require title', () => {
    const invalidRecipe = {
      ingredients: ['ingredient 1'],
      instructions: 'Test instructions',
      notes: 'Test notes',
      categories: [],
    };

    const result = recipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['title']);
    }
  });

  it('should require at least one ingredient', () => {
    const invalidRecipe = {
      title: 'Test Recipe',
      ingredients: [],
      instructions: 'Test instructions',
      notes: 'Test notes',
      categories: [],
    };

    const result = recipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['ingredients']);
    }
  });

  it('should not allow empty ingredient strings', () => {
    const invalidRecipe = {
      title: 'Test Recipe',
      ingredients: ['ingredient 1', '', 'ingredient 3'],
      instructions: 'Test instructions',
      notes: 'Test notes',
      categories: [],
    };

    const result = recipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['ingredients', 1]);
    }
  });

  it('should require instructions', () => {
    const invalidRecipe = {
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      notes: 'Test notes',
      categories: [],
    };

    const result = recipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['instructions']);
    }
  });

  it('should allow empty notes', () => {
    const validRecipe = {
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      instructions: 'Test instructions',
      notes: '',
      categories: [],
    };

    const result = recipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  it('should allow optional image_url', () => {
    const validRecipe = {
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      instructions: 'Test instructions',
      notes: 'Test notes',
      categories: [],
    };

    const result = recipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });
});

describe('parseRecipeSchema', () => {
  it('should validate valid recipe text', () => {
    const validData = {
      recipeText: 'This is a recipe text that should be parsed.',
    };

    const result = parseRecipeSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should require recipeText', () => {
    const invalidData = {};

    const result = parseRecipeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['recipeText']);
    }
  });

  it('should not allow empty recipeText', () => {
    const invalidData = {
      recipeText: '',
    };

    const result = parseRecipeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['recipeText']);
    }
  });

  it('should handle whitespace-only recipeText', () => {
    const invalidData = {
      recipeText: '   \n\t   ',
    };

    const result = parseRecipeSchema.safeParse(invalidData);
    // Note: Zod's min(1) doesn't trim whitespace by default, so this might pass
    // We'll test the actual behavior - it should pass since whitespace is still a string
    expect(result.success).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { generateImagePrompt, canGenerateImage, extractVisualElements } from '@/lib/ai-image-utils';
import type { Recipe } from '@/lib/types';

describe('AI Image Utils', () => {
  describe('generateImagePrompt', () => {
    it('should use recipe description when available', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Test Recipe',
        description: 'A delicious, creamy pasta dish with fresh herbs',
        ingredients: ['pasta', 'cream', 'herbs'],
        instructions: 'Cook pasta',
        notes: 'Test notes',
        image_url: null,
        categories: ['Course: Main', 'Cuisine: Italian'],
        setup: ['Prep time: 10 minutes'],
        cooking_time: null,
        difficulty: null,
        user_id: 'user1',
        is_public: false,
        creator_rating: null,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
        current_version_id: null,
      };

      const prompt = generateImagePrompt(recipe);
      expect(prompt).toContain('A delicious, creamy pasta dish with fresh herbs');
      expect(prompt).toContain('Italian style');
      expect(prompt).toContain('appetizing');
    });

    it('should fallback to title when description is empty', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Chocolate Cake',
        description: '',
        ingredients: ['chocolate', 'flour'],
        instructions: 'Bake cake',
        notes: '',
        image_url: null,
        categories: [],
        setup: [],
        cooking_time: null,
        difficulty: null,
        user_id: 'user1',
        is_public: false,
        creator_rating: null,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
        current_version_id: null,
      };

      const prompt = generateImagePrompt(recipe);
      expect(prompt).toContain('A delicious chocolate cake');
      expect(prompt).toContain('appetizing');
    });

    it('should include cuisine and technique context from categories', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Grilled Salmon',
        description: 'Fresh salmon with herbs',
        ingredients: ['salmon', 'herbs'],
        instructions: 'Grill salmon',
        notes: '',
        image_url: null,
        categories: ['Course: Main', 'Cuisine: Mediterranean', 'Technique: Grilled'],
        setup: ['Cook time: 15 minutes'],
        cooking_time: null,
        difficulty: null,
        user_id: 'user1',
        is_public: false,
        creator_rating: null,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
        current_version_id: null,
      };

      const prompt = generateImagePrompt(recipe);
      expect(prompt).toContain('Mediterranean style');
      expect(prompt).toContain('Grilled');
    });
  });

  describe('canGenerateImage', () => {
    it('should return true for recipes with title and description', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Test Recipe',
        description: 'A delicious recipe',
        ingredients: ['ingredient1'],
        instructions: 'Cook it',
        notes: '',
        image_url: null,
        categories: [],
        setup: [],
        cooking_time: null,
        difficulty: null,
        user_id: 'user1',
        is_public: false,
        creator_rating: null,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
        current_version_id: null,
      };

      expect(canGenerateImage(recipe)).toBe(true);
    });

    it('should return true for recipes with title and ingredients', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Test Recipe',
        description: null,
        ingredients: ['ingredient1'],
        instructions: 'Cook it',
        notes: '',
        image_url: null,
        categories: [],
        setup: [],
        cooking_time: null,
        difficulty: null,
        user_id: 'user1',
        is_public: false,
        creator_rating: null,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
        current_version_id: null,
      };

      expect(canGenerateImage(recipe)).toBe(true);
    });

    it('should return false for recipes without title', () => {
      const recipe: Recipe = {
        id: '1',
        title: '',
        description: 'A delicious recipe',
        ingredients: ['ingredient1'],
        instructions: 'Cook it',
        notes: '',
        image_url: null,
        categories: [],
        setup: [],
        cooking_time: null,
        difficulty: null,
        user_id: 'user1',
        is_public: false,
        creator_rating: null,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
        current_version_id: null,
      };

      expect(canGenerateImage(recipe)).toBe(false);
    });
  });

  describe('extractVisualElements', () => {
    it('should extract main ingredients', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Test Recipe',
        description: null,
        ingredients: ['pasta, cooked', 'tomatoes, diced', 'cheese, grated'],
        instructions: 'Mix ingredients',
        notes: '',
        image_url: null,
        categories: [],
        setup: [],
        cooking_time: null,
        difficulty: null,
        user_id: 'user1',
        is_public: false,
        creator_rating: null,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
        current_version_id: null,
      };

      const elements = extractVisualElements(recipe);
      expect(elements).toContain('pasta');
      expect(elements).toContain('tomatoes');
      expect(elements).toContain('cheese');
    });

    it('should extract cooking methods from setup', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Test Recipe',
        description: null,
        ingredients: ['ingredient1'],
        instructions: 'Cook it',
        notes: '',
        image_url: null,
        categories: [],
        setup: ['Bake for 30 minutes', 'Prep time: 10 minutes'],
        cooking_time: null,
        difficulty: null,
        user_id: 'user1',
        is_public: false,
        creator_rating: null,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
        current_version_id: null,
      };

      const elements = extractVisualElements(recipe);
      expect(elements).toContain('bake');
      expect(elements).toContain('ingredient1');
    });

    it('should limit to first 5 ingredients', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Test Recipe',
        description: null,
        ingredients: ['ingredient1', 'ingredient2', 'ingredient3', 'ingredient4', 'ingredient5', 'ingredient6'],
        instructions: 'Cook it',
        notes: '',
        image_url: null,
        categories: [],
        setup: [],
        cooking_time: null,
        difficulty: null,
        user_id: 'user1',
        is_public: false,
        creator_rating: null,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
        current_version_id: null,
      };

      const elements = extractVisualElements(recipe);
      expect(elements).toHaveLength(5);
      expect(elements).toContain('ingredient1');
      expect(elements).toContain('ingredient5');
      expect(elements).not.toContain('ingredient6');
    });
  });
});

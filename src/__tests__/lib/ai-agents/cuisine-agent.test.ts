import { describe, it, expect } from 'vitest';
import { generateRecipeJSON } from '@/lib/ai-agents/cuisine-agent';

describe('CuisineAgent', () => {
  describe('generateRecipeJSON', () => {
    it('should generate a complete recipe JSON with prep field for Mexican cuisine', () => {
      const recipe = generateRecipeJSON('Mexican', 'Main');

      expect(recipe).toHaveProperty('title');
      expect(recipe).toHaveProperty('ingredients');
      expect(recipe).toHaveProperty('instructions');
      expect(recipe).toHaveProperty('setup');
      expect(recipe).toHaveProperty('categories');
      expect(recipe).toHaveProperty('notes');

      // Check title format
      expect(recipe.title).toBe('Mexican Main Recipe');

      // Check ingredients structure with prep field
      expect(Array.isArray(recipe.ingredients)).toBe(true);
      recipe.ingredients.forEach((ingredient) => {
        expect(ingredient).toHaveProperty('item');
        expect(ingredient).toHaveProperty('amount');
        expect(ingredient).toHaveProperty('prep');
        expect(typeof ingredient.item).toBe('string');
        expect(typeof ingredient.amount).toBe('string');
        expect(typeof ingredient.prep).toBe('string');
      });

      // Check instructions
      expect(Array.isArray(recipe.instructions)).toBe(true);
      expect(recipe.instructions.length).toBeGreaterThan(0);

      // Check setup
      expect(Array.isArray(recipe.setup)).toBe(true);
      expect(recipe.setup.length).toBeGreaterThan(0);

      // Check categories
      expect(Array.isArray(recipe.categories)).toBe(true);
      expect(recipe.categories.length).toBeGreaterThan(0);

      // Check notes
      expect(typeof recipe.notes).toBe('string');
      expect(recipe.notes.length).toBeGreaterThan(0);
    });

    it('should generate a complete recipe JSON with prep field for Italian cuisine', () => {
      const recipe = generateRecipeJSON('Italian', 'Appetizer');

      expect(recipe.title).toBe('Italian Appetizer Recipe');

      // Check that ingredients have prep instructions
      const hasPrepInstructions = recipe.ingredients.some(
        (ing) => ing.prep && ing.prep.length > 0
      );
      expect(hasPrepInstructions).toBe(true);

      // Check that setup includes prep time
      const hasPrepTime = recipe.setup.some((setup) =>
        setup.includes('Prep time')
      );
      expect(hasPrepTime).toBe(true);
    });

    it('should generate a complete recipe JSON with prep field for Chinese cuisine', () => {
      const recipe = generateRecipeJSON('Chinese', 'Side');

      expect(recipe.title).toBe('Chinese Side Recipe');

      // Check that ingredients have prep instructions (some may be default)
      recipe.ingredients.forEach((ingredient) => {
        expect(ingredient.prep).toBeDefined();
        expect(ingredient.prep.length).toBeGreaterThan(0);
      });

      // Check that at least some ingredients have specific prep instructions
      const hasSpecificPrep = recipe.ingredients.some(
        (ing) =>
          ing.prep !== 'Wash and prepare as needed' && ing.prep.length > 10
      );
      expect(hasSpecificPrep).toBe(true);

      // Check that instructions include technique-specific guidance
      const hasTechniqueGuidance = recipe.instructions.some(
        (instruction) =>
          instruction.includes('high heat') || instruction.includes('wok')
      );
      expect(hasTechniqueGuidance).toBe(true);
    });

    it('should throw error for unknown cuisine', () => {
      expect(() => {
        generateRecipeJSON('UnknownCuisine', 'Main');
      }).toThrow('No context found for cuisine: UnknownCuisine');
    });

    it('should include regional staples in ingredients', () => {
      const recipe = generateRecipeJSON('Mexican', 'Main');

      // Check for common regional staples
      const hasOnion = recipe.ingredients.some((ing) =>
        ing.item.toLowerCase().includes('onion')
      );
      const hasGarlic = recipe.ingredients.some((ing) =>
        ing.item.toLowerCase().includes('garlic')
      );

      expect(hasOnion).toBe(true);
      expect(hasGarlic).toBe(true);
    });

    it('should generate appropriate setup steps', () => {
      const recipe = generateRecipeJSON('Thai', 'Main');

      // Check for essential setup information
      const hasPrepTime = recipe.setup.some((setup) =>
        setup.includes('Prep time')
      );
      const hasCookTime = recipe.setup.some((setup) =>
        setup.includes('Cook time')
      );
      const hasServingSize = recipe.setup.some((setup) =>
        setup.includes('Serves')
      );

      expect(hasPrepTime).toBe(true);
      expect(hasCookTime).toBe(true);
      expect(hasServingSize).toBe(true);
    });

    it('should generate cuisine-specific cooking instructions', () => {
      const recipe = generateRecipeJSON('Japanese', 'Main');

      // Check for Japanese-specific instructions
      const hasJapaneseTechniques = recipe.instructions.some(
        (instruction) =>
          instruction.includes('dashi') || instruction.includes('seasonal')
      );

      expect(hasJapaneseTechniques).toBe(true);
    });
  });
});

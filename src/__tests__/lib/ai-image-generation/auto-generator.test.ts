import {
  generateImageForRecipe,
  shouldAutoGenerateImage,
  getUserImagePreferences,
} from '@/lib/ai-image-generation/auto-generator';
import { RecipeFormData } from '@/lib/schemas';

// Mock fetch
global.fetch = vi.fn();

describe('Auto Image Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateImageForRecipe', () => {
    it('should generate image successfully', async () => {
      const recipe: RecipeFormData = {
        title: 'Delicious Pasta',
        description:
          'A rich, creamy carbonara with crispy pancetta and velvety egg sauce',
        ingredients: ['pasta', 'eggs', 'pancetta'],
        instructions: 'Cook pasta and prepare sauce...',
        notes: '',
        categories: ['Cuisine: Italian', 'Course: Main'],
        setup: [],
      };

      // Mock successful API response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            imageUrl: 'https://generated-image.jpg',
            usage: { totalCost: 0.04 },
          }),
      });

      const result = await generateImageForRecipe(recipe);

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe('https://generated-image.jpg');
      expect(result.cost).toBe(0.04);
    });

    it('should return error when disabled', async () => {
      const recipe: RecipeFormData = {
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['ingredient'],
        instructions: 'Test instructions',
      };

      const result = await generateImageForRecipe(recipe, { enabled: false });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-generation disabled');
    });

    it('should handle API errors gracefully', async () => {
      const recipe: RecipeFormData = {
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['ingredient'],
        instructions: 'Test instructions',
      };

      // Mock failed API response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: 'Rate limit exceeded',
          }),
      });

      const result = await generateImageForRecipe(recipe);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });

  describe('shouldAutoGenerateImage', () => {
    it('should return true for recipes with rich descriptions', () => {
      const recipe: RecipeFormData = {
        title: 'Delicious Pasta',
        description:
          'A rich, creamy carbonara with crispy pancetta and velvety egg sauce that will make your taste buds dance',
        ingredients: ['pasta', 'eggs', 'pancetta', 'cheese'],
        instructions:
          'First, cook the pasta according to package directions. While pasta is cooking, prepare the sauce...',
        notes: '',
        categories: ['Cuisine: Italian'],
        setup: [],
      };

      const shouldGenerate = shouldAutoGenerateImage(recipe);

      expect(shouldGenerate).toBe(true);
    });

    it('should return false when recipe already has image', () => {
      const recipe: RecipeFormData = {
        title: 'Test Recipe',
        description: 'A test recipe with rich description',
        ingredients: ['ingredient'],
        instructions: 'Test instructions that are long enough',
        image_url: 'https://existing-image.jpg',
      };

      const shouldGenerate = shouldAutoGenerateImage(recipe);

      expect(shouldGenerate).toBe(false);
    });

    it('should return false when description is too short', () => {
      const recipe: RecipeFormData = {
        title: 'Test Recipe',
        description: 'Short',
        ingredients: ['ingredient'],
        instructions: 'Test instructions that are long enough',
      };

      const shouldGenerate = shouldAutoGenerateImage(recipe);

      expect(shouldGenerate).toBe(false);
    });

    it('should return false when instructions are too short', () => {
      const recipe: RecipeFormData = {
        title: 'Test Recipe',
        description: 'A test recipe with rich description that is long enough',
        ingredients: ['ingredient'],
        instructions: 'Short',
      };

      const shouldGenerate = shouldAutoGenerateImage(recipe);

      expect(shouldGenerate).toBe(false);
    });

    it('should return false when user is manually uploading image', () => {
      const recipe: RecipeFormData = {
        title: 'Test Recipe',
        description: 'A test recipe with rich description',
        ingredients: ['ingredient'],
        instructions: 'Test instructions that are long enough',
      };

      const initialData: RecipeFormData = {
        ...recipe,
        image_url: 'https://user-uploaded-image.jpg',
      };

      const shouldGenerate = shouldAutoGenerateImage(recipe, initialData);

      expect(shouldGenerate).toBe(false);
    });
  });

  describe('getUserImagePreferences', () => {
    it('should return default preferences', async () => {
      const preferences = await getUserImagePreferences();

      expect(preferences.enabled).toBe(true);
      expect(preferences.quality).toBe('standard');
      expect(preferences.size).toBe('1024x1024');
      expect(preferences.fallbackOnError).toBe(true);
    });
  });
});

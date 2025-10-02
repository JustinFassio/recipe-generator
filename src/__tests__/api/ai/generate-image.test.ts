// Note: API endpoint tests would need to be run in a Node.js environment
// This test file focuses on the auto-generator service functionality
import { generateImageForRecipe } from '@/lib/ai-image-generation/auto-generator';

// Mock fetch
global.fetch = vi.fn();

describe('AI Image Generation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate image successfully', async () => {
    const recipe = {
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
    const recipe = {
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
    const recipe = {
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

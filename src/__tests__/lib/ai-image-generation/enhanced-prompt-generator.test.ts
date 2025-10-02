import { generateEnhancedPrompt, optimizePromptForDALLE, generatePromptVariations } from '@/lib/ai-image-generation/enhanced-prompt-generator';
import { RecipeFormData } from '@/lib/schemas';

describe('Enhanced Prompt Generator', () => {
  const mockRecipe: RecipeFormData = {
    title: 'Spaghetti Carbonara',
    description: 'A classic Italian pasta dish with eggs, cheese, and pancetta, traditionally served hot and creamy',
    ingredients: ['spaghetti', 'eggs', 'pancetta', 'pecorino cheese', 'black pepper'],
    instructions: 'Cook pasta according to package directions. While pasta is cooking, fry pancetta until crispy. Beat eggs with cheese and pepper. Drain pasta and immediately toss with pancetta and egg mixture until creamy.',
    notes: 'Serve immediately while hot',
    categories: ['Cuisine: Italian', 'Course: Main'],
    setup: ['bring large pot of water to boil'],
  };

  it('should generate enhanced prompt with full context', () => {
    const result = generateEnhancedPrompt(mockRecipe);

    expect(result.primaryPrompt).toContain('spaghetti carbonara');
    expect(result.primaryPrompt).toContain('Italian style');
    expect(result.primaryPrompt).toContain('spaghetti');
    expect(result.primaryPrompt).toContain('professional food photography');
    expect(result.primaryPrompt).toContain('appetizing');

    expect(result.metadata.cuisine).toBe('Italian');
    expect(result.metadata.complexity).toBe('moderate');
    expect(result.metadata.mainIngredients).toContain('spaghetti');
    expect(result.metadata.cookingMethods).toContain('fried');
  });

  it('should generate different prompts for different styles', () => {
    const photographicResult = generateEnhancedPrompt(mockRecipe, {
      style: 'photographic',
      mood: 'appetizing',
      focus: 'dish',
      quality: 'standard',
    });

    const artisticResult = generateEnhancedPrompt(mockRecipe, {
      style: 'artistic',
      mood: 'elegant',
      focus: 'dish',
      quality: 'hd',
    });

    expect(photographicResult.primaryPrompt).toContain('professional food photography');
    expect(artisticResult.primaryPrompt).toContain('artistic food presentation');
    expect(artisticResult.primaryPrompt).toContain('elegant and sophisticated');
  });

  it('should generate secondary prompt with simplified context', () => {
    const result = generateEnhancedPrompt(mockRecipe);

    expect(result.secondaryPrompt).toContain('A spaghetti carbonara');
    expect(result.secondaryPrompt).toContain('in Italian style');
    expect(result.secondaryPrompt).toContain('with spaghetti');
    expect(result.secondaryPrompt).toContain('professional food photography');
    expect(result.secondaryPrompt.length).toBeLessThan(result.primaryPrompt.length);
  });

  it('should generate fallback prompt with minimal context', () => {
    const result = generateEnhancedPrompt(mockRecipe);

    expect(result.fallbackPrompt).toContain('A delicious spaghetti carbonara');
    expect(result.fallbackPrompt).toContain('Italian style');
    expect(result.fallbackPrompt).toContain('appetizing');
    expect(result.fallbackPrompt).toContain('well-lit');
    expect(result.fallbackPrompt.length).toBeLessThan(result.secondaryPrompt.length);
  });

  it('should optimize prompt for DALL-E character limit', () => {
    const longPrompt = 'A'.repeat(1200);
    const optimized = optimizePromptForDALLE(longPrompt);

    expect(optimized.length).toBeLessThanOrEqual(1000);
    expect(optimized).toContain('...');
  });

  it('should not modify short prompts', () => {
    const shortPrompt = 'A delicious pasta dish';
    const optimized = optimizePromptForDALLE(shortPrompt);

    expect(optimized).toBe(shortPrompt);
  });

  it('should generate prompt variations', () => {
    const variations = generatePromptVariations(mockRecipe, {
      style: 'photographic',
      mood: 'appetizing',
      focus: 'dish',
      quality: 'standard',
    });

    expect(variations).toHaveLength(3);
    expect(variations[0].primaryPrompt).toContain('professional food photography');
    
    // Should have different styles and moods in variations
    const hasDifferentStyles = variations.some(v => 
      !v.primaryPrompt.includes('professional food photography')
    );
    expect(hasDifferentStyles).toBe(true);
  });

  it('should handle recipe with minimal information', () => {
    const minimalRecipe: RecipeFormData = {
      title: 'Simple Dish',
      description: 'Basic dish',
      ingredients: ['ingredient1'],
      instructions: 'Cook it.',
      notes: '',
      categories: [],
      setup: [],
    };

    const result = generateEnhancedPrompt(minimalRecipe);

    expect(result.primaryPrompt).toContain('simple dish');
    expect(result.primaryPrompt).toContain('professional food photography');
    expect(result.metadata.cuisine).toBeNull();
    expect(result.metadata.complexity).toBe('simple');
  });

  it('should include seasonal context when available', () => {
    const seasonalRecipe: RecipeFormData = {
      title: 'Summer Tomato Salad',
      description: 'Fresh summer salad',
      ingredients: ['tomatoes', 'basil', 'corn'],
      instructions: 'Mix ingredients.',
      notes: '',
      categories: [],
      setup: [],
    };

    const result = generateEnhancedPrompt(seasonalRecipe);

    expect(result.primaryPrompt).toContain('summer seasonal');
  });

  it('should include cooking method context', () => {
    const grilledRecipe: RecipeFormData = {
      title: 'Grilled Salmon',
      description: 'Grilled salmon fillet',
      ingredients: ['salmon', 'lemon', 'herbs'],
      instructions: 'Preheat grill and cook salmon for 4-5 minutes per side.',
      notes: '',
      categories: [],
      setup: [],
    };

    const result = generateEnhancedPrompt(grilledRecipe);

    expect(result.primaryPrompt).toContain('grilled salmon');
    expect(result.metadata.cookingMethods).toContain('grilled');
  });

  it('should handle different focus options', () => {
    const dishFocus = generateEnhancedPrompt(mockRecipe, {
      style: 'photographic',
      mood: 'appetizing',
      focus: 'dish',
      quality: 'standard',
    });

    const ingredientsFocus = generateEnhancedPrompt(mockRecipe, {
      style: 'photographic',
      mood: 'appetizing',
      focus: 'ingredients',
      quality: 'standard',
    });

    // Both should be valid prompts, focus affects internal generation logic
    expect(dishFocus.primaryPrompt).toBeDefined();
    expect(ingredientsFocus.primaryPrompt).toBeDefined();
  });
});

import { analyzeRecipeContext } from '@/lib/ai-image-generation/recipe-context-analyzer';
import { RecipeFormData } from '@/lib/schemas';

describe('Recipe Context Analyzer', () => {
  it('should analyze Italian cuisine context', () => {
    const recipe: RecipeFormData = {
      title: 'Spaghetti Carbonara',
      description: 'A classic Italian pasta dish with eggs, cheese, and pancetta',
      ingredients: ['spaghetti', 'eggs', 'pancetta', 'pecorino cheese', 'black pepper'],
      instructions: 'Cook pasta according to package directions. While pasta is cooking, fry pancetta until crispy...',
      notes: '',
      categories: ['Cuisine: Italian', 'Course: Main'],
      setup: [],
    };

    const context = analyzeRecipeContext(recipe);

    expect(context.cuisine).toEqual({
      name: 'Italian',
      region: 'Mediterranean',
      characteristics: ['fresh herbs', 'olive oil', 'simple ingredients'],
      visualElements: ['rustic presentation', 'warm colors', 'wooden surfaces'],
    });
  });

  it('should analyze cooking methods from instructions', () => {
    const recipe: RecipeFormData = {
      title: 'Grilled Chicken',
      description: 'Delicious grilled chicken breast',
      ingredients: ['chicken breast', 'olive oil', 'salt', 'pepper'],
      instructions: 'Preheat grill to medium-high heat. Season chicken and grill for 6-7 minutes per side until cooked through.',
      notes: '',
      categories: [],
      setup: [],
    };

    const context = analyzeRecipeContext(recipe);

    expect(context.cookingMethods).toHaveLength(1);
    expect(context.cookingMethods[0]).toEqual({
      method: 'grilled',
      intensity: 'high',
      visualCues: ['grill marks', 'charred edges', 'smoky appearance'],
    });
  });

  it('should analyze ingredient information', () => {
    const recipe: RecipeFormData = {
      title: 'Tomato Salad',
      description: 'Fresh tomato salad with herbs',
      ingredients: ['2 cups cherry tomatoes', '1/4 cup fresh basil', 'olive oil'],
      instructions: 'Cut tomatoes in half and mix with basil and olive oil.',
      notes: '',
      categories: [],
      setup: [],
    };

    const context = analyzeRecipeContext(recipe);

    expect(context.mainIngredients).toHaveLength(3);
    expect(context.mainIngredients[0]).toEqual({
      name: 'cherry tomatoes',
      category: 'vegetable',
      visualImportance: 'primary',
      color: ['red', 'deep red'],
      texture: ['natural'],
    });
  });

  it('should analyze dish type from categories', () => {
    const recipe: RecipeFormData = {
      title: 'Chocolate Cake',
      description: 'Rich chocolate dessert',
      ingredients: ['flour', 'cocoa powder', 'sugar', 'eggs'],
      instructions: 'Mix ingredients and bake for 30 minutes.',
      notes: '',
      categories: ['Course: Dessert'],
      setup: [],
    };

    const context = analyzeRecipeContext(recipe);

    expect(context.dishType).toEqual({
      type: 'dessert',
      presentation: 'sweet finish',
      servingStyle: 'decorative plating',
    });
  });

  it('should analyze recipe complexity', () => {
    const simpleRecipe: RecipeFormData = {
      title: 'Simple Salad',
      description: 'Basic salad',
      ingredients: ['lettuce', 'tomato'],
      instructions: 'Mix ingredients.',
      notes: '',
      categories: [],
      setup: [],
    };

    const complexRecipe: RecipeFormData = {
      title: 'Complex Stew',
      description: 'A complex multi-ingredient stew with many steps and preparation requirements',
      ingredients: ['beef', 'carrots', 'onions', 'potatoes', 'celery', 'tomatoes', 'herbs', 'spices', 'wine', 'stock', 'flour'],
      instructions: 'First, prepare all ingredients by chopping vegetables into small pieces. Then, season the beef with salt and pepper. Heat oil in a large pot and brown the beef on all sides. Remove beef and add vegetables, cooking until softened. Return beef to pot and add wine, stock, and herbs. Bring to boil, then simmer for 2 hours until meat is tender. Finally, thicken with flour and serve hot.',
      notes: 'Requires advance preparation',
      categories: ['Course: Main'],
      setup: ['chop vegetables', 'marinate beef'],
    };

    const simpleContext = analyzeRecipeContext(simpleRecipe);
    const complexContext = analyzeRecipeContext(complexRecipe);

    expect(simpleContext.complexity).toBe('simple');
    expect(complexContext.complexity).toBe('elaborate');
  });

  it('should analyze seasonal context', () => {
    const summerRecipe: RecipeFormData = {
      title: 'Summer Salad',
      description: 'Fresh summer salad',
      ingredients: ['tomatoes', 'corn', 'basil', 'zucchini'],
      instructions: 'Mix ingredients together.',
      notes: '',
      categories: [],
      setup: [],
    };

    const context = analyzeRecipeContext(summerRecipe);

    expect(context.seasonalContext).toEqual({
      season: 'summer',
      elements: ['tomato', 'tomatoes', 'corn', 'zucchini', 'basil'],
    });
  });

  it('should analyze temperature context', () => {
    const hotRecipe: RecipeFormData = {
      title: 'Hot Soup',
      description: 'Warm soup',
      ingredients: ['vegetables', 'stock'],
      instructions: 'Heat ingredients until hot and serve immediately.',
      notes: '',
      categories: [],
      setup: [],
    };

    const coldRecipe: RecipeFormData = {
      title: 'Cold Dessert',
      description: 'Chilled dessert',
      ingredients: ['cream', 'sugar'],
      instructions: 'Mix ingredients and chill in refrigerator for 2 hours.',
      notes: '',
      categories: [],
      setup: [],
    };

    const hotContext = analyzeRecipeContext(hotRecipe);
    const coldContext = analyzeRecipeContext(coldRecipe);

    expect(hotContext.temperature?.servingTemp).toBe('hot');
    expect(coldContext.temperature?.servingTemp).toBe('cold');
  });

  it('should handle missing categories gracefully', () => {
    const recipe: RecipeFormData = {
      title: 'Basic Recipe',
      description: 'A simple recipe',
      ingredients: ['ingredient1', 'ingredient2'],
      instructions: 'Cook ingredients.',
      notes: '',
      categories: [],
      setup: [],
    };

    const context = analyzeRecipeContext(recipe);

    expect(context.cuisine).toBeNull();
    expect(context.dishType).toBeNull();
    expect(context.culturalContext).toBeNull();
    expect(context.seasonalContext).toBeNull();
  });
});

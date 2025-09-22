import type { Recipe } from './types';

/**
 * Generate an AI image prompt from recipe data
 * This function will be used in future phases when AI image generation is implemented
 *
 * @param recipe - The recipe object containing description, title, ingredients, and categories
 * @returns A formatted prompt string optimized for DALL-E 3 or similar AI image models
 */
export function generateImagePrompt(recipe: Recipe): string {
  // Start with the rich description if available
  let prompt = '';

  if (recipe.description && recipe.description.trim()) {
    prompt = recipe.description;
  } else {
    // Fallback to title-based description
    prompt = `A delicious ${recipe.title.toLowerCase()}`;
  }

  // Enhance with visual and culinary context
  const visualEnhancements = [
    'appetizing',
    'beautifully plated',
    'professional food photography',
    'high quality',
    'mouth-watering',
  ];

  // Add cuisine context from categories if available
  const cuisineContext =
    recipe.categories
      ?.find((cat) => cat.toLowerCase().includes('cuisine'))
      ?.replace(/cuisine:\s*/i, '') || '';

  if (cuisineContext) {
    prompt += `, ${cuisineContext} style`;
  }

  // Add cooking method context
  const techniqueContext =
    recipe.categories
      ?.find((cat) => cat.toLowerCase().includes('technique'))
      ?.replace(/technique:\s*/i, '') || '';

  if (techniqueContext) {
    prompt += `, ${techniqueContext}`;
  }

  // Add visual enhancements
  prompt += `, ${visualEnhancements.join(', ')}`;

  return prompt;
}

/**
 * Validate if a recipe has sufficient data for AI image generation
 *
 * @param recipe - The recipe to validate
 * @returns boolean indicating if the recipe has enough context for image generation
 */
export function canGenerateImage(recipe: Recipe): boolean {
  return !!(
    recipe.title &&
    recipe.title.trim() &&
    (recipe.description || recipe.ingredients?.length > 0)
  );
}

/**
 * Extract key visual elements from recipe for image generation
 *
 * @param recipe - The recipe object
 * @returns Array of visual elements that can enhance the image prompt
 */
export function extractVisualElements(recipe: Recipe): string[] {
  const elements: string[] = [];

  // Add main ingredients as visual elements
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    const mainIngredients = recipe.ingredients
      .slice(0, 5) // Limit to first 5 ingredients
      .map((ingredient) => {
        // Extract the main ingredient name (before any preparation details)
        return ingredient.split(',')[0].trim();
      });
    elements.push(...mainIngredients);
  }

  // Add cooking method from setup
  if (recipe.setup && recipe.setup.length > 0) {
    const cookingMethods: string[] = [];
    recipe.setup.forEach((item) => {
      const lowerItem = item.toLowerCase();
      if (lowerItem.includes('bake')) cookingMethods.push('bake');
      if (lowerItem.includes('grill')) cookingMethods.push('grill');
      if (lowerItem.includes('fry')) cookingMethods.push('fry');
      if (lowerItem.includes('roast')) cookingMethods.push('roast');
      if (lowerItem.includes('steam')) cookingMethods.push('steam');
      if (lowerItem.includes('sauté')) cookingMethods.push('sauté');
    });
    elements.push(...cookingMethods);
  }

  return elements;
}

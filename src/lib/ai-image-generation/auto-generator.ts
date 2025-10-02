import { RecipeFormData } from '@/lib/schemas';

export interface AutoGenerationOptions {
  enabled: boolean;
  quality: 'standard' | 'hd';
  size: '1024x1024' | '1024x1792' | '1792x1024';
  fallbackOnError: boolean;
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  usedFallback?: boolean;
  cost?: number;
}

/**
 * Generate image for recipe automatically
 */
export async function generateImageForRecipe(
  recipe: RecipeFormData,
  options: AutoGenerationOptions = {
    enabled: true,
    quality: 'standard',
    size: '1024x1024',
    fallbackOnError: true,
  }
): Promise<GenerationResult> {
  if (!options.enabled) {
    return { success: false, error: 'Auto-generation disabled' };
  }

  try {
    // Generate intelligent prompt from recipe context
    const prompt = generateIntelligentPrompt(recipe);

    // Call image generation API
    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        recipeTitle: recipe.title,
        categories: recipe.categories,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        size: options.size,
        quality: options.quality,
        useIntelligentPrompting: true,
        fallbackOnError: options.fallbackOnError,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.imageUrl) {
      return {
        success: true,
        imageUrl: data.imageUrl,
        usedFallback: data.usedFallback || false,
        cost: data.usage?.totalCost || 0,
      };
    } else {
      return {
        success: false,
        error: data.error || 'No image URL returned',
      };
    }
  } catch (error) {
    console.error('Auto image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate intelligent prompt from recipe context
 */
function generateIntelligentPrompt(recipe: RecipeFormData): string {
  // Priority 1: Use description if available and rich
  if (recipe.description && recipe.description.trim().length > 50) {
    return recipe.description.trim();
  }

  // Priority 2: Generate from title and context
  let prompt = `A delicious ${recipe.title.toLowerCase()}`;

  // Add cuisine context from categories
  if (recipe.categories) {
    const cuisine = recipe.categories
      .find((cat) => cat.includes('Cuisine:'))
      ?.split(':')[1]
      ?.trim();

    if (cuisine) {
      prompt += `, ${cuisine} style`;
    }
  }

  // Add main ingredients context
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    const mainIngredients = recipe.ingredients
      .slice(0, 3)
      .map((ing) => {
        // Extract main ingredient name (remove measurements)
        const cleaned = ing
          .replace(/\d+\s*(cups?|tbsp?|tsp?|oz|lb|g|kg|ml|l)\s*/gi, '')
          .trim();
        return cleaned.split(',')[0].trim(); // Take first part if comma-separated
      })
      .filter(Boolean);

    if (mainIngredients.length > 0) {
      prompt += `, featuring ${mainIngredients.join(' and ')}`;
    }
  }

  // Add cooking method context from instructions
  const cookingMethod = inferCookingMethod(recipe.instructions);
  if (cookingMethod) {
    prompt += `, ${cookingMethod}`;
  }

  // Add quality descriptors
  prompt += ', professional food photography, appetizing, well-lit';

  return prompt;
}

/**
 * Infer cooking method from instructions
 */
function inferCookingMethod(instructions: string): string | null {
  const instructionsLower = instructions.toLowerCase();

  const methods = {
    baked: ['bake', 'oven', 'baking', 'roast', 'roasting'],
    grilled: ['grill', 'grilling', 'bbq', 'barbecue'],
    fried: ['fry', 'frying', 'deep fry', 'pan fry'],
    boiled: ['boil', 'boiling', 'simmer', 'simmering'],
    raw: ['raw', 'fresh', 'uncooked', 'salad'],
    steamed: ['steam', 'steaming'],
    sautéed: ['sauté', 'sautéed', 'sautéing', 'sautée'],
  };

  for (const [method, keywords] of Object.entries(methods)) {
    if (keywords.some((keyword) => instructionsLower.includes(keyword))) {
      return method;
    }
  }

  return null;
}

/**
 * Check if recipe should have auto-generation
 */
export function shouldAutoGenerateImage(
  recipe: RecipeFormData,
  initialData?: RecipeFormData
): boolean {
  // Don't generate if:
  // 1. Recipe already has an image
  if (recipe.image_url) {
    return false;
  }

  // 2. User is manually uploading an image
  if (initialData?.image_url) {
    return false;
  }

  // 3. Recipe doesn't have enough context
  if (!recipe.title || !recipe.ingredients || recipe.ingredients.length === 0) {
    return false;
  }

  // 4. No description or description is too short
  if (!recipe.description || recipe.description.trim().length < 20) {
    return false;
  }

  // 5. Instructions are too short
  if (!recipe.instructions || recipe.instructions.trim().length < 50) {
    return false;
  }

  return true;
}

/**
 * Get user preferences for auto-generation
 */
export async function getUserImagePreferences(): Promise<AutoGenerationOptions> {
  // For now, return default preferences
  // In the future, this could fetch from user profile
  return {
    enabled: true,
    quality: 'standard',
    size: '1024x1024',
    fallbackOnError: true,
  };
}

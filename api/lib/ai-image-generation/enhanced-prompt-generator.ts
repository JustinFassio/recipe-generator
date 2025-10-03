import { RecipeFormData } from '../../../src/lib/schemas';
import { analyzeRecipeContext, RecipeContext } from './recipe-context-analyzer';

export interface PromptGenerationOptions {
  style: 'photographic' | 'artistic' | 'minimalist' | 'luxury';
  mood: 'appetizing' | 'elegant' | 'rustic' | 'modern';
  focus: 'dish' | 'ingredients' | 'process' | 'presentation';
  quality: 'standard' | 'hd';
}

export interface GeneratedPrompt {
  primaryPrompt: string;
  secondaryPrompt: string;
  fallbackPrompt: string;
  metadata: {
    cuisine: string | null;
    complexity: string;
    cookingMethods: string[];
    mainIngredients: string[];
    visualStyle: string;
  };
}

/**
 * Generate enhanced prompt using recipe context analysis
 */
export function generateEnhancedPrompt(
  recipe: RecipeFormData,
  options: PromptGenerationOptions = {
    style: 'photographic',
    mood: 'appetizing',
    focus: 'dish',
    quality: 'standard',
  }
): GeneratedPrompt {
  const context = analyzeRecipeContext(recipe);

  return {
    primaryPrompt: generatePrimaryPrompt(recipe, context, options),
    secondaryPrompt: generateSecondaryPrompt(recipe, context, options),
    fallbackPrompt: generateFallbackPrompt(recipe, context),
    metadata: {
      cuisine: context.cuisine?.name || null,
      complexity: context.complexity,
      cookingMethods: context.cookingMethods.map((m) => m.method),
      mainIngredients: context.mainIngredients.map((i) => i.name),
      visualStyle: context.visualStyle?.style || 'traditional',
    },
  };
}

/**
 * Generate primary prompt with full context
 */
function generatePrimaryPrompt(
  recipe: RecipeFormData,
  context: RecipeContext,
  options: PromptGenerationOptions
): string {
  const parts: string[] = [];

  // Start with dish title (always include title for consistency)
  parts.push(`A delicious ${recipe.title.toLowerCase()}`);

  // Add description if available and rich
  if (recipe.description && recipe.description.trim().length > 30) {
    parts.push(recipe.description.trim());
  }

  // Add cuisine context
  if (context.cuisine) {
    parts.push(`${context.cuisine.name} style`);
    if (context.cuisine.visualElements.length > 0) {
      parts.push(context.cuisine.visualElements.join(', '));
    }
  }

  // Add main ingredients with visual importance
  if (context.mainIngredients.length > 0) {
    const primaryIngredients = context.mainIngredients
      .filter((ing) => ing.visualImportance === 'primary')
      .map((ing) => ing.name);

    if (primaryIngredients.length > 0) {
      parts.push(`featuring ${primaryIngredients.join(' and ')}`);
    }
  }

  // Add cooking methods
  if (context.cookingMethods.length > 0) {
    const method = context.cookingMethods[0]; // Primary cooking method
    parts.push(method.visualCues[0] || `${method.method}`);
  }

  // Add dish type context
  if (context.dishType) {
    parts.push(context.dishType.presentation);
  }

  // Add seasonal context
  if (context.seasonalContext) {
    parts.push(`${context.seasonalContext.season} seasonal`);
  }

  // Add temperature context
  if (context.temperature) {
    parts.push(context.temperature.visualCues[0]);
  }

  // Add style and mood
  parts.push(getStyleDescription(options.style, options.mood));
  parts.push(getQualityDescription(options.quality, context.complexity));

  return parts.join(', ');
}

/**
 * Generate secondary prompt with simplified context
 */
function generateSecondaryPrompt(
  recipe: RecipeFormData,
  context: RecipeContext,
  options: PromptGenerationOptions
): string {
  const parts: string[] = [];

  // Core dish
  parts.push(`A ${recipe.title.toLowerCase()}`);

  // Cuisine
  if (context.cuisine) {
    parts.push(`in ${context.cuisine.name} style`);
  }

  // Main ingredients (simplified)
  if (context.mainIngredients.length > 0) {
    const mainIngredient = context.mainIngredients[0];
    parts.push(`with ${mainIngredient.name}`);
  }

  // Primary cooking method
  if (context.cookingMethods.length > 0) {
    parts.push(context.cookingMethods[0].method);
  }

  // Style
  parts.push(getStyleDescription(options.style, options.mood));
  parts.push('professional food photography');

  return parts.join(', ');
}

/**
 * Generate fallback prompt with minimal context
 */
function generateFallbackPrompt(
  recipe: RecipeFormData,
  context: RecipeContext
): string {
  const parts: string[] = [];

  // Simple dish description
  parts.push(`A delicious ${recipe.title.toLowerCase()}`);

  // Basic cuisine if available
  if (context.cuisine) {
    parts.push(`${context.cuisine.name} style`);
  }

  // Essential quality descriptors
  parts.push('appetizing, well-lit, professional food photography');

  return parts.join(', ');
}

/**
 * Get style description based on options and context
 */
function getStyleDescription(style: string, mood: string): string {
  const styleMap: Record<string, string> = {
    photographic: 'professional food photography',
    artistic: 'artistic food presentation',
    minimalist: 'clean, minimalist presentation',
    luxury: 'luxury food styling',
  };

  const moodMap: Record<string, string> = {
    appetizing: 'appetizing and inviting',
    elegant: 'elegant and sophisticated',
    rustic: 'rustic and hearty',
    modern: 'modern and contemporary',
  };

  return `${styleMap[style]}, ${moodMap[mood]}`;
}

/**
 * Get quality description based on options and complexity
 */
function getQualityDescription(quality: string, complexity: string): string {
  const qualityMap: Record<string, string> = {
    standard: 'high quality',
    hd: 'ultra high resolution',
  };

  const complexityMap: Record<string, string> = {
    simple: 'clean presentation',
    moderate: 'well-composed',
    complex: 'detailed composition',
    elaborate: 'intricate presentation',
  };

  return `${qualityMap[quality]}, ${complexityMap[complexity]}`;
}

/**
 * Generate prompt variations for A/B testing
 */
export function generatePromptVariations(
  recipe: RecipeFormData,
  baseOptions: PromptGenerationOptions
): GeneratedPrompt[] {
  const variations: GeneratedPrompt[] = [];

  // Original prompt
  variations.push(generateEnhancedPrompt(recipe, baseOptions));

  // Different style variations
  const styles: Array<PromptGenerationOptions['style']> = [
    'photographic',
    'artistic',
    'minimalist',
    'luxury',
  ];
  const moods: Array<PromptGenerationOptions['mood']> = [
    'appetizing',
    'elegant',
    'rustic',
    'modern',
  ];

  // Generate 2-3 variations
  for (let i = 0; i < 2; i++) {
    const style = styles[Math.floor(Math.random() * styles.length)];
    const mood = moods[Math.floor(Math.random() * moods.length)];

    variations.push(
      generateEnhancedPrompt(recipe, {
        ...baseOptions,
        style,
        mood,
      })
    );
  }

  return variations;
}

/**
 * Optimize prompt for DALL-E 3 constraints
 */
export function optimizePromptForDALLE(prompt: string): string {
  // DALL-E 3 has a 1000 character limit for prompts
  if (prompt.length <= 1000) {
    return prompt;
  }

  // Truncate intelligently at word boundaries
  const truncated = prompt.substring(0, 997); // Leave room for "..."
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 800) {
    // Only truncate if we have enough content
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Add cultural and regional context to prompts
 */
export function addCulturalContext(
  prompt: string,
  context: RecipeContext
): string {
  if (!context.culturalContext) return prompt;

  const culturalElements: string[] = [];

  // Add tradition
  if (context.culturalContext.tradition) {
    culturalElements.push(`${context.culturalContext.tradition} tradition`);
  }

  // Add occasion
  if (context.culturalContext.occasion) {
    culturalElements.push(context.culturalContext.occasion);
  }

  // Add setting
  if (context.culturalContext.setting) {
    culturalElements.push(context.culturalContext.setting);
  }

  if (culturalElements.length > 0) {
    return `${prompt}, ${culturalElements.join(', ')}`;
  }

  return prompt;
}

/**
 * Add seasonal context to prompts
 */
export function addSeasonalContext(
  prompt: string,
  context: RecipeContext
): string {
  if (!context.seasonalContext) return prompt;

  const seasonalElements: string[] = [];

  // Add season
  seasonalElements.push(`${context.seasonalContext.season} seasonal`);

  // Add seasonal ingredients
  if (context.seasonalContext.elements.length > 0) {
    seasonalElements.push(
      `featuring ${context.seasonalContext.elements.join(' and ')}`
    );
  }

  return `${prompt}, ${seasonalElements.join(', ')}`;
}

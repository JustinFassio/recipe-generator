import { RecipeFormData } from '@/lib/schemas';
import { analyzeRecipeContext } from './recipe-context-analyzer';
import { calculateImageCost } from './cost-tracker';

export interface OptimizationStrategy {
  name: string;
  description: string;
  costSavings: number;
  qualityImpact: 'none' | 'minimal' | 'moderate' | 'significant';
  applyTo: 'size' | 'quality' | 'frequency' | 'prompt';
}

export interface OptimizationRecommendation {
  strategy: OptimizationStrategy;
  currentSettings: {
    size: '1024x1024' | '1024x1792' | '1792x1024';
    quality: 'standard' | 'hd';
  };
  recommendedSettings: {
    size: '1024x1024' | '1024x1792' | '1792x1024';
    quality: 'standard' | 'hd';
  };
  costSavings: number;
  reasoning: string;
}

export interface SmartGenerationSettings {
  size: '1024x1024' | '1024x1792' | '1792x1024';
  quality: 'standard' | 'hd';
  promptStyle: 'photographic' | 'artistic' | 'minimalist' | 'luxury';
  promptMood: 'appetizing' | 'elegant' | 'rustic' | 'modern';
  reasoning: string;
  costSavings?: number;
}

/**
 * Get cost optimization strategies
 */
export function getOptimizationStrategies(): OptimizationStrategy[] {
  return [
    {
      name: 'Use Square Size',
      description: 'Use 1024x1024 instead of portrait/landscape sizes',
      costSavings: 0.04, // $0.04 savings per image
      qualityImpact: 'none',
      applyTo: 'size',
    },
    {
      name: 'Standard Quality',
      description: 'Use standard quality instead of HD',
      costSavings: 0.04, // $0.04 savings per image
      qualityImpact: 'minimal',
      applyTo: 'quality',
    },
    {
      name: 'Smart Size Selection',
      description: 'Automatically choose optimal size based on recipe type',
      costSavings: 0.02, // Average savings
      qualityImpact: 'none',
      applyTo: 'size',
    },
    {
      name: 'Batch Generation',
      description: 'Generate multiple images in one session to reduce overhead',
      costSavings: 0.01, // Small overhead savings
      qualityImpact: 'none',
      applyTo: 'frequency',
    },
    {
      name: 'Simplified Prompts',
      description: 'Use shorter, more focused prompts for better success rates',
      costSavings: 0.02, // Reduce failed generations
      qualityImpact: 'minimal',
      applyTo: 'prompt',
    },
  ];
}

/**
 * Get optimization recommendations for a recipe
 */
export function getOptimizationRecommendations(
  recipe: RecipeFormData,
  currentSettings: {
    size: '1024x1024' | '1024x1792' | '1792x1024';
    quality: 'standard' | 'hd';
  }
): OptimizationRecommendation[] {
  const context = analyzeRecipeContext(recipe);
  const recommendations: OptimizationRecommendation[] = [];

  // Size optimization recommendations
  if (currentSettings.size !== '1024x1024') {
    const currentCost = calculateImageCost(
      currentSettings.size,
      currentSettings.quality
    );
    const optimizedCost = calculateImageCost(
      '1024x1024',
      currentSettings.quality
    );
    const savings = currentCost - optimizedCost;

    recommendations.push({
      strategy: getOptimizationStrategies()[0], // Use Square Size
      currentSettings,
      recommendedSettings: {
        size: '1024x1024',
        quality: currentSettings.quality,
      },
      costSavings: savings,
      reasoning:
        'Square size is optimal for most recipe images and costs 50% less than portrait/landscape sizes.',
    });
  }

  // Quality optimization recommendations
  if (currentSettings.quality === 'hd') {
    const currentCost = calculateImageCost(currentSettings.size, 'hd');
    const optimizedCost = calculateImageCost(currentSettings.size, 'standard');
    const savings = currentCost - optimizedCost;

    // Only recommend standard quality for simple recipes
    if (context.complexity === 'simple' || context.complexity === 'moderate') {
      recommendations.push({
        strategy: getOptimizationStrategies()[1], // Standard Quality
        currentSettings,
        recommendedSettings: {
          size: currentSettings.size,
          quality: 'standard',
        },
        costSavings: savings,
        reasoning:
          'Standard quality is sufficient for most recipes and provides significant cost savings with minimal quality impact.',
      });
    }
  }

  // Smart size selection based on recipe type
  const optimalSize = getOptimalSizeForRecipe(context);
  if (optimalSize && optimalSize !== currentSettings.size) {
    const currentCost = calculateImageCost(
      currentSettings.size,
      currentSettings.quality
    );
    const optimizedCost = calculateImageCost(
      optimalSize,
      currentSettings.quality
    );
    const savings = currentCost - optimizedCost;

    recommendations.push({
      strategy: getOptimizationStrategies()[2], // Smart Size Selection
      currentSettings,
      recommendedSettings: {
        size: optimalSize,
        quality: currentSettings.quality,
      },
      costSavings: savings,
      reasoning: getSizeReasoning(context, optimalSize),
    });
  }

  return recommendations.sort((a, b) => b.costSavings - a.costSavings);
}

/**
 * Get optimal size for a recipe based on context
 */
function getOptimalSizeForRecipe(_context: {
  dishType?: { type: string } | null;
  complexity?: string;
}): '1024x1024' | '1024x1792' | '1792x1024' | null {
  // Portrait for tall dishes like drinks, layered desserts
  if (
    _context.dishType?.type === 'dessert' &&
    _context.complexity === 'elaborate'
  ) {
    return '1024x1792';
  }

  // Landscape for wide dishes like platters, family-style meals
  if (
    _context.dishType?.type === 'main course' &&
    _context.complexity === 'elaborate'
  ) {
    return '1792x1024';
  }

  // Square for most recipes (optimal cost/quality ratio)
  return '1024x1024';
}

/**
 * Get reasoning for size selection
 */
function getSizeReasoning(
  _context: { dishType?: { type: string } | null; complexity?: string },
  size: string
): string {
  switch (size) {
    case '1024x1792':
      return 'Portrait size is ideal for tall dishes and layered presentations.';
    case '1792x1024':
      return 'Landscape size is perfect for wide platters and family-style meals.';
    case '1024x1024':
    default:
      return 'Square size provides the best balance of cost and quality for most recipes.';
  }
}

/**
 * Get smart generation settings for a recipe
 */
export function getSmartGenerationSettings(
  recipe: RecipeFormData,
  budgetLimit?: number,
  userPreferences?: {
    preferQuality: boolean;
    preferCostSavings: boolean;
    style: 'photographic' | 'artistic' | 'minimalist' | 'luxury';
    mood: 'appetizing' | 'elegant' | 'rustic' | 'modern';
  }
): SmartGenerationSettings {
  const _context = analyzeRecipeContext(recipe);

  // Default settings
  let size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024';
  let quality: 'standard' | 'hd' = 'standard';
  let reasoning = 'Optimized for cost-effectiveness';

  // Apply budget constraints
  if (budgetLimit && budgetLimit < 5) {
    // Very tight budget - use most cost-effective settings
    size = '1024x1024';
    quality = 'standard';
    reasoning = 'Budget-optimized settings for maximum value';
  } else if (budgetLimit && budgetLimit < 10) {
    // Moderate budget - balance cost and quality
    size = getOptimalSizeForRecipe(_context) || '1024x1024';
    quality = _context.complexity === 'elaborate' ? 'hd' : 'standard';
    reasoning = 'Balanced settings for moderate budget';
  } else {
    // Generous budget - prioritize quality
    size = getOptimalSizeForRecipe(_context) || '1024x1024';
    quality = userPreferences?.preferQuality ? 'hd' : 'standard';
    reasoning = 'Quality-focused settings for generous budget';
  }

  // Apply user preferences
  if (userPreferences?.preferQuality) {
    quality = 'hd';
    reasoning += ' with HD quality preference';
  }

  if (userPreferences?.preferCostSavings) {
    size = '1024x1024';
    quality = 'standard';
    reasoning += ' with cost savings preference';
  }

  // Calculate cost savings
  const standardCost = calculateImageCost('1024x1024', 'standard');
  const currentCost = calculateImageCost(size, quality);
  const costSavings = standardCost - currentCost;

  return {
    size,
    quality,
    promptStyle: userPreferences?.style || 'photographic',
    promptMood: userPreferences?.mood || 'appetizing',
    reasoning,
    costSavings: costSavings > 0 ? costSavings : undefined,
  };
}

/**
 * Estimate cost for different generation scenarios
 */
export function estimateGenerationCosts(
  _recipe: RecipeFormData,
  scenarios: Array<{
    size: '1024x1024' | '1024x1792' | '1792x1024';
    quality: 'standard' | 'hd';
  }>
): Array<{
  scenario: string;
  cost: number;
  savings: number;
  quality: 'standard' | 'hd';
  size: '1024x1024' | '1024x1792' | '1792x1024';
}> {
  const baselineCost = calculateImageCost('1024x1024', 'standard');

  return scenarios.map((scenario) => ({
    scenario: `${scenario.size} ${scenario.quality}`,
    cost: calculateImageCost(scenario.size, scenario.quality),
    savings: baselineCost - calculateImageCost(scenario.size, scenario.quality),
    quality: scenario.quality,
    size: scenario.size,
  }));
}

/**
 * Get cost-effective prompt optimization
 */
export function getCostEffectivePrompt(
  _recipe: RecipeFormData,
  maxLength: number = 500
): string {
  const context = analyzeRecipeContext(_recipe);

  // Build a cost-effective prompt
  const parts: string[] = [];

  // Essential elements only
  parts.push(`A ${_recipe.title.toLowerCase()}`);

  if (context.cuisine) {
    parts.push(`${context.cuisine.name} style`);
  }

  if (context.mainIngredients.length > 0) {
    const mainIngredient = context.mainIngredients[0];
    parts.push(`with ${mainIngredient.name}`);
  }

  // Add cooking method if simple
  if (context.cookingMethods.length > 0 && context.complexity === 'simple') {
    parts.push(context.cookingMethods[0].method);
  }

  // Essential quality descriptors
  parts.push('professional food photography, appetizing');

  let prompt = parts.join(', ');

  // Truncate if too long
  if (prompt.length > maxLength) {
    prompt = prompt.substring(0, maxLength - 3) + '...';
  }

  return prompt;
}

/**
 * Calculate potential monthly savings
 */
export function calculateMonthlySavings(
  currentUsage: {
    monthlyGenerations: number;
    averageSize: '1024x1024' | '1024x1792' | '1792x1024';
    averageQuality: 'standard' | 'hd';
  },
  optimizedUsage: {
    monthlyGenerations: number;
    averageSize: '1024x1024' | '1024x1792' | '1792x1024';
    averageQuality: 'standard' | 'hd';
  }
): {
  monthlySavings: number;
  yearlySavings: number;
  percentageReduction: number;
} {
  const currentCost =
    currentUsage.monthlyGenerations *
    calculateImageCost(currentUsage.averageSize, currentUsage.averageQuality);

  const optimizedCost =
    optimizedUsage.monthlyGenerations *
    calculateImageCost(
      optimizedUsage.averageSize,
      optimizedUsage.averageQuality
    );

  const monthlySavings = currentCost - optimizedCost;
  const yearlySavings = monthlySavings * 12;
  const percentageReduction = (monthlySavings / currentCost) * 100;

  return {
    monthlySavings,
    yearlySavings,
    percentageReduction,
  };
}

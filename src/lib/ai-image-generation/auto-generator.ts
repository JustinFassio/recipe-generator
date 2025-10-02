import { RecipeFormData } from '@/lib/schemas';
import {
  generateEnhancedPrompt,
  optimizePromptForDALLE,
} from './enhanced-prompt-generator';
import { trackImageGenerationCost, calculateImageCost } from './cost-tracker';
import {
  canGenerateImage,
  updateBudgetAfterGeneration,
} from './budget-manager';

export interface AutoGenerationOptions {
  enabled: boolean;
  quality: 'standard' | 'hd';
  size: '1024x1024' | '1024x1792' | '1792x1024';
  fallbackOnError: boolean;
  promptStyle?: 'photographic' | 'artistic' | 'minimalist' | 'luxury';
  promptMood?: 'appetizing' | 'elegant' | 'rustic' | 'modern';
  promptFocus?: 'dish' | 'ingredients' | 'process' | 'presentation';
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  usedFallback?: boolean;
  cost?: number;
  costTrackingId?: string;
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

  // Calculate expected cost
  const expectedCost = calculateImageCost(options.size, options.quality);

  // Check budget limits
  const budgetCheck = await canGenerateImage(expectedCost);
  if (!budgetCheck.allowed) {
    return {
      success: false,
      error: budgetCheck.reason || 'Budget limit exceeded',
    };
  }

  try {
    // Generate enhanced prompt from recipe context
    const enhancedPrompt = generateEnhancedPrompt(recipe, {
      style: options.promptStyle || 'photographic',
      mood: options.promptMood || 'appetizing',
      focus: options.promptFocus || 'dish',
      quality: options.quality,
    });

    const prompt = optimizePromptForDALLE(enhancedPrompt.primaryPrompt);

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
      // Track successful generation cost
      try {
        const actualCost = data.usage?.totalCost || expectedCost;

        // Track cost in database
        const costRecord = await trackImageGenerationCost({
          user_id: '', // Will be filled by the function
          prompt: prompt,
          size: options.size,
          quality: options.quality,
          cost: actualCost,
          success: true,
          image_url: data.imageUrl,
          generation_time_ms: data.usage?.generationTimeMs,
        });

        // Update user budget
        await updateBudgetAfterGeneration(actualCost);

        return {
          success: true,
          imageUrl: data.imageUrl,
          usedFallback: data.usedFallback || false,
          cost: data.usage?.totalCost || expectedCost,
          costTrackingId: costRecord.id,
        };
      } catch (trackingError) {
        console.warn('Failed to track generation cost:', trackingError);
        // Still return success even if tracking fails
        return {
          success: true,
          imageUrl: data.imageUrl,
          usedFallback: data.usedFallback || false,
          cost: data.usage?.totalCost || expectedCost,
        };
      }
    } else {
      // Track failed generation cost (for API calls that still cost money)
      try {
        await trackImageGenerationCost({
          user_id: '', // Will be filled by the function
          prompt: prompt,
          size: options.size,
          quality: options.quality,
          cost: 0, // Failed generations don't cost money
          success: false,
          error_message: data.error || 'No image URL returned',
        });
      } catch (trackingError) {
        console.warn('Failed to track failed generation:', trackingError);
      }

      return {
        success: false,
        error: data.error || 'No image URL returned',
        cost: 0,
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

// Enhanced prompt generation is now handled by the enhanced-prompt-generator module

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
  // In the future, this could fetch from user profile or localStorage
  try {
    const savedSettings = localStorage.getItem('imageGenerationSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return {
        enabled: settings.autoGenerationEnabled ?? true,
        quality: settings.defaultQuality || 'standard',
        size: settings.defaultSize || '1024x1024',
        fallbackOnError: settings.fallbackOnError ?? true,
        promptStyle: settings.promptStyle || 'photographic',
        promptMood: settings.promptMood || 'appetizing',
        promptFocus: settings.promptFocus || 'dish',
      };
    }
  } catch (error) {
    console.warn('Failed to load user image preferences:', error);
  }

  return {
    enabled: true,
    quality: 'standard',
    size: '1024x1024',
    fallbackOnError: true,
    promptStyle: 'photographic',
    promptMood: 'appetizing',
    promptFocus: 'dish',
  };
}

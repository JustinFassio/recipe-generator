import { useImageGenerationContext as useImageGenerationContextOriginal } from '@/contexts/ImageGenerationContext';

/**
 * Safely use the ImageGenerationContext, providing default values when not available
 * This is useful for components that may be used in test environments where the context
 * provider is not available.
 */
export function useImageGenerationContext() {
  try {
    return useImageGenerationContextOriginal();
  } catch {
    // Context not available (e.g., in tests), use default values
    return {
      generationState: {
        isGenerating: false,
        progress: 0,
        recipeId: undefined,
        error: undefined,
      },
      startGeneration: () => {},
      updateProgress: () => {},
      completeGeneration: () => {},
    };
  }
}

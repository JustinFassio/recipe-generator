import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  generateImageForRecipe,
  shouldAutoGenerateImage,
  getUserImagePreferences,
  type GenerationResult,
} from '@/lib/ai-image-generation/auto-generator';
import { RecipeFormData } from '@/lib/schemas';

interface UseAutoImageGenerationOptions {
  onSuccess?: (imageUrl: string) => void;
  onError?: (error: string) => void;
  onComplete?: (result: GenerationResult) => void;
  onProgressUpdate?: (progress: number) => void;
}

export function useAutoImageGeneration(
  options?: UseAutoImageGenerationOptions
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const autoGenerateImage = useMutation({
    mutationFn: async (recipe: RecipeFormData): Promise<GenerationResult> => {
      setIsGenerating(true);
      setGenerationProgress(10);
      options?.onProgressUpdate?.(10);

      try {
        // Check if image should be generated
        if (!shouldAutoGenerateImage(recipe)) {
          return {
            success: false,
            error: 'Recipe does not meet criteria for auto-generation',
          };
        }

        setGenerationProgress(20);
        options?.onProgressUpdate?.(20);

        // Get user preferences
        const userPreferences = await getUserImagePreferences();

        setGenerationProgress(30);
        options?.onProgressUpdate?.(30);

        // Generate image
        const result = await generateImageForRecipe(recipe, userPreferences);

        setGenerationProgress(100);
        options?.onProgressUpdate?.(100);

        return result;
      } catch (error) {
        setGenerationProgress(0);
        options?.onProgressUpdate?.(0);
        throw error;
      } finally {
        setIsGenerating(false);
        setTimeout(() => {
          setGenerationProgress(0);
          options?.onProgressUpdate?.(0);
        }, 1000);
      }
    },
    onSuccess: (result) => {
      if (result.success && result.imageUrl) {
        options?.onSuccess?.(result.imageUrl);
      } else {
        options?.onError?.(result.error || 'Generation failed');
      }
      options?.onComplete?.(result);
    },
    onError: (error: Error) => {
      options?.onError?.(error.message);
      options?.onComplete?.({
        success: false,
        error: error.message,
      });
    },
  });

  const generateForRecipe = useCallback(
    (recipe: RecipeFormData) => {
      return autoGenerateImage.mutateAsync(recipe);
    },
    [autoGenerateImage]
  );

  const checkShouldGenerate = useCallback(
    (recipe: RecipeFormData, initialData?: RecipeFormData) => {
      return shouldAutoGenerateImage(recipe, initialData);
    },
    []
  );

  return {
    generateForRecipe,
    checkShouldGenerate,
    isGenerating,
    generationProgress,
    error: autoGenerateImage.error,
    isError: autoGenerateImage.isError,
    result: autoGenerateImage.data,
  };
}

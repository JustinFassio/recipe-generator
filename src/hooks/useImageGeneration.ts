import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
// Image storage now handled by backend API

interface GenerateImageRequest {
  recipeTitle: string;
  description?: string;
  ingredients: string[];
  instructions: string;
  categories: string[];
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'photographic' | 'artistic' | 'minimalist' | 'luxury';
  mood?: 'appetizing' | 'elegant' | 'rustic' | 'modern';
  focus?: 'dish' | 'ingredients' | 'process' | 'presentation';
}

interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  usedFallback?: boolean;
  fallbackStrategy?: string;
  promptUsed?: string;
  usage?: {
    promptTokens: number;
    totalCost: number;
  };
}

interface UseImageGenerationOptions {
  onSuccess?: (imageUrl: string) => void;
  onError?: (error: string) => void;
}

export function useImageGeneration(options?: UseImageGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const generateImage = useMutation({
    mutationFn: async (request: GenerateImageRequest): Promise<string> => {
      setIsGenerating(true);
      setGenerationProgress(10);

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setGenerationProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + Math.random() * 20;
          });
        }, 500);

        const response = await fetch('/api/ai/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        clearInterval(progressInterval);
        setGenerationProgress(95);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate image');
        }

        const data: GenerateImageResponse = await response.json();

        if (!data.success || !data.imageUrl) {
          throw new Error(data.error || 'No image generated');
        }

        setGenerationProgress(100);

        // Image storage is now handled by the backend API
        // The imageUrl returned is already a permanent Supabase URL
        return data.imageUrl;
      } catch (error) {
        setGenerationProgress(0);
        throw error;
      } finally {
        setIsGenerating(false);
        setTimeout(() => setGenerationProgress(0), 1000);
      }
    },
    onSuccess: (imageUrl) => {
      options?.onSuccess?.(imageUrl);
    },
    onError: (error: Error) => {
      options?.onError?.(error.message);
    },
  });

  return {
    generateImage: generateImage.mutateAsync,
    isGenerating,
    generationProgress,
    error: generateImage.error,
    isError: generateImage.isError,
  };
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { RecipeFormData } from '@/lib/schemas';
import { generateEnhancedPrompt, optimizePromptForDALLE } from '@/lib/ai-image-generation/enhanced-prompt-generator';
import { Wand2, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AIImageGeneratorProps {
  recipe: RecipeFormData;
  onImageGenerated: (imageUrl: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function AIImageGenerator({
  recipe,
  onImageGenerated,
  onError,
  className = '',
}: AIImageGeneratorProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [generationOptions, setGenerationOptions] = useState({
    quality: 'standard' as 'standard' | 'hd',
    size: '1024x1024' as '1024x1024' | '1024x1792' | '1792x1024',
    promptStyle: 'photographic' as 'photographic' | 'artistic' | 'minimalist' | 'luxury',
    promptMood: 'appetizing' as 'appetizing' | 'elegant' | 'rustic' | 'modern',
    promptFocus: 'dish' as 'dish' | 'ingredients' | 'process' | 'presentation',
  });

  const { generateImage, isGenerating, generationProgress, error } = useImageGeneration({
    onSuccess: (imageUrl) => {
      onImageGenerated(imageUrl);
      toast({
        title: 'Image Generated!',
        description: 'Your AI-generated recipe image is ready.',
        variant: 'default',
      });
    },
    onError: (errorMessage) => {
      onError?.(errorMessage);
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const handleGenerateImage = async () => {
    if (!recipe.title || !recipe.description) {
      toast({
        title: 'Missing Information',
        description: 'Recipe title and description are required for image generation.',
        variant: 'destructive',
      });
      return;
    }

    // Generate enhanced prompt using recipe context analysis
    const enhancedPrompt = generateEnhancedPrompt(recipe, {
      style: generationOptions.promptStyle,
      mood: generationOptions.promptMood,
      focus: generationOptions.promptFocus,
      quality: generationOptions.quality,
    });
    
    const prompt = optimizePromptForDALLE(enhancedPrompt.primaryPrompt);
    
    try {
      await generateImage({
        prompt,
        recipeTitle: recipe.title,
        categories: recipe.categories,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        quality: generationOptions.quality,
        size: generationOptions.size,
      });
    } catch (error) {
      console.error('Image generation error:', error);
    }
  };

  // Enhanced prompt generation is now handled by the enhanced-prompt-generator module

  const getCostEstimate = (): number => {
    const costs = {
      '1024x1024': { standard: 0.04, hd: 0.08 },
      '1024x1792': { standard: 0.08, hd: 0.12 },
      '1792x1024': { standard: 0.08, hd: 0.12 },
    };

    return costs[generationOptions.size]?.[generationOptions.quality] || 0.04;
  };

  const canGenerate = recipe.title && recipe.description && recipe.ingredients?.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Generation Button */}
      <div className="flex items-center space-x-3">
        <Button
          type="button"
          onClick={handleGenerateImage}
          disabled={!canGenerate || isGenerating}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isGenerating ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {isGenerating ? 'Generating...' : 'Generate with AI'}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowOptions(!showOptions)}
        >
          Options
        </Button>

        {error && (
          <Badge variant="destructive" className="ml-auto">
            <AlertCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Generating image...</span>
            <span>{Math.round(generationProgress)}%</span>
          </div>
          <Progress value={generationProgress} className="h-2" />
        </div>
      )}

      {/* Generation Options */}
      {showOptions && (
        <div className="rounded-lg border bg-gray-50 p-4 space-y-4">
          <h4 className="font-medium text-gray-900">Generation Options</h4>
          
          {/* Quality Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality
            </label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={generationOptions.quality === 'standard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, quality: 'standard' }))}
              >
                Standard
              </Button>
              <Button
                type="button"
                variant={generationOptions.quality === 'hd' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, quality: 'hd' }))}
              >
                HD
              </Button>
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={generationOptions.size === '1024x1024' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, size: '1024x1024' }))}
              >
                Square
              </Button>
              <Button
                type="button"
                variant={generationOptions.size === '1024x1792' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, size: '1024x1792' }))}
              >
                Portrait
              </Button>
              <Button
                type="button"
                variant={generationOptions.size === '1792x1024' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, size: '1792x1024' }))}
              >
                Landscape
              </Button>
            </div>
          </div>

          {/* Prompt Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style
            </label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={generationOptions.promptStyle === 'photographic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, promptStyle: 'photographic' }))}
              >
                Photo
              </Button>
              <Button
                type="button"
                variant={generationOptions.promptStyle === 'artistic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, promptStyle: 'artistic' }))}
              >
                Artistic
              </Button>
              <Button
                type="button"
                variant={generationOptions.promptStyle === 'minimalist' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, promptStyle: 'minimalist' }))}
              >
                Minimal
              </Button>
              <Button
                type="button"
                variant={generationOptions.promptStyle === 'luxury' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, promptStyle: 'luxury' }))}
              >
                Luxury
              </Button>
            </div>
          </div>

          {/* Prompt Mood Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mood
            </label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={generationOptions.promptMood === 'appetizing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, promptMood: 'appetizing' }))}
              >
                Appetizing
              </Button>
              <Button
                type="button"
                variant={generationOptions.promptMood === 'elegant' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, promptMood: 'elegant' }))}
              >
                Elegant
              </Button>
              <Button
                type="button"
                variant={generationOptions.promptMood === 'rustic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, promptMood: 'rustic' }))}
              >
                Rustic
              </Button>
              <Button
                type="button"
                variant={generationOptions.promptMood === 'modern' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGenerationOptions(prev => ({ ...prev, promptMood: 'modern' }))}
              >
                Modern
              </Button>
            </div>
          </div>

          {/* Cost Estimate */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Estimated cost:</span>
            <Badge variant="outline">${getCostEstimate().toFixed(2)}</Badge>
          </div>
        </div>
      )}

      {/* Generation Requirements */}
      {!canGenerate && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Requirements for AI generation:</p>
              <ul className="mt-1 space-y-1">
                {!recipe.title && <li>• Recipe title</li>}
                {!recipe.description && <li>• Recipe description</li>}
                {(!recipe.ingredients || recipe.ingredients.length === 0) && <li>• At least one ingredient</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Generation failed:</p>
              <p>{error.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

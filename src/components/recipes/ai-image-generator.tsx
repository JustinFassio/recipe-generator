import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { RecipeFormData } from '@/lib/schemas';
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

    const prompt = generatePrompt(recipe);
    
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

  const generatePrompt = (recipe: RecipeFormData): string => {
    // Use description if available and rich
    if (recipe.description && recipe.description.trim().length > 50) {
      return recipe.description.trim();
    }

    // Generate from title and context
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
          const cleaned = ing
            .replace(/\d+\s*(cups?|tbsp?|tsp?|oz|lb|g|kg|ml|l)\s*/gi, '')
            .trim();
          return cleaned.split(',')[0].trim();
        })
        .filter(Boolean);

      if (mainIngredients.length > 0) {
        prompt += `, featuring ${mainIngredients.join(' and ')}`;
      }
    }

    // Add cooking method context
    const cookingMethod = inferCookingMethod(recipe.instructions);
    if (cookingMethod) {
      prompt += `, ${cookingMethod}`;
    }

    // Add quality descriptors
    prompt += ', professional food photography, appetizing, well-lit';

    return prompt;
  };

  const inferCookingMethod = (instructions: string): string | null => {
    if (!instructions) return null;
    
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
  };

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

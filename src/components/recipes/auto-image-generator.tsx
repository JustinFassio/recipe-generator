import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAutoImageGeneration } from '@/hooks/useAutoImageGeneration';
import { RecipeFormData } from '@/lib/schemas';
import {
  Wand2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Settings,
  X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AutoImageGeneratorProps {
  recipe: RecipeFormData;
  initialData?: RecipeFormData;
  onImageGenerated: (imageUrl: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function AutoImageGenerator({
  recipe,
  initialData,
  onImageGenerated,
  onError,
  className = '',
}: AutoImageGeneratorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(true);
  const [shouldGenerate, setShouldGenerate] = useState(false);

  const {
    generateForRecipe,
    checkShouldGenerate,
    isGenerating,
    generationProgress,
    error,
    result,
  } = useAutoImageGeneration({
    onSuccess: (imageUrl) => {
      onImageGenerated(imageUrl);
      toast({
        title: 'Image Generated Automatically!',
        description: 'Your recipe now has an AI-generated image.',
        variant: 'default',
      });
    },
    onError: (errorMessage) => {
      onError?.(errorMessage);
      toast({
        title: 'Auto-Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Check if auto-generation should happen
  useEffect(() => {
    const shouldAutoGenerate = checkShouldGenerate(recipe, initialData);
    setShouldGenerate(shouldAutoGenerate);
  }, [recipe, initialData, checkShouldGenerate]);

  // Removed unused handleAutoGenerate function

  const handleManualGenerate = async () => {
    try {
      await generateForRecipe(recipe);
    } catch (error) {
      console.error('Manual image generation error:', error);
    }
  };

  const getGenerationStatus = () => {
    if (isGenerating) return 'generating';
    if (error) return 'error';
    if (result?.success) return 'success';
    if (result && !result.success) return 'failed';
    if (shouldGenerate && autoGenerateEnabled) return 'ready';
    if (shouldGenerate && !autoGenerateEnabled) return 'disabled';
    return 'not-applicable';
  };

  const status = getGenerationStatus();

  const getStatusBadge = () => {
    switch (status) {
      case 'generating':
        return (
          <Badge variant="default">
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
            Generating
          </Badge>
        );
      case 'success':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Generated
          </Badge>
        );
      case 'error':
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="outline" className="border-blue-600 text-blue-600">
            Ready
          </Badge>
        );
      case 'disabled':
        return <Badge variant="secondary">Disabled</Badge>;
      default:
        return null;
    }
  };

  if (status === 'not-applicable') {
    return null; // Don't show component if auto-generation is not applicable
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Auto-Generation Status */}
      <div className="rounded-lg border bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wand2 className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">
                Auto Image Generation
              </h4>
              <p className="text-sm text-blue-700">
                {status === 'ready' &&
                  'This recipe will get an AI-generated image when saved'}
                {status === 'generating' && 'Generating image automatically...'}
                {status === 'success' && 'Image generated successfully!'}
                {status === 'error' && 'Auto-generation failed'}
                {status === 'disabled' && 'Auto-generation is disabled'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Generating image...</span>
              <span>{Math.round(generationProgress)}%</span>
            </div>
            <Progress value={generationProgress} className="h-2" />
          </div>
        )}
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="rounded-lg border bg-gray-50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Auto-Generation Settings
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Auto-Generation</p>
              <p className="text-sm text-gray-600">
                Automatically generate images when saving recipes
              </p>
            </div>
            <Button
              type="button"
              variant={autoGenerateEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoGenerateEnabled(!autoGenerateEnabled)}
            >
              {autoGenerateEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {/* Generation Criteria */}
          <div>
            <p className="font-medium text-gray-700 mb-2">
              Generation Criteria
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                {recipe.title ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span>Recipe title</span>
              </div>
              <div className="flex items-center space-x-2">
                {recipe.description && recipe.description.length > 20 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span>Rich description (20+ characters)</span>
              </div>
              <div className="flex items-center space-x-2">
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span>At least one ingredient</span>
              </div>
              <div className="flex items-center space-x-2">
                {recipe.instructions && recipe.instructions.length > 50 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span>Detailed instructions (50+ characters)</span>
              </div>
              <div className="flex items-center space-x-2">
                {!recipe.image_url ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span>No existing image</span>
              </div>
            </div>
          </div>

          {/* Manual Generation Button */}
          {status === 'ready' && (
            <Button
              type="button"
              onClick={handleManualGenerate}
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Now
            </Button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Auto-generation failed:</p>
              <p>{error.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

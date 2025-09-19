# Phase 2: Frontend Integration

**Add "Generate with AI" option to the recipe upload interface with seamless user experience**

## 🎯 Objectives

- Integrate AI image generation into existing recipe form
- Create intuitive UI for image generation option
- Implement loading states and progress indicators
- Add error handling and user feedback
- Maintain existing manual upload functionality

## 📋 Deliverables

- [ ] Enhanced recipe form with AI generation option
- [ ] Image generation UI components
- [ ] Loading states and progress indicators
- [ ] Error handling and user feedback
- [ ] Integration with existing image upload system
- [ ] Mobile-responsive design
- [ ] Accessibility compliance

## 🏗️ Implementation

### 1. Create Image Generation Hook

**File**: `src/hooks/useImageGeneration.ts`

```typescript
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

interface GenerateImageRequest {
  prompt: string;
  recipeTitle?: string;
  categories?: string[];
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
}

interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
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
          setGenerationProgress(prev => {
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
```

### 2. Create Image Generation Component

**File**: `src/components/recipes/ImageGenerationPanel.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageGenerationPanelProps {
  recipeTitle?: string;
  categories?: string[];
  onImageGenerated: (imageUrl: string) => void;
  onClose: () => void;
}

export function ImageGenerationPanel({
  recipeTitle,
  categories,
  onImageGenerated,
  onClose
}: ImageGenerationPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1024x1024' | '1024x1792' | '1792x1024'>('1024x1024');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');

  // Auto-generate initial prompt from recipe context
  useEffect(() => {
    if (recipeTitle && !prompt) {
      const cuisine = categories?.find(cat => cat.includes('Cuisine:'))?.split(':')[1]?.trim();
      const course = categories?.find(cat => cat.includes('Course:'))?.split(':')[1]?.trim();
      
      let autoPrompt = `A delicious ${recipeTitle.toLowerCase()}`;
      if (cuisine) autoPrompt += ` in ${cuisine} style`;
      if (course) autoPrompt += `, perfect for ${course.toLowerCase()}`;
      autoPrompt += ', professional food photography';
      
      setPrompt(autoPrompt);
    }
  }, [recipeTitle, categories, prompt]);

  const { generateImage, isGenerating, generationProgress, error } = useImageGeneration({
    onSuccess: (imageUrl) => {
      onImageGenerated(imageUrl);
      onClose();
    },
    onError: (errorMessage) => {
      console.error('Image generation failed:', errorMessage);
    }
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      const imageUrl = await generateImage({
        prompt: prompt.trim(),
        recipeTitle,
        categories,
        size,
        quality
      });
      
      onImageGenerated(imageUrl);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getCostEstimate = () => {
    const costs = {
      '1024x1024': { standard: '$0.04', hd: '$0.08' },
      '1024x1792': { standard: '$0.08', hd: '$0.12' },
      '1792x1024': { standard: '$0.08', hd: '$0.12' }
    };
    return costs[size][quality];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Generate Recipe Image with AI
        </CardTitle>
        <CardDescription>
          Create a custom image for your recipe using AI. The image will be tailored to your recipe's style and ingredients.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Recipe Context Display */}
        {recipeTitle && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Recipe Context</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{recipeTitle}</p>
              {categories && categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {categories.map((category, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Image Description</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="min-h-[100px]"
            disabled={isGenerating}
          />
          <p className="text-sm text-gray-500">
            Be specific about the dish, style, and presentation you want.
          </p>
        </div>

        {/* Image Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="size">Image Size</Label>
            <Select value={size} onValueChange={(value: any) => setSize(value)} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                <SelectItem value="1024x1792">Portrait (1024×1792)</SelectItem>
                <SelectItem value="1792x1024">Landscape (1792×1024)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality">Quality</Label>
            <Select value={quality} onValueChange={(value: any) => setQuality(value)} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hd">HD (Higher Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cost Estimate */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium">Estimated Cost:</span>
          <span className="text-sm font-bold text-blue-600">{getCostEstimate()}</span>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Indicator */}
        {isGenerating && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Generating image...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              This usually takes 10-30 seconds. Please don't close this window.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Image
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. Enhance Recipe Form

**File**: `src/components/recipes/recipe-form.tsx` (modifications)

```typescript
// Add these imports
import { ImageGenerationPanel } from './ImageGenerationPanel';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Upload } from 'lucide-react';

// Add state for image generation
const [showImageGeneration, setShowImageGeneration] = useState(false);

// Modify the image upload section
<div className="space-y-4">
  <Label htmlFor="image">Recipe Image</Label>
  
  {/* Existing image preview and upload */}
  {currentImageUrl && (
    <div className="relative">
      <img
        src={currentImageUrl}
        alt="Recipe preview"
        className="w-full h-48 object-cover rounded-lg"
      />
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2"
        onClick={handleRemoveImage}
      >
        Remove
      </Button>
    </div>
  )}

  {/* Image Upload Options */}
  <div className="flex gap-3">
    <Button
      type="button"
      variant="outline"
      onClick={() => fileInputRef.current?.click()}
      disabled={loading}
      className="flex-1"
    >
      <Upload className="mr-2 h-4 w-4" />
      {loading ? 'Uploading...' : 'Upload Photo'}
    </Button>

    <Dialog open={showImageGeneration} onOpenChange={setShowImageGeneration}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <ImageGenerationPanel
          recipeTitle={formData.title}
          categories={formData.categories}
          onImageGenerated={(imageUrl) => {
            setFormData(prev => ({ ...prev, image_url: imageUrl }));
            setCurrentImageUrl(imageUrl);
            setShowImageGeneration(false);
          }}
          onClose={() => setShowImageGeneration(false)}
        />
      </DialogContent>
    </Dialog>
  </div>

  <p className="text-sm text-gray-500">
    Upload a photo or generate one with AI. Images help make your recipe more appealing.
  </p>
</div>
```

### 4. Create Loading States Component

**File**: `src/components/shared/ImageGenerationLoader.tsx`

```typescript
import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface ImageGenerationLoaderProps {
  progress: number;
  message?: string;
}

export function ImageGenerationLoader({ progress, message }: ImageGenerationLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-500" />
        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-purple-500" />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Generating Your Image</h3>
        <p className="text-gray-600">
          {message || 'Creating a beautiful image for your recipe...'}
        </p>
      </div>

      <div className="w-full max-w-xs">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

## 🎨 UI/UX Considerations

### 1. Visual Design
- **Consistent with existing design system** (DaisyUI/Tailwind)
- **Clear visual hierarchy** with proper spacing and typography
- **Intuitive iconography** using Lucide React icons
- **Responsive design** that works on all screen sizes

### 2. User Experience
- **Progressive disclosure** - show advanced options only when needed
- **Smart defaults** - auto-generate prompts from recipe context
- **Clear feedback** - loading states, progress indicators, error messages
- **Non-blocking** - users can continue editing while image generates

### 3. Accessibility
- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** color schemes
- **Focus management** in modals and dialogs

## 🧪 Testing

### 1. Component Tests

**File**: `src/__tests__/components/recipes/ImageGenerationPanel.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageGenerationPanel } from '@/components/recipes/ImageGenerationPanel';

describe('ImageGenerationPanel', () => {
  it('should render with recipe context', () => {
    render(
      <ImageGenerationPanel
        recipeTitle="Test Recipe"
        categories={['Cuisine: Italian', 'Course: Main']}
        onImageGenerated={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('should auto-generate prompt from recipe context', () => {
    render(
      <ImageGenerationPanel
        recipeTitle="Classic Lasagna"
        categories={['Cuisine: Italian', 'Course: Main']}
        onImageGenerated={jest.fn()}
        onClose={jest.fn()}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(expect.stringContaining('classic lasagna'));
    expect(textarea).toHaveValue(expect.stringContaining('italian style'));
  });

  // Add more tests for user interactions, error handling, etc.
});
```

### 2. Integration Tests

**File**: `src/__tests__/integration/recipe-form-image-generation.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeForm } from '@/components/recipes/recipe-form';

describe('Recipe Form with Image Generation', () => {
  it('should integrate image generation into recipe form', async () => {
    render(<RecipeForm />);

    // Fill in recipe details
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Recipe' }
    });

    // Click generate with AI button
    fireEvent.click(screen.getByText(/generate with ai/i));

    // Should open image generation panel
    expect(screen.getByText(/generate recipe image with ai/i)).toBeInTheDocument();

    // Should auto-populate prompt
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(expect.stringContaining('test recipe'));
  });
});
```

## 📱 Mobile Responsiveness

### 1. Responsive Layout
- **Stack buttons vertically** on mobile devices
- **Full-width modals** on small screens
- **Touch-friendly** button sizes and spacing
- **Optimized text input** for mobile keyboards

### 2. Performance Considerations
- **Lazy loading** of image generation components
- **Debounced input** for prompt suggestions
- **Optimized images** for different screen densities

## ✅ Phase 2 Completion Criteria

- [ ] Image generation panel renders correctly
- [ ] Integration with recipe form works seamlessly
- [ ] Loading states and progress indicators function properly
- [ ] Error handling displays user-friendly messages
- [ ] Mobile responsive design works on all devices
- [ ] Accessibility requirements met
- [ ] Component tests pass
- [ ] Integration tests pass
- [ ] User experience flows smoothly

## 🚀 Next Phase

Once Phase 2 is complete, proceed to [Phase 3: Recipe Context Integration](./PHASE-3-RECIPE-CONTEXT.md) to enhance the AI prompts with intelligent recipe context analysis.

---

**Estimated Time**: 2-3 days
**Dependencies**: Phase 1 backend API
**Risk Level**: Medium (UI/UX complexity)

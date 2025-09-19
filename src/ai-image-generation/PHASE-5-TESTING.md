# Phase 5: Testing & Quality Assurance

**Comprehensive testing, quality validation, and performance optimization for AI image generation**

## 🎯 Objectives

- Implement comprehensive testing suite
- Add quality validation and user feedback
- Optimize performance and monitoring
- Ensure production readiness
- Validate cost management effectiveness

## 📋 Deliverables

- [ ] Comprehensive test suite (unit, integration, e2e)
- [ ] Quality validation system
- [ ] Performance benchmarks
- [ ] User feedback collection
- [ ] Production monitoring
- [ ] Documentation and training materials

## 🧪 Testing Implementation

### 1. Unit Tests

**File**: `src/__tests__/api/ai/generate-image.test.ts`

```typescript
import { handler } from '@/api/ai/generate-image';

describe('AI Image Generation API', () => {
  it('should validate request parameters', async () => {
    const req = { method: 'POST', body: {} } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Prompt is required and must be a string'
    });
  });

  it('should generate image successfully', async () => {
    // Mock successful DALL-E response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [{ url: 'https://example.com/generated-image.jpg' }]
      })
    });

    const req = {
      method: 'POST',
      body: { prompt: 'test prompt', size: '1024x1024', quality: 'standard' }
    } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      imageUrl: 'https://example.com/generated-image.jpg',
      usage: expect.any(Object)
    });
  });
});
```

### 2. Integration Tests

**File**: `src/__tests__/integration/ai-image-generation.test.ts`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageGenerationPanel } from '@/components/recipes/ImageGenerationPanel';

describe('AI Image Generation Integration', () => {
  beforeEach(() => {
    // Mock API responses
    global.fetch = jest.fn();
  });

  it('should generate image with recipe context', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        imageUrl: 'https://example.com/generated-image.jpg'
      })
    });

    render(
      <ImageGenerationPanel
        recipeTitle="Test Recipe"
        categories={['Cuisine: Italian']}
        onImageGenerated={jest.fn()}
        onClose={jest.fn()}
      />
    );

    // Verify auto-generated prompt
    expect(screen.getByDisplayValue(/test recipe/i)).toBeInTheDocument();

    // Generate image
    fireEvent.click(screen.getByText(/generate image/i));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('test recipe')
      });
    });
  });
});
```

### 3. End-to-End Tests

**File**: `tests/e2e/ai-image-generation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('AI Image Generation E2E', () => {
  test('should generate recipe image end-to-end', async ({ page }) => {
    // Navigate to recipe form
    await page.goto('/add-recipe');
    
    // Fill recipe details
    await page.fill('[data-testid="recipe-title"]', 'Test Recipe');
    await page.fill('[data-testid="recipe-ingredients"]', 'pasta, tomato sauce');
    
    // Click generate with AI
    await page.click('[data-testid="generate-with-ai"]');
    
    // Verify generation panel opens
    await expect(page.locator('[data-testid="image-generation-panel"]')).toBeVisible();
    
    // Verify auto-generated prompt
    const promptTextarea = page.locator('[data-testid="prompt-textarea"]');
    await expect(promptTextarea).toContainText('test recipe');
    
    // Mock successful generation
    await page.route('/api/ai/generate-image', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          imageUrl: 'https://example.com/generated-image.jpg'
        })
      });
    });
    
    // Generate image
    await page.click('[data-testid="generate-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="generated-image"]')).toBeVisible();
    await expect(page.locator('[data-testid="cost-display"]')).toContainText('$0.04');
  });
});
```

## 🔍 Quality Validation

### 1. Image Quality Assessment

**File**: `src/lib/ai-image-generation/quality-validator.ts`

```typescript
export interface ImageQualityMetrics {
  relevance: number; // 0-1 score for relevance to recipe
  technicalQuality: number; // 0-1 score for image quality
  aestheticAppeal: number; // 0-1 score for visual appeal
  overallScore: number; // Combined score
}

export interface QualityValidation {
  passed: boolean;
  metrics: ImageQualityMetrics;
  issues: string[];
  suggestions: string[];
}

/**
 * Validate generated image quality
 */
export async function validateImageQuality(
  imageUrl: string,
  recipeContext: RecipeContext,
  prompt: string
): Promise<QualityValidation> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check image accessibility
  const accessibilityCheck = await checkImageAccessibility(imageUrl);
  if (!accessibilityCheck.accessible) {
    issues.push('Image is not accessible');
  }

  // Check relevance to recipe context
  const relevanceScore = await assessRelevance(imageUrl, recipeContext, prompt);
  if (relevanceScore < 0.6) {
    issues.push('Image may not be relevant to recipe');
    suggestions.push('Consider refining the prompt with more specific details');
  }

  // Check technical quality
  const technicalScore = await assessTechnicalQuality(imageUrl);
  if (technicalScore < 0.7) {
    issues.push('Image technical quality could be improved');
    suggestions.push('Try using HD quality setting');
  }

  const overallScore = (relevanceScore + technicalScore + 0.8) / 3; // Assume good aesthetic

  return {
    passed: issues.length === 0 && overallScore >= 0.7,
    metrics: {
      relevance: relevanceScore,
      technicalQuality: technicalScore,
      aestheticAppeal: 0.8, // Would be calculated from actual image analysis
      overallScore
    },
    issues,
    suggestions
  };
}

/**
 * Check if image is accessible and loads correctly
 */
async function checkImageAccessibility(imageUrl: string): Promise<{ accessible: boolean; error?: string }> {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return {
      accessible: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message
    };
  }
}

/**
 * Assess relevance to recipe context (simplified)
 */
async function assessRelevance(
  imageUrl: string,
  context: RecipeContext,
  prompt: string
): Promise<number> {
  // In a real implementation, this would use image analysis AI
  // For now, return a score based on prompt-context alignment
  const promptLower = prompt.toLowerCase();
  let relevanceScore = 0.5; // Base score

  // Check for cuisine alignment
  if (context.cuisine && promptLower.includes(context.cuisine.toLowerCase())) {
    relevanceScore += 0.2;
  }

  // Check for ingredient mentions
  if (context.mainIngredients.length > 0) {
    const ingredientMatches = context.mainIngredients.filter(ingredient =>
      promptLower.includes(ingredient.toLowerCase())
    );
    relevanceScore += (ingredientMatches.length / context.mainIngredients.length) * 0.2;
  }

  // Check for cooking method alignment
  if (context.cookingMethod && promptLower.includes(context.cookingMethod)) {
    relevanceScore += 0.1;
  }

  return Math.min(relevanceScore, 1.0);
}

/**
 * Assess technical quality (simplified)
 */
async function assessTechnicalQuality(imageUrl: string): Promise<number> {
  // In a real implementation, this would analyze image properties
  // For now, return a base score
  return 0.8;
}
```

### 2. User Feedback Collection

**File**: `src/components/ai-image-generation/ImageQualityFeedback.tsx`

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

interface ImageQualityFeedbackProps {
  imageUrl: string;
  recipeTitle: string;
  onFeedbackSubmitted: (feedback: ImageFeedback) => void;
}

interface ImageFeedback {
  rating: number;
  relevance: number;
  quality: number;
  comments: string;
  improvements: string[];
}

export function ImageQualityFeedback({
  imageUrl,
  recipeTitle,
  onFeedbackSubmitted
}: ImageQualityFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [relevance, setRelevance] = useState(0);
  const [quality, setQuality] = useState(0);
  const [comments, setComments] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);

  const handleSubmit = () => {
    const feedback: ImageFeedback = {
      rating,
      relevance,
      quality,
      comments,
      improvements
    };
    
    onFeedbackSubmitted(feedback);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Rate This Image
        </CardTitle>
        <CardDescription>
          Help us improve AI image generation for "{recipeTitle}"
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Rating */}
        <div>
          <label className="text-sm font-medium">Overall Rating</label>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`p-1 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                <Star className="h-5 w-5 fill-current" />
              </button>
            ))}
          </div>
        </div>

        {/* Relevance Rating */}
        <div>
          <label className="text-sm font-medium">Relevance to Recipe</label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setRelevance(1)}
              className={`p-2 ${relevance === 1 ? 'bg-red-100' : 'bg-gray-100'}`}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => setRelevance(2)}
              className={`p-2 ${relevance === 2 ? 'bg-green-100' : 'bg-gray-100'}`}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quality Rating */}
        <div>
          <label className="text-sm font-medium">Image Quality</label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setQuality(1)}
              className={`p-2 ${quality === 1 ? 'bg-red-100' : 'bg-gray-100'}`}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => setQuality(2)}
              className={`p-2 ${quality === 2 ? 'bg-green-100' : 'bg-gray-100'}`}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Comments */}
        <div>
          <label className="text-sm font-medium">Comments (Optional)</label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="What could be improved?"
            className="mt-1"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || relevance === 0 || quality === 0}
          className="w-full"
        >
          Submit Feedback
        </Button>
      </CardContent>
    </Card>
  );
}
```

## 📊 Performance Monitoring

### 1. Performance Metrics

**File**: `src/lib/ai-image-generation/performance-monitor.ts`

```typescript
export interface PerformanceMetrics {
  averageGenerationTime: number;
  successRate: number;
  cacheHitRate: number;
  costPerGeneration: number;
  userSatisfactionScore: number;
}

export interface PerformanceAlert {
  type: 'performance' | 'cost' | 'quality' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  metrics: any;
}

/**
 * Monitor performance metrics
 */
export async function collectPerformanceMetrics(): Promise<PerformanceMetrics> {
  // Collect metrics from usage data
  const metrics = await calculateMetrics();
  
  // Check for performance issues
  await checkPerformanceAlerts(metrics);
  
  return metrics;
}

/**
 * Check for performance alerts
 */
async function checkPerformanceAlerts(metrics: PerformanceMetrics): Promise<PerformanceAlert[]> {
  const alerts: PerformanceAlert[] = [];

  // Generation time alert
  if (metrics.averageGenerationTime > 30000) { // 30 seconds
    alerts.push({
      type: 'performance',
      severity: 'high',
      message: 'Image generation is slower than expected',
      timestamp: new Date().toISOString(),
      metrics: { averageGenerationTime: metrics.averageGenerationTime }
    });
  }

  // Success rate alert
  if (metrics.successRate < 0.9) {
    alerts.push({
      type: 'quality',
      severity: 'high',
      message: 'Image generation success rate is below 90%',
      timestamp: new Date().toISOString(),
      metrics: { successRate: metrics.successRate }
    });
  }

  // Cost alert
  if (metrics.costPerGeneration > 0.10) {
    alerts.push({
      type: 'cost',
      severity: 'medium',
      message: 'Average cost per generation is high',
      timestamp: new Date().toISOString(),
      metrics: { costPerGeneration: metrics.costPerGeneration }
    });
  }

  return alerts;
}
```

## 📚 Documentation

### 1. User Guide

**File**: `src/ai-image-generation/USER_GUIDE.md`

```markdown
# AI Image Generation User Guide

## Getting Started

AI image generation allows you to create custom images for your recipes using artificial intelligence. This guide will help you get the most out of this feature.

## How to Generate Images

1. **Navigate to Recipe Creation**: Go to the "Add Recipe" page
2. **Fill Recipe Details**: Enter your recipe title, ingredients, and instructions
3. **Choose Image Option**: Click "Generate with AI" next to the image upload
4. **Customize Prompt**: Review and modify the auto-generated image description
5. **Select Settings**: Choose image size and quality
6. **Generate**: Click "Generate Image" and wait for creation

## Tips for Better Images

### Writing Effective Prompts
- Be specific about the dish and style
- Mention key ingredients
- Include cooking method (baked, grilled, etc.)
- Add visual style preferences

### Example Prompts
- "A delicious homemade lasagna, Italian style, golden cheese topping, rustic presentation"
- "Fresh Thai curry with coconut milk, vibrant green color, aromatic spices, traditional bowl"
- "Chocolate chip cookies, warm and gooey, golden brown, home-baked style"

### Cost Optimization
- Use standard quality for most images
- Choose 1024x1024 size unless you need specific dimensions
- Check for similar recipes to reuse cached images

## Troubleshooting

### Common Issues
- **Generation Fails**: Try a simpler, shorter prompt
- **Poor Quality**: Use HD quality setting or refine prompt
- **High Costs**: Check your usage limits and optimize settings

### Getting Help
- Contact support for technical issues
- Check the FAQ for common questions
- Review your usage dashboard for cost management
```

## ✅ Phase 5 Completion Criteria

- [ ] Comprehensive test suite covers all functionality
- [ ] Quality validation system provides meaningful feedback
- [ ] Performance benchmarks meet requirements
- [ ] User feedback collection is implemented
- [ ] Production monitoring is active
- [ ] Documentation is complete and accurate
- [ ] All tests pass consistently
- [ ] Performance metrics are within acceptable ranges
- [ ] User satisfaction scores are positive
- [ ] System is ready for production deployment

## 🚀 Production Deployment

### Pre-Deployment Checklist
- [ ] All phases completed and tested
- [ ] Performance benchmarks met
- [ ] Cost management validated
- [ ] User acceptance testing passed
- [ ] Documentation reviewed
- [ ] Monitoring systems configured
- [ ] Rollback plan prepared

### Deployment Steps
1. Deploy backend API endpoints
2. Deploy frontend components
3. Run database migrations
4. Configure monitoring
5. Enable feature for users
6. Monitor initial usage

---

**Estimated Time**: 3-4 days
**Dependencies**: All previous phases
**Risk Level**: Low (testing and validation)

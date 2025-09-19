# Phase 1: Backend API Setup

**Create DALL-E 3 API integration with secure server-side image generation**

## 🎯 Objectives

- Create secure backend API endpoint for DALL-E 3 image generation
- Implement proper error handling and rate limiting
- Set up image processing and storage integration
- Ensure security best practices with server-side API key usage

## 📋 Deliverables

- [ ] New API endpoint: `/api/ai/generate-image`
- [ ] DALL-E 3 integration with existing OpenAI API key
- [ ] Image processing and optimization
- [ ] Storage integration with existing Supabase setup
- [ ] Error handling and rate limiting
- [ ] Basic testing infrastructure

## 🏗️ Implementation

### 1. Create API Endpoint

**File**: `api/ai/generate-image.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const { prompt, recipeTitle, categories, size = '1024x1024', quality = 'standard' }: GenerateImageRequest = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required and must be a string' 
      });
    }

    // Check API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ 
        success: false, 
        error: 'Image generation service not configured' 
      });
    }

    // Generate enhanced prompt for recipe context
    const enhancedPrompt = buildRecipeImagePrompt(prompt, recipeTitle, categories);

    // Call DALL-E 3 API
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size,
        quality,
        response_format: 'url'
      })
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      console.error('DALL-E API error:', errorData);
      
      return res.status(400).json({
        success: false,
        error: `Image generation failed: ${errorData.error?.message || 'Unknown error'}`
      });
    }

    const imageData = await imageResponse.json();
    const generatedImageUrl = imageData.data[0]?.url;

    if (!generatedImageUrl) {
      return res.status(500).json({
        success: false,
        error: 'No image URL returned from generation service'
      });
    }

    // TODO: Phase 2 - Download and store image in Supabase
    // For now, return the temporary URL (expires in 24 hours)
    const response: GenerateImageResponse = {
      success: true,
      imageUrl: generatedImageUrl,
      usage: {
        promptTokens: enhancedPrompt.length,
        totalCost: calculateImageCost(size, quality)
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during image generation'
    });
  }
}

/**
 * Build enhanced prompt for recipe images
 */
function buildRecipeImagePrompt(
  basePrompt: string, 
  recipeTitle?: string, 
  categories?: string[]
): string {
  let enhancedPrompt = basePrompt;

  // Add recipe context if available
  if (recipeTitle) {
    enhancedPrompt = `${recipeTitle}: ${enhancedPrompt}`;
  }

  // Add category context for better image relevance
  if (categories && categories.length > 0) {
    const categoryContext = categories
      .filter(cat => cat.includes('Cuisine:'))
      .map(cat => cat.split(':')[1]?.trim())
      .filter(Boolean)
      .join(', ');
    
    if (categoryContext) {
      enhancedPrompt += `, ${categoryContext} style`;
    }
  }

  // Add professional food photography context
  enhancedPrompt += ', professional food photography, high quality, appetizing, well-lit';

  return enhancedPrompt;
}

/**
 * Calculate estimated cost for image generation
 */
function calculateImageCost(size: string, quality: string): number {
  // DALL-E 3 pricing (as of 2024)
  const costs = {
    '1024x1024': { standard: 0.04, hd: 0.08 },
    '1024x1792': { standard: 0.08, hd: 0.12 },
    '1792x1024': { standard: 0.08, hd: 0.12 }
  };

  return costs[size as keyof typeof costs]?.[quality as 'standard' | 'hd'] || 0.04;
}
```

### 2. Add Rate Limiting

**File**: `api/ai/generate-image.ts` (addition)

```typescript
// Add rate limiting middleware
import { rateLimit } from '@/lib/rate-limit';

// Apply rate limiting: 5 requests per minute per user
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per window
  keyGenerator: (req) => {
    // Use user ID if available, otherwise IP
    return req.headers['x-user-id'] as string || req.headers['x-forwarded-for'] as string || 'anonymous';
  }
});

export default limiter(handler);
```

### 3. Create Rate Limiting Utility

**File**: `src/lib/rate-limit.ts`

```typescript
interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator: (req: any) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(options: RateLimitOptions) {
  return (handler: Function) => {
    return async (req: any, res: any) => {
      const key = options.keyGenerator(req);
      const now = Date.now();
      const windowStart = now - options.windowMs;

      // Clean up old entries
      Object.keys(store).forEach(k => {
        if (store[k].resetTime < windowStart) {
          delete store[k];
        }
      });

      // Get or create entry for this key
      if (!store[key] || store[key].resetTime < now) {
        store[key] = {
          count: 0,
          resetTime: now + options.windowMs
        };
      }

      // Check if limit exceeded
      if (store[key].count >= options.max) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
        });
      }

      // Increment counter
      store[key].count++;

      // Continue to handler
      return handler(req, res);
    };
  };
}
```

### 4. Add Environment Validation

**File**: `scripts/env-schema.json` (addition)

```json
{
  "OPENAI_API_KEY": {
    "required": true,
    "description": "OpenAI API key for DALL-E 3 image generation",
    "type": "string",
    "validation": "starts_with_sk-"
  }
}
```

## 🧪 Testing

### 1. Unit Tests

**File**: `src/__tests__/api/ai/generate-image.test.ts`

```typescript
import { handler } from '@/api/ai/generate-image';

describe('AI Image Generation API', () => {
  it('should reject non-POST requests', async () => {
    const req = { method: 'GET' } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should validate required prompt field', async () => {
    const req = { 
      method: 'POST', 
      body: {} 
    } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Prompt is required and must be a string'
    });
  });

  // Add more tests for successful generation, error handling, etc.
});
```

### 2. Integration Tests

**File**: `src/__tests__/integration/ai-image-generation.test.ts`

```typescript
describe('AI Image Generation Integration', () => {
  it('should generate image with recipe context', async () => {
    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A delicious homemade lasagna',
        recipeTitle: 'Classic Italian Lasagna',
        categories: ['Cuisine: Italian', 'Course: Main']
      })
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.imageUrl).toMatch(/^https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net/);
  });
});
```

## 🔒 Security Considerations

1. **API Key Protection**: Server-side only, never exposed to client
2. **Rate Limiting**: Prevent abuse and control costs
3. **Input Validation**: Sanitize prompts to prevent injection attacks
4. **Error Handling**: Don't expose sensitive information in error messages
5. **Content Filtering**: DALL-E 3 has built-in content filtering

## 📊 Monitoring

### 1. Usage Tracking

```typescript
// Add to handler
console.log(`[AI Image Generation] User: ${userId}, Prompt: ${prompt.substring(0, 100)}...`);
console.log(`[AI Image Generation] Cost: $${calculateImageCost(size, quality)}`);
```

### 2. Error Monitoring

```typescript
// Add to error handling
if (error.message.includes('quota')) {
  console.error('[AI Image Generation] Quota exceeded for user:', userId);
  // Alert monitoring system
}
```

## ✅ Phase 1 Completion Criteria

- [ ] API endpoint responds correctly to valid requests
- [ ] DALL-E 3 integration working with existing API key
- [ ] Rate limiting prevents abuse
- [ ] Error handling covers all failure scenarios
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Security review completed
- [ ] Monitoring and logging in place

## 🚀 Next Phase

Once Phase 1 is complete, proceed to [Phase 2: Frontend Integration](./PHASE-2-FRONTEND-INTEGRATION.md) to add the UI components and user interface for image generation.

---

**Estimated Time**: 1-2 days
**Dependencies**: Existing OpenAI API key setup
**Risk Level**: Low (uses existing infrastructure)

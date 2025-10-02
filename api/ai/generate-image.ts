import { VercelRequest, VercelResponse } from '@vercel/node';
import { createImageGenerationRateLimit } from '../../src/lib/rate-limit';

interface GenerateImageRequest {
  prompt: string;
  recipeTitle?: string;
  categories?: string[];
  ingredients?: string[];
  instructions?: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  useIntelligentPrompting?: boolean;
  fallbackOnError?: boolean;
}

interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  usedFallback?: boolean;
  fallbackStrategy?: string;
  usage?: {
    promptTokens: number;
    totalCost: number;
  };
}

const handler = async (
  req: VercelRequest,
  res: VercelResponse
): Promise<void> => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Validate request body
    const {
      prompt,
      recipeTitle,
      categories,
      size = '1024x1024',
      quality = 'standard',
      fallbackOnError = true,
    }: GenerateImageRequest = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string',
      });
      return;
    }

    // Check API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      res.status(500).json({
        success: false,
        error: 'Image generation service not configured',
      });
      return;
    }

    // Generate enhanced prompt for recipe context
    const enhancedPrompt = buildRecipeImagePrompt(
      prompt,
      recipeTitle,
      categories
    );

    // Call DALL-E 3 API
    const imageResponse = await fetch(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: 1,
          size,
          quality,
          response_format: 'url',
        }),
      }
    );

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      console.error('DALL-E API error:', errorData);

      // Try fallback strategies if enabled
      if (fallbackOnError) {
        const fallbackPrompt = generateFallbackPrompt(prompt);

        if (fallbackPrompt !== enhancedPrompt) {
          console.log(
            `[AI Image Generation] Trying fallback prompt: ${fallbackPrompt}`
          );

          const fallbackResponse = await fetch(
            'https://api.openai.com/v1/images/generations',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'dall-e-3',
                prompt: fallbackPrompt,
                n: 1,
                size,
                quality,
                response_format: 'url',
              }),
            }
          );

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            res.status(200).json({
              success: true,
              imageUrl: fallbackData.data[0]?.url,
              usedFallback: true,
              fallbackStrategy: 'simplified_prompt',
              usage: {
                promptTokens: fallbackPrompt.length,
                totalCost: calculateImageCost(size, quality),
              },
            });
            return;
          }
        }
      }

      res.status(400).json({
        success: false,
        error: `Image generation failed: ${errorData.error?.message || 'Unknown error'}`,
      });
      return;
    }

    const imageData = await imageResponse.json();
    const generatedImageUrl = imageData.data[0]?.url;

    if (!generatedImageUrl) {
      res.status(500).json({
        success: false,
        error: 'No image URL returned from generation service',
      });
      return;
    }

    const response: GenerateImageResponse = {
      success: true,
      imageUrl: generatedImageUrl,
      usage: {
        promptTokens: enhancedPrompt.length,
        totalCost: calculateImageCost(size, quality),
      },
    };

    res.status(200).json(response);
    return;
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during image generation',
    });
    return;
  }
};

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
      .filter((cat) => cat.includes('Cuisine:'))
      .map((cat) => cat.split(':')[1]?.trim())
      .filter(Boolean)
      .join(', ');

    if (categoryContext) {
      enhancedPrompt += `, ${categoryContext} style`;
    }
  }

  // Add professional food photography context
  enhancedPrompt +=
    ', professional food photography, high quality, appetizing, well-lit';

  return enhancedPrompt;
}

/**
 * Generate fallback prompt when primary generation fails
 */
function generateFallbackPrompt(basePrompt: string): string {
  // Simplify the prompt by removing complex elements
  let fallbackPrompt = basePrompt;

  // Remove overly complex descriptors
  fallbackPrompt = fallbackPrompt.replace(/very|extremely|incredibly/gi, '');
  fallbackPrompt = fallbackPrompt.replace(/,\s*,/g, ','); // Clean up double commas
  fallbackPrompt = fallbackPrompt.replace(/\s+/g, ' ').trim(); // Clean up spaces

  // Add basic food photography context
  fallbackPrompt += ', food photography, appetizing';

  return fallbackPrompt;
}

/**
 * Calculate estimated cost for image generation
 */
function calculateImageCost(size: string, quality: string): number {
  // DALL-E 3 pricing (as of 2024)
  const costs = {
    '1024x1024': { standard: 0.04, hd: 0.08 },
    '1024x1792': { standard: 0.08, hd: 0.12 },
    '1792x1024': { standard: 0.08, hd: 0.12 },
  };

  return (
    costs[size as keyof typeof costs]?.[quality as 'standard' | 'hd'] || 0.04
  );
}

// Apply rate limiting
export default createImageGenerationRateLimit()(handler);

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    // Validate request body exists
    if (!req.body) {
      res
        .status(400)
        .json({ success: false, error: 'Request body is required' });
      return;
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      res.status(500).json({
        success: false,
        error: 'Image generation service not configured',
      });
      return;
    }

    const {
      recipeTitle,
      description,
      ingredients,
      instructions,
      categories,
      quality = 'standard',
      style = 'photographic',
      mood = 'appetizing',
    }: GenerateImageRequest = req.body;

    // Validate required fields
    if (!recipeTitle) {
      res
        .status(400)
        .json({ success: false, error: 'Recipe title is required' });
      return;
    }

    // Ensure arrays exist with defaults
    const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeInstructions = instructions || '';

    // Force landscape orientation for consistency with UI frame
    const forcedSize = '1792x1024';

    // Generate enhanced prompt
    const prompt = generateEnhancedPrompt(
      {
        title: recipeTitle,
        description: description || '',
        ingredients: safeIngredients,
        instructions: safeInstructions,
        categories: safeCategories,
      },
      { style, mood, quality }
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
          prompt,
          n: 1,
          size: forcedSize,
          quality,
          response_format: 'url',
        }),
      }
    );

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      console.error('DALL-E API error:', errorData);
      throw new Error(
        errorData.error?.message || `HTTP ${imageResponse.status}`
      );
    }

    const imageData = await imageResponse.json();
    const temporaryImageUrl = imageData.data[0]?.url;

    if (!temporaryImageUrl) {
      throw new Error('No image URL returned from generation service');
    }

    // Download and store the image to avoid 403 errors from expired DALL-E URLs
    let permanentImageUrl: string;
    try {
      permanentImageUrl =
        await downloadAndStoreGeneratedImage(temporaryImageUrl);
    } catch (storageError) {
      console.warn(
        'Failed to store generated image, using temporary URL:',
        storageError
      );
      permanentImageUrl = temporaryImageUrl; // Fallback to temporary URL
    }

    res.status(200).json({
      success: true,
      imageUrl: permanentImageUrl,
      promptUsed: prompt,
      usage: {
        promptTokens: prompt.length,
        totalCost: calculateImageCost(forcedSize, quality),
      },
    });
  } catch (error) {
    console.error('Image generation error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Ensure we always send a proper JSON response
    try {
      res.status(500).json({
        success: false,
        error: `Image generation failed: ${errorMessage}`,
      });
    } catch (sendError) {
      // If JSON send fails, log the error
      console.error('Failed to send error response:', sendError);

      // Only attempt fallback if headers haven't been sent yet
      if (!res.headersSent) {
        try {
          res.status(500).json({
            success: false,
            error: `Image generation failed: ${errorMessage}`,
          });
        } catch (fallbackError) {
          console.error(
            'Failed to send fallback error response:',
            fallbackError
          );
        }
      }
    }
  }
}

/**
 * Generate enhanced prompt using recipe context analysis
 */
function generateEnhancedPrompt(
  recipe: {
    title: string;
    description: string;
    ingredients: string[];
    instructions: string;
    categories: string[];
  },
  options: {
    style: string;
    mood: string;
    quality: string;
  }
): string {
  const parts: string[] = [];

  // Start with dish title
  parts.push(`A delicious ${recipe.title.toLowerCase()}`);

  // Add description if available and rich
  if (recipe.description && recipe.description.trim().length > 30) {
    parts.push(recipe.description.trim());
  }

  // Add main ingredients (first 3)
  if (
    recipe.ingredients &&
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.length > 0
  ) {
    const mainIngredients = recipe.ingredients.slice(0, 3);
    parts.push(`featuring ${mainIngredients.join(' and ')}`);
  }

  // Add style and mood
  const styleMap: Record<string, string> = {
    photographic: 'professional food photography',
    artistic: 'artistic food presentation',
    minimalist: 'clean, minimalist presentation',
    luxury: 'luxury food styling',
  };

  const moodMap: Record<string, string> = {
    appetizing: 'appetizing and inviting',
    elegant: 'elegant and sophisticated',
    rustic: 'rustic and hearty',
    modern: 'modern and contemporary',
  };

  parts.push(`${styleMap[options.style]}, ${moodMap[options.mood]}`);

  // Add quality descriptor
  if (options.quality === 'hd') {
    parts.push('ultra high resolution');
  } else {
    parts.push('high quality');
  }

  return parts.join(', ');
}

/**
 * Download image from DALL-E URL and upload to Supabase storage
 */
async function downloadAndStoreGeneratedImage(
  imageUrl: string
): Promise<string> {
  try {
    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download the image from DALL-E URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download image: ${response.status} ${response.statusText}`
      );
    }

    const imageBlob = await response.blob();

    // Generate a unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const fileName = `ai-generated-${timestamp}-${randomSuffix}.png`;

    // Create the storage path (we'll use a generic user ID since we don't have auth context here)
    const storagePath = `generated-images/${fileName}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(storagePath, imageBlob, {
        cacheControl: '31536000', // 1 year cache
        contentType: 'image/png',
        upsert: false, // Don't overwrite - each generation should be unique
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get the public URL
    const { data } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(storagePath);

    console.log(`Successfully stored generated image: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    console.error('Error downloading and storing generated image:', error);
    throw new Error(
      `Failed to store generated image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Calculate image generation cost based on size and quality
 */
function calculateImageCost(size: string, quality: string): number {
  const costMap: Record<string, Record<string, number>> = {
    '1024x1024': { standard: 0.04, hd: 0.08 },
    '1024x1792': { standard: 0.08, hd: 0.12 },
    '1792x1024': { standard: 0.08, hd: 0.12 },
  };

  return costMap[size]?.[quality] || 0.04;
}

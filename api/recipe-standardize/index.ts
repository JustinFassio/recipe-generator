import type { VercelRequest, VercelResponse } from '@vercel/node';

// AI standardization prompt
const RECIPE_STANDARDIZATION_PROMPT = `You are a recipe standardization expert. Convert any recipe format into a standardized structure.

TARGET FORMAT:
# Recipe Title

## Setup (Prep Ahead)
- Soak beans overnight
- Marinate chicken for 2 hours
- Preheat oven to 350°F

## Ingredients
- 2 cups spinach
- 1 cup strawberries

## Instructions
1. Heat oil in pan
2. Add ingredients
3. Cook for 10 minutes

## Notes
- Storage tips
- Substitutions
- Serving suggestions

RULES:
1. Extract the recipe title from any format
2. Move ALL prep work (soaking, marinating, preheating, chopping, etc.) to Setup section
3. List ingredients with measurements
4. Convert instructions to numbered steps
5. Extract any tips, notes, or serving suggestions
6. Handle any input format (blogs, social media, tables, etc.)
7. Preserve all important information
8. Use clear, concise language
9. IMPORTANT: Keep the original recipe title as close to the source as possible
10. If the input is already well-formatted, make minimal changes
11. Ensure all sections are properly structured with markdown headers`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipeText } = req.body;

    // Validate input
    if (!recipeText || typeof recipeText !== 'string') {
      return res.status(400).json({ error: 'Recipe text is required' });
    }

    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured on server',
      });
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: RECIPE_STANDARDIZATION_PROMPT,
          },
          {
            role: 'user',
            content: `Please standardize this recipe:\n\n${recipeText}`,
          },
        ],
        temperature: 0.3, // Low temperature for consistent formatting
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return res.status(500).json({
        error: `AI processing failed: ${response.status}`,
      });
    }

    const data = await response.json();
    const standardizedText = data.choices[0]?.message?.content;

    if (!standardizedText) {
      return res.status(500).json({
        error: 'No response from AI standardization',
      });
    }

    // Return the standardized recipe text
    return res.status(200).json({
      standardizedText,
      success: true,
    });
  } catch (error) {
    console.error('Recipe standardization error:', error);
    return res.status(500).json({
      error: 'Internal server error during recipe standardization',
    });
  }
}

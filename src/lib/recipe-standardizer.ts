// Standardized recipe format interface

// Standardized recipe format interface
export interface StandardizedRecipe {
  title: string;
  setup: string[];
  ingredients: string[];
  instructions: string[];
  notes: string[];
}

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
9. IMPORTANT: Extract and preserve ALL category information from the input (Course, Cuisine, Technique, etc.) and include it in the Notes section as "Categories: [list of categories]"

Return ONLY the standardized recipe in the exact format above.`;

/**
 * Standardize a recipe using AI before parsing
 */
export async function standardizeRecipeWithAI(
  recipeText: string
): Promise<StandardizedRecipe> {
  try {
    // Check if OpenAI API is available
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OpenAI API key not available for recipe standardization'
      );
    }

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
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const standardizedText = data.choices[0]?.message?.content;

    if (!standardizedText) {
      throw new Error('No response from AI standardization');
    }

    // Parse the standardized text into structured format
    return parseStandardizedRecipe(standardizedText);
  } catch (error) {
    console.error('AI standardization failed:', error);
    throw new Error(
      `Failed to standardize recipe: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse the AI-standardized recipe text into structured format
 */
function parseStandardizedRecipe(text: string): StandardizedRecipe {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let title = '';
  const setup: string[] = [];
  const ingredients: string[] = [];
  const instructions: string[] = [];
  const notes: string[] = [];

  let currentSection = '';

  for (const line of lines) {
    // Extract title
    if (line.startsWith('# ') && !title) {
      title = line.substring(2).trim();
      continue;
    }

    // Detect section headers
    if (line.startsWith('## ')) {
      const sectionName = line.substring(3).toLowerCase();
      if (sectionName.includes('setup') || sectionName.includes('prep')) {
        currentSection = 'setup';
      } else if (sectionName.includes('ingredient')) {
        currentSection = 'ingredients';
      } else if (sectionName.includes('instruction')) {
        currentSection = 'instructions';
      } else if (sectionName.includes('note')) {
        currentSection = 'notes';
      }
      continue;
    }

    // Parse content based on current section
    if (currentSection === 'setup' && line.startsWith('- ')) {
      setup.push(line.substring(2).trim());
    } else if (currentSection === 'ingredients' && line.startsWith('- ')) {
      ingredients.push(line.substring(2).trim());
    } else if (currentSection === 'instructions' && /^\d+\./.test(line)) {
      // Extract numbered instruction
      const instruction = line.replace(/^\d+\.\s*/, '').trim();
      if (instruction) {
        instructions.push(instruction);
      }
    } else if (currentSection === 'notes' && line.startsWith('- ')) {
      notes.push(line.substring(2).trim());
    }
  }

  return {
    title: title || 'Untitled Recipe',
    setup,
    ingredients,
    instructions,
    notes,
  };
}

/**
 * Convert standardized recipe to ParsedRecipe format
 */
export function convertToParsedRecipe(standardized: StandardizedRecipe) {
  // Extract categories from notes if they're in "Categories:" format
  const categories: string[] = [];
  const notesWithoutCategories: string[] = [];

  for (const note of standardized.notes) {
    if (note.startsWith('Categories:')) {
      const categoryList = note.replace('Categories:', '').trim();
      if (categoryList) {
        // Split by comma and clean up each category
        const categoryArray = categoryList.split(',').map((cat) => cat.trim());
        categories.push(...categoryArray);
      }
    } else {
      notesWithoutCategories.push(note);
    }
  }

  return {
    title: standardized.title,
    ingredients: standardized.ingredients,
    instructions: standardized.instructions.join('\n\n'),
    notes:
      notesWithoutCategories.length > 0
        ? notesWithoutCategories.join('\n')
        : null,
    categories,
  };
}

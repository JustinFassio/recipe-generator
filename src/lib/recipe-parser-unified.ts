import type { RecipeFormData } from './schemas';
import { parseIngredientText } from './groceries/ingredient-parser';

/**
 * Unified Recipe Parser - Single source of truth for all recipe parsing
 *
 * This replaces the multiple parsing approaches with one intelligent system that:
 * 1. Handles any AI response format (JSON, conversational, structured)
 * 2. Provides consistent output regardless of input
 * 3. Includes comprehensive error handling and user feedback
 * 4. Supports progressive enhancement (structured -> conversational -> fallback)
 */

export interface ParsedRecipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  categories: string[];
  setup: string[];
}

export interface RecipeParseResult {
  success: boolean;
  recipe?: RecipeFormData;
  error?: string;
  warnings?: string[];
}

/**
 * Main entry point for all recipe parsing
 * Handles any format and returns consistent RecipeFormData
 */
export async function parseRecipeUnified(
  content: string
): Promise<RecipeParseResult> {
  try {
    // Step 1: Try structured JSON parsing (fastest, most reliable)
    const jsonResult = tryParseStructuredJSON(content);
    if (jsonResult.success) {
      return {
        success: true,
        recipe: jsonResult.recipe,
        warnings: jsonResult.warnings,
      };
    }

    // Step 2: Try AI-powered parsing for conversational content
    const aiResult = await tryAIParsing(content);
    if (aiResult.success) {
      return {
        success: true,
        recipe: aiResult.recipe,
        warnings: aiResult.warnings,
      };
    }

    // Step 3: Fallback to pattern-based parsing
    const fallbackResult = tryPatternParsing(content);
    if (fallbackResult.success) {
      return {
        success: true,
        recipe: fallbackResult.recipe,
        warnings: [
          'Recipe parsed using fallback method. Please review for accuracy.',
        ],
      };
    }

    return {
      success: false,
      error:
        'Unable to parse recipe from the provided content. Please ensure the content contains a complete recipe with ingredients and instructions.',
    };
  } catch (error) {
    return {
      success: false,
      error: `Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Step 1: Try to parse structured JSON (Chef Marco format, etc.)
 */
function tryParseStructuredJSON(content: string): RecipeParseResult {
  try {
    // Look for JSON in markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    let jsonText = jsonMatch ? jsonMatch[1].trim() : content.trim();

    // If no markdown, try to extract JSON object
    if (!jsonMatch && content.includes('{') && content.includes('}')) {
      const jsonObject = extractJSONObject(content);
      if (jsonObject) {
        jsonText = jsonObject;
      }
    }

    if (!jsonText) {
      return { success: false };
    }

    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.title || !parsed.ingredients || !parsed.instructions) {
      return { success: false };
    }

    const recipe: RecipeFormData = {
      title: String(parsed.title),
      description: String(parsed.description || ''),
      ingredients: normalizeIngredients(parsed.ingredients),
      instructions: String(parsed.instructions),
      notes: String(parsed.notes || ''),
      categories: Array.isArray(parsed.categories)
        ? parsed.categories.map(String)
        : [],
      setup: Array.isArray(parsed.setup) ? parsed.setup.map(String) : [],
      image_url: null,
    };

    return {
      success: true,
      recipe,
      warnings: [],
    };
  } catch {
    return { success: false };
  }
}

/**
 * Step 2: AI-powered parsing for conversational content
 */
async function tryAIParsing(content: string): Promise<RecipeParseResult> {
  // This would use OpenAI to extract structured recipe from conversational text
  // For now, we'll implement a simplified version

  try {
    // Check if content looks like it contains a recipe
    const hasRecipeIndicators =
      /ingredient|instruction|recipe|cook|bake|mix|add|cup|tablespoon|teaspoon/i.test(
        content
      );

    if (!hasRecipeIndicators) {
      return { success: false };
    }

    // Use the existing parseRecipeFromText function as a fallback
    const { parseRecipeFromText } = await import('./recipe-parser');
    const parsed = await parseRecipeFromText(content);

    const recipe: RecipeFormData = {
      title: parsed.title,
      description: parsed.description || '',
      ingredients: parsed.ingredients,
      instructions: parsed.instructions,
      notes: parsed.notes || '',
      categories: parsed.categories,
      setup: parsed.setup,
      image_url: null,
    };

    return {
      success: true,
      recipe,
      warnings: [
        'Recipe parsed from conversational text. Please review for accuracy.',
      ],
    };
  } catch {
    return { success: false };
  }
}

/**
 * Step 3: Pattern-based parsing as final fallback
 */
function tryPatternParsing(content: string): RecipeParseResult {
  try {
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let title = 'Recipe from Text';
    let description = '';
    const ingredients: string[] = [];
    const instructions: string[] = [];
    const categories: string[] = [];

    let inIngredientsSection = false;
    let inInstructionsSection = false;
    let inDescriptionSection = false;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Detect sections
      if (lowerLine.includes('description') || lowerLine.includes('about')) {
        inDescriptionSection = true;
        inIngredientsSection = false;
        inInstructionsSection = false;
        continue;
      }

      if (lowerLine.includes('ingredient')) {
        inIngredientsSection = true;
        inInstructionsSection = false;
        inDescriptionSection = false;
        continue;
      }

      if (
        lowerLine.includes('instruction') ||
        lowerLine.includes('step') ||
        lowerLine.includes('method') ||
        lowerLine.includes('cooking') ||
        lowerLine.includes('directions')
      ) {
        inIngredientsSection = false;
        inInstructionsSection = true;
        inDescriptionSection = false;
        continue;
      }

      // Extract title (usually first line or after "recipe:")
      if (
        title === 'Recipe from Text' &&
        !inIngredientsSection &&
        !inInstructionsSection &&
        !inDescriptionSection
      ) {
        if (lowerLine.includes('recipe:') || lowerLine.includes('title:')) {
          title = line.replace(/^(recipe|title):\s*/i, '');
        } else if (
          line.length > 5 &&
          line.length < 100 &&
          !line.includes(':')
        ) {
          title = line;
        }
      }

      // Extract description
      if (inDescriptionSection && line.length > 10) {
        if (description) {
          description += ' ' + line;
        } else {
          description = line;
        }
      }

      // Also capture description-like content before ingredients (common in conversational recipes)
      if (
        !inIngredientsSection &&
        !inInstructionsSection &&
        !inDescriptionSection &&
        title !== 'Recipe from Text' &&
        line.length > 20 &&
        line.length < 200 &&
        !line.includes(':') &&
        !line.match(/^[-*•]\s+/) &&
        !line.match(/^\d+\.\s+/) &&
        (line.includes('delicious') ||
          line.includes('flavor') ||
          line.includes('taste') ||
          line.includes('perfect') ||
          line.includes('tender') ||
          line.includes('crispy') ||
          line.includes('savory') ||
          line.includes('sweet') ||
          line.includes('spicy') ||
          line.includes('rich') ||
          line.includes('fresh'))
      ) {
        if (description) {
          description += ' ' + line;
        } else {
          description = line;
        }
      }

      // Extract ingredients
      if (
        inIngredientsSection &&
        (line.match(/^[-*•]\s+/) || // Bullet points
          line.match(/^\d+\.\s+/) || // Numbered lists
          line.includes('cup') ||
          line.includes('tbsp') ||
          line.includes('tsp') ||
          line.includes('ounce') ||
          line.includes('pound') ||
          line.includes('gram'))
      ) {
        const cleanIngredient = line
          .replace(/^[-*•]\s+/, '')
          .replace(/^\d+\.\s+/, '')
          .trim();
        if (cleanIngredient.length > 2) {
          ingredients.push(cleanIngredient);
        }
      }

      // Extract instructions
      if (
        inInstructionsSection &&
        (line.match(/^\d+\.\s+/) || // Numbered steps
          line.match(/^[-*•]\s+/) || // Bullet points
          lowerLine.includes('heat') ||
          lowerLine.includes('add') ||
          lowerLine.includes('cook') ||
          lowerLine.includes('mix') ||
          lowerLine.includes('stir') ||
          lowerLine.includes('bake'))
      ) {
        const cleanInstruction = line
          .replace(/^\d+\.\s+/, '')
          .replace(/^[-*•]\s+/, '')
          .trim();
        if (cleanInstruction.length > 5) {
          instructions.push(cleanInstruction);
        }
      }
    }

    if (ingredients.length === 0 || instructions.length === 0) {
      return { success: false };
    }

    const recipe: RecipeFormData = {
      title,
      description: description.trim(),
      ingredients,
      instructions: instructions.join('\n'),
      notes: '',
      categories,
      setup: [],
      image_url: null,
    };

    return {
      success: true,
      recipe,
    };
  } catch {
    return { success: false };
  }
}

/**
 * Normalize ingredients to string array regardless of input format
 * Uses the new ingredient parser to clean ingredient names by removing quantities, units, and size adjectives
 */
function normalizeIngredients(ingredients: unknown): string[] {
  if (!Array.isArray(ingredients)) {
    return [];
  }

  return ingredients
    .map((item: unknown) => {
      let rawIngredient: string;

      if (typeof item === 'string') {
        rawIngredient = item;
      } else if (typeof item === 'object' && item !== null) {
        // Handle object format: {item, amount, prep}
        const obj = item as { item?: string; amount?: string; prep?: string };
        const parts = [];
        if (obj.amount) parts.push(obj.amount);
        if (obj.item) parts.push(obj.item);
        if (obj.prep) parts.push(obj.prep);
        rawIngredient = parts.join(' ');
      } else {
        rawIngredient = String(item);
      }

      // Use the new ingredient parser to clean the ingredient name
      // This removes quantities, units, and size adjectives for consistent storage
      const parsed = parseIngredientText(rawIngredient);
      return parsed.name;
    })
    .filter((item) => item.length > 0);
}

/**
 * Extract JSON object from text content
 */
function extractJSONObject(text: string): string | null {
  let start = -1;
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = text.slice(start, i + 1);
        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          // Not valid JSON, continue searching
        }
        start = -1;
      }
    }
  }

  return null;
}

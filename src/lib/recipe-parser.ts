import type { ParsedRecipe, IngredientItem } from './types';
import { MAX_CATEGORIES_PER_RECIPE } from './constants';
import {
  normalizeCategories,
  uniqueValidCategories,
  sortCategories,
} from './category-parsing';
import type { CategoryObject } from './category-parsing';
import {
  standardizeRecipeWithAI,
  convertToParsedRecipe,
} from './recipe-standardizer';

// Convert markdown formatting to plain text
function convertMarkdownToPlainText(text: string): string {
  return (
    text
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Convert bold text **text** to text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      // Convert italic text *text* to text
      .replace(/\*([^*]+)\*/g, '$1')
      // Convert inline code `text` to text
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown links [text](url) to just text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove horizontal rules
      .replace(/^[-=*_]{3,}$/gm, '')
      // Remove markdown blockquotes
      .replace(/^>\s+/gm, '')
      // Remove markdown code blocks (with or without language specifiers)
      .replace(/```[\s\S]*?```/g, '')
      // Remove bullet points and list markers
      .replace(/^[-*•]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n')
      .trim()
  );
}

// Parse recipe from text using AI standardization
export async function parseRecipeFromText(text: string): Promise<ParsedRecipe> {
  // Input validation
  if (!text || typeof text !== 'string') {
    throw new Error('Recipe text must be a non-empty string');
  }

  if (text.length > 10000) {
    throw new Error(
      'Recipe text is too long. Please keep it under 10,000 characters.'
    );
  }

  // Clean up the text first
  const cleanedText = text.trim();

  // Check if the content looks like JSON before attempting to parse
  const trimmedText = cleanedText.trim();
  const looksLikeJson =
    trimmedText.startsWith('{') || trimmedText.includes('```json');

  // Try JSON first (most structured) - but only if it looks like JSON
  if (looksLikeJson) {
    try {
      let jsonText = cleanedText;

      // Check if JSON is wrapped in markdown code blocks
      const jsonBlockMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        jsonText = jsonBlockMatch[1];
      }

      // Try to parse as JSON first
      const parsed = JSON.parse(jsonText);
      const jsonRecipe = parseJsonRecipe(parsed);

      // Ensure setup field exists for JSON recipes
      return {
        ...jsonRecipe,
        setup: jsonRecipe.setup || [],
      };
    } catch (err) {
      console.error('JSON parsing failed, trying AI standardization:', err);
    }
  }

  // Use AI standardization for all other formats
  try {
    const standardized = await standardizeRecipeWithAI(cleanedText);
    const parsedRecipe = convertToParsedRecipe(standardized);

    // Add setup field from standardized recipe
    return {
      ...parsedRecipe,
      setup: standardized.setup,
    };
  } catch (error) {
    console.error(
      'AI standardization failed, falling back to flexible parsing:',
      error
    );

    // Fallback to original flexible parsing
    const fallbackRecipe = parseFlexibleRecipe(cleanedText);
    return {
      ...fallbackRecipe,
      setup: [], // No setup info in fallback
    };
  }
}

function parseJsonRecipe(parsed: Record<string, unknown>): ParsedRecipe {
  // Validate required fields
  const hasTitle = parsed.title || parsed.name;
  const hasIngredients =
    parsed.ingredients && Array.isArray(parsed.ingredients);
  const hasInstructions = parsed.instructions;

  if (!hasTitle) {
    throw new Error('Missing required field: title or name');
  }
  if (!hasIngredients) {
    throw new Error('Missing required field: ingredients (must be an array)');
  }
  if (!hasInstructions) {
    throw new Error('Missing required field: instructions');
  }

  const title = (parsed.name || parsed.title || 'Untitled Recipe') as string;
  const ingredients = parseIngredients(parsed.ingredients);
  const instructions = parseInstructions(parsed);
  const notes = parseNotes(parsed);
  const categories = parseCategories(parsed);
  const setup = parseSetup(parsed);

  return { title, ingredients, instructions, notes, categories, setup };
}

function parseIngredients(ingredients: unknown): string[] {
  const result: string[] = [];

  if (Array.isArray(ingredients)) {
    // Simple array format - convert to strings
    return ingredients
      .map((item: unknown) => {
        if (typeof item === 'string') {
          return item;
        } else if (typeof item === 'object' && item !== null) {
          const typedItem = item as IngredientItem;
          const ingredientStr =
            `${typedItem.amount || ''} ${typedItem.item || ''} ${typedItem.prep ? `, ${typedItem.prep}` : ''}`.trim();
          return ingredientStr;
        }
        return '';
      })
      .filter((item) => item.length > 0);
  } else if (typeof ingredients === 'object' && ingredients !== null) {
    // Nested object format with categories
    const categoryOrder = ['main', 'sauce', 'toppings', 'garnish'];
    const allCategories = Object.keys(ingredients);

    const orderedCategories = [
      ...categoryOrder.filter((cat) => allCategories.includes(cat)),
      ...allCategories.filter((cat) => !categoryOrder.includes(cat)),
    ];

    for (const category of orderedCategories) {
      const items = (ingredients as Record<string, unknown>)[category];
      if (Array.isArray(items) && items.length > 0) {
        const categoryTitle = category
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        result.push(`--- ${categoryTitle} ---`);

        for (const item of items) {
          if (typeof item === 'string') {
            result.push(item);
          } else if (typeof item === 'object' && item !== null) {
            const typedItem = item as IngredientItem;
            let ingredientStr = '';
            if (typedItem.amount) ingredientStr += `${typedItem.amount} `;
            if (typedItem.item) ingredientStr += typedItem.item;
            if (typedItem.prep) ingredientStr += `, ${typedItem.prep}`;

            if (ingredientStr.trim()) {
              result.push(ingredientStr.trim());
            }
          }
        }
      }
    }
  }

  return result;
}

function parseInstructions(parsed: Record<string, unknown>): string {
  const instructionParts: string[] = [];

  // Add basic/preparation instructions first
  if (
    parsed.basic_instructions &&
    Array.isArray(parsed.basic_instructions) &&
    parsed.basic_instructions.length > 0
  ) {
    instructionParts.push('**Preparation:**');
    parsed.basic_instructions.forEach((step: unknown, index: number) => {
      if (typeof step === 'string' && step.trim()) {
        instructionParts.push(`${index + 1}. ${step.trim()}`);
      }
    });
    instructionParts.push('');
  }

  // Add main cooking instructions
  if (Array.isArray(parsed.instructions) && parsed.instructions.length > 0) {
    if (instructionParts.length > 0) {
      instructionParts.push('**Cooking Instructions:**');
    }
    parsed.instructions.forEach((step: unknown, index: number) => {
      if (typeof step === 'string' && step.trim()) {
        const cleanStep = step.trim().replace(/^\d+\.\s*/, '');
        instructionParts.push(`${index + 1}. ${cleanStep}`);
      } else if (typeof step === 'object' && step !== null) {
        const stepObj = step as Record<string, unknown>;

        // Handle step object with step and details properties
        if (stepObj.step && typeof stepObj.step === 'string') {
          const stepTitle = stepObj.step.trim();
          instructionParts.push(`**${stepTitle}:**`);

          // Add details if they exist
          if (stepObj.details && Array.isArray(stepObj.details)) {
            stepObj.details.forEach((detail: unknown) => {
              if (typeof detail === 'string' && detail.trim()) {
                instructionParts.push(`• ${detail.trim()}`);
              }
            });
          }
        } else if (
          stepObj.text &&
          typeof stepObj.text === 'string' &&
          stepObj.text.trim()
        ) {
          const cleanStep = stepObj.text.trim().replace(/^\d+\.\s*/, '');
          instructionParts.push(`${index + 1}. ${cleanStep}`);
        }
      }
    });
  } else if (
    typeof parsed.instructions === 'string' &&
    parsed.instructions.trim()
  ) {
    if (instructionParts.length > 0) {
      instructionParts.push('**Cooking Instructions:**');
    }
    instructionParts.push(parsed.instructions.trim());
  }

  return instructionParts.join('\n');
}

function parseNotes(parsed: Record<string, unknown>): string {
  const notesParts: string[] = [];

  if (parsed.servings) {
    notesParts.push(`**Servings:** ${parsed.servings}`);
    notesParts.push('');
  }

  if (
    parsed.tips_and_tricks &&
    Array.isArray(parsed.tips_and_tricks) &&
    parsed.tips_and_tricks.length > 0
  ) {
    notesParts.push('**Tips & Tricks:**');
    parsed.tips_and_tricks.forEach((tip: unknown) => {
      if (typeof tip === 'string' && tip.trim()) {
        notesParts.push(`• ${tip.trim()}`);
      }
    });
    notesParts.push('');
  }

  if (
    parsed.substitutions &&
    Array.isArray(parsed.substitutions) &&
    parsed.substitutions.length > 0
  ) {
    notesParts.push('**Substitutions:**');
    parsed.substitutions.forEach((sub: unknown) => {
      if (typeof sub === 'string' && sub.trim()) {
        notesParts.push(`• ${sub.trim()}`);
      }
    });
    notesParts.push('');
  }

  if (
    parsed.pairings &&
    Array.isArray(parsed.pairings) &&
    parsed.pairings.length > 0
  ) {
    notesParts.push('**Pairings:**');
    parsed.pairings.forEach((pairing: unknown) => {
      if (typeof pairing === 'string' && pairing.trim()) {
        notesParts.push(`• ${pairing.trim()}`);
      }
    });
    notesParts.push('');
  }

  if (parsed.notes && typeof parsed.notes === 'string' && parsed.notes.trim()) {
    notesParts.push('**Additional Notes:**');
    notesParts.push(parsed.notes.trim());
  } else if (
    parsed.notes &&
    Array.isArray(parsed.notes) &&
    parsed.notes.length > 0
  ) {
    notesParts.push('**Additional Notes:**');
    parsed.notes.forEach((note: unknown) => {
      if (typeof note === 'string' && note.trim()) {
        notesParts.push(`• ${note.trim()}`);
      }
    });
  }

  return notesParts.join('\n').trim();
}

function parseSetup(parsed: Record<string, unknown>): string[] {
  const setupItems: string[] = [];

  // Handle setup array
  if (parsed.setup && Array.isArray(parsed.setup)) {
    parsed.setup.forEach((item: unknown) => {
      if (typeof item === 'string' && item.trim()) {
        setupItems.push(item.trim());
      }
    });
  }

  // Handle prep array
  if (parsed.prep && Array.isArray(parsed.prep)) {
    parsed.prep.forEach((item: unknown) => {
      if (typeof item === 'string' && item.trim()) {
        setupItems.push(item.trim());
      }
    });
  }

  // Handle prep_time as a setup item
  if (
    parsed.prep_time &&
    typeof parsed.prep_time === 'string' &&
    parsed.prep_time.trim()
  ) {
    setupItems.push(`Prep time: ${parsed.prep_time.trim()}`);
  }

  // Handle soak_time as a setup item
  if (
    parsed.soak_time &&
    typeof parsed.soak_time === 'string' &&
    parsed.soak_time.trim()
  ) {
    setupItems.push(`Soak time: ${parsed.soak_time.trim()}`);
  }

  // Handle marinate_time as a setup item
  if (
    parsed.marinate_time &&
    typeof parsed.marinate_time === 'string' &&
    parsed.marinate_time.trim()
  ) {
    setupItems.push(`Marinate time: ${parsed.marinate_time.trim()}`);
  }

  return setupItems;
}

function parseCategories(parsed: Record<string, unknown>): string[] {
  try {
    const allCategories: string[] = [];

    // Handle categories array or object
    if (parsed.categories) {
      if (Array.isArray(parsed.categories)) {
        parsed.categories.forEach((category: unknown) => {
          if (typeof category === 'string' && category.trim()) {
            allCategories.push(category.trim());
          }
        });
      } else if (
        typeof parsed.categories === 'object' &&
        parsed.categories !== null
      ) {
        // Handle object format categories
        const objectCategories = normalizeCategories(
          parsed.categories as CategoryObject
        );
        allCategories.push(...objectCategories);
      }
    }

    // Handle category string
    if (
      parsed.category &&
      typeof parsed.category === 'string' &&
      parsed.category.trim()
    ) {
      allCategories.push(parsed.category.trim());
    }

    // Handle tags array
    if (parsed.tags && Array.isArray(parsed.tags)) {
      parsed.tags.forEach((tag: unknown) => {
        if (typeof tag === 'string' && tag.trim()) {
          allCategories.push(tag.trim());
        }
      });
    }

    // Handle labels array
    if (parsed.labels && Array.isArray(parsed.labels)) {
      parsed.labels.forEach((label: unknown) => {
        if (typeof label === 'string' && label.trim()) {
          allCategories.push(label.trim());
        }
      });
    }

    // Handle classification array
    if (parsed.classification && Array.isArray(parsed.classification)) {
      parsed.classification.forEach((item: unknown) => {
        if (typeof item === 'string' && item.trim()) {
          allCategories.push(item.trim());
        }
      });
    }

    // Handle individual fields
    if (
      parsed.cuisine &&
      typeof parsed.cuisine === 'string' &&
      parsed.cuisine.trim()
    ) {
      allCategories.push(parsed.cuisine.trim());
    }

    if (parsed.type && typeof parsed.type === 'string' && parsed.type.trim()) {
      allCategories.push(parsed.type.trim());
    }

    if (
      parsed.dish_type &&
      typeof parsed.dish_type === 'string' &&
      parsed.dish_type.trim()
    ) {
      allCategories.push(parsed.dish_type.trim());
    }

    if (
      parsed.course &&
      typeof parsed.course === 'string' &&
      parsed.course.trim()
    ) {
      allCategories.push(parsed.course.trim());
    }

    if (
      parsed.technique &&
      typeof parsed.technique === 'string' &&
      parsed.technique.trim()
    ) {
      allCategories.push(parsed.technique.trim());
    }

    // Use advanced category parsing utilities
    const normalizedCategories = normalizeCategories(allCategories);
    const uniqueCategories = uniqueValidCategories(normalizedCategories);
    const sortedCategories = sortCategories(uniqueCategories);

    // Limit to MAX_CATEGORIES_PER_RECIPE
    const limitedCategories = sortedCategories.slice(
      0,
      MAX_CATEGORIES_PER_RECIPE
    );

    return limitedCategories;
  } catch (error) {
    console.warn('Category parsing error:', error);
    return [];
  }
}

function parseFlexibleRecipe(text: string): ParsedRecipe {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let title = 'Untitled Recipe';
  const ingredients: string[] = [];
  const instructions: string[] = [];
  const notes: string[] = [];

  let inPrepSection = false;
  let inIngredientsSection = false;
  let inInstructionsSection = false;
  let inNotesSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Detect title (usually the first prominent heading or text)
    if (
      title === 'Untitled Recipe' &&
      (line.match(/^#+\s+/) || // Markdown heading
        line.match(/^[A-Z][^.!?]*$/) || // Single line starting with capital, no punctuation
        (line.length > 5 && line.length < 80 && !line.includes(':'))) // Reasonable length without colons
    ) {
      title = convertMarkdownToPlainText(line)
        .replace(/^#+\s+/, '')
        .replace(/[^\w\s-]/g, '')
        .trim();
      continue;
    }

    // Detect sections
    if (
      lowerLine.includes('ingredient') ||
      lowerLine.includes('what you need')
    ) {
      inIngredientsSection = true;
      inPrepSection = false;
      inInstructionsSection = false;
      inNotesSection = false;
      continue;
    }

    if (
      lowerLine.includes('prep') ||
      lowerLine.includes('mise en place') ||
      lowerLine.includes('prepare')
    ) {
      inPrepSection = true;
      inIngredientsSection = false;
      inInstructionsSection = false;
      inNotesSection = false;
      continue;
    }

    if (
      lowerLine.includes('instruction') ||
      lowerLine.includes('direction') ||
      lowerLine.includes('step') ||
      lowerLine.includes('method') ||
      lowerLine.includes('cooking') ||
      lowerLine.includes('how to')
    ) {
      inInstructionsSection = true;
      inPrepSection = false;
      inIngredientsSection = false;
      inNotesSection = false;
      continue;
    }

    if (
      lowerLine.includes('note') ||
      lowerLine.includes('tip') ||
      lowerLine.includes('serves') ||
      lowerLine.includes('yield')
    ) {
      inNotesSection = true;
      inPrepSection = false;
      inIngredientsSection = false;
      inInstructionsSection = false;
      continue;
    }

    // Skip section headers and dividers
    if (
      line.match(/^[-=*_]{3,}$/) || // Dividers like --- or ===
      line.match(/^#+\s+/) || // Markdown headers
      line.match(/^[A-Z\s]+:$/) || // ALL CAPS headers
      (lowerLine.includes('---') && lowerLine.length < 10)
    ) {
      continue;
    }

    // Process content based on current section
    if (inIngredientsSection || inPrepSection) {
      // Handle various ingredient formats
      if (
        line.match(/^[-*•]\s+/) || // Bullet points
        line.match(/^\d+\.\s+/) || // Numbered lists
        line.includes('cup') ||
        line.includes('tbsp') ||
        line.includes('tsp') ||
        line.includes('ounce') ||
        line.includes('pound') ||
        line.includes('gram') ||
        line.includes('ml') ||
        line.includes('g') ||
        line.includes('oz') ||
        line.includes('lb') ||
        line.includes('kg')
      ) {
        // Clean up the ingredient line - convert markdown to plain text
        const cleanIngredient = convertMarkdownToPlainText(line)
          .replace(/^\*\*[^*]+\*\*:\s*/, '') // Remove bold headers like **Prep:**
          .replace(/^[A-Z\s]+:\s*/, '') // Remove ALL CAPS headers
          .trim();

        if (cleanIngredient && cleanIngredient.length > 2) {
          ingredients.push(cleanIngredient);
        }
      }
    } else if (inInstructionsSection) {
      // Handle various instruction formats
      if (
        line.match(/^[-*•]\s+/) || // Bullet points
        line.match(/^\d+\.\s+/) || // Numbered lists
        line.match(/^Step\s+\d+:/i) || // Step X: format
        line.match(/^\*\*[^*]+\*\*$/) || // Bold step headers
        line.includes('heat') ||
        line.includes('add') ||
        line.includes('cook') ||
        line.includes('mix') ||
        line.includes('stir') ||
        line.includes('bake') ||
        line.includes('simmer') ||
        line.includes('boil') ||
        line.includes('fry')
      ) {
        // Clean up the instruction line - convert markdown to plain text
        const cleanInstruction = convertMarkdownToPlainText(line)
          .replace(/^Step\s+\d+:\s*/i, '') // Remove Step X: prefix
          .replace(/^\*\*([^*]+)\*\*$/, '$1') // Remove bold formatting
          .trim();

        if (cleanInstruction && cleanInstruction.length > 5) {
          instructions.push(cleanInstruction);
        }
      }
    } else if (inNotesSection) {
      // Handle notes and tips
      if (
        line.match(/^[-*•]\s+/) || // Bullet points
        line.match(/^\d+\.\s+/) || // Numbered lists
        line.match(/^✨\s+/) || // Sparkle emoji
        line.match(/^💡\s+/) || // Lightbulb emoji
        line.includes('tip') ||
        line.includes('note') ||
        line.includes('serves') ||
        line.includes('yield')
      ) {
        const cleanNote = convertMarkdownToPlainText(line)
          .replace(/^[✨💡]/u, '') // Remove emojis
          .trim();

        if (cleanNote && cleanNote.length > 3) {
          notes.push(cleanNote);
        }
      }
    }
  }

  // If we didn't find structured sections, try to extract ingredients and instructions from the whole text
  if (ingredients.length === 0 && instructions.length === 0) {
    return extractFromUnstructuredText(text);
  }

  // Validate that we found actual recipe content
  if (ingredients.length === 0 && instructions.length === 0) {
    throw new Error(
      'No recipe content found. Please ensure your text contains ingredients and cooking instructions. ' +
        'Supported formats: structured text with Ingredients and Instructions sections, or JSON format.'
    );
  }

  // Extract categories from markdown text
  const categories = extractCategoriesFromMarkdown(text);

  return {
    title,
    ingredients,
    instructions: instructions.join('\n'),
    notes: notes.join('\n'),
    categories,
    setup: [], // No setup info in flexible parsing
  };
}

function extractFromUnstructuredText(text: string): ParsedRecipe {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const ingredients: string[] = [];
  const instructions: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Try to identify ingredients by common patterns
    if (
      line.match(/^\d+/) && // Starts with number
      (line.includes('cup') ||
        line.includes('tbsp') ||
        line.includes('tsp') ||
        line.includes('ounce') ||
        line.includes('pound') ||
        line.includes('gram') ||
        line.includes('ml') ||
        line.includes('g') ||
        line.includes('oz') ||
        line.includes('lb') ||
        line.includes('kg') ||
        line.includes('clove') ||
        line.includes('medium') ||
        line.includes('large') ||
        line.includes('small'))
    ) {
      ingredients.push(convertMarkdownToPlainText(line));
    }
    // Try to identify instructions by action words
    else if (
      lowerLine.includes('heat') ||
      lowerLine.includes('add') ||
      lowerLine.includes('cook') ||
      lowerLine.includes('mix') ||
      lowerLine.includes('stir') ||
      lowerLine.includes('bake') ||
      lowerLine.includes('simmer') ||
      lowerLine.includes('boil') ||
      lowerLine.includes('fry') ||
      lowerLine.includes('preheat') ||
      lowerLine.includes('combine') ||
      lowerLine.includes('pour')
    ) {
      instructions.push(convertMarkdownToPlainText(line));
    }
  }

  // Extract categories from unstructured text
  const categories = extractCategoriesFromMarkdown(text);

  return {
    title: 'Recipe from Text',
    ingredients,
    instructions: instructions.join('\n'),
    notes: '',
    categories,
    setup: [], // No setup info in unstructured text
  };
}

/**
 * Extract categories from markdown text using various patterns
 */
function extractCategoriesFromMarkdown(text: string): string[] {
  const categories: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();

    // Look for explicit category lines
    if (
      trimmed.startsWith('categories:') ||
      trimmed.startsWith('tags:') ||
      trimmed.startsWith('type:') ||
      trimmed.startsWith('cuisine:') ||
      trimmed.startsWith('course:') ||
      trimmed.startsWith('dish type:') ||
      trimmed.startsWith('technique:')
    ) {
      const content = line.substring(line.indexOf(':') + 1).trim();

      // Handle comma-separated values
      if (content.includes(',')) {
        const items = content
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        categories.push(...items);
      } else if (content) {
        categories.push(content);
      }
    }

    // Look for inline category mentions with simpler patterns
    const categoryPatterns = [
      /(course):\s*([^,.\n]+?)(?=\s|$|,|\.)/gi,
      /(cuisine):\s*([^,.\n]+?)(?=\s|$|,|\.)/gi,
      /(type):\s*([^,.\n]+?)(?=\s|$|,|\.)/gi,
      /(technique):\s*([^,.\n]+?)(?=\s|$|,|\.)/gi,
      /(dish type):\s*([^,.\n]+?)(?=\s|$|,|\.)/gi,
    ];

    categoryPatterns.forEach((pattern) => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const namespace = match[1];
        const value = match[2];
        if (namespace && value) {
          categories.push(`${namespace}: ${value.trim()}`);
        }
      }
    });
  }

  // Use category parsing utilities to normalize and validate
  try {
    const normalizedCategories = normalizeCategories(categories);
    const uniqueCategories = uniqueValidCategories(normalizedCategories);
    const sortedCategories = sortCategories(uniqueCategories);

    return sortedCategories;
  } catch (error) {
    console.warn('Category extraction error:', error);
    return [];
  }
}

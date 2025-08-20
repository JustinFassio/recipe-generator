import type { ParsedRecipe, IngredientItem } from './types';

// Parse recipe from text using external API
export async function parseRecipeFromText(text: string): Promise<ParsedRecipe> {
  try {
    console.log('Attempting to parse as JSON...');

    let jsonText = text;

    // Check if JSON is wrapped in markdown code blocks
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1];
      console.log('Extracted JSON from markdown code block');
    }

    // Try to parse as JSON first
    const parsed = JSON.parse(jsonText);
    console.log('Successfully parsed JSON format');

    return parseJsonRecipe(parsed);
  } catch {
    console.log('JSON parsing failed, trying markdown parsing');
    return parseMarkdownRecipe(text);
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

  return { title, ingredients, instructions, notes };
}

function parseIngredients(ingredients: unknown): string[] {
  const result: string[] = [];

  if (Array.isArray(ingredients)) {
    // Simple array format - convert to strings
    return ingredients.map((item: string | IngredientItem) =>
      typeof item === 'string'
        ? item
        : `${item.amount || ''} ${item.item || ''} ${item.prep ? `, ${item.prep}` : ''}`.trim()
    );
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
    parsed.basic_instructions.forEach((step: string, index: number) => {
      if (step && step.trim()) {
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
    parsed.instructions.forEach((step: string) => {
      if (step && step.trim()) {
        const cleanStep = step.trim().replace(/^\d+\.\s*/, '');
        instructionParts.push(cleanStep);
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
    parsed.tips_and_tricks.forEach((tip: string) => {
      if (tip && tip.trim()) {
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
    parsed.substitutions.forEach((sub: string) => {
      if (sub && sub.trim()) {
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
    parsed.pairings.forEach((pairing: string) => {
      if (pairing && pairing.trim()) {
        notesParts.push(`• ${pairing.trim()}`);
      }
    });
    notesParts.push('');
  }

  if (parsed.notes && typeof parsed.notes === 'string' && parsed.notes.trim()) {
    notesParts.push('**Additional Notes:**');
    notesParts.push(parsed.notes.trim());
  }

  return notesParts.join('\n').trim();
}

function parseMarkdownRecipe(text: string): ParsedRecipe {
  console.log('Text preview:', text.substring(0, 200) + '...');

  // Try to extract recipe content from the text
  let processedText = text;
  const recipeKeywords = [
    'ingredient',
    'instruction',
    'recipe',
    'cook',
    'bake',
    'prepare',
    'serve',
    'mix',
    'add',
    'heat',
    'boil',
    'fry',
    'season',
    'cup',
    'tablespoon',
    'teaspoon',
    'oz',
    'lb',
    'gram',
  ];

  const lines = text.split('\n');
  let recipeStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (recipeKeywords.some((keyword) => line.includes(keyword))) {
      recipeStartIndex = i;
      break;
    }
  }

  if (recipeStartIndex >= 0) {
    processedText = lines.slice(recipeStartIndex).join('\n');
    console.log(
      'Extracted recipe content starting from line',
      recipeStartIndex
    );
  }

  // Parse markdown content
  const processedLines = processedText
    .split('\n')
    .filter((line) => line.trim());
  let title = 'Untitled Recipe';
  const ingredients: string[] = [];
  let instructions = '';
  let notes = '';
  let currentSection = '';

  for (const line of processedLines) {
    const trimmed = line.trim();
    const lowerTrimmed = trimmed.toLowerCase();

    if (trimmed.startsWith('#')) {
      const potentialTitle = trimmed.replace(/^#+\s*/, '');
      if (
        potentialTitle.length > 0 &&
        !lowerTrimmed.includes('implementation') &&
        !lowerTrimmed.includes('outcome')
      ) {
        title = potentialTitle;
        currentSection = 'title';
      }
    } else if (lowerTrimmed.includes('ingredient')) {
      currentSection = 'ingredients';
    } else if (
      lowerTrimmed.includes('instruction') ||
      lowerTrimmed.includes('direction') ||
      lowerTrimmed.includes('step') ||
      lowerTrimmed.includes('method')
    ) {
      currentSection = 'instructions';
    } else if (lowerTrimmed.includes('note') || lowerTrimmed.includes('tip')) {
      currentSection = 'notes';
    } else if (
      trimmed.startsWith('-') ||
      trimmed.startsWith('*') ||
      /^\d+\./.test(trimmed)
    ) {
      if (currentSection === 'ingredients') {
        ingredients.push(trimmed.replace(/^[-*]\s*|\d+\.\s*/, ''));
      } else if (currentSection === 'instructions') {
        instructions += trimmed.replace(/^[-*]\s*|\d+\.\s*/, '') + '\n';
      }
    } else if (trimmed) {
      if (currentSection === 'instructions') {
        instructions += trimmed + '\n';
      } else if (currentSection === 'notes') {
        notes += trimmed + '\n';
      } else if (
        !currentSection &&
        title === 'Untitled Recipe' &&
        !lowerTrimmed.includes('implementation') &&
        !lowerTrimmed.includes('outcome') &&
        !lowerTrimmed.includes('analysis') &&
        trimmed.length < 100
      ) {
        title = trimmed;
      }
    }
  }

  // Provide helpful default if no recipe content found
  if (ingredients.length === 0 && instructions.trim() === '') {
    return {
      title: 'Recipe from AI Conversation',
      ingredients: ['Please ask the AI to provide specific ingredients'],
      instructions:
        'Please ask the AI to provide step-by-step cooking instructions.',
      notes: `Original AI response: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}\n\nTip: Try asking the AI something like "Can you give me a complete recipe with ingredients and instructions?"`,
    };
  }

  return {
    title,
    ingredients,
    instructions: instructions.trim(),
    notes: notes.trim(),
  };
}

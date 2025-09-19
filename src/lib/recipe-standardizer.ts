// Standardized recipe format interface
export interface StandardizedRecipe {
  title: string;
  setup: string[];
  ingredients: string[];
  instructions: string[];
  notes: string[];
}

// TODO: AI standardization temporarily disabled for security
// Will be re-enabled once proper backend API is implemented

/**
 * Standardize a recipe (AI processing temporarily disabled for security)
 * TODO: Re-enable AI processing once proper backend API is implemented
 */
export async function standardizeRecipeWithAI(
  recipeText: string
): Promise<StandardizedRecipe> {
  try {
    // Call the secure backend API for AI processing
    const response = await fetch('/api/recipe-standardize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipeText }),
    });

    // Check if response exists and has ok property
    if (!response || typeof response.ok === 'undefined') {
      throw new Error(
        'AI API standardization failed: No response or malformed response object'
      );
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AI standardization API error:', errorData);

      // Fallback to local parsing if AI processing fails
      console.warn(
        'AI recipe standardization failed. Using local parsing as fallback.'
      );
      return parseStandardizedRecipe(recipeText);
    }

    const data = await response.json();

    if (data.success && data.standardizedText) {
      // Parse the AI-standardized text
      return parseStandardizedRecipe(data.standardizedText);
    } else {
      throw new Error('Invalid response from AI standardization API');
    }
  } catch (error) {
    console.error('Recipe standardization failed:', error);
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

  // Extract categories from the entire text first
  const categories: string[] = [];

  // Look for category patterns in the text
  const categoryPatterns = [
    /(?:^|\n)(?:Categories?|Tags?|Type):\s*(.+?)(?:\n|$)/gi,
    /(?:^|\n)(?:Course|Cuisine|Technique):\s*(.+?)(?:\n|$)/gi,
    /(?:^|\n)(?:#+\s*)?(?:Course|Cuisine|Technique):\s*(.+?)(?:\n|$)/gi,
  ];

  for (const pattern of categoryPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const categoryList = match[1].trim();
      if (categoryList) {
        // Split by comma and clean up each category
        const categoryArray = categoryList.split(',').map((cat) => cat.trim());
        categories.push(...categoryArray);
      }
    }
  }

  // Also look for inline category mentions
  const inlineCategoryPattern = /(?:Course|Cuisine|Technique):\s*([^,\n]+)/gi;
  let inlineMatch;
  while ((inlineMatch = inlineCategoryPattern.exec(text)) !== null) {
    const category = inlineMatch[1].trim();
    if (category && !categories.includes(category)) {
      categories.push(category);
    }
  }

  for (const line of lines) {
    // Extract title from any markdown header (1-6 # symbols)
    if (line.match(/^#{1,6}\s+/) && !title) {
      // Remove markdown header symbols and clean up
      title = line.replace(/^#{1,6}\s+/, '').trim();
      // Remove any markdown formatting like **bold** or *italic*
      title = title.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove **bold**
      title = title.replace(/\*(.*?)\*/g, '$1'); // Remove *italic*
      title = title.replace(/`(.*?)`/g, '$1'); // Remove `code`
      // Remove emojis and other non-text characters at the beginning
      title = title
        .replace(
          /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/gu,
          ''
        )
        .trim();
      continue;
    }

    // Detect section headers
    if (line.startsWith('## ')) {
      const sectionName = line.substring(3).toLowerCase();
      if (
        sectionName.includes('setup') ||
        sectionName.includes('prep') ||
        sectionName.includes('assembly')
      ) {
        currentSection = 'setup';
      } else if (
        sectionName.includes('ingredient') ||
        sectionName.includes('vinaigrette') ||
        sectionName.includes('dressing')
      ) {
        currentSection = 'ingredients';
      } else if (
        sectionName.includes('instruction') &&
        !sectionName.includes('assembly')
      ) {
        currentSection = 'instructions';
      } else if (
        sectionName.includes('note') ||
        sectionName.includes('healing')
      ) {
        currentSection = 'notes';
      }
      continue;
    }

    // Parse content based on current section
    if (currentSection === 'setup') {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        setup.push(line.substring(2).trim());
      } else if (/^\d+\./.test(line)) {
        // Extract numbered setup step
        const setupStep = line.replace(/^\d+\.\s*/, '').trim();
        if (setupStep) {
          setup.push(setupStep);
        }
      }
    } else if (
      currentSection === 'ingredients' &&
      (line.startsWith('- ') || line.startsWith('* '))
    ) {
      ingredients.push(line.substring(2).trim());
    } else if (currentSection === 'instructions' && /^\d+\./.test(line)) {
      // Extract numbered instruction
      const instruction = line.replace(/^\d+\.\s*/, '').trim();
      if (instruction) {
        instructions.push(instruction);
      }
    } else if (
      currentSection === 'notes' &&
      (line.startsWith('- ') || line.startsWith('* '))
    ) {
      notes.push(line.substring(2).trim());
    }
  }

  // Add categories to notes if found
  if (categories.length > 0) {
    notes.unshift(`Categories: ${categories.join(', ')}`);
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
 * Extract categories from recipe notes and separate them from regular notes
 *
 * This function processes recipe notes to identify and extract category information
 * that was previously embedded in the notes array. It looks for notes that start
 * with "Categories:" and parses the comma-separated category list.
 *
 * @param notes - Array of recipe notes, potentially containing category information
 * @returns An object containing:
 *   - categories: Array of extracted category strings (e.g., ["Italian", "Pasta", "Quick"])
 *   - notesWithoutCategories: Array of notes with category information removed
 *
 * @example
 * ```typescript
 * const result = extractCategoriesFromNotes([
 *   "Categories: Italian, Pasta, Quick",
 *   "Serve with fresh basil",
 *   "Can be made ahead"
 * ]);
 * // Returns:
 * // {
 * //   categories: ["Italian", "Pasta", "Quick"],
 * //   notesWithoutCategories: ["Serve with fresh basil", "Can be made ahead"]
 * // }
 * ```
 */
function extractCategoriesFromNotes(notes: string[]): {
  categories: string[];
  notesWithoutCategories: string[];
} {
  const categories: string[] = [];
  const notesWithoutCategories: string[] = [];

  for (const note of notes) {
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

  return { categories, notesWithoutCategories };
}

/**
 * Convert standardized recipe to ParsedRecipe format
 */
export function convertToParsedRecipe(standardized: StandardizedRecipe) {
  const { categories, notesWithoutCategories } = extractCategoriesFromNotes(
    standardized.notes
  );

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

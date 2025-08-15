import { supabase } from './supabase';
import type { Recipe } from './supabase';

export const recipeApi = {
  // Fetch all recipes for the current user
  async getRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get a single recipe by ID
  async getRecipe(id: string): Promise<Recipe | null> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new recipe
  async createRecipe(
    recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Recipe> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('recipes')
      .insert({ ...recipe, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing recipe
  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a recipe
  async deleteRecipe(id: string): Promise<void> {
    const { error } = await supabase.from('recipes').delete().eq('id', id);

    if (error) throw error;
  },

  // Upload recipe image
  async uploadImage(file: File): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
};

// Types for the new JSON recipe format
interface IngredientItem {
  item: string;
  amount?: string;
  prep?: string;
}

// RecipeJSON interface removed as it's not used directly due to dynamic JSON parsing

// Parse recipe from text using external API
export async function parseRecipeFromText(text: string): Promise<{
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
}> {
  // This would typically call your LLM proxy endpoint
  // For now, we'll simulate the parsing with a basic implementation
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

    // Validate required fields - be flexible about field names
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

    // Handle complex nested JSON structure
    if (parsed.name || parsed.title) {
      const title = parsed.name || parsed.title || 'Untitled Recipe';
      let ingredients: string[] = [];
      let instructions = '';
      let notes = '';

      // Handle nested ingredients object with categories
      if (parsed.ingredients && typeof parsed.ingredients === 'object') {
        if (Array.isArray(parsed.ingredients)) {
          // Simple array format - convert to strings
          ingredients = parsed.ingredients.map(
            (item: string | IngredientItem) =>
              typeof item === 'string'
                ? item
                : `${item.amount || ''} ${item.item || ''} ${item.prep ? `, ${item.prep}` : ''}`.trim()
          );
        } else {
          // Nested object format with categories (main, sauce, toppings, etc.)
          const categoryOrder = ['main', 'sauce', 'toppings', 'garnish']; // Preferred order
          const allCategories = Object.keys(parsed.ingredients);

          // Process categories in preferred order, then any remaining
          const orderedCategories = [
            ...categoryOrder.filter((cat) => allCategories.includes(cat)),
            ...allCategories.filter((cat) => !categoryOrder.includes(cat)),
          ];

          for (const category of orderedCategories) {
            const items = parsed.ingredients[category];
            if (Array.isArray(items) && items.length > 0) {
              // Add category header with proper capitalization
              const categoryTitle = category
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase());
              ingredients.push(`--- ${categoryTitle} ---`);

              for (const item of items) {
                if (typeof item === 'string') {
                  ingredients.push(item);
                } else if (typeof item === 'object' && item !== null) {
                  // Handle structured ingredient objects: { item, amount, prep }
                  const typedItem = item as IngredientItem;
                  let ingredientStr = '';
                  if (typedItem.amount) ingredientStr += `${typedItem.amount} `;
                  if (typedItem.item) ingredientStr += typedItem.item;
                  if (typedItem.prep) ingredientStr += `, ${typedItem.prep}`;

                  if (ingredientStr.trim()) {
                    ingredients.push(ingredientStr.trim());
                  }
                }
              }
            }
          }
        }
      }

      // Handle instructions - support both array and string formats
      const instructionParts: string[] = [];

      // Add basic/preparation instructions first (if present)
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
        instructionParts.push(''); // Add blank line
      }

      // Add main cooking instructions
      if (
        Array.isArray(parsed.instructions) &&
        parsed.instructions.length > 0
      ) {
        if (instructionParts.length > 0) {
          instructionParts.push('**Cooking Instructions:**');
        }
        parsed.instructions.forEach((step: string) => {
          if (step && step.trim()) {
            // Remove any existing numbering and add clean formatting
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

      instructions = instructionParts.join('\n');

      // Handle notes - combine various optional sections
      const notesParts: string[] = [];

      // Add servings information
      if (parsed.servings) {
        notesParts.push(`**Servings:** ${parsed.servings}`);
        notesParts.push('');
      }

      // Add tips and tricks
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

      // Add substitutions
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

      // Add pairings
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

      // Add any additional notes
      if (
        parsed.notes &&
        typeof parsed.notes === 'string' &&
        parsed.notes.trim()
      ) {
        notesParts.push('**Additional Notes:**');
        notesParts.push(parsed.notes.trim());
      }

      notes = notesParts.join('\n').trim();

      return {
        title,
        ingredients,
        instructions,
        notes,
      };
    }

    // Fallback for simple JSON format
    return {
      title: parsed.title || parsed.name || 'Untitled Recipe',
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      instructions: parsed.instructions || '',
      notes: parsed.notes || '',
    };
  } catch {
    console.log('JSON parsing failed, trying markdown parsing');
    console.log('Text preview:', text.substring(0, 200) + '...');

    // Try to extract recipe content from the text if it contains non-recipe content
    let processedText = text;

    // Look for recipe-like sections and extract them
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

    // Find the first line that contains recipe-related content
    let recipeStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (recipeKeywords.some((keyword) => line.includes(keyword))) {
        recipeStartIndex = i;
        break;
      }
    }

    // If we found recipe content, start from there
    if (recipeStartIndex >= 0) {
      processedText = lines.slice(recipeStartIndex).join('\n');
      console.log(
        'Extracted recipe content starting from line',
        recipeStartIndex
      );
    } else {
      // If no clear recipe content found, try to extract any structured content
      console.log('No clear recipe keywords found, using full text');
    }

    // If not JSON, treat as markdown and do basic parsing
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
        // Only use as title if it looks like a recipe title
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
      } else if (
        lowerTrimmed.includes('note') ||
        lowerTrimmed.includes('tip')
      ) {
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
          // Only use as title if it's short and doesn't contain non-recipe words
          title = trimmed;
        }
      }
    }

    // If we didn't find much recipe content, provide a helpful default
    if (ingredients.length === 0 && instructions.trim() === '') {
      return {
        title: 'Recipe from AI Conversation',
        ingredients: ['Please ask the AI to provide specific ingredients'],
        instructions:
          'Please ask the AI to provide step-by-step cooking instructions.',
        notes: `Original AI response: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}\n\nTip: Try asking the AI something like "Can you give me a complete recipe with ingredients and instructions?"`,
      };
    }

    const result = {
      title,
      ingredients,
      instructions: instructions.trim(),
      notes: notes.trim(),
    };

    console.log('Markdown parsing result:', result);
    return result;
  }
}

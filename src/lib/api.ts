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
  async uploadImage(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

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
    // Try to parse as JSON first
    const parsed = JSON.parse(text);

    // Handle complex nested JSON structure
    if (parsed.name || parsed.title) {
      const title = parsed.name || parsed.title || 'Untitled Recipe';
      let ingredients: string[] = [];
      let instructions = '';
      let notes = '';

      // Handle nested ingredients object with categories
      if (parsed.ingredients && typeof parsed.ingredients === 'object') {
        if (Array.isArray(parsed.ingredients)) {
          // Simple array format
          ingredients = parsed.ingredients;
        } else {
          // Nested object format with categories
          for (const [category, items] of Object.entries(parsed.ingredients)) {
            if (Array.isArray(items)) {
              // Add category header
              ingredients.push(
                `--- ${category.charAt(0).toUpperCase() + category.slice(1)} ---`
              );

              for (const item of items) {
                if (typeof item === 'string') {
                  ingredients.push(item);
                } else if (typeof item === 'object' && item.item) {
                  // Handle structured ingredient objects
                  let ingredientStr = '';
                  if (item.amount) ingredientStr += `${item.amount} `;
                  ingredientStr += item.item;
                  if (item.prep) ingredientStr += `, ${item.prep}`;
                  ingredients.push(ingredientStr);
                }
              }
            }
          }
        }
      }

      // Handle instructions - combine basic_instructions and instructions
      const instructionParts: string[] = [];

      if (
        parsed.basic_instructions &&
        Array.isArray(parsed.basic_instructions)
      ) {
        instructionParts.push('**Preparation:**');
        parsed.basic_instructions.forEach((step: string, index: number) => {
          instructionParts.push(`${index + 1}. ${step}`);
        });
        instructionParts.push(''); // Add blank line
      }

      if (parsed.instructions && Array.isArray(parsed.instructions)) {
        if (instructionParts.length > 0) {
          instructionParts.push('**Cooking Instructions:**');
        }
        parsed.instructions.forEach((step: string, index: number) => {
          const stepNumber = parsed.basic_instructions ? index + 1 : index + 1;
          instructionParts.push(`${stepNumber}. ${step}`);
        });
      } else if (typeof parsed.instructions === 'string') {
        instructionParts.push(parsed.instructions);
      }

      instructions = instructionParts.join('\n');

      // Handle notes - combine various optional sections
      const notesParts: string[] = [];

      if (parsed.servings) {
        notesParts.push(`**Servings:** ${parsed.servings}`);
        notesParts.push('');
      }

      if (parsed.tips_and_tricks && Array.isArray(parsed.tips_and_tricks)) {
        notesParts.push('**Tips & Tricks:**');
        parsed.tips_and_tricks.forEach((tip: string) => {
          notesParts.push(`• ${tip}`);
        });
        notesParts.push('');
      }

      if (parsed.substitutions && Array.isArray(parsed.substitutions)) {
        notesParts.push('**Substitutions:**');
        parsed.substitutions.forEach((sub: string) => {
          notesParts.push(`• ${sub}`);
        });
        notesParts.push('');
      }

      if (parsed.pairings && Array.isArray(parsed.pairings)) {
        notesParts.push('**Pairings:**');
        parsed.pairings.forEach((pairing: string) => {
          notesParts.push(`• ${pairing}`);
        });
        notesParts.push('');
      }

      if (parsed.notes) {
        notesParts.push('**Additional Notes:**');
        notesParts.push(parsed.notes);
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
    // If not JSON, treat as markdown and do basic parsing
    const lines = text.split('\n').filter((line) => line.trim());
    let title = 'Untitled Recipe';
    const ingredients: string[] = [];
    let instructions = '';
    let notes = '';

    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('#')) {
        title = trimmed.replace(/^#+\s*/, '');
        currentSection = 'title';
      } else if (trimmed.toLowerCase().includes('ingredient')) {
        currentSection = 'ingredients';
      } else if (
        trimmed.toLowerCase().includes('instruction') ||
        trimmed.toLowerCase().includes('direction')
      ) {
        currentSection = 'instructions';
      } else if (trimmed.toLowerCase().includes('note')) {
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
        } else if (!currentSection && !title) {
          title = trimmed;
        }
      }
    }

    return {
      title,
      ingredients,
      instructions: instructions.trim(),
      notes: notes.trim(),
    };
  }
}

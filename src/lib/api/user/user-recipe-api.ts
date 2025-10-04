import { supabase } from '../../supabase';
import type { Recipe, RecipeFilters } from '../../types';
import { handleError } from '../shared/error-handling';
import { IngredientMatcher } from '../../groceries/ingredient-matcher';
import { getUserGroceries } from '../../user-preferences';

// Configuration constants for ingredient filtering
const INGREDIENT_MATCH_CONFIDENCE_THRESHOLD = 50; // Minimum confidence score for ingredient matching (0-100)

// Simple string-based fallback matching (mirrors explore page)
function applySimpleIngredientFilter(
  list: Recipe[],
  selected: string[]
): Recipe[] {
  const selectedIngredientsSet = new Set(
    selected.map((s) => s.toLowerCase().trim())
  );
  return list.filter((recipe) =>
    recipe.ingredients.some((recipeIngredient) =>
      selectedIngredientsSet.has(recipeIngredient.toLowerCase().trim())
    )
  );
}

/**
 * User Recipe API - Operations for user's own recipes with filtering and search
 */
export const userRecipeApi = {
  // Fetch all recipes for the current user with optional filters
  async getUserRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) throw new Error('User not authenticated');
    const user = authData.user;

    // Optimize: Only select needed fields for list view to reduce data transfer
    let query = supabase
      .from('recipes')
      .select(
        'id, title, description, ingredients, instructions, notes, image_url, categories, cooking_time, difficulty, is_public, created_at, updated_at, user_id'
      )
      .eq('user_id', user.id);

    // Apply search filter using secure parameterized queries to prevent SQL injection
    if (filters?.searchTerm) {
      // SECURITY FIX: Use safe ILIKE patterns instead of raw SQL interpolation with to_tsquery
      // This prevents SQL injection while maintaining search functionality
      const searchTerm = filters.searchTerm.trim().replace(/[%_\\]/g, '\\$&'); // Escape LIKE wildcards

      query = query.or(
        `title.ilike.%${searchTerm}%,instructions.ilike.%${searchTerm}%,ingredients.cs.{${searchTerm}}`
      );
    }

    // Apply category filter
    if (filters?.categories?.length) {
      query = query.overlaps('categories', filters.categories);
    }

    // Apply cuisine filter (cuisine is stored as a category)
    if (filters?.cuisine?.length) {
      const cuisineCategories = filters.cuisine.map((c) => `Cuisine: ${c}`);
      query = query.overlaps('categories', cuisineCategories);
    }

    // Apply mood filter (moods are stored as namespaced categories)
    if (filters?.moods?.length) {
      // Backward-compatible: match both namespaced and plain mood tags
      const moodCategories = [
        ...filters.moods.map((m) => `Mood: ${m}`),
        ...filters.moods,
      ];
      query = query.overlaps('categories', moodCategories);
    }

    // NOTE: availableIngredients filtering is now handled client-side
    // using sophisticated IngredientMatcher for better accuracy.
    // The old simple string matching was removed because it couldn't handle:
    // - Recipe ingredients with measurements ("2 cups diced onions")
    // - Synonyms and variations
    // - Normalization and fuzzy matching

    // Apply sorting
    const sortBy = filters?.sortBy || 'date';
    const sortOrder = filters?.sortOrder || 'desc';

    if (sortBy === 'date') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'title') {
      query = query.order('title', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'popularity') {
      // Use updated_at as a proxy for popularity (more popular recipes get updated more)
      // Fall back to created_at for recipes with same updated_at
      query = query
        .order('updated_at', { ascending: sortOrder === 'asc' })
        .order('created_at', { ascending: sortOrder === 'asc' });
    } else {
      // Default to date sorting
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    const { data, error } = await query;

    if (error) handleError(error, 'Get user recipes');
    let recipes = (data as unknown as Recipe[]) || [];

    // Apply client-side ingredient filtering using sophisticated IngredientMatcher
    if (filters?.availableIngredients?.length) {
      try {
        // Get user's available groceries for matching
        const userGroceries = await getUserGroceries(user.id);
        const groceriesData = userGroceries?.groceries || {};

        // Check if user has grocery data set up
        const hasGroceryData = Object.keys(groceriesData).length > 0;

        if (hasGroceryData) {
          // Use sophisticated IngredientMatcher when grocery data is available
          const matcher = new IngredientMatcher(groceriesData);

          // Create a function to check if a matched grocery ingredient relates to selected global ingredients
          const isIngredientMatch = (
            matchedGroceryIngredient: string,
            selectedIngredients: string[]
          ): boolean => {
            const normalizedMatched = matchedGroceryIngredient
              .toLowerCase()
              .trim();

            return selectedIngredients.some((selectedIngredient) => {
              const normalizedSelected = selectedIngredient
                .toLowerCase()
                .trim();

              // Exact match
              if (normalizedMatched === normalizedSelected) return true;

              // Check if matched ingredient contains the selected ingredient
              if (normalizedMatched.includes(normalizedSelected)) return true;

              // Check if selected ingredient contains the matched ingredient
              if (normalizedSelected.includes(normalizedMatched)) return true;

              // Check for common variations (e.g., "Yellow Onions" vs "Onions")
              const matchedWords = normalizedMatched.split(/\s+/);
              const selectedWords = normalizedSelected.split(/\s+/);

              // If any word from selected matches any word from matched
              return selectedWords.some((selectedWord) =>
                matchedWords.some(
                  (matchedWord) =>
                    selectedWord === matchedWord ||
                    matchedWord.includes(selectedWord) ||
                    selectedWord.includes(matchedWord)
                )
              );
            });
          };

          // Filter recipes based on sophisticated ingredient matching
          recipes = recipes.filter((recipe) => {
            // Check if any recipe ingredient matches any selected ingredient
            return recipe.ingredients.some((recipeIngredient) => {
              const match = matcher.matchIngredient(recipeIngredient);
              // Consider it a match if:
              // 1. The matcher found a match with good confidence, AND
              // 2. The matched ingredient relates to any selected ingredient
              return (
                match.matchType !== 'none' &&
                match.confidence >= INGREDIENT_MATCH_CONFIDENCE_THRESHOLD &&
                match.matchedGroceryIngredient &&
                isIngredientMatch(
                  match.matchedGroceryIngredient,
                  filters.availableIngredients!
                )
              );
            });
          });
        } else {
          // Fall back to simple string matching when no grocery data is available
          // This matches the behavior of the explore page
          recipes = applySimpleIngredientFilter(
            recipes,
            filters.availableIngredients
          );
        }
      } catch (error) {
        console.warn(
          'Failed to apply client-side ingredient filtering:',
          error
        );
        // Fall back to simple string matching if there's an error
        recipes = applySimpleIngredientFilter(
          recipes,
          filters.availableIngredients
        );
      }
    }

    return recipes;
  },
};

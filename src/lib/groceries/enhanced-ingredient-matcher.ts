import { IngredientMatcher, IngredientMatch } from './ingredient-matcher';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/types';

export interface GlobalIngredient {
  id: string;
  name: string;
  normalized_name: string;
  category: string;
  synonyms: string[];
  usage_count: number;
  first_seen_at: string;
  last_seen_at: string;
  created_by: string | null;
  is_verified: boolean;
  is_system?: boolean;
  created_at: string;
  updated_at: string;
}

export interface IngredientMatchWithGlobal extends IngredientMatch {
  isGlobalIngredient?: boolean;
  globalIngredient?: GlobalIngredient;
  canSaveToGlobal?: boolean;
}

export interface IngredientExtractionResult {
  extracted: Array<{
    ingredient: string;
    suggestedCategory: string;
    confidence: number;
  }>;
  unknown: string[];
}

/**
 * Enhanced ingredient matcher that includes global ingredients support
 */
export class EnhancedIngredientMatcher extends IngredientMatcher {
  private globalIngredients: Map<string, GlobalIngredient> = new Map();
  private globalIngredientsLoaded = false;

  constructor(groceries: Record<string, string[]>) {
    super(groceries);
    this.loadGlobalIngredients();
  }

  /**
   * Override the base matchIngredient to include global ingredients
   */
  matchIngredient(recipeIngredient: string): IngredientMatch {
    // First try regular matching
    const regularMatch = super.matchIngredient(recipeIngredient);

    if (regularMatch.matchType !== 'none') {
      return regularMatch;
    }

    // Try global ingredients matching (synchronous check)
    const globalMatch = this.findGlobalIngredientMatch(recipeIngredient);

    if (globalMatch) {
      return {
        recipeIngredient,
        matchedGroceryIngredient: globalMatch.name,
        matchedCategory: globalMatch.category,
        confidence: 85, // High confidence for global ingredients
        matchType: 'global' as unknown as
          | 'exact'
          | 'partial'
          | 'fuzzy'
          | 'none',
      };
    }

    // No match found
    return regularMatch;
  }

  /**
   * Enhanced matching that includes global ingredients (async version)
   */
  async matchIngredientWithGlobal(
    recipeIngredient: string
  ): Promise<IngredientMatchWithGlobal> {
    // First try regular matching
    const regularMatch = this.matchIngredient(recipeIngredient);

    if (regularMatch.matchType !== 'none') {
      return {
        ...regularMatch,
        isGlobalIngredient: false,
        canSaveToGlobal: false,
      };
    }

    // Try global ingredients matching
    await this.ensureGlobalIngredientsLoaded();
    const globalMatch = this.findGlobalIngredientMatch(recipeIngredient);

    if (globalMatch) {
      return {
        recipeIngredient,
        matchedGroceryIngredient: globalMatch.name,
        matchedCategory: globalMatch.category,
        confidence: 85, // High confidence for global ingredients
        matchType: 'global' as unknown as
          | 'exact'
          | 'partial'
          | 'fuzzy'
          | 'none',
        isGlobalIngredient: true,
        globalIngredient: globalMatch,
        canSaveToGlobal: false,
      };
    }

    // No match found - can be saved to global
    return {
      ...regularMatch,
      canSaveToGlobal: true,
    };
  }

  /**
   * Save ingredient to global list
   */
  async saveIngredientToGlobal(
    ingredientText: string,
    category: string,
    recipeContext?: {
      recipeId: string;
      recipeCategories: string[];
    }
  ): Promise<{
    success: boolean;
    ingredient?: GlobalIngredient;
    error?: string;
  }> {
    try {
      const normalizedName = this.normalizeName(ingredientText);

      // Check if already exists
      const { data: existing, error: fetchError } = await supabase
        .from('global_ingredients')
        .select('*')
        .eq('normalized_name', normalizedName)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Update usage count
        const { data: updated, error: updateError } = await supabase
          .from('global_ingredients')
          .update({
            usage_count: existing.usage_count + 1,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Log the learning
        if (recipeContext) {
          await this.logIngredientLearning(
            recipeContext.recipeId,
            ingredientText,
            category,
            true
          );
        }

        return { success: true, ingredient: updated };
      }

      // Create new global ingredient
      const { data: newIngredient, error: insertError } = await supabase
        .from('global_ingredients')
        .insert({
          name: ingredientText,
          normalized_name: normalizedName,
          category,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log the learning
      if (recipeContext) {
        await this.logIngredientLearning(
          recipeContext.recipeId,
          ingredientText,
          category,
          true
        );
      }

      // Refresh global ingredients cache
      await this.loadGlobalIngredients();

      return { success: true, ingredient: newIngredient };
    } catch (error) {
      console.error('Error saving ingredient to global:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Auto-extract and categorize ingredients from recipe
   */
  async extractIngredientsFromRecipe(
    recipe: Recipe
  ): Promise<IngredientExtractionResult> {
    const extracted: Array<{
      ingredient: string;
      suggestedCategory: string;
      confidence: number;
    }> = [];
    const unknown: string[] = [];

    for (const ingredient of recipe.ingredients) {
      const match = await this.matchIngredientWithGlobal(ingredient);

      if (match.matchType === 'none' && match.canSaveToGlobal) {
        // Suggest category based on recipe context
        const suggestedCategory = this.suggestCategoryFromContext(
          ingredient,
          recipe
        );
        unknown.push(ingredient);

        extracted.push({
          ingredient,
          suggestedCategory,
          confidence: 0.7,
        });

        // Log the extraction attempt
        await this.logIngredientLearning(
          recipe.id,
          ingredient,
          suggestedCategory,
          false
        );
      }
    }

    return { extracted, unknown };
  }

  /**
   * Get all global ingredients
   */
  async getGlobalIngredients(): Promise<GlobalIngredient[]> {
    await this.ensureGlobalIngredientsLoaded();
    return Array.from(this.globalIngredients.values());
  }

  /**
   * Search global ingredients by name
   */
  async searchGlobalIngredients(query: string): Promise<GlobalIngredient[]> {
    await this.ensureGlobalIngredientsLoaded();
    const normalizedQuery = this.normalizeName(query);

    return Array.from(this.globalIngredients.values()).filter(
      (ingredient) =>
        ingredient.normalized_name.includes(normalizedQuery) ||
        ingredient.name.toLowerCase().includes(query.toLowerCase()) ||
        ingredient.synonyms.some((synonym) =>
          synonym.toLowerCase().includes(query.toLowerCase())
        )
    );
  }

  private async loadGlobalIngredients(): Promise<void> {
    if (this.globalIngredientsLoaded) return;

    try {
      const { data, error } = await supabase
        .from('global_ingredients')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;

      this.globalIngredients.clear();
      data?.forEach((ingredient) => {
        this.globalIngredients.set(ingredient.normalized_name, ingredient);
      });

      this.globalIngredientsLoaded = true;
    } catch (error) {
      console.error('Failed to load global ingredients:', error);
    }
  }

  private async ensureGlobalIngredientsLoaded(): Promise<void> {
    if (!this.globalIngredientsLoaded) {
      await this.loadGlobalIngredients();
    }
  }

  private findGlobalIngredientMatch(
    recipeIngredient: string
  ): GlobalIngredient | null {
    const normalized = this.normalizeName(recipeIngredient);

    // Direct match
    if (this.globalIngredients.has(normalized)) {
      return this.globalIngredients.get(normalized)!;
    }

    // Partial match
    for (const [key, ingredient] of this.globalIngredients) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return ingredient;
      }
    }

    // Check synonyms
    for (const ingredient of this.globalIngredients.values()) {
      for (const synonym of ingredient.synonyms) {
        const normalizedSynonym = this.normalizeName(synonym);
        if (
          normalized.includes(normalizedSynonym) ||
          normalizedSynonym.includes(normalized)
        ) {
          return ingredient;
        }
      }
    }

    return null;
  }

  private suggestCategoryFromContext(
    ingredient: string,
    recipe: Recipe
  ): string {
    const categories = recipe.categories || [];
    const ingredientLower = ingredient.toLowerCase();

    // Category-based suggestions
    if (categories.some((cat) => cat.includes('Course: Breakfast'))) {
      if (ingredientLower.includes('egg') || ingredientLower.includes('bacon'))
        return 'proteins';
      if (
        ingredientLower.includes('milk') ||
        ingredientLower.includes('cheese')
      )
        return 'dairy';
      if (
        ingredientLower.includes('bread') ||
        ingredientLower.includes('toast')
      )
        return 'pantry';
    }

    if (categories.some((cat) => cat.includes('Course: Dessert'))) {
      if (
        ingredientLower.includes('sugar') ||
        ingredientLower.includes('flour')
      )
        return 'pantry';
      if (
        ingredientLower.includes('chocolate') ||
        ingredientLower.includes('vanilla')
      )
        return 'pantry';
    }

    if (categories.some((cat) => cat.includes('Cuisine: Middle Eastern'))) {
      if (
        ingredientLower.includes('tahini') ||
        ingredientLower.includes('hummus')
      )
        return 'pantry';
      if (
        ingredientLower.includes('sumac') ||
        ingredientLower.includes('zaatar')
      )
        return 'spices';
    }

    if (categories.some((cat) => cat.includes('Cuisine: Asian'))) {
      if (ingredientLower.includes('soy') || ingredientLower.includes('miso'))
        return 'pantry';
      if (
        ingredientLower.includes('ginger') ||
        ingredientLower.includes('sesame')
      )
        return 'spices';
    }

    // Ingredient-based suggestions
    if (
      ingredientLower.includes('meat') ||
      ingredientLower.includes('chicken') ||
      ingredientLower.includes('beef') ||
      ingredientLower.includes('fish') ||
      ingredientLower.includes('pork') ||
      ingredientLower.includes('lamb')
    ) {
      return 'proteins';
    }

    if (
      ingredientLower.includes('vegetable') ||
      ingredientLower.includes('onion') ||
      ingredientLower.includes('carrot') ||
      ingredientLower.includes('tomato') ||
      ingredientLower.includes('pepper') ||
      ingredientLower.includes('cucumber')
    ) {
      return 'vegetables';
    }

    if (
      ingredientLower.includes('spice') ||
      ingredientLower.includes('herb') ||
      ingredientLower.includes('salt') ||
      ingredientLower.includes('pepper') ||
      ingredientLower.includes('cumin') ||
      ingredientLower.includes('paprika')
    ) {
      return 'spices';
    }

    if (
      ingredientLower.includes('milk') ||
      ingredientLower.includes('cheese') ||
      ingredientLower.includes('yogurt') ||
      ingredientLower.includes('butter') ||
      ingredientLower.includes('cream')
    ) {
      return 'dairy';
    }

    if (
      ingredientLower.includes('fruit') ||
      ingredientLower.includes('apple') ||
      ingredientLower.includes('banana') ||
      ingredientLower.includes('berry') ||
      ingredientLower.includes('orange') ||
      ingredientLower.includes('lemon')
    ) {
      return 'fruits';
    }

    if (
      ingredientLower.includes('oil') ||
      ingredientLower.includes('vinegar') ||
      ingredientLower.includes('flour') ||
      ingredientLower.includes('rice') ||
      ingredientLower.includes('pasta') ||
      ingredientLower.includes('bread')
    ) {
      return 'pantry';
    }

    // Default to pantry for unknown items
    return 'pantry';
  }

  private async logIngredientLearning(
    recipeId: string,
    ingredientText: string,
    suggestedCategory: string,
    wasSaved: boolean
  ): Promise<void> {
    try {
      await supabase.from('ingredient_learning_log').insert({
        recipe_id: recipeId,
        ingredient_text: ingredientText,
        extracted_name: this.normalizeName(ingredientText),
        suggested_category: suggestedCategory,
        confidence_score: 0.7,
        was_saved: wasSaved,
      });
    } catch (error) {
      console.error('Failed to log ingredient learning:', error);
    }
  }
}

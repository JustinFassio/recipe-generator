/**
 * AI Agent for Ingredient Operations
 * Mirrors the structure of the Categories (and Cuisine) agents to provide
 * intelligent access to the grocery ingredient/category system for filtering.
 */

import {
  CHEF_ISABELLA_SYSTEM_CATALOG,
  CATEGORY_METADATA,
} from '@/lib/groceries/system-catalog';

export interface IngredientsAgentOptions {
  maxSuggestions?: number;
  includeCategoryContext?: boolean;
}

export interface IngredientSuggestion {
  ingredient: string;
  categoryKey: string;
  categoryName: string;
  icon?: string;
  confidence: number; // 0..1
  reasoning: string;
}

export interface CategorySummary {
  key: string;
  name: string;
  icon: string;
  count: number;
  sample: string[];
}

export class IngredientsAgent {
  private options: IngredientsAgentOptions;

  private allIngredients: Array<{
    key: string;
    name: string;
    icon: string;
    item: string;
  }>; // flat index

  constructor(options: IngredientsAgentOptions = {}) {
    this.options = {
      maxSuggestions: 20,
      includeCategoryContext: true,
      ...options,
    };

    // Build a flat searchable index of all canonical ingredients from Chef Isabella's system
    this.allIngredients = Object.entries(CHEF_ISABELLA_SYSTEM_CATALOG).flatMap(
      ([categoryKey, ingredients]) => {
        const categoryMetadata =
          CATEGORY_METADATA[categoryKey as keyof typeof CATEGORY_METADATA];
        return ingredients.map((ingredient) => ({
          key: categoryKey,
          name: categoryMetadata?.name || categoryKey,
          icon: categoryMetadata?.icon || '🍽️',
          item: ingredient,
        }));
      }
    );
  }

  /**
   * Search ingredients by free-text query. Returns ranked suggestions with context.
   */
  searchIngredients(query: string): IngredientSuggestion[] {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];

    const scored = this.allIngredients
      .map(({ key, name, icon, item }) => {
        const itemLower = item.toLowerCase();
        let confidence = 0;
        let reasoning = '';

        if (itemLower === q) {
          confidence = 1.0;
          reasoning = 'Exact match';
        } else if (itemLower.startsWith(q)) {
          confidence = 0.9;
          reasoning = 'Starts with query';
        } else if (itemLower.includes(q)) {
          confidence = 0.75;
          reasoning = 'Contains query';
        } else {
          // Word overlap heuristic
          const itemWords = new Set(itemLower.split(/\s+/g));
          const queryWords = new Set(q.split(/\s+/g));
          let overlap = 0;
          queryWords.forEach((w) => {
            if (itemWords.has(w)) overlap += 1;
          });
          if (overlap > 0) {
            confidence = Math.min(0.5 + overlap * 0.1, 0.7);
            reasoning = overlap > 1 ? 'Multiple word overlap' : 'Word overlap';
          }
        }

        return {
          ingredient: item,
          categoryKey: key,
          categoryName: name,
          icon,
          confidence,
          reasoning,
        } as IngredientSuggestion;
      })
      .filter((s) => s.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.options.maxSuggestions);

    return scored;
  }

  /**
   * Get all ingredients in a category (by key), sorted alphabetically.
   */
  getIngredientsByCategory(categoryKey: string): string[] {
    const ingredients =
      CHEF_ISABELLA_SYSTEM_CATALOG[
        categoryKey as keyof typeof CHEF_ISABELLA_SYSTEM_CATALOG
      ];
    if (!ingredients) return [];
    return [...ingredients].sort((a, b) => a.localeCompare(b));
  }

  /**
   * Get the canonical category for a given ingredient (first match wins).
   */
  getCategoryForIngredient(
    ingredient: string
  ): { key: string; name: string; icon: string } | null {
    const found = this.allIngredients.find(
      (x) => x.item.toLowerCase() === ingredient.toLowerCase()
    );
    return found
      ? { key: found.key, name: found.name, icon: found.icon }
      : null;
  }

  /**
   * Suggest related ingredients given a seed list. Prioritizes items from the same categories
   * as the seed ingredients to help users expand filter selections logically.
   */
  suggestRelatedIngredients(
    seed: string[],
    limit = 12
  ): IngredientSuggestion[] {
    if (!seed?.length) return [];

    const seedSet = new Set(seed.map((s) => s.toLowerCase()));
    const seedCategories = new Set(
      seed
        .map((s) => this.getCategoryForIngredient(s)?.key)
        .filter((k): k is string => Boolean(k))
    );

    const suggestions = this.allIngredients
      .filter((row) => !seedSet.has(row.item.toLowerCase()))
      .map((row) => {
        const inSeedCategory = seedCategories.has(row.key);
        const confidence = inSeedCategory ? 0.7 : 0.4; // bias towards same-category items
        const reasoning = inSeedCategory
          ? 'Shares category with selected items'
          : 'Complementary category';
        return {
          ingredient: row.item,
          categoryKey: row.key,
          categoryName: row.name,
          icon: row.icon,
          confidence,
          reasoning,
        } as IngredientSuggestion;
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    return suggestions;
  }

  /**
   * Provide category-level summaries for UI (counts and samples).
   */
  getCategorySummaries(): CategorySummary[] {
    return Object.entries(CHEF_ISABELLA_SYSTEM_CATALOG).map(
      ([categoryKey, ingredients]) => {
        const categoryMetadata =
          CATEGORY_METADATA[categoryKey as keyof typeof CATEGORY_METADATA];
        const list = [...ingredients].sort((a, b) => a.localeCompare(b));
        return {
          key: categoryKey,
          name: categoryMetadata?.name || categoryKey,
          icon: categoryMetadata?.icon || '🍽️',
          count: list.length,
          sample: list.slice(0, 5),
        } as CategorySummary;
      }
    );
  }
}

// Export singleton instance and convenience functions (matching cuisine-agent pattern)
export const ingredientsAgent = new IngredientsAgent();

export const searchIngredients = (query: string) =>
  ingredientsAgent.searchIngredients(query);
export const getIngredientsByCategory = (categoryKey: string) =>
  ingredientsAgent.getIngredientsByCategory(categoryKey);
export const getCategoryForIngredient = (ingredient: string) =>
  ingredientsAgent.getCategoryForIngredient(ingredient);
export const suggestRelatedIngredients = (seed: string[], limit?: number) =>
  ingredientsAgent.suggestRelatedIngredients(seed, limit);
export const getIngredientCategorySummaries = () =>
  ingredientsAgent.getCategorySummaries();

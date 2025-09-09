import type { Recipe } from '@/lib/types';

export interface IngredientMatch {
  recipeIngredient: string;
  matchedGroceryIngredient?: string;
  matchedCategory?: string;
  confidence: number; // 0-100
  matchType: 'exact' | 'partial' | 'fuzzy' | 'none';
}

export interface RecipeCompatibility {
  recipeId: string;
  totalIngredients: number;
  availableIngredients: IngredientMatch[];
  missingIngredients: IngredientMatch[];
  compatibilityScore: number; // 0-100
  confidenceScore: number; // Average confidence of matches
}

/**
 * Core ingredient matching engine with multiple matching strategies
 */
export class IngredientMatcher {
  private groceries: Record<string, string[]>;
  private preprocessedGroceries: Map<
    string,
    { category: string; normalized: string }
  >;

  constructor(groceries: Record<string, string[]>) {
    this.groceries = groceries;
    this.preprocessedGroceries = this.preprocessGroceries();
  }

  /**
   * Match a single recipe ingredient against user groceries
   */
  matchIngredient(recipeIngredient: string): IngredientMatch {
    const normalized = this.normalizeIngredient(recipeIngredient);

    // Strategy 1: Exact match
    const exactMatch = this.findExactMatch(normalized);
    if (exactMatch) {
      return {
        recipeIngredient,
        matchedGroceryIngredient: exactMatch.ingredient,
        matchedCategory: exactMatch.category,
        confidence: 100,
        matchType: 'exact',
      };
    }

    // Strategy 2: Partial match (contains)
    const partialMatch = this.findPartialMatch(normalized);
    if (partialMatch) {
      return {
        recipeIngredient,
        matchedGroceryIngredient: partialMatch.ingredient,
        matchedCategory: partialMatch.category,
        confidence: partialMatch.confidence,
        matchType: 'partial',
      };
    }

    // Strategy 3: Fuzzy match (synonyms, plurals, etc.)
    const fuzzyMatch = this.findFuzzyMatch(normalized);
    if (fuzzyMatch) {
      return {
        recipeIngredient,
        matchedGroceryIngredient: fuzzyMatch.ingredient,
        matchedCategory: fuzzyMatch.category,
        confidence: fuzzyMatch.confidence,
        matchType: 'fuzzy',
      };
    }

    // No match found
    return {
      recipeIngredient,
      confidence: 0,
      matchType: 'none',
    };
  }

  /**
   * Calculate compatibility for entire recipe
   */
  calculateRecipeCompatibility(recipe: Recipe): RecipeCompatibility {
    const matches = recipe.ingredients.map((ingredient) =>
      this.matchIngredient(ingredient)
    );

    const availableMatches = matches.filter(
      (match) => match.matchType !== 'none'
    );
    const missingMatches = matches.filter(
      (match) => match.matchType === 'none'
    );

    const compatibilityScore =
      recipe.ingredients.length > 0
        ? Math.round(
            (availableMatches.length / recipe.ingredients.length) * 100
          )
        : 0;

    const confidenceScore =
      availableMatches.length > 0
        ? Math.round(
            availableMatches.reduce((sum, match) => sum + match.confidence, 0) /
              availableMatches.length
          )
        : 0;

    return {
      recipeId: recipe.id,
      totalIngredients: recipe.ingredients.length,
      availableIngredients: availableMatches,
      missingIngredients: missingMatches,
      compatibilityScore,
      confidenceScore,
    };
  }

  private preprocessGroceries(): Map<
    string,
    { category: string; normalized: string }
  > {
    const processed = new Map();

    Object.entries(this.groceries).forEach(([category, ingredients]) => {
      ingredients.forEach((ingredient) => {
        const normalized = this.normalizeIngredient(ingredient);
        processed.set(normalized, { category, normalized });

        // Add plurals and singulars
        const variants = this.generateVariants(ingredient);
        variants.forEach((variant) => {
          const normalizedVariant = this.normalizeIngredient(variant);
          if (!processed.has(normalizedVariant)) {
            processed.set(normalizedVariant, {
              category,
              normalized: normalizedVariant,
            });
          }
        });
      });
    });

    return processed;
  }

  private normalizeIngredient(ingredient: string): string {
    return ingredient
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(
        /\b(fresh|dried|ground|whole|chopped|diced|sliced|minced)\b/g,
        ''
      ) // Remove prep words
      .replace(
        /\b(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g)\b/g,
        ''
      ) // Remove measurements
      .replace(/\b(large|medium|small|extra)\b/g, '') // Remove size descriptors
      .replace(/\b(\d+)\b/g, '') // Remove numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private findExactMatch(
    normalized: string
  ): { ingredient: string; category: string } | null {
    const match = this.preprocessedGroceries.get(normalized);
    if (match) {
      const originalIngredient = Object.entries(this.groceries)
        .find(([cat]) => cat === match.category)?.[1]
        ?.find((ing) => this.normalizeIngredient(ing) === normalized);

      if (originalIngredient) {
        return { ingredient: originalIngredient, category: match.category };
      }
    }
    return null;
  }

  private findPartialMatch(
    normalized: string
  ): { ingredient: string; category: string; confidence: number } | null {
    const words = normalized.split(' ').filter((word) => word.length > 2);
    let bestMatch: {
      ingredient: string;
      category: string;
      confidence: number;
    } | null = null;

    for (const [groceryNormalized, { category }] of this
      .preprocessedGroceries) {
      // const groceryWords = groceryNormalized.split(' ');

      // Check if recipe ingredient contains grocery ingredient
      if (normalized.includes(groceryNormalized)) {
        const confidence = Math.round(
          (groceryNormalized.length / normalized.length) * 80
        );
        if (!bestMatch || confidence > bestMatch.confidence) {
          const originalIngredient = Object.entries(this.groceries)
            .find(([cat]) => cat === category)?.[1]
            ?.find(
              (ing) => this.normalizeIngredient(ing) === groceryNormalized
            );

          if (originalIngredient) {
            bestMatch = {
              ingredient: originalIngredient,
              category,
              confidence,
            };
          }
        }
      }

      // Check if grocery ingredient contains recipe ingredient words
      const matchingWords = words.filter((word) =>
        groceryNormalized.includes(word)
      );
      if (matchingWords.length > 0) {
        const confidence = Math.round(
          (matchingWords.length / words.length) * 70
        );
        if (!bestMatch || confidence > bestMatch.confidence) {
          const originalIngredient = Object.entries(this.groceries)
            .find(([cat]) => cat === category)?.[1]
            ?.find(
              (ing) => this.normalizeIngredient(ing) === groceryNormalized
            );

          if (originalIngredient) {
            bestMatch = {
              ingredient: originalIngredient,
              category,
              confidence,
            };
          }
        }
      }
    }

    return bestMatch && bestMatch.confidence >= 50 ? bestMatch : null;
  }

  private findFuzzyMatch(
    normalized: string
  ): { ingredient: string; category: string; confidence: number } | null {
    // Implement fuzzy matching with synonyms and common variations
    const synonyms = this.getIngredientSynonyms(normalized);

    for (const synonym of synonyms) {
      const match = this.findPartialMatch(synonym);
      if (match) {
        return { ...match, confidence: Math.max(match.confidence - 10, 40) }; // Reduce confidence for fuzzy matches
      }
    }

    return null;
  }

  private generateVariants(ingredient: string): string[] {
    const variants = [ingredient];
    const lower = ingredient.toLowerCase();

    // Add plural/singular variants
    if (lower.endsWith('s') && lower.length > 3) {
      variants.push(lower.slice(0, -1)); // Remove 's'
    } else if (!lower.endsWith('s')) {
      variants.push(lower + 's'); // Add 's'
    }

    // Add common variations
    if (lower.includes(' ')) {
      variants.push(lower.replace(' ', '')); // Remove spaces
    }

    return variants;
  }

  private getIngredientSynonyms(ingredient: string): string[] {
    // Common ingredient synonyms mapping
    const synonymMap: Record<string, string[]> = {
      onion: ['yellow onion', 'white onion', 'sweet onion'],
      tomato: ['tomatoes', 'roma tomato', 'cherry tomato'],
      pepper: [
        'bell pepper',
        'sweet pepper',
        'black pepper',
        'white pepper',
        'ground pepper',
      ],
      garlic: ['garlic clove', 'garlic bulb'],
      chicken: ['chicken breast', 'chicken thigh', 'poultry'],
      beef: ['ground beef', 'beef chuck', 'steak'],
      oil: ['olive oil', 'vegetable oil', 'cooking oil'],
      salt: ['sea salt', 'table salt', 'kosher salt'],
      cheese: ['cheddar', 'mozzarella', 'parmesan'],
      milk: ['whole milk', '2% milk', 'dairy milk'],
      butter: ['salted butter', 'unsalted butter'],
      flour: ['all purpose flour', 'wheat flour', 'plain flour'],
      sugar: ['white sugar', 'granulated sugar'],
      egg: ['eggs', 'chicken egg'],
      lemon: ['lemon juice', 'fresh lemon'],
      lime: ['lime juice', 'fresh lime'],
    };

    const words = ingredient.split(' ');
    const synonyms = [ingredient];

    words.forEach((word) => {
      if (synonymMap[word]) {
        synonyms.push(...synonymMap[word]);
      }
    });

    return synonyms;
  }
}

import type { Recipe } from '@/lib/types';

export interface IngredientMatch {
  recipeIngredient: string;
  matchedGroceryIngredient?: string;
  matchedCategory?: string;
  confidence: number; // 0-100
  matchType: 'exact' | 'partial' | 'fuzzy' | 'global' | 'none';
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
    {
      categories: string[];
      normalized: string;
      /**
       * Stores the original ingredient name for better matching results.
       */
      original: string;
    }
  >;

  constructor(groceries: Record<string, string[]>) {
    this.groceries = groceries;
    this.preprocessedGroceries = this.preprocessGroceries();
  }

  /**
   * Check if the user's groceries effectively contain an ingredient by name,
   * using the same matching strategy as matchIngredient.
   */
  public hasIngredient(ingredientName: string): boolean {
    const match = this.matchIngredient(ingredientName);
    return match.matchType !== 'none';
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
    {
      categories: string[];
      normalized: string;
      /**
       * Stores the original ingredient name for better matching results.
       */
      original: string;
    }
  > {
    const processed = new Map();

    Object.entries(this.groceries).forEach(([category, ingredients]) => {
      ingredients.forEach((ingredient) => {
        const normalized = this.normalizeIngredient(ingredient);

        // Store with original ingredient for better matching
        if (!processed.has(normalized)) {
          processed.set(normalized, {
            categories: [category],
            normalized,
            original: ingredient,
          });
        } else {
          // If ingredient exists in multiple categories, keep track of all categories
          const existing = processed.get(normalized)!;
          if (!existing.categories.includes(category)) {
            existing.categories.push(category);
          }
        }

        // Add plurals and singulars
        const variants = this.generateVariants(ingredient);
        variants.forEach((variant) => {
          const normalizedVariant = this.normalizeIngredient(variant);
          if (!processed.has(normalizedVariant)) {
            processed.set(normalizedVariant, {
              categories: [category],
              normalized: normalizedVariant,
              original: ingredient,
            });
          } else {
            // Handle duplicates across variants too
            const existing = processed.get(normalizedVariant)!;
            if (!existing.categories.includes(category)) {
              existing.categories.push(category);
            }
          }
        });
      });
    });

    return processed;
  }

  protected normalizeIngredient(ingredient: string): string {
    return ingredient
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(
        /\b(fresh|dried|ground|whole|chopped|diced|sliced|minced|melted|softened|room temperature)\b/g,
        ''
      ) // Remove prep words
      .replace(
        /\b(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g|ml|liters?)\b/g,
        ''
      ) // Remove measurements
      .replace(/\b(large|medium|small|extra|about|approximately)\b/g, '') // Remove size descriptors
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '') // Remove numbers (including decimals)
      .replace(/\b(slices?|cloves?|pieces?|strips?|chunks?)\b/g, '') // Remove quantity words
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Public helper to normalize from outside (e.g., hooks/components)
  public normalizeName(ingredient: string): string {
    return this.normalizeIngredient(ingredient);
  }

  private findExactMatch(
    normalized: string
  ): { ingredient: string; category: string } | null {
    const match = this.preprocessedGroceries.get(normalized);
    if (match) {
      // Use the original ingredient from the match
      return {
        ingredient: match.original,
        category: match.categories[0], // Use first category if multiple
      };
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

    for (const [groceryNormalized, { categories, original }] of this
      .preprocessedGroceries) {
      // Check if recipe ingredient contains grocery ingredient
      if (normalized.includes(groceryNormalized)) {
        // Improved confidence calculation for exact word matches
        const confidence = this.calculateContainsConfidence(
          normalized,
          groceryNormalized
        );
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            ingredient: original,
            category: categories[0], // Use first category if multiple
            confidence,
          };
        }
      }

      // Check if grocery ingredient contains recipe ingredient words
      const matchingWords = words.filter((word) =>
        groceryNormalized.includes(word)
      );
      if (matchingWords.length > 0) {
        // Improved confidence calculation for word matches
        const confidence = this.calculateWordMatchConfidence(
          normalized,
          matchingWords,
          groceryNormalized
        );
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            ingredient: original,
            category: categories[0], // Use first category if multiple
            confidence,
          };
        }
      }
    }

    // Lower threshold for better matching of basic ingredients
    return bestMatch && bestMatch.confidence >= 30 ? bestMatch : null;
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

  /**
   * Calculate confidence for when recipe ingredient contains grocery ingredient
   */
  private calculateContainsConfidence(
    recipeNormalized: string,
    groceryNormalized: string
  ): number {
    // If it's an exact match, give high confidence
    if (recipeNormalized === groceryNormalized) {
      return 100;
    }

    // For partial matches, use a more generous calculation
    const groceryLength = groceryNormalized.length;
    const recipeLength = recipeNormalized.length;

    // Base confidence on how much of the grocery ingredient is in the recipe
    const baseConfidence = Math.round((groceryLength / recipeLength) * 100);

    // Boost confidence for common single-word ingredients
    if (groceryLength <= 8 && !groceryNormalized.includes(' ')) {
      return Math.min(baseConfidence + 20, 85); // Cap at 85% for partial matches
    }

    return Math.min(baseConfidence, 80);
  }

  /**
   * Calculate confidence for word-based matches
   */
  private calculateWordMatchConfidence(
    recipeNormalized: string,
    matchingWords: string[],
    groceryNormalized: string
  ): number {
    const totalWords = recipeNormalized
      .split(' ')
      .filter((word) => word.length > 2).length;
    const matchRatio = matchingWords.length / totalWords;

    // Base confidence on word match ratio
    let confidence = Math.round(matchRatio * 100);

    // Boost confidence if the grocery ingredient is a single word that matches
    if (matchingWords.length === 1 && !groceryNormalized.includes(' ')) {
      confidence = Math.min(confidence + 15, 75); // Cap at 75% for word matches
    }

    // Boost confidence for exact word matches
    if (matchingWords.some((word) => groceryNormalized === word)) {
      confidence = Math.min(confidence + 10, 80);
    }

    return confidence;
  }
}

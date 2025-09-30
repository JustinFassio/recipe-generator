import { IngredientMatcher } from '@/lib/groceries/ingredient-matcher';

export interface CuisineStaple {
  ingredient: string;
  category: string;
  priority: 'essential' | 'recommended' | 'optional';
  reason: string;
  usage: string;
  culturalContext?: string;
}

export interface CuisineStaplesData {
  cuisine: string;
  staples: CuisineStaple[];
  description: string;
  subStyles?: string[];
}

export interface MissingStaples {
  cuisine: string;
  missing: CuisineStaple[];
  available: CuisineStaple[];
  coverage: number; // Percentage of staples they have
}

export class CuisineStaplesManager {
  private cuisineData: Record<string, CuisineStaplesData> = {
    mexican: {
      cuisine: 'Mexican',
      description: 'Essential ingredients for authentic Mexican cooking',
      subStyles: ['Traditional Mexican', 'Tex-Mex', 'Baja'],
      staples: [
        {
          ingredient: 'cumin',
          category: 'flavor_builders',
          priority: 'essential',
          reason: 'Core spice for Mexican flavor profile',
          usage: 'Used in taco seasoning, chili, and rice dishes',
          culturalContext: 'Essential for authentic Mexican taste',
        },
        {
          ingredient: 'cilantro',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Fresh herb for garnishing and flavor',
          usage: 'Garnish for tacos, salsas, and rice dishes',
          culturalContext:
            'Cannot make authentic Mexican food without cilantro',
        },
        {
          ingredient: 'lime',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Acidic component for balance',
          usage: 'Squeezed over tacos, in salsas, and marinades',
          culturalContext: 'Lime is the soul of Mexican cuisine',
        },
        {
          ingredient: 'jalapeño',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Primary heat source',
          usage: 'Fresh in salsas, pickled for toppings, roasted for flavor',
          culturalContext: 'The most common chili in Mexican cooking',
        },
        {
          ingredient: 'avocado',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Base for guacamole and creamy elements',
          usage: 'Guacamole, sliced on tacos, in salads',
          culturalContext: 'Avocado is sacred in Mexican cuisine',
        },
        {
          ingredient: 'onion',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Base for sofrito and salsas',
          usage: 'Sautéed as base, raw in salsas, pickled for toppings',
          culturalContext: 'Foundation of Mexican cooking',
        },
        {
          ingredient: 'garlic',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Aromatic base for all dishes',
          usage: 'Sautéed with onions, in marinades and salsas',
          culturalContext: 'Essential aromatic in Mexican cuisine',
        },
        {
          ingredient: 'oregano',
          category: 'flavor_builders',
          priority: 'recommended',
          reason: 'Mexican oregano has distinct flavor',
          usage: 'In chili, beans, and meat marinades',
          culturalContext: 'Mexican oregano is different from Mediterranean',
        },
        {
          ingredient: 'paprika',
          category: 'flavor_builders',
          priority: 'recommended',
          reason: 'Adds color and mild heat',
          usage: 'In spice blends, rubs, and for color',
          culturalContext: 'Common in Tex-Mex and Northern Mexican cooking',
        },
        {
          ingredient: 'black beans',
          category: 'pantry_staples',
          priority: 'recommended',
          reason: 'Protein staple in Mexican cuisine',
          usage: 'Refried beans, in rice, as side dish',
          culturalContext: 'Beans are a daily staple in Mexican households',
        },
        {
          ingredient: 'rice',
          category: 'pantry_staples',
          priority: 'recommended',
          reason: 'Base for many Mexican dishes',
          usage: 'Spanish rice, as side dish, in burritos',
          culturalContext: 'Rice is served with almost every Mexican meal',
        },
      ],
    },
    italian: {
      cuisine: 'Italian',
      description: 'Classic ingredients for authentic Italian cooking',
      subStyles: ['Northern Italian', 'Southern Italian', 'Sicilian'],
      staples: [
        {
          ingredient: 'basil',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'The herb of Italian cuisine',
          usage: 'Fresh in pesto, on pizza, in caprese salad',
          culturalContext: 'Basil is the soul of Italian cooking',
        },
        {
          ingredient: 'oregano',
          category: 'flavor_builders',
          priority: 'essential',
          reason: 'Essential for pizza and tomato sauces',
          usage: 'In pizza sauce, marinara, and meat dishes',
          culturalContext: 'Oregano is synonymous with Italian pizza',
        },
        {
          ingredient: 'parmesan',
          category: 'dairy_cold',
          priority: 'essential',
          reason: 'The king of Italian cheeses',
          usage: 'Grated over pasta, in risotto, on salads',
          culturalContext: 'Parmigiano-Reggiano is the gold standard',
        },
        {
          ingredient: 'olive oil',
          category: 'pantry_staples',
          priority: 'essential',
          reason: 'The foundation of Italian cooking',
          usage: 'Cooking, finishing, in dressings',
          culturalContext: 'Extra virgin olive oil is sacred in Italy',
        },
        {
          ingredient: 'garlic',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Essential aromatic base',
          usage: 'Sautéed as base, in sauces, roasted',
          culturalContext: 'Garlic is the foundation of Italian flavor',
        },
        {
          ingredient: 'onion',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Base for soffritto and sauces',
          usage: 'Sautéed as base, in sauces, caramelized',
          culturalContext: 'Onion is the start of most Italian dishes',
        },
        {
          ingredient: 'tomatoes',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Core of Italian cuisine',
          usage: 'Fresh in salads, in sauces, roasted',
          culturalContext: 'Tomatoes define Italian cooking',
        },
        {
          ingredient: 'mozzarella',
          category: 'dairy_cold',
          priority: 'recommended',
          reason: 'Essential for pizza and caprese',
          usage: 'On pizza, in caprese salad, melted in dishes',
          culturalContext: 'Fresh mozzarella is a must for authentic pizza',
        },
        {
          ingredient: 'rosemary',
          category: 'flavor_builders',
          priority: 'recommended',
          reason: 'Aromatic herb for meats and breads',
          usage: 'With roasted meats, in focaccia, in marinades',
          culturalContext: 'Rosemary grows wild in Italian countryside',
        },
        {
          ingredient: 'thyme',
          category: 'flavor_builders',
          priority: 'recommended',
          reason: 'Delicate herb for subtle flavor',
          usage: 'In sauces, with vegetables, in marinades',
          culturalContext: 'Thyme adds elegance to Italian dishes',
        },
      ],
    },
    asian: {
      cuisine: 'Asian',
      description: 'Essential ingredients for Asian cooking',
      subStyles: ['Chinese', 'Japanese', 'Korean', 'Thai', 'Vietnamese'],
      staples: [
        {
          ingredient: 'soy sauce',
          category: 'pantry_staples',
          priority: 'essential',
          reason: 'The foundation of Asian flavor',
          usage: 'In marinades, stir-fries, dipping sauces',
          culturalContext: 'Soy sauce is the salt of Asian cuisine',
        },
        {
          ingredient: 'ginger',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Essential aromatic and digestive aid',
          usage: 'Fresh in stir-fries, pickled, in tea',
          culturalContext: 'Ginger is medicine and flavor in Asian cooking',
        },
        {
          ingredient: 'garlic',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Essential aromatic base',
          usage: 'Minced in stir-fries, in marinades, roasted',
          culturalContext: 'Garlic is the foundation of Asian flavor',
        },
        {
          ingredient: 'sesame oil',
          category: 'pantry_staples',
          priority: 'essential',
          reason: 'Distinctive Asian flavor and aroma',
          usage: 'Finishing oil, in dressings, for aroma',
          culturalContext: 'Sesame oil is the soul of Asian cooking',
        },
        {
          ingredient: 'rice vinegar',
          category: 'pantry_staples',
          priority: 'essential',
          reason: 'Mild acidity for Asian dishes',
          usage: 'In dressings, pickles, dipping sauces',
          culturalContext: 'Rice vinegar is gentler than Western vinegars',
        },
        {
          ingredient: 'green onion',
          category: 'fresh_produce',
          priority: 'essential',
          reason: 'Essential garnish and flavor',
          usage: 'Garnish for everything, in stir-fries, in soups',
          culturalContext: 'Green onions are used in almost every Asian dish',
        },
        {
          ingredient: 'chili',
          category: 'fresh_produce',
          priority: 'recommended',
          reason: 'Heat and color for Asian dishes',
          usage: 'Fresh in stir-fries, dried in sauces, pickled',
          culturalContext: 'Chili heat varies by region in Asia',
        },
        {
          ingredient: 'coconut milk',
          category: 'pantry_staples',
          priority: 'recommended',
          reason: 'Creamy base for curries and soups',
          usage: 'In curries, soups, desserts',
          culturalContext:
            'Coconut milk is essential in Southeast Asian cooking',
        },
        {
          ingredient: 'fish sauce',
          category: 'pantry_staples',
          priority: 'recommended',
          reason: 'Umami depth for Southeast Asian dishes',
          usage: 'In marinades, dipping sauces, curries',
          culturalContext:
            'Fish sauce is the secret ingredient in Southeast Asian cuisine',
        },
        {
          ingredient: 'miso',
          category: 'pantry_staples',
          priority: 'optional',
          reason: 'Fermented umami for Japanese dishes',
          usage: 'In soups, marinades, dressings',
          culturalContext: 'Miso is the soul of Japanese cooking',
        },
      ],
    },
  };

  /**
   * Get all available cuisines
   */
  getAvailableCuisines(): string[] {
    return Object.keys(this.cuisineData);
  }

  /**
   * Get staples for a specific cuisine
   */
  getCuisineStaples(cuisineKey: string): CuisineStaple[] {
    return this.cuisineData[cuisineKey]?.staples || [];
  }

  /**
   * Get cuisine data
   */
  getCuisineData(cuisineKey: string): CuisineStaplesData | null {
    return this.cuisineData[cuisineKey] || null;
  }

  /**
   * Find missing staples for a cuisine using existing IngredientMatcher
   */
  findMissingStaples(
    cuisineKey: string,
    _userGroceries: Record<string, string[]>,
    ingredientMatcher: IngredientMatcher
  ): MissingStaples {
    const cuisineData = this.cuisineData[cuisineKey];
    if (!cuisineData) {
      return {
        cuisine: cuisineKey,
        missing: [],
        available: [],
        coverage: 0,
      };
    }

    const available: CuisineStaple[] = [];
    const missing: CuisineStaple[] = [];

    // Check each staple against user's groceries using existing matcher
    cuisineData.staples.forEach((staple) => {
      const match = ingredientMatcher.matchIngredient(staple.ingredient);

      if (match.matchType !== 'none' && match.confidence >= 50) {
        available.push(staple);
      } else {
        missing.push(staple);
      }
    });

    const coverage =
      cuisineData.staples.length > 0
        ? Math.round((available.length / cuisineData.staples.length) * 100)
        : 0;

    return {
      cuisine: cuisineData.cuisine,
      missing,
      available,
      coverage,
    };
  }

  /**
   * Get all missing staples across all cuisines
   */
  getAllMissingStaples(
    userGroceries: Record<string, string[]>,
    ingredientMatcher: IngredientMatcher
  ): MissingStaples[] {
    return this.getAvailableCuisines()
      .map((cuisineKey) =>
        this.findMissingStaples(cuisineKey, userGroceries, ingredientMatcher)
      )
      .filter((result) => result.missing.length > 0);
  }

  /**
   * Get recommended staples to add for a specific cuisine
   */
  getRecommendedAdditions(
    cuisineKey: string,
    userGroceries: Record<string, string[]>,
    ingredientMatcher: IngredientMatcher,
    maxRecommendations: number = 5
  ): CuisineStaple[] {
    const missingStaples = this.findMissingStaples(
      cuisineKey,
      userGroceries,
      ingredientMatcher
    );

    // Prioritize essential ingredients first, then recommended
    return missingStaples.missing
      .sort((a, b) => {
        const priorityOrder = { essential: 0, recommended: 1, optional: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, maxRecommendations);
  }
}

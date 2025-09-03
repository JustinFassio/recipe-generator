/**
 * AI Agent for Regional Cuisine Operations
 * Provides intelligent access to the comprehensive cuisine system
 */

import {
  CUISINE_REGIONS,
  ALL_CUISINES,
  getCuisinesByRegion,
  getCuisineRegion,
} from '@/lib/cuisines';

// Configuration constants
const TOTAL_WORLD_COUNTRIES = 168; // Total number of recognized world countries

export interface CuisineAgentOptions {
  includeRegionalContext?: boolean;
  maxSuggestions?: number;
  filterByAccessibility?: boolean;
}

export interface CuisineSuggestion {
  cuisine: string;
  region: string;
  description: string;
  confidence: number;
  reasoning: string;
}

export interface RegionalCuisineContext {
  region: string;
  description: string;
  cuisines: string[];
  culturalNotes: string[];
  commonIngredients: string[];
  cookingTechniques: string[];
}

export class CuisineAgent {
  private options: CuisineAgentOptions;

  constructor(options: CuisineAgentOptions = {}) {
    this.options = {
      includeRegionalContext: true,
      maxSuggestions: 10,
      filterByAccessibility: false,
      ...options,
    };
  }

  /**
   * Get cuisines that match a search query with regional context
   */
  searchCuisines(query: string): CuisineSuggestion[] {
    const lowerQuery = query.toLowerCase();
    const suggestions: CuisineSuggestion[] = [];

    Object.entries(CUISINE_REGIONS).forEach(([region, data]) => {
      data.cuisines.forEach((cuisine) => {
        const cuisineLower = cuisine.toLowerCase();
        let confidence = 0;
        let reasoning = '';

        // Exact match
        if (cuisineLower === lowerQuery) {
          confidence = 1.0;
          reasoning = 'Exact match';
        }
        // Contains query
        else if (cuisineLower.includes(lowerQuery)) {
          confidence = 0.8;
          reasoning = 'Contains search term';
        }
        // Query contains cuisine
        else if (lowerQuery.includes(cuisineLower)) {
          confidence = 0.6;
          reasoning = 'Search term contains cuisine name';
        }
        // Regional match
        else if (region.toLowerCase().includes(lowerQuery)) {
          confidence = 0.4;
          reasoning = 'Regional match';
        }

        if (confidence > 0) {
          suggestions.push({
            cuisine,
            region,
            description: data.description,
            confidence,
            reasoning,
          });
        }
      });
    });

    // Sort by confidence and limit results
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.options.maxSuggestions);
  }

  /**
   * Get regional context for a specific cuisine
   */
  getCuisineContext(cuisine: string): RegionalCuisineContext | null {
    const region = getCuisineRegion(cuisine);
    if (!region) return null;

    const regionData = CUISINE_REGIONS[region];
    if (!regionData) return null;

    return {
      region,
      description: regionData.description,
      cuisines: [...regionData.cuisines],
      culturalNotes: this.getCulturalNotes(region, cuisine),
      commonIngredients: this.getCommonIngredients(region, cuisine),
      cookingTechniques: this.getCookingTechniques(region, cuisine),
    };
  }

  /**
   * Suggest cuisines based on ingredients or cooking methods
   */
  suggestCuisinesByIngredients(ingredients: string[]): CuisineSuggestion[] {
    const suggestions: CuisineSuggestion[] = [];
    const ingredientSet = new Set(ingredients.map((i) => i.toLowerCase()));

    Object.entries(CUISINE_REGIONS).forEach(([region, data]) => {
      data.cuisines.forEach((cuisine) => {
        const commonIngredients = this.getCommonIngredients(region, cuisine);
        const matches = commonIngredients.filter((ingredient) =>
          ingredientSet.has(ingredient.toLowerCase())
        );

        if (matches.length > 0) {
          const confidence = matches.length / ingredients.length;
          suggestions.push({
            cuisine,
            region,
            description: data.description,
            confidence,
            reasoning: `Matches ${matches.length} ingredients: ${matches.join(', ')}`,
          });
        }
      });
    });

    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.options.maxSuggestions);
  }

  /**
   * Get complementary cuisines for a given cuisine
   */
  getComplementaryCuisines(cuisine: string): CuisineSuggestion[] {
    const context = this.getCuisineContext(cuisine);
    if (!context) return [];

    const suggestions: CuisineSuggestion[] = [];
    const currentRegion = context.region;

    Object.entries(CUISINE_REGIONS).forEach(([region, data]) => {
      if (region === currentRegion) return; // Skip same region

      data.cuisines.forEach((otherCuisine) => {
        const confidence = this.calculateComplementaryScore(
          cuisine,
          otherCuisine,
          region
        );

        if (confidence > 0.3) {
          suggestions.push({
            cuisine: otherCuisine,
            region,
            description: data.description,
            confidence,
            reasoning:
              'Complementary cuisine based on cultural exchange and ingredient compatibility',
          });
        }
      });
    });

    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.options.maxSuggestions);
  }

  /**
   * Generate recipe categories for a specific cuisine
   */
  generateRecipeCategories(cuisine: string, course: string = 'Main'): string[] {
    const context = this.getCuisineContext(cuisine);
    if (!context) return [];

    const categories = [
      `Course: ${course}`,
      `Cuisine: ${cuisine}`,
      `Collection: Regional Specialties`,
    ];

    // Add regional context
    if (this.options.includeRegionalContext) {
      categories.push(`Collection: ${context.region} Traditions`);
    }

    // Add technique based on region
    const techniques = this.getCookingTechniques(context.region, cuisine);
    if (techniques.length > 0) {
      categories.push(`Technique: ${techniques[0]}`);
    }

    // Add seasonal appropriateness
    categories.push('Season: Year-Round');

    return categories;
  }

  /**
   * Generate a complete recipe JSON with prep field for a specific cuisine
   */
  generateRecipeJSON(
    cuisine: string,
    course: string = 'Main'
  ): {
    title: string;
    ingredients: Array<{
      item: string;
      amount?: string;
      prep?: string;
    }>;
    instructions: string[];
    setup: string[];
    categories: string[];
    notes: string;
  } {
    const context = this.getCuisineContext(cuisine);
    if (!context) {
      throw new Error(`No context found for cuisine: ${cuisine}`);
    }

    // Generate a sample recipe based on cuisine and regional context
    const title = `${cuisine} ${course} Recipe`;

    // Generate ingredients with prep instructions
    const ingredients = this.generateIngredientsWithPrep(context);

    // Generate cooking instructions
    const instructions = this.generateCookingInstructions(context, cuisine);

    // Generate setup/prep steps
    const setup = this.generateSetupSteps(context, cuisine);

    // Generate categories
    const categories = this.generateRecipeCategories(cuisine, course);

    // Generate notes
    const notes = this.generateRecipeNotes(context, cuisine);

    return {
      title,
      ingredients,
      instructions,
      setup,
      categories,
      notes,
    };
  }

  /**
   * Get all cuisines in a specific region
   */
  getCuisinesInRegion(region: string): string[] {
    return [...getCuisinesByRegion(region)];
  }

  /**
   * Get statistics about cuisine coverage
   */
  getCoverageStats() {
    const totalCountries = TOTAL_WORLD_COUNTRIES;
    const totalCuisines = ALL_CUISINES.length;
    const coveragePercentage = (totalCuisines / totalCountries) * 100;

    const regionalStats = Object.entries(CUISINE_REGIONS).map(
      ([region, data]) => ({
        region,
        cuisineCount: data.cuisines.length,
        percentage: (data.cuisines.length / totalCountries) * 100,
      })
    );

    return {
      totalCuisines,
      totalCountries,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      regionalBreakdown: regionalStats,
    };
  }

  // Private helper methods
  private getCulturalNotes(region: string, cuisine: string): string[] {
    const culturalNotes: Record<string, Record<string, string[]>> = {
      Americas: {
        Mexican: [
          'Rich in corn, beans, and chili peppers',
          'Influenced by indigenous and Spanish traditions',
        ],
        Brazilian: [
          'Diverse regional variations',
          'Heavy use of cassava and tropical fruits',
        ],
        Caribbean: [
          'Fusion of African, European, and indigenous influences',
          'Bold spices and tropical ingredients',
        ],
      },
      Europe: {
        Italian: [
          'Regional diversity from north to south',
          'Emphasis on fresh, seasonal ingredients',
        ],
        French: [
          'Sophisticated techniques and presentation',
          'Wine and dairy prominent',
        ],
        Ukrainian: [
          'Hearty, comfort food traditions',
          'Heavy use of grains and root vegetables',
        ],
      },
      Asia: {
        Chinese: [
          'Eight major regional cuisines',
          'Balance of flavors and textures',
        ],
        Thai: [
          'Harmony of sweet, sour, salty, and spicy',
          'Fresh herbs and aromatic ingredients',
        ],
        Japanese: ['Seasonal ingredients and minimalism', 'Umami-rich flavors'],
      },
    };

    return (
      culturalNotes[region]?.[cuisine] || [
        `Traditional ${cuisine} cuisine from ${region}`,
        'Rich in regional flavors and cooking methods',
      ]
    );
  }

  private getCommonIngredients(region: string, cuisine: string): string[] {
    const ingredients: Record<string, Record<string, string[]>> = {
      Americas: {
        Mexican: [
          'corn',
          'beans',
          'chili peppers',
          'tomatoes',
          'lime',
          'cilantro',
        ],
        Brazilian: ['cassava', 'black beans', 'rice', 'coconut', 'palm oil'],
        Caribbean: ['plantains', 'yams', 'coconut', 'allspice', 'rum'],
      },
      Europe: {
        Italian: ['olive oil', 'basil', 'tomatoes', 'parmesan', 'balsamic'],
        French: [
          'butter',
          'wine',
          'shallots',
          'herbs de provence',
          'dijon mustard',
        ],
        Ukrainian: ['potatoes', 'beets', 'cabbage', 'dill', 'sour cream'],
      },
      Asia: {
        Chinese: ['soy sauce', 'ginger', 'garlic', 'rice wine', 'five spice'],
        Thai: [
          'fish sauce',
          'coconut milk',
          'lemongrass',
          'kaffir lime',
          'galangal',
        ],
        Japanese: ['miso', 'dashi', 'mirin', 'natto', 'wasabi'],
      },
    };

    return (
      ingredients[region]?.[cuisine] || [
        'regional spices',
        'local vegetables',
        'traditional grains',
        'cultural seasonings',
      ]
    );
  }

  private getCookingTechniques(region: string, cuisine: string): string[] {
    const techniques: Record<string, Record<string, string[]>> = {
      Americas: {
        Mexican: ['grilling', 'braising', 'steaming', 'frying'],
        Brazilian: ['grilling', 'slow cooking', 'deep frying', 'smoking'],
        Caribbean: ['grilling', 'stewing', 'pickling', 'smoking'],
      },
      Europe: {
        Italian: ['braising', 'sautéing', 'roasting', 'pasta making'],
        French: ['sautéing', 'braising', 'poaching', 'sauce making'],
        Ukrainian: ['braising', 'slow cooking', 'pickling', 'fermenting'],
      },
      Asia: {
        Chinese: ['stir-frying', 'steaming', 'braising', 'deep frying'],
        Thai: ['stir-frying', 'curry making', 'grilling', 'steaming'],
        Japanese: ['steaming', 'grilling', 'tempura frying', 'sushi making'],
      },
    };

    return (
      techniques[region]?.[cuisine] || [
        'traditional cooking methods',
        'regional preparation techniques',
        'cultural cooking styles',
      ]
    );
  }

  private calculateComplementaryScore(
    cuisine1: string,
    cuisine2: string,
    region2: string
  ): number {
    // Simple scoring based on cultural proximity and ingredient compatibility
    let score = 0.5; // Base score

    // Regional proximity bonus
    const region1 = getCuisineRegion(cuisine1);
    if (region1 === region2) {
      score += 0.2; // Same region
    } else if (this.areRegionsProximate(region1, region2)) {
      score += 0.1; // Proximate regions
    }

    // Cultural exchange bonus
    if (this.haveCulturalExchange(cuisine1, cuisine2)) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generate ingredients with prep instructions for a cuisine
   */
  private generateIngredientsWithPrep(context: RegionalCuisineContext): Array<{
    item: string;
    amount?: string;
    prep?: string;
  }> {
    const ingredients: Array<{
      item: string;
      amount?: string;
      prep?: string;
    }> = [];

    // Add common ingredients with typical prep instructions
    context.commonIngredients.forEach((ingredient) => {
      const prepInstructions =
        this.getPrepInstructionsForIngredient(ingredient);

      ingredients.push({
        item: ingredient,
        amount: this.getTypicalAmount(ingredient),
        prep: prepInstructions,
      });
    });

    // Add some regional staples
    const regionalStaples = this.getRegionalStaples(context.region);
    regionalStaples.forEach((staple) => {
      if (!ingredients.some((ing) => ing.item === staple.item)) {
        ingredients.push({
          item: staple.item,
          amount: staple.amount,
          prep: staple.prep,
        });
      }
    });

    return ingredients;
  }

  /**
   * Generate cooking instructions for a cuisine
   */
  private generateCookingInstructions(
    context: RegionalCuisineContext,
    cuisine: string
  ): string[] {
    const instructions: string[] = [];
    const techniques = context.cookingTechniques;

    // Start with prep instructions
    instructions.push(
      `Prepare all ingredients according to their prep instructions.`
    );

    // Add technique-specific instructions
    if (techniques.includes('grilling')) {
      instructions.push(`Preheat your grill to medium-high heat.`);
    }
    if (techniques.includes('braising')) {
      instructions.push(
        `Heat oil in a large, heavy-bottomed pot over medium heat.`
      );
    }
    if (techniques.includes('stir-frying')) {
      instructions.push(
        `Heat a wok or large skillet over high heat until very hot.`
      );
    }
    if (techniques.includes('steaming')) {
      instructions.push(`Set up a steamer basket over boiling water.`);
    }

    // Add cuisine-specific instructions
    const cuisineInstructions = this.getCuisineSpecificInstructions(cuisine);
    instructions.push(...cuisineInstructions);

    // Add finishing instructions
    instructions.push(`Taste and adjust seasoning as needed.`);
    instructions.push(`Serve hot and enjoy your ${cuisine} creation!`);

    return instructions;
  }

  /**
   * Generate setup/prep steps for a cuisine
   */
  private generateSetupSteps(
    context: RegionalCuisineContext,
    cuisine: string
  ): string[] {
    const setup: string[] = [];

    // Add prep time estimate
    setup.push(`Prep time: 15-20 minutes`);

    // Add cooking time estimate
    setup.push(`Cook time: 30-45 minutes`);

    // Add serving size
    setup.push(`Serves: 4-6 people`);

    // Add equipment needed
    const equipment = this.getRequiredEquipment(context.region, cuisine);
    if (equipment.length > 0) {
      setup.push(`Equipment needed: ${equipment.join(', ')}`);
    }

    // Add special notes
    const specialNotes = this.getSpecialPrepNotes(cuisine);
    setup.push(...specialNotes);

    return setup;
  }

  /**
   * Generate recipe notes for a cuisine
   */
  private generateRecipeNotes(
    context: RegionalCuisineContext,
    cuisine: string
  ): string {
    const notes: string[] = [];

    // Add cultural context
    notes.push(
      `This recipe celebrates the rich traditions of ${context.region} cuisine.`
    );

    // Add ingredient tips
    notes.push(
      `For authentic flavor, try to use fresh, local ingredients when possible.`
    );

    // Add variation suggestions
    const variations = this.getRecipeVariations(cuisine);
    if (variations.length > 0) {
      notes.push(`Variations: ${variations.join('; ')}`);
    }

    // Add serving suggestions
    const servingSuggestions = this.getServingSuggestions(cuisine);
    if (servingSuggestions.length > 0) {
      notes.push(`Serving suggestions: ${servingSuggestions.join('; ')}`);
    }

    return notes.join(' ');
  }

  private areRegionsProximate(
    region1: string | null,
    region2: string
  ): boolean {
    if (!region1) return false;

    const proximatePairs = [
      ['Europe', 'Middle East'],
      ['Asia', 'Oceania'],
      ['Americas', 'Oceania'],
      ['Africa', 'Middle East'],
    ];

    return proximatePairs.some(
      ([r1, r2]) =>
        (region1 === r1 && region2 === r2) || (region1 === r2 && region2 === r1)
    );
  }

  private haveCulturalExchange(cuisine1: string, cuisine2: string): boolean {
    // Simplified cultural exchange detection
    const exchangePairs = [
      ['Italian', 'French'],
      ['Chinese', 'Japanese'],
      ['Mexican', 'American'],
      ['Turkish', 'Greek'],
      ['Indian', 'Pakistani'],
    ];

    return exchangePairs.some(
      ([c1, c2]) =>
        (cuisine1 === c1 && cuisine2 === c2) ||
        (cuisine1 === c2 && cuisine2 === c1)
    );
  }

  /**
   * Get prep instructions for a specific ingredient
   */
  private getPrepInstructionsForIngredient(ingredient: string): string {
    const prepInstructions: Record<string, string> = {
      corn: 'Remove husk and silk, rinse thoroughly',
      beans: 'Rinse and drain, remove any debris',
      'chili peppers': 'Remove stems and seeds, finely chop',
      tomatoes: 'Core and dice, or blanch and peel if needed',
      lime: 'Wash, zest if needed, then juice',
      cilantro: 'Wash and finely chop, discard stems',
      cassava: 'Peel, cut into chunks, remove woody center',
      'black beans': 'Rinse thoroughly, soak overnight if using dried',
      coconut: 'Crack open, extract meat, grate or chop',
      plantains: 'Peel and slice, choose ripeness based on recipe',
      'olive oil': 'Use extra virgin for finishing, regular for cooking',
      basil: 'Wash and tear leaves, avoid chopping to preserve flavor',
      parmesan: 'Grate fresh, avoid pre-grated for best flavor',
      butter: 'Bring to room temperature for baking, use cold for cooking',
      shallots: 'Peel and finely dice, milder than regular onions',
      potatoes: 'Scrub clean, peel if desired, cut to uniform size',
      beets: 'Scrub thoroughly, trim tops, can be roasted whole',
      'soy sauce': 'Use light for seasoning, dark for color and depth',
      ginger: 'Peel and grate or mince, use fresh for best flavor',
      'fish sauce': "Use sparingly as it's very salty and pungent",
      'coconut milk': 'Shake well before opening, use full-fat for richness',
      lemongrass: 'Remove outer layers, bruise and slice, or use paste',
      miso: 'Dissolve in warm liquid before adding to prevent clumping',
      dashi: 'Prepare fresh or use instant, forms base of many dishes',
    };

    return (
      prepInstructions[ingredient.toLowerCase()] || 'Wash and prepare as needed'
    );
  }

  /**
   * Get typical amount for an ingredient
   */
  private getTypicalAmount(ingredient: string): string {
    const amounts: Record<string, string> = {
      corn: '2 ears',
      beans: '1 cup',
      'chili peppers': '2-3 peppers',
      tomatoes: '4 medium',
      lime: '2 limes',
      cilantro: '1 bunch',
      cassava: '1 pound',
      'black beans': '2 cups',
      coconut: '1 whole',
      plantains: '3-4 medium',
      'olive oil': '2 tablespoons',
      basil: '1 cup packed',
      parmesan: '1/2 cup grated',
      butter: '4 tablespoons',
      shallots: '2 medium',
      potatoes: '1 pound',
      beets: '4 medium',
      'soy sauce': '2 tablespoons',
      ginger: '2-inch piece',
      'fish sauce': '1 tablespoon',
      'coconut milk': '1 can (13.5 oz)',
      lemongrass: '2 stalks',
      miso: '2 tablespoons',
      dashi: '2 cups',
    };

    return amounts[ingredient.toLowerCase()] || 'as needed';
  }

  /**
   * Get regional staples with prep instructions
   */
  private getRegionalStaples(region: string): Array<{
    item: string;
    amount: string;
    prep: string;
  }> {
    const staples: Record<
      string,
      Array<{
        item: string;
        amount: string;
        prep: string;
      }>
    > = {
      Americas: [
        { item: 'onion', amount: '1 large', prep: 'Peel and dice' },
        { item: 'garlic', amount: '4 cloves', prep: 'Peel and mince' },
        { item: 'salt', amount: 'to taste', prep: 'Season as needed' },
        { item: 'black pepper', amount: 'to taste', prep: 'Freshly ground' },
      ],
      Europe: [
        { item: 'onion', amount: '1 medium', prep: 'Peel and finely dice' },
        { item: 'garlic', amount: '3 cloves', prep: 'Peel and mince' },
        {
          item: 'olive oil',
          amount: '3 tablespoons',
          prep: 'Extra virgin for finishing',
        },
        {
          item: 'herbs',
          amount: '2 tablespoons',
          prep: 'Fresh, finely chopped',
        },
      ],
      Asia: [
        { item: 'onion', amount: '1 medium', prep: 'Peel and slice' },
        { item: 'garlic', amount: '6 cloves', prep: 'Peel and mince' },
        { item: 'ginger', amount: '1-inch piece', prep: 'Peel and grate' },
        { item: 'green onions', amount: '4 stalks', prep: 'Trim and slice' },
      ],
    };

    return staples[region] || [];
  }

  /**
   * Get cuisine-specific cooking instructions
   */
  private getCuisineSpecificInstructions(cuisine: string): string[] {
    const instructions: Record<string, string[]> = {
      Mexican: [
        'Layer flavors by cooking aromatics first',
        'Add spices to bloom their flavors in oil',
        'Finish with fresh herbs and lime juice',
      ],
      Italian: [
        'Cook pasta al dente, reserve pasta water',
        'Build sauce in the same pan as pasta',
        'Finish with pasta water to create creamy sauce',
      ],
      Chinese: [
        'Prepare all ingredients before starting to cook',
        'Cook over high heat for authentic wok flavor',
        'Add ingredients in order of cooking time',
      ],
      Thai: [
        'Balance sweet, sour, salty, and spicy flavors',
        'Add coconut milk gradually to prevent curdling',
        'Finish with fresh herbs and lime juice',
      ],
      Japanese: [
        'Use dashi as the base for authentic flavor',
        'Respect the seasonality of ingredients',
        'Present dishes with attention to aesthetics',
      ],
    };

    return (
      instructions[cuisine] || [
        'Cook ingredients according to traditional methods',
        'Respect the cultural cooking techniques',
      ]
    );
  }

  /**
   * Get required equipment for a cuisine
   */
  private getRequiredEquipment(region: string, cuisine: string): string[] {
    const equipment: Record<string, Record<string, string[]>> = {
      Americas: {
        Mexican: ['large skillet', 'grater', 'citrus juicer'],
        Brazilian: ['grill', 'heavy pot', 'mortar and pestle'],
        Caribbean: ['grill', 'dutch oven', 'spice grinder'],
      },
      Europe: {
        Italian: ['pasta pot', 'large skillet', 'grater'],
        French: ['heavy pot', 'whisk', 'fine mesh strainer'],
        Ukrainian: ['large pot', 'mandoline', 'fermentation vessel'],
      },
      Asia: {
        Chinese: ['wok', 'spider strainer', 'cleaver'],
        Thai: ['wok', 'mortar and pestle', 'steamer'],
        Japanese: ['rice cooker', 'bamboo mat', 'fine grater'],
      },
    };

    return equipment[region]?.[cuisine] || ['basic cooking utensils'];
  }

  /**
   * Get special prep notes for a cuisine
   */
  private getSpecialPrepNotes(cuisine: string): string[] {
    const notes: Record<string, string[]> = {
      Mexican: [
        'Soak dried chilies in hot water for 30 minutes',
        'Toast spices in a dry pan to enhance flavor',
      ],
      Italian: [
        'Bring cheese to room temperature for best flavor',
        'Use pasta water to adjust sauce consistency',
      ],
      Chinese: [
        'Marinate meat for at least 30 minutes',
        'Prepare sauce mixture before starting to cook',
      ],
      Thai: [
        'Soak rice noodles in warm water for 30 minutes',
        'Prepare curry paste or use high-quality store-bought',
      ],
      Japanese: [
        'Rinse rice until water runs clear',
        'Prepare dashi stock in advance',
      ],
    };

    return notes[cuisine] || ['Follow traditional preparation methods'];
  }

  /**
   * Get recipe variations for a cuisine
   */
  private getRecipeVariations(cuisine: string): string[] {
    const variations: Record<string, string[]> = {
      Mexican: [
        'Add more chilies for extra heat',
        'Substitute black beans for pinto beans',
        'Use corn tortillas instead of flour',
      ],
      Italian: [
        'Add mushrooms for vegetarian option',
        'Use different pasta shapes',
        'Substitute pecorino for parmesan',
      ],
      Chinese: [
        'Add more vegetables for vegetarian version',
        'Use different protein (chicken, beef, tofu)',
        'Adjust spice level to preference',
      ],
      Thai: [
        'Add more coconut milk for creamier texture',
        'Use different curry pastes',
        'Add more vegetables for nutrition',
      ],
      Japanese: [
        'Use different types of miso',
        'Add more vegetables for variety',
        'Adjust seasoning to taste',
      ],
    };

    return variations[cuisine] || ['Experiment with ingredient substitutions'];
  }

  /**
   * Get serving suggestions for a cuisine
   */
  private getServingSuggestions(cuisine: string): string[] {
    const suggestions: Record<string, string[]> = {
      Mexican: [
        'Serve with warm tortillas',
        'Garnish with fresh cilantro and lime wedges',
        'Accompany with rice and beans',
      ],
      Italian: [
        'Serve with crusty bread',
        'Garnish with fresh basil',
        'Pair with a simple green salad',
      ],
      Chinese: [
        'Serve with steamed rice',
        'Garnish with green onions',
        'Accompany with pickled vegetables',
      ],
      Thai: [
        'Serve with jasmine rice',
        'Garnish with fresh herbs',
        'Accompany with cucumber salad',
      ],
      Japanese: [
        'Serve with steamed rice',
        'Garnish with green onions',
        'Accompany with pickled vegetables',
      ],
    };

    return (
      suggestions[cuisine] || [
        'Serve hot and enjoy with traditional accompaniments',
      ]
    );
  }
}

// Export singleton instance for easy use
export const cuisineAgent = new CuisineAgent();

// Export convenience functions
export const searchCuisines = (query: string) =>
  cuisineAgent.searchCuisines(query);
export const getCuisineContext = (cuisine: string) =>
  cuisineAgent.getCuisineContext(cuisine);
export const suggestCuisinesByIngredients = (ingredients: string[]) =>
  cuisineAgent.suggestCuisinesByIngredients(ingredients);
export const getComplementaryCuisines = (cuisine: string) =>
  cuisineAgent.getComplementaryCuisines(cuisine);
export const generateRecipeCategories = (cuisine: string, course?: string) =>
  cuisineAgent.generateRecipeCategories(cuisine, course);
export const generateRecipeJSON = (cuisine: string, course?: string) =>
  cuisineAgent.generateRecipeJSON(cuisine, course);
export const getCoverageStats = () => cuisineAgent.getCoverageStats();

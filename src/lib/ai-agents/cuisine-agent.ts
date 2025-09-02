/**
 * AI Agent for Regional Cuisine Operations
 * Provides intelligent access to the comprehensive cuisine system
 */

import {
  CUISINE_REGIONS,
  ALL_CUISINES,
  getCuisinesByRegion,
  getCuisineRegion
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
      ...options
    };
  }

  /**
   * Get cuisines that match a search query with regional context
   */
  searchCuisines(query: string): CuisineSuggestion[] {
    const lowerQuery = query.toLowerCase();
    const suggestions: CuisineSuggestion[] = [];

    Object.entries(CUISINE_REGIONS).forEach(([region, data]) => {
      data.cuisines.forEach(cuisine => {
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
            reasoning
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
      cookingTechniques: this.getCookingTechniques(region, cuisine)
    };
  }

  /**
   * Suggest cuisines based on ingredients or cooking methods
   */
  suggestCuisinesByIngredients(ingredients: string[]): CuisineSuggestion[] {
    const suggestions: CuisineSuggestion[] = [];
    const ingredientSet = new Set(ingredients.map(i => i.toLowerCase()));

    Object.entries(CUISINE_REGIONS).forEach(([region, data]) => {
      data.cuisines.forEach(cuisine => {
        const commonIngredients = this.getCommonIngredients(region, cuisine);
        const matches = commonIngredients.filter(ingredient => 
          ingredientSet.has(ingredient.toLowerCase())
        );

        if (matches.length > 0) {
          const confidence = matches.length / ingredients.length;
          suggestions.push({
            cuisine,
            region,
            description: data.description,
            confidence,
            reasoning: `Matches ${matches.length} ingredients: ${matches.join(', ')}`
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

      data.cuisines.forEach(otherCuisine => {
        const confidence = this.calculateComplementaryScore(cuisine, otherCuisine, region);
        
        if (confidence > 0.3) {
          suggestions.push({
            cuisine: otherCuisine,
            region,
            description: data.description,
            confidence,
            reasoning: 'Complementary cuisine based on cultural exchange and ingredient compatibility'
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
      `Collection: Regional Specialties`
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

    const regionalStats = Object.entries(CUISINE_REGIONS).map(([region, data]) => ({
      region,
      cuisineCount: data.cuisines.length,
      percentage: (data.cuisines.length / totalCountries) * 100
    }));

    return {
      totalCuisines,
      totalCountries,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      regionalBreakdown: regionalStats
    };
  }

  // Private helper methods
  private getCulturalNotes(region: string, cuisine: string): string[] {
    const culturalNotes: Record<string, Record<string, string[]>> = {
      'Americas': {
        'Mexican': ['Rich in corn, beans, and chili peppers', 'Influenced by indigenous and Spanish traditions'],
        'Brazilian': ['Diverse regional variations', 'Heavy use of cassava and tropical fruits'],
        'Caribbean': ['Fusion of African, European, and indigenous influences', 'Bold spices and tropical ingredients']
      },
      'Europe': {
        'Italian': ['Regional diversity from north to south', 'Emphasis on fresh, seasonal ingredients'],
        'French': ['Sophisticated techniques and presentation', 'Wine and dairy prominent'],
        'Ukrainian': ['Hearty, comfort food traditions', 'Heavy use of grains and root vegetables']
      },
      'Asia': {
        'Chinese': ['Eight major regional cuisines', 'Balance of flavors and textures'],
        'Thai': ['Harmony of sweet, sour, salty, and spicy', 'Fresh herbs and aromatic ingredients'],
        'Japanese': ['Seasonal ingredients and minimalism', 'Umami-rich flavors']
      }
    };

    return culturalNotes[region]?.[cuisine] || [
      `Traditional ${cuisine} cuisine from ${region}`,
      'Rich in regional flavors and cooking methods'
    ];
  }

  private getCommonIngredients(region: string, cuisine: string): string[] {
    const ingredients: Record<string, Record<string, string[]>> = {
      'Americas': {
        'Mexican': ['corn', 'beans', 'chili peppers', 'tomatoes', 'lime', 'cilantro'],
        'Brazilian': ['cassava', 'black beans', 'rice', 'coconut', 'palm oil'],
        'Caribbean': ['plantains', 'yams', 'coconut', 'allspice', 'rum']
      },
      'Europe': {
        'Italian': ['olive oil', 'basil', 'tomatoes', 'parmesan', 'balsamic'],
        'French': ['butter', 'wine', 'shallots', 'herbs de provence', 'dijon mustard'],
        'Ukrainian': ['potatoes', 'beets', 'cabbage', 'dill', 'sour cream']
      },
      'Asia': {
        'Chinese': ['soy sauce', 'ginger', 'garlic', 'rice wine', 'five spice'],
        'Thai': ['fish sauce', 'coconut milk', 'lemongrass', 'kaffir lime', 'galangal'],
        'Japanese': ['miso', 'dashi', 'mirin', 'natto', 'wasabi']
      }
    };

    return ingredients[region]?.[cuisine] || [
      'regional spices',
      'local vegetables',
      'traditional grains',
      'cultural seasonings'
    ];
  }

  private getCookingTechniques(region: string, cuisine: string): string[] {
    const techniques: Record<string, Record<string, string[]>> = {
      'Americas': {
        'Mexican': ['grilling', 'braising', 'steaming', 'frying'],
        'Brazilian': ['grilling', 'slow cooking', 'deep frying', 'smoking'],
        'Caribbean': ['grilling', 'stewing', 'pickling', 'smoking']
      },
      'Europe': {
        'Italian': ['braising', 'sautéing', 'roasting', 'pasta making'],
        'French': ['sautéing', 'braising', 'poaching', 'sauce making'],
        'Ukrainian': ['braising', 'slow cooking', 'pickling', 'fermenting']
      },
      'Asia': {
        'Chinese': ['stir-frying', 'steaming', 'braising', 'deep frying'],
        'Thai': ['stir-frying', 'curry making', 'grilling', 'steaming'],
        'Japanese': ['steaming', 'grilling', 'tempura frying', 'sushi making']
      }
    };

    return techniques[region]?.[cuisine] || [
      'traditional cooking methods',
      'regional preparation techniques',
      'cultural cooking styles'
    ];
  }

  private calculateComplementaryScore(cuisine1: string, cuisine2: string, region2: string): number {
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

  private areRegionsProximate(region1: string | null, region2: string): boolean {
    if (!region1) return false;
    
    const proximatePairs = [
      ['Europe', 'Middle East'],
      ['Asia', 'Oceania'],
      ['Americas', 'Oceania'],
      ['Africa', 'Middle East']
    ];

    return proximatePairs.some(([r1, r2]) => 
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
      ['Indian', 'Pakistani']
    ];

    return exchangePairs.some(([c1, c2]) => 
      (cuisine1 === c1 && cuisine2 === c2) || (cuisine1 === c2 && cuisine2 === c1)
    );
  }
}

// Export singleton instance for easy use
export const cuisineAgent = new CuisineAgent();

// Export convenience functions
export const searchCuisines = (query: string) => cuisineAgent.searchCuisines(query);
export const getCuisineContext = (cuisine: string) => cuisineAgent.getCuisineContext(cuisine);
export const suggestCuisinesByIngredients = (ingredients: string[]) => cuisineAgent.suggestCuisinesByIngredients(ingredients);
export const getComplementaryCuisines = (cuisine: string) => cuisineAgent.getComplementaryCuisines(cuisine);
export const generateRecipeCategories = (cuisine: string, course?: string) => cuisineAgent.generateRecipeCategories(cuisine, course);
export const getCoverageStats = () => cuisineAgent.getCoverageStats();

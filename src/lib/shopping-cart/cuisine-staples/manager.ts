import { IngredientMatcher } from '@/lib/groceries/ingredient-matcher';
import { CuisineStaple, CuisineStaplesData, MissingStaples } from './types';

// Modular cuisine groups (expand as families are migrated)
import { asianCuisines } from './asian-cuisines';
import { europeanCuisines } from './european-cuisines';
import { americanCuisines } from './american-cuisines';
import { middleEasternCuisines } from './middle-eastern-cuisines';
import { caribbeanCuisines } from './caribbean-cuisines';
import { scandinavianCuisines } from './scandinavian-cuisines';
import { africanCuisines } from './african-cuisines';
import { fusionCuisines } from './fusion-cuisines';
import { internationalFusionCuisines } from './international-fusion-cuisines';
import { vegetarianCuisines } from './vegetarian-cuisines';
import { healthFocusedCuisines } from './health-focused-cuisines';
import { culturalAdaptations } from './cultural-adaptations';
import { specialtyDiets } from './specialty-diets';
import { specialtyCookingMethods } from './specialty-cooking-methods';
import { specialtyDietExpansions } from './specialty-diet-expansions';
import { specialtyDietFurtherExpansions } from './specialty-diet-further-expansions';
import { specialtyDietFinalExpansions } from './specialty-diet-final-expansions';
import { latinAmericanCuisines } from './latin-american';

// Compose all available families. As Phase 2 completes, this becomes the single source of truth.
const COMPOSED_CUISINES: Record<string, CuisineStaplesData> = {
  ...asianCuisines,
  ...europeanCuisines,
  ...americanCuisines,
  ...middleEasternCuisines,
  ...caribbeanCuisines,
  ...scandinavianCuisines,
  ...africanCuisines,
  ...fusionCuisines,
  ...internationalFusionCuisines,
  ...latinAmericanCuisines,
  ...vegetarianCuisines,
  ...healthFocusedCuisines,
  ...culturalAdaptations,
  ...specialtyDiets,
  ...specialtyCookingMethods,
  ...specialtyDietExpansions,
  ...specialtyDietFurtherExpansions,
  ...specialtyDietFinalExpansions,
};

export class CuisineStaplesManager {
  private cuisineData: Record<string, CuisineStaplesData> = COMPOSED_CUISINES;

  getAvailableCuisines(): string[] {
    return Object.keys(this.cuisineData).sort((a, b) => a.localeCompare(b));
  }

  getCuisineData(cuisineKey: string): CuisineStaplesData | undefined {
    return this.cuisineData[cuisineKey];
  }

  getCuisineStaples(cuisineKey: string): CuisineStaple[] {
    const data = this.getCuisineData(cuisineKey);
    return data ? data.staples : [];
  }

  // Preserve legacy signature: (cuisineKey, userGroceryCart, matcher)
  findMissingStaples(
    cuisineKey: string,
    userGroceryCart: Record<string, string[]>,
    matcher: IngredientMatcher
  ): MissingStaples {
    const data = this.getCuisineData(cuisineKey);
    if (!data) {
      return {
        cuisine: cuisineKey,
        available: [],
        missing: [],
        coverage: 0,
      };
    }

    const ownedIngredients = Object.keys(userGroceryCart).flatMap(
      (c) => userGroceryCart[c] || []
    );
    const normalizedOwned = new Set(
      ownedIngredients.map((i) => i.trim().toLowerCase())
    );

    const available: CuisineStaple[] = [];
    const missing: CuisineStaple[] = [];

    for (const staple of data.staples) {
      const name = staple.ingredient.toLowerCase();
      const hasDirect = normalizedOwned.has(name);
      const hasMatch = hasDirect || matcher.hasIngredient(name);
      if (hasMatch) available.push(staple);
      else missing.push(staple);
    }

    const coverage = Math.round(
      (available.length / Math.max(1, data.staples.length)) * 100
    );

    return { cuisine: data.cuisine, available, missing, coverage };
  }

  // Preserve legacy signature: (userGroceryCart, matcher)
  getAllMissingStaples(
    userGroceryCart: Record<string, string[]>,
    matcher: IngredientMatcher
  ): MissingStaples[] {
    return this.getAvailableCuisines()
      .map((key) => this.findMissingStaples(key, userGroceryCart, matcher))
      .sort((a, b) => b.coverage - a.coverage);
  }

  // Preserve legacy signature and return type: (cuisineKey, userGroceryCart, matcher, limit) => CuisineStaple[]
  getRecommendedAdditions(
    cuisineKey: string,
    userGroceryCart: Record<string, string[]>,
    matcher: IngredientMatcher,
    limit = 20
  ): CuisineStaple[] {
    const data = this.getCuisineData(cuisineKey);
    if (!data) return [];

    const ownedIngredients = Object.keys(userGroceryCart).flatMap(
      (c) => userGroceryCart[c] || []
    );
    const normalizedOwned = new Set(
      ownedIngredients.map((i) => i.trim().toLowerCase())
    );

    const missing = data.staples.filter((staple) => {
      const name = staple.ingredient.toLowerCase();
      const hasDirect = normalizedOwned.has(name);
      return !(hasDirect || matcher.hasIngredient(name));
    });

    const scoreOf = (p: CuisineStaple['priority']) =>
      p === 'essential' ? 3 : p === 'recommended' ? 2 : 1;

    return missing
      .sort((a, b) => scoreOf(b.priority) - scoreOf(a.priority))
      .slice(0, limit);
  }
}

// Slim compatibility layer. Prefer importing from cuisine-staples/manager and /types.
export type {
  CuisineStaple,
  CuisineStaplesData,
} from './cuisine-staples/types';
export { CuisineStaplesManager } from './cuisine-staples/manager';
export { asianCuisines } from './cuisine-staples/asian-cuisines';
export { europeanCuisines } from './cuisine-staples/european-cuisines';
export { americanCuisines } from './cuisine-staples/american-cuisines';
export { middleEasternCuisines } from './cuisine-staples/middle-eastern-cuisines';
export { caribbeanCuisines } from './cuisine-staples/caribbean-cuisines';
export { scandinavianCuisines } from './cuisine-staples/scandinavian-cuisines';
export { africanCuisines } from './cuisine-staples/african-cuisines';
export { fusionCuisines } from './cuisine-staples/fusion-cuisines';
export { internationalFusionCuisines } from './cuisine-staples/international-fusion-cuisines';
export { vegetarianCuisines } from './cuisine-staples/vegetarian-cuisines';
export { healthFocusedCuisines } from './cuisine-staples/health-focused-cuisines';
export { culturalAdaptations } from './cuisine-staples/cultural-adaptations';
export { specialtyDiets } from './cuisine-staples/specialty-diets';
export { specialtyCookingMethods } from './cuisine-staples/specialty-cooking-methods';
export { specialtyDietExpansions } from './cuisine-staples/specialty-diet-expansions';
export { specialtyDietFurtherExpansions } from './cuisine-staples/specialty-diet-further-expansions';
export { specialtyDietFinalExpansions } from './cuisine-staples/specialty-diet-final-expansions';
export { latinAmericanCuisines } from './cuisine-staples/latin-american';

// Narrow the type of import.meta to avoid any-casts while supporting Vite env
const __meta =
  typeof import.meta !== 'undefined'
    ? (import.meta as unknown as { env?: { DEV?: boolean } })
    : undefined;
if (__meta?.env?.DEV) {
  console.warn(
    '[cuisine-staples] This file is now a thin compatibility layer. Please import from cuisine-staples/manager or group files directly.'
  );
}

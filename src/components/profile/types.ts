/**
 * Profile Domain Types
 *
 * Centralized type definitions for profile components to improve type safety
 * and provide better editor support.
 */

import type {
  commonAllergens,
  commonDietaryRestrictions,
  commonMedicalConditions,
  commonCuisines,
  commonEquipment,
  commonDislikedIngredients,
  spiceLabels,
  skillLevelLabels,
} from './constants';

// Union types from constants for type safety
export type Allergen = (typeof commonAllergens)[number];
export type DietaryRestriction = (typeof commonDietaryRestrictions)[number];
export type MedicalCondition = (typeof commonMedicalConditions)[number];
export type Cuisine = (typeof commonCuisines)[number];
export type Equipment = (typeof commonEquipment)[number];
export type DislikedIngredient = (typeof commonDislikedIngredients)[number];
export type SpiceLevel = (typeof spiceLabels)[number];
export type SkillLevel = (typeof skillLevelLabels)[number];

// Measurement units
export type Units = 'metric' | 'imperial';

// Time per meal range (1-5 corresponding to timePerMealLabels)
export type TimePerMeal = 1 | 2 | 3 | 4 | 5;

// Spice tolerance range (1-5 corresponding to spiceLabels)
export type SpiceTolerance = 1 | 2 | 3 | 4 | 5;

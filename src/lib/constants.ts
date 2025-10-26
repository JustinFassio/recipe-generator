/**
 * GENERAL APPLICATION CONSTANTS
 *
 * This file contains general constants used across the application.
 *
 * IMPORTANT: This file does NOT contain:
 * - Cuisine definitions (see @/lib/cuisines.ts)
 * - Category definitions (see @/lib/categories.ts)
 * - Mood definitions (see @/lib/moods.ts)
 *
 * Each domain has its own specialized file for maintainability and clarity.
 */

// Recipe-related constants
export const MAX_CATEGORIES_PER_RECIPE = 6;
export const MAX_CATEGORY_LENGTH = 50;

// Image fallback path
export const FALLBACK_IMAGE_PATH = '/recipe-generator-logo.png';

// Predefined categories for filtering
export const PREDEFINED_CATEGORIES = [
  'Collection: Quick & Easy',
  'Collection: 30-Minute Meals',
  'Collection: One-Pot Wonders',
  'Collection: Vegetarian',
  'Collection: Vegan',
  'Collection: Gluten-Free',
  'Collection: Low-Carb',
  'Collection: High-Protein',
  'Occasion: Weeknight',
  'Occasion: Weekend',
  'Occasion: Holiday',
  'Occasion: Party',
  'Technique: No-Cook',
  'Technique: Slow Cooker',
  'Technique: Air Fryer',
  'Technique: Instant Pot',
  'Diet: Keto',
  'Diet: Paleo',
  'Diet: Mediterranean',
  'Diet: DASH',
] as const;

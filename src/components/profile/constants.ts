/**
 * Profile Domain Constants
 *
 * Centralized constants for profile components to improve maintainability
 * and reduce duplication across the profile feature.
 */

// Safety & Health Constants
export const commonAllergens = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Sesame',
  'Sulfites',
] as const;

export const commonDietaryRestrictions = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Keto',
  'Paleo',
  'Low Carb',
  'Low Fat',
  'Low Sodium',
  'Gluten-Free',
  'Dairy-Free',
  'Halal',
  'Kosher',
] as const;

export const commonMedicalConditions = [
  'Diabetes',
  'High Blood Pressure',
  'Heart Disease',
  'Kidney Disease',
  'Liver Disease',
  'Celiac Disease',
  'IBS',
  'GERD',
] as const;

// Cooking & Cuisine Constants
export const commonCuisines = [
  'American',
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'Thai',
  'French',
  'Mediterranean',
  'Greek',
  'Korean',
  'Vietnamese',
  'Spanish',
  'Middle Eastern',
  'German',
  'British',
] as const;

export const commonEquipment = [
  'Oven',
  'Stovetop',
  'Microwave',
  'Air Fryer',
  'Slow Cooker',
  'Pressure Cooker',
  'Rice Cooker',
  'Blender',
  'Food Processor',
  'Stand Mixer',
  'Grill',
  'Cast Iron Pan',
  'Non-stick Pan',
  'Wok',
  'Dutch Oven',
  'Baking Sheets',
] as const;

export const commonDislikedIngredients = [
  'Mushrooms',
  'Onions',
  'Garlic',
  'Cilantro',
  'Olives',
  'Tomatoes',
  'Bell Peppers',
  'Spicy Peppers',
  'Coconut',
  'Seafood',
  'Liver',
  'Blue Cheese',
  'Anchovies',
  'Pickles',
  'Avocado',
  'Eggplant',
] as const;

// Skill & Preference Constants
export const spiceLabels = [
  'Mild',
  'Medium',
  'Hot',
  'Very Hot',
  'Extreme',
] as const;

export const timePerMealLabels = ['15m', '30m', '45m', '60m', '90m+'] as const;

export const skillLevelLabels = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
  'Chef',
] as const;

// Username validation (already centralized but moved here for completeness)
export const USERNAME_PATTERN = '^[a-z0-9_]+$';

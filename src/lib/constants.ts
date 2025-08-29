// Recipe-related constants
export const MAX_CATEGORIES_PER_RECIPE = 6;
export const MAX_CATEGORY_LENGTH = 50;

// Filter options - only include what exists in the database
export const CUISINE_OPTIONS = [
  'italian',
  'mexican',
  'chinese',
  'indian',
  'japanese',
  'thai',
  'french',
  'mediterranean',
  'american',
  'greek',
  'spanish',
  'korean',
  'vietnamese',
  'lebanese',
  'turkish',
  'moroccan',
  'ethiopian',
  'caribbean',
  'brazilian',
  'peruvian',
] as const;

export const CUISINE_LABELS: Record<string, string> = {
  italian: 'Italian',
  mexican: 'Mexican',
  chinese: 'Chinese',
  indian: 'Indian',
  japanese: 'Japanese',
  thai: 'Thai',
  french: 'French',
  mediterranean: 'Mediterranean',
  american: 'American',
  greek: 'Greek',
  spanish: 'Spanish',
  korean: 'Korean',
  vietnamese: 'Vietnamese',
  lebanese: 'Lebanese',
  turkish: 'Turkish',
  moroccan: 'Moroccan',
  ethiopian: 'Ethiopian',
  caribbean: 'Caribbean',
  brazilian: 'Brazilian',
  peruvian: 'Peruvian',
};

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

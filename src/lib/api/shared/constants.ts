/**
 * Shared API Constants - Common constants used across API modules
 */

// Configuration constants for ingredient filtering
export const INGREDIENT_MATCH_CONFIDENCE_THRESHOLD = 50; // Minimum confidence score for ingredient matching (0-100)

// API Limits
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_SEARCH_RESULTS = 1000;

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 2 * 60 * 60 * 1000, // 2 hours
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};

// Image upload constants
export const IMAGE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  DEFAULT_QUALITY: 85,
  THUMBNAIL_SIZES: [150, 300, 600, 1200],
};

// Recipe constants
export const RECIPE = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_INGREDIENTS: 50,
  MAX_INSTRUCTIONS_LENGTH: 10000,
  MAX_NOTES_LENGTH: 2000,
  MAX_CATEGORIES: 10,
};

// Rating constants
export const RATING = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  DEFAULT_RATING: 0,
};

// Search constants
export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  DEFAULT_RESULTS_LIMIT: 20,
  MAX_RESULTS_LIMIT: 100,
};

// Error codes
export const ERROR_CODES = {
  NOT_FOUND: 'PGRST116',
  UNAUTHORIZED: 'PGRST301',
  FORBIDDEN: 'PGRST403',
  VALIDATION_ERROR: 'PGRST400',
  INTERNAL_ERROR: 'PGRST500',
} as const;

// Database table names
export const TABLES = {
  RECIPES: 'recipes',
  RECIPE_IMAGES: 'recipe_images',
  RECIPE_RATINGS: 'recipe_ratings',
  RECIPE_CONTENT_VERSIONS: 'recipe_content_versions',
  PROFILES: 'profiles',
  USER_GROCERIES: 'user_groceries',
  GLOBAL_INGREDIENTS: 'global_ingredients',
} as const;

// Storage bucket names
export const STORAGE_BUCKETS = {
  RECIPE_IMAGES: 'recipe-images',
  AVATARS: 'avatars',
  TEMP_UPLOADS: 'temp-uploads',
} as const;

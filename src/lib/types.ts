// Centralized type definitions for the Recipe Generator app

// Core Recipe types
export type Recipe = {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string;
  notes: string | null;
  image_url: string | null;
  categories: string[];
  setup: string[];
  cooking_time: string | null;
  difficulty: string | null;
  user_id: string;
  is_public: boolean;
  creator_rating: number | null;
  created_at: string;
  updated_at: string;
  // Clean versioning field
  current_version_id: string | null;
};

export type PublicRecipe = Recipe & {
  author_name: string;
};

// Recipe Versioning types
export type RecipeVersion = {
  id: string;
  recipe_id: string;
  version_number: number;
  version_name: string | null;
  changelog: string | null;
  // Full content snapshot
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string;
  notes: string | null;
  setup: string[];
  categories: string[];
  cooking_time: string | null;
  difficulty: string | null;
  creator_rating: number | null;
  image_url: string | null;
  // Metadata
  created_at: string;
  created_by: string;
  is_published: boolean;
};

export type VersionStats = {
  recipe_id: string;
  title: string;
  version_number: number;
  creator_rating: number | null;
  owner_id: string;
  version_rating_count: number;
  version_avg_rating: number | null;
  version_view_count: number;
  version_comment_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  parent_recipe_id: string | null;
  is_version: boolean;
};

export type AggregateStats = {
  original_recipe_id: string;
  original_title: string;
  owner_id: string;
  total_versions: number;
  latest_version: number;
  total_ratings: number;
  aggregate_avg_rating: number | null;
  total_views: number;
  total_comments: number;
  last_updated: string;
  latest_version_title: string | null;
  latest_creator_rating: number | null;
};

export type VersionRating = {
  id: string;
  recipe_id: string;
  version_number: number;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipeView = {
  id: string;
  recipe_id: string;
  version_number: number;
  user_id: string;
  viewed_at: string;
  session_id: string | null;
};

// Recipe filtering types - only include what exists in the database
export type Cuisine = (typeof import('./cuisines').CUISINE_OPTIONS)[number];
export type Mood = (typeof import('./moods').MOOD_OPTIONS)[number];
export type SortOption = 'date' | 'title' | 'popularity';

export type RecipeFilters = {
  searchTerm?: string;
  categories?: string[];
  cuisine?: Cuisine[];
  moods?: Mood[];
  availableIngredients?: string[];
  sortBy?: SortOption;
  sortOrder?: 'asc' | 'desc';
};

// User Profile types
export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  // Basic preferences
  region: string | null; // Legacy field
  // Geographic preferences
  country: string | null;
  state_province: string | null;
  city: string | null;
  // Other preferences
  language: string | null;
  units: string | null;
  time_per_meal: number | null;
  skill_level: string | null;
  created_at: string;
  updated_at: string;
};

// Username management
export type Username = {
  username: string;
  user_id: string;
  created_at: string;
};

// User safety and dietary preferences
export type UserSafety = {
  user_id: string;
  allergies: string[];
  dietary_restrictions: string[];
  medical_conditions: string[];
  created_at: string;
  updated_at: string;
};

export type CookingPreferences = {
  user_id: string;
  preferred_cuisines: string[];
  available_equipment: string[];
  disliked_ingredients: string[];
  spice_tolerance: number | null;
  created_at: string;
  updated_at: string;
};

// Grocery types
export type UserGroceries = {
  user_id: string;
  groceries: Record<string, string[]>;
  shopping_list?: Record<string, string>;
  shopping_contexts?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type GroceryCategory = {
  name: string;
  subtitle: string;
  icon: string;
  items: string[];
};

export type GroceryCategories = Record<string, GroceryCategory>;

// Audit trail
export type AccountEvent = {
  id: string;
  user_id: string;
  event_type:
    | 'profile_created'
    | 'username_claimed'
    | 'username_changed'
    | 'profile_updated'
    | 'avatar_updated'
    | 'email_changed'
    | 'password_changed';
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

// API Response types
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

export type AuthError = {
  message: string;
  code?: string;
  details?: string;
};

// Recipe parsing types
export interface IngredientItem {
  item: string;
  amount?: string;
  prep?: string;
}

export type ParsedRecipe = {
  title: string;
  setup: string[];
  ingredients: string[];
  instructions: string;
  notes: string | null;
  categories: string[];
};

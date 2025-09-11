// Centralized type definitions for the Recipe Generator app

// Core Recipe types
export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string | null;
  image_url: string | null;
  categories: string[];
  setup: string[];
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicRecipe = Recipe & {
  author_name: string;
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

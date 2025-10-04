/**
 * Shared API Types - Common types used across API modules
 */

// Type for profile summary data used in API responses
export interface ProfileSummary {
  id: string;
  full_name: string | null;
}

// Typed row for the recipe_aggregate_stats view
export interface AggregateStatsRow {
  id: string;
  title: string;
  is_public: boolean;
  aggregate_avg_rating: number | null;
  total_ratings: number;
  total_views: number;
  total_versions: number;
  latest_version: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

// Common filter types
export interface BaseFilters {
  searchTerm?: string;
  sortBy?: 'date' | 'title' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Image upload types
export interface ImageUploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
}

// Analytics types
export interface RecipeAnalytics {
  version_count: number;
  recent_activity: {
    ratings_this_week: number;
    views_this_week: number;
    comments_this_week: number;
  };
  top_comments: Array<{ id: string; comment: string; created_at: string }>;
}

export interface TrendingRecipe {
  recipe_id: string;
  title: string;
  version_number: number;
  creator_rating: number;
  owner_id: string;
  version_rating_count: number;
  version_avg_rating: number;
  version_view_count: number;
  created_at: string;
  updated_at: string;
}

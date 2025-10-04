/**
 * Main API Export - Barrel file for all API modules
 * 
 * This file provides a clean, organized way to import API functions
 * while keeping the implementation details separated into focused modules.
 */

// Core Recipe APIs
export { recipeApi as coreRecipeApi } from './core/recipe-api';
export { publicRecipeApi } from './core/public-recipe-api';

// User-specific APIs
export { userRecipeApi } from './user/user-recipe-api';

// Feature-specific APIs
export { imageGalleryApi } from './features/image-gallery-api';
export { ratingApi } from './features/rating-api';
export { versioningApi } from './features/versioning-api';

// Discovery APIs
export { exploreApi } from './discovery/explore-api';

// Shared utilities
export { handleError } from './shared/error-handling';
export * from './shared/types';
export * from './shared/constants';

// Legacy compatibility - maintain the old recipeApi export for backward compatibility
// This will be the main export that combines all recipe-related functionality
import { recipeApi as coreRecipeApi } from './core/recipe-api';
import { publicRecipeApi } from './core/public-recipe-api';
import { userRecipeApi } from './user/user-recipe-api';
import { imageGalleryApi } from './features/image-gallery-api';
import { ratingApi } from './features/rating-api';
import { versioningApi } from './features/versioning-api';
import { exploreApi } from './discovery/explore-api';
import { parseRecipeFromText } from '../recipe-parser';

/**
 * Legacy Recipe API - Maintains backward compatibility
 * 
 * This combines all recipe-related functionality into a single object
 * to maintain compatibility with existing code that imports from the main api.ts file.
 * 
 * @deprecated Consider importing specific APIs directly for better tree-shaking
 */
export const recipeApi = {
  // Core recipe operations
  ...coreRecipeApi,
  
  // Public recipe operations
  getPublicRecipe: publicRecipeApi.getPublicRecipe,
  getPublicRecipes: publicRecipeApi.getPublicRecipes,
  savePublicRecipe: publicRecipeApi.savePublicRecipe,
  toggleRecipePublic: publicRecipeApi.toggleRecipePublic,
  getRecipeSharingStatus: publicRecipeApi.getRecipeSharingStatus,
  
  // User recipe operations
  getUserRecipes: userRecipeApi.getUserRecipes,
  
  // Image gallery operations
  getRecipeImages: imageGalleryApi.getRecipeImages,
  getPrimaryRecipeImage: imageGalleryApi.getPrimaryRecipeImage,
  addRecipeImage: imageGalleryApi.addRecipeImage,
  updateRecipeImage: imageGalleryApi.updateRecipeImage,
  deleteRecipeImage: imageGalleryApi.deleteRecipeImage,
  setPrimaryImage: imageGalleryApi.setPrimaryImage,
  reorderRecipeImages: imageGalleryApi.reorderRecipeImages,
  uploadImage: imageGalleryApi.uploadImage,
  
  // Rating operations
  getCommunityRating: ratingApi.getCommunityRating,
  submitCommunityRating: ratingApi.submitCommunityRating,
  getUserProfile: ratingApi.getUserProfile,
  
  // Versioning operations
  ...versioningApi,
  
  // Discovery operations
  getPublicRecipesWithStats: exploreApi.getPublicRecipesWithStats,
  getHighestRatedPublicRecipes: exploreApi.getHighestRatedPublicRecipes,
  getTrendingRecipes: exploreApi.getTrendingRecipes,
  getRecipeAnalytics: exploreApi.getRecipeAnalytics,
  
  // Utility functions
  parseRecipeFromText,
};

// Re-export everything for convenience
export * from './core/recipe-api';
export * from './core/public-recipe-api';
export * from './user/user-recipe-api';
export * from './features/image-gallery-api';
export * from './features/rating-api';
export * from './features/versioning-api';
export * from './discovery/explore-api';

/**
 * @deprecated This file is deprecated. Use the new modular API structure instead.
 * 
 * For new code, import from specific API modules:
 * - import { recipeApi } from '@/lib/api/core/recipe-api'
 * - import { imageGalleryApi } from '@/lib/api/features/image-gallery-api'
 * - import { exploreApi } from '@/lib/api/discovery/explore-api'
 * 
 * This file is maintained for backward compatibility only.
 */

// Import from specific modules to avoid circular dependencies
import { recipeApi as coreRecipeApi } from './api/core/recipe-api';
import { publicRecipeApi } from './api/core/public-recipe-api';
import { userRecipeApi } from './api/user/user-recipe-api';
import { imageGalleryApi } from './api/features/image-gallery-api';
import { ratingApi } from './api/features/rating-api';
import { versioningApi } from './api/features/versioning-api';
import { exploreApi } from './api/discovery/explore-api';
import { parseRecipeFromText } from './recipe-parser';

// Re-export shared utilities
export { handleError } from './api/shared/error-handling';
export * from './api/shared/types';
export * from './api/shared/constants';

// Legacy Recipe API - Maintains backward compatibility
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

// Re-export individual APIs for direct access
export { coreRecipeApi };
export { publicRecipeApi };
export { userRecipeApi };
export { imageGalleryApi };
export { ratingApi };
export { versioningApi };
export { exploreApi };
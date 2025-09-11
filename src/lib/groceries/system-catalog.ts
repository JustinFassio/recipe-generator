/*
 * Chef Isabella's "Kitchen Reality" System Catalog
 *
 * "Group by BEHAVIOR, not biology" - Chef Isabella
 *
 * Comprehensive ingredient catalog organized by where ingredients live in the kitchen
 * and how they are actually used in cooking, not by scientific classification.
 *
 * This catalog serves as the source of truth for system ingredients that get
 * synced to the global_ingredients table with is_system=true.
 *
 * NOTE: This file now imports from individual category files for better maintainability.
 * Each category is maintained in its own file under ./categories/
 */

// Re-export everything from the categories index for backward compatibility
export {
  CHEF_ISABELLA_SYSTEM_CATALOG,
  CATEGORY_METADATA,
  getAllSystemIngredients,
  getCategoryStats,
  // Individual category exports for direct access if needed
  PROTEINS,
  FRESH_PRODUCE,
  FLAVOR_BUILDERS,
  COOKING_ESSENTIALS,
  BAKERY_GRAINS,
  DAIRY_COLD,
  PANTRY_STAPLES,
  FROZEN,
} from './categories/index';

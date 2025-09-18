/**
 * Main Seed Orchestrator
 * Coordinates all seed scripts in the correct order
 */

import { validateEnvironment, logSuccess, logError, logInfo } from './seed/utils/shared';
import { seedAllUsers } from './seed/core/users';
import { seedGlobalIngredients } from './seed/core/global-ingredients';
import { seedAllRecipes } from './seed/content/recipes';
import { seedRecipeRatings } from './seed/content/ratings';
import { seedUserGroceries } from './seed/engagement/groceries';
import { seedAnalyticsData } from './seed/engagement/analytics';
import { seedEvaluationReports } from './seed/health/evaluations';

/**
 * Seed all data in the correct dependency order
 */
async function seedAll() {
  console.log('🌱 Starting comprehensive seed process...\n');
  
  // Validate required environment variables
  validateEnvironment(['SUPABASE_SERVICE_ROLE_KEY']);
  
  try {
    // Phase 1: Core Foundation (users and global data)
    logInfo('Phase 1: Seeding core foundation...');
    await seedAllUsers();
    await seedGlobalIngredients();
    
    // Phase 2: Content (depends on users)
    logInfo('Phase 2: Seeding content...');
    await seedAllRecipes();
    await seedRecipeRatings();
    
    // Phase 3: Engagement (depends on users and recipes)
    logInfo('Phase 3: Seeding engagement data...');
    await seedUserGroceries();
    await seedAnalyticsData();
    
    // Phase 4: Health Data (depends on users)
    logInfo('Phase 4: Seeding health data...');
    await seedEvaluationReports();
    
    // Success summary
    console.log('\n' + '='.repeat(50));
    logSuccess('🎉 All seed data created successfully!');
    console.log('='.repeat(50));
    
    logInfo('Seeded data includes:');
    logInfo('  ✓ 6 test users with profiles and preferences');
    logInfo('  ✓ 50+ global ingredients with categories and synonyms');
    logInfo('  ✓ 20+ recipes with Version 0 (Original Recipe)');
    logInfo('  ✓ Community and creator ratings for recipes');
    logInfo('  ✓ User grocery lists for ingredient matching');
    logInfo('  ✓ Avatar analytics and recipe view tracking');
    logInfo('  ✓ Health evaluation reports');
    logInfo('  ✓ User safety and cooking preferences');
    
    console.log('\n🚀 Your local database is ready for testing!');
    
  } catch (error) {
    logError('Seed process failed:', error);
    process.exit(1);
  }
}

/**
 * Seed only core data (users + basic recipes)
 */
async function seedCore() {
  console.log('🌱 Starting core seed process...\n');
  
  validateEnvironment(['SUPABASE_SERVICE_ROLE_KEY']);
  
  try {
    await seedAllUsers();
    await seedAllRecipes();
    
    logSuccess('Core seed data created successfully!');
    
  } catch (error) {
    logError('Core seed process failed:', error);
    process.exit(1);
  }
}

/**
 * Seed only content data (assumes users exist)
 */
async function seedContent() {
  console.log('🌱 Starting content seed process...\n');
  
  validateEnvironment(['SUPABASE_SERVICE_ROLE_KEY']);
  
  try {
    await seedAllRecipes();
    
    logSuccess('Content seed data created successfully!');
    
  } catch (error) {
    logError('Content seed process failed:', error);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'core':
    seedCore();
    break;
  case 'content':
    seedContent();
    break;
  case 'users':
    seedAllUsers();
    break;
  case 'recipes':
    seedAllRecipes();
    break;
  case 'health':
    seedEvaluationReports();
    break;
  default:
    seedAll();
    break;
}

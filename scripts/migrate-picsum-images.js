#!/usr/bin/env node

/**
 * Migration script to replace picsum.photos URLs with local placeholder images
 * This script will:
 * 1. Find all recipes with picsum.photos URLs
 * 2. Replace them with local placeholder images or null
 * 3. Update the database with the new URLs
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Check if a URL is a picsum.photos URL
 */
function isPicsumUrl(url) {
  return url && url.includes('picsum.photos');
}

/**
 * Generate a local placeholder image URL based on recipe title
 */
function generateLocalPlaceholderUrl(recipeTitle) {
  // Use a consistent local placeholder image
  // This could be enhanced to use recipe-specific placeholders in the future
  return '/recipe-generator-logo.png';
}

/**
 * Main migration function
 */
async function migratePicsumImages() {
  try {
    console.log('🔍 Searching for recipes with picsum.photos URLs...');

    // Get all recipes with picsum.photos URLs
    const { data: recipes, error: fetchError } = await supabase
      .from('recipes')
      .select('id, title, image_url')
      .like('image_url', '%picsum.photos%');

    if (fetchError) {
      throw new Error(`Failed to fetch recipes: ${fetchError.message}`);
    }

    console.log(`📊 Found ${recipes.length} recipes with picsum.photos URLs`);

    if (recipes.length === 0) {
      console.log('✅ No picsum.photos URLs found to migrate');
      return;
    }

    // Show what will be migrated
    console.log('\n📋 Recipes to be migrated:');
    recipes.forEach((recipe) => {
      console.log(`   - ${recipe.title} (${recipe.id})`);
      console.log(`     Current: ${recipe.image_url}`);
    });

    // Migrate each picsum.photos URL
    let migratedCount = 0;
    let failedCount = 0;

    for (const recipe of recipes) {
      console.log(`\n🔄 Processing recipe: ${recipe.title} (ID: ${recipe.id})`);

      // Generate new placeholder URL
      const newUrl = generateLocalPlaceholderUrl(recipe.title);

      console.log(`   Old URL: ${recipe.image_url}`);
      console.log(`   New URL: ${newUrl}`);

      // Update the recipe with the new URL
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: newUrl })
        .eq('id', recipe.id);

      if (updateError) {
        console.error(
          `❌ Failed to update recipe ${recipe.id}:`,
          updateError.message
        );
        failedCount++;
      } else {
        console.log(`✅ Updated recipe ${recipe.id} with new placeholder URL`);
        migratedCount++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`   ✅ Successfully migrated: ${migratedCount} images`);
    console.log(`   ❌ Failed to migrate: ${failedCount} images`);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migratePicsumImages();
}

export { migratePicsumImages, isPicsumUrl };

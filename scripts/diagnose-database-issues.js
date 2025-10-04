#!/usr/bin/env node

/**
 * Diagnostic script to identify database schema and data issues
 * This script will:
 * 1. Check if recipe_ratings table has version_number column
 * 2. Check data types and constraints
 * 3. Identify potential 406/400 error causes
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
 * Check recipe_ratings table schema
 */
async function checkRecipeRatingsSchema() {
  try {
    console.log('🔍 Checking recipe_ratings table schema...');

    // Try to query the table structure
    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying recipe_ratings table:', error);
      return;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('📊 recipe_ratings columns:', columns);

      // Check for version_number column
      if (columns.includes('version_number')) {
        console.log('✅ version_number column exists');

        // Check data types
        const sample = data[0];
        if (sample.version_number !== undefined) {
          console.log(
            `   - Sample version_number value: ${sample.version_number} (type: ${typeof sample.version_number})`
          );
        } else {
          console.log('   - version_number is undefined/null in sample data');
        }
      } else {
        console.log('❌ version_number column missing!');
      }
    } else {
      console.log('📊 recipe_ratings table is empty');
    }
  } catch (error) {
    console.error('❌ Failed to check recipe_ratings schema:', error.message);
  }
}

/**
 * Test the problematic query that's causing 406 errors
 */
async function testProblematicQuery() {
  try {
    console.log('\n🔍 Testing problematic recipe_ratings query...');

    // This is the query from the error: recipe_ratings?select=*&recipe_id=eq.0de6df1d-9706-4482-96e9-210fbe701745&version_number=eq.1&user_id=eq.576def01-9f93-410c-95e5-aa613a54f7c1

    const recipeId = '0de6df1d-9706-4482-96e9-210fbe701745';
    const userId = '576def01-9f93-410c-95e5-aa613a54f7c1';
    const versionNumber = 1;

    console.log(`   Testing query for recipe: ${recipeId}`);
    console.log(`   User: ${userId}`);
    console.log(`   Version: ${versionNumber}`);

    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('version_number', versionNumber)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Query failed:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);
      console.error('   Error hint:', error.hint);
    } else {
      console.log('✅ Query succeeded');
      console.log(`   Found ${data?.length || 0} records`);
      if (data && data.length > 0) {
        console.log('   Sample record:', data[0]);
      }
    }
  } catch (error) {
    console.error('❌ Failed to test query:', error.message);
  }
}

/**
 * Check recipe_views table
 */
async function checkRecipeViewsTable() {
  try {
    console.log('\n🔍 Checking recipe_views table...');

    const { data, error } = await supabase
      .from('recipe_views')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying recipe_views table:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
    } else {
      console.log('✅ recipe_views table accessible');
      console.log(`   Found ${data?.length || 0} records`);
    }
  } catch (error) {
    console.error('❌ Failed to check recipe_views:', error.message);
  }
}

/**
 * Check for DALL-E URLs in recipes
 */
async function checkDalleUrls() {
  try {
    console.log('\n🔍 Checking for DALL-E URLs in recipes...');

    const { data, error } = await supabase
      .from('recipes')
      .select('id, title, image_url')
      .not('image_url', 'is', null)
      .limit(10);

    if (error) {
      console.error('❌ Error querying recipes:', error);
      return;
    }

    const dalleRecipes =
      data?.filter(
        (recipe) =>
          recipe.image_url &&
          recipe.image_url.includes('oaidalleapiprodscus.blob.core.windows.net')
      ) || [];

    console.log(`📊 Found ${dalleRecipes.length} recipes with DALL-E URLs:`);
    dalleRecipes.forEach((recipe) => {
      console.log(`   - ${recipe.title} (${recipe.id})`);
      console.log(`     URL: ${recipe.image_url}`);
    });
  } catch (error) {
    console.error('❌ Failed to check DALL-E URLs:', error.message);
  }
}

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
  console.log('🔧 Running database diagnostics...\n');

  await checkRecipeRatingsSchema();
  await testProblematicQuery();
  await checkRecipeViewsTable();
  await checkDalleUrls();

  console.log('\n✅ Diagnostics completed!');
}

// Run the diagnostics
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnostics();
}

export {
  runDiagnostics,
  checkRecipeRatingsSchema,
  testProblematicQuery,
  checkRecipeViewsTable,
  checkDalleUrls,
};

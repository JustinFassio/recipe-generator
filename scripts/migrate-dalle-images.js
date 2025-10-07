#!/usr/bin/env node

/**
 * Migration script to identify and convert DALL-E URLs to Supabase storage URLs
 * This script will:
 * 1. Find all recipes with DALL-E URLs
 * 2. Attempt to download and re-upload them to Supabase
 * 3. Update the database with the new URLs
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

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
 * Check if a URL is a DALL-E URL
 */
function isDalleUrl(url) {
  return url && url.includes('oaidalleapiprodscus.blob.core.windows.net');
}

/**
 * Download image from DALL-E URL and upload to Supabase storage
 */
async function migrateDalleImage(dalleUrl, recipeId) {
  try {
    console.log(`🔄 Migrating image for recipe ${recipeId}...`);

    // Download the image from DALL-E URL
    const response = await fetch(dalleUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download image: ${response.status} ${response.statusText}`
      );
    }

    const imageBlob = await response.buffer();

    // Generate a unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const fileName = `migrated-dalle-${timestamp}-${randomSuffix}.png`;

    // Create the storage path
    const storagePath = `generated-images/${fileName}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(storagePath, imageBlob, {
        cacheControl: '31536000', // 1 year cache
        contentType: 'image/png',
        upsert: false, // Don't overwrite - each migration should be unique
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get the public URL
    const { data } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(storagePath);

    console.log(`✅ Successfully migrated image: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    console.error(
      `❌ Failed to migrate image for recipe ${recipeId}:`,
      error.message
    );
    return null;
  }
}

/**
 * Main migration function
 */
async function migrateDalleImages() {
  try {
    console.log('🔍 Searching for recipes with DALL-E URLs...');

    // Get all recipes with image URLs
    const { data: recipes, error: fetchError } = await supabase
      .from('recipes')
      .select('id, title, image_url')
      .not('image_url', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch recipes: ${fetchError.message}`);
    }

    console.log(`📊 Found ${recipes.length} recipes with images`);

    // Filter recipes with DALL-E URLs
    const dalleRecipes = recipes.filter((recipe) =>
      isDalleUrl(recipe.image_url)
    );

    console.log(`🎯 Found ${dalleRecipes.length} recipes with DALL-E URLs`);

    if (dalleRecipes.length === 0) {
      console.log('✅ No DALL-E URLs found to migrate');
      return;
    }

    // Migrate each DALL-E image
    let migratedCount = 0;
    let failedCount = 0;

    for (const recipe of dalleRecipes) {
      console.log(`\n🔄 Processing recipe: ${recipe.title} (ID: ${recipe.id})`);
      console.log(`   Old URL: ${recipe.image_url}`);

      const newUrl = await migrateDalleImage(recipe.image_url, recipe.id);

      if (newUrl) {
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
          console.log(`✅ Updated recipe ${recipe.id} with new URL`);
          migratedCount++;
        }
      } else {
        failedCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
  migrateDalleImages();
}

export { migrateDalleImages, isDalleUrl };

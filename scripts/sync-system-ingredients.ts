/*
 * Chef Isabella's "Kitchen Reality" System Ingredients Sync
 *
 * "Group by BEHAVIOR, not biology!" - Chef Isabella
 *
 * Syncs Chef Isabella's comprehensive ingredient catalog into global_ingredients
 * - Marks items as is_system = true
 * - Idempotent upserts by normalized_name
 * - Organizes ingredients by kitchen behavior, not scientific classification
 *
 * Usage (local):
 *   SUPABASE_SERVICE_ROLE_KEY=... npm run tsx scripts/sync-system-ingredients.ts
 */

import { createClient } from '@supabase/supabase-js';
import {
  getAllSystemIngredients,
  CATEGORY_METADATA,
  getCategoryStats,
} from '@/lib/groceries/system-catalog';

// Operation status enum for better type safety and maintainability
enum UpsertStatus {
  INSERTED = 'inserted',
  UPDATED = 'updated',
  UNCHANGED = 'unchanged',
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function upsertSystemIngredient(
  name: string,
  category: string
): Promise<UpsertStatus> {
  const normalized_name = normalizeName(name);

  const { data: existing, error: fetchError } = await admin
    .from('global_ingredients')
    .select('id, is_system, category, name')
    .eq('normalized_name', normalized_name)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (!existing) {
    const { error: insertError } = await admin
      .from('global_ingredients')
      .insert({
        name,
        normalized_name,
        category,
        synonyms: [],
        usage_count: 5,
        is_verified: true,
        is_system: true,
      });
    if (insertError) throw insertError;
    return UpsertStatus.INSERTED;
  }

  // Ensure category remains accurate and is_system is true
  if (
    !existing.is_system ||
    existing.category !== category ||
    existing.name !== name
  ) {
    const { error: updateError } = await admin
      .from('global_ingredients')
      .update({ is_system: true, category, name })
      .eq('id', existing.id);
    if (updateError) throw updateError;
    return UpsertStatus.UPDATED;
  }

  return UpsertStatus.UNCHANGED;
}

async function main() {
  console.log("🍽️  Chef Isabella's Kitchen Reality Ingredient Sync");
  console.log('📚 "Group by BEHAVIOR, not biology!" - Chef Isabella');
  console.log('');

  const systemIngredients = getAllSystemIngredients();
  const categoryCount = new Set(systemIngredients.map((i) => i.category)).size;
  const { stats, total } = getCategoryStats();

  console.log(`📊 Processing ${total} system ingredients`);
  console.log(`🏷️  Across ${categoryCount} "Kitchen Reality" categories`);
  console.log('');

  // Show category breakdown with Chef Isabella's personality
  console.log('📋 Category Breakdown (organized by kitchen behavior):');
  Object.entries(stats).forEach(([category, count]) => {
    const meta = CATEGORY_METADATA[category as keyof typeof CATEGORY_METADATA];
    console.log(
      `   ${meta?.icon} ${meta?.name} - "${meta?.subtitle}": ${count} items`
    );
  });
  console.log('');

  let insertedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let errorCount = 0;

  for (const { name, category } of systemIngredients) {
    try {
      const result = await upsertSystemIngredient(name, category);
      if (result === UpsertStatus.INSERTED) {
        insertedCount++;
        console.log(`➕ Inserted: ${name} [${category}]`);
      } else if (result === UpsertStatus.UPDATED) {
        updatedCount++;
        console.log(`♻️  Updated: ${name} [${category}]`);
      } else {
        unchangedCount++;
      }
    } catch (e) {
      console.error(`❌ Failed upserting ${name} [${category}]:`, e);
      errorCount++;
      process.exitCode = 1;
    }
  }

  console.log('');
  console.log("🎉 Chef Isabella's Kitchen Reality Sync Complete!");
  console.log('📈 Final Summary:');
  console.log(`  ➕ Inserted: ${insertedCount} new ingredients`);
  console.log(`  ♻️  Updated: ${updatedCount} existing ingredients`);
  console.log(`  ✅ Unchanged: ${unchangedCount} already perfect`);
  console.log(
    `  ❌ Errors: ${errorCount} ingredients couldn't find their home`
  );
  console.log(`  📊 Total Processed: ${total} ingredients`);

  if (errorCount === 0) {
    console.log('');
    console.log(
      "🍽️  Your kitchen is now organized like a professional chef's!"
    );
    console.log('🔍 Ingredients grouped by behavior, not biology');
    console.log('👩‍🍳 Ready for intuitive, accessible cooking');
    console.log('🏠 Following the "grandmother\'s kitchen" principle');
  } else {
    console.log('');
    console.log("⚠️  Some ingredients couldn't find their kitchen home");
    console.log('🔧 Please review errors above and adjust as needed');
  }
}

main();

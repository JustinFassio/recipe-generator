/*
 * Sync predefined system ingredients (from GROCERY_CATEGORIES) into global_ingredients
 * - Marks items as is_system = true
 * - Idempotent upserts by normalized_name
 *
 * Usage (local):
 *   SUPABASE_SERVICE_ROLE_KEY=... npm run tsx scripts/sync-system-ingredients.ts
 */

import { createClient } from '@supabase/supabase-js';
import { GROCERY_CATEGORIES } from '@/lib/groceries/categories';

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

async function upsertSystemIngredient(name: string, category: string) {
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
    console.log(`➕ Inserted system ingredient: ${name} [${category}]`);
    return;
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
    console.log(`♻️  Updated system ingredient: ${name} [${category}]`);
  }
}

async function main() {
  const entries = Object.entries(GROCERY_CATEGORIES) as Array<
    [keyof typeof GROCERY_CATEGORIES, { items: string[] }]
  >;

  for (const [categoryKey, meta] of entries) {
    for (const item of meta.items) {
      try {
        await upsertSystemIngredient(item, categoryKey as string);
      } catch (e) {
        console.error(`Failed upserting ${item} [${categoryKey}]:`, e);
        process.exitCode = 1;
      }
    }
  }

  console.log('✅ System ingredients sync complete');
}

main();

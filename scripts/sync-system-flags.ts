/*
 * Align is_system flags in global_ingredients to canonical terms from GROCERY_CATEGORIES.
 * - Any ingredient whose normalized_name is NOT in the canonical set will be set is_system=false.
 * - Any canonical not present is inserted (handled by sync-system-ingredients.ts but we keep a safety update).
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

async function main() {
  const canonicalSet = new Set<string>();
  for (const [, meta] of Object.entries(GROCERY_CATEGORIES)) {
    for (const item of meta.items) canonicalSet.add(normalizeName(item));
  }

  const { data: all, error } = await admin
    .from('global_ingredients')
    .select('id,name,normalized_name,is_system');
  if (error) throw error;

  const toUnset = (all || []).filter(
    (g) => g.is_system && !canonicalSet.has(g.normalized_name)
  );

  for (const g of toUnset) {
    const { error: updErr } = await admin
      .from('global_ingredients')
      .update({ is_system: false })
      .eq('id', g.id);
    if (updErr) {
      console.error(
        'Failed unsetting is_system for',
        g.normalized_name,
        updErr
      );
      process.exitCode = 1;
    } else {
      console.log(`🔧 Demoted non-canonical from system: ${g.name}`);
    }
  }

  console.log('✅ System flag alignment complete');
}

main();

/*
  Preseed a curated subset of cuisine staples into global_ingredients as system rows.
  - Non-destructive, idempotent: uses RPC upsert_global_system_ingredient
  - Scope filter: only essentials and recommended; cap per cuisine (default 10)
  - Run locally: npx ts-node scripts/seed/preseed-cuisine-staples-to-globals.ts
*/
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { CuisineStaplesManager } from '@/lib/shopping-cart/cuisine-staples/manager';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE key in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function upsert(name: string, category: string): Promise<boolean> {
  const normalized = normalizeName(name);
  const { error } = await supabase.rpc('upsert_global_system_ingredient', {
    p_name: name,
    p_normalized_name: normalized,
    p_category: category,
  });
  if (error) {
    console.warn('Upsert failed:', name, category, error.message);
    return false;
  }
  return true;
}

async function main() {
  const limitPerCuisine = Number(process.env.PRESEED_PER_CUISINE || 10);
  const includeOptional = process.env.PRESEED_INCLUDE_OPTIONAL === 'true';

  const manager = new CuisineStaplesManager();
  const cuisines = manager.getAvailableCuisines();

  let upserted = 0;
  let failed = 0;

  for (const key of cuisines) {
    const staples = manager
      .getCuisineStaples(key)
      .filter((s) => includeOptional || s.priority !== 'optional')
      .slice(0, limitPerCuisine);

    for (const s of staples) {
      const ok = await upsert(s.ingredient, s.category);
      if (ok) upserted += 1;
      else failed += 1;
    }
  }

  console.log(`Preseed complete. Upserted: ${upserted}, Failed: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

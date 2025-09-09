/*
 * Add specified pantry staples to Alice Baker's groceries (idempotent).
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/add-alice-staples.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TARGET_EMAIL = 'alice@example.com';
const PANTRY_ITEMS = [
  'vegetable oil',
  'brown sugar',
  'baking powder',
  'baking soda',
  'vinegar',
];

async function main() {
  // Find Alice
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });
  if (listErr) throw listErr;
  const alice = list.users.find((u) => u.email?.toLowerCase() === TARGET_EMAIL);
  if (!alice) throw new Error('Alice user not found');

  // Load groceries row
  const { data: ugRow, error: ugErr } = await admin
    .from('user_groceries')
    .select('groceries')
    .eq('user_id', alice.id)
    .maybeSingle();
  if (ugErr) throw ugErr;

  const groceries: Record<string, string[]> = ugRow?.groceries || {};
  const currentPantry = new Set<string>(groceries.pantry || []);
  let changed = false;
  for (const item of PANTRY_ITEMS) {
    if (!currentPantry.has(item)) {
      currentPantry.add(item);
      changed = true;
      console.log(`➕ Added to pantry: ${item}`);
    }
  }

  if (!changed) {
    console.log('✅ Pantry already contains all target staples.');
    return;
  }

  const newGroceries = {
    ...groceries,
    pantry: Array.from(currentPantry).sort((a, b) => a.localeCompare(b)),
  };
  const { error: upsertErr } = await admin
    .from('user_groceries')
    .upsert({ user_id: alice.id, groceries: newGroceries });
  if (upsertErr) throw upsertErr;
  console.log('✅ Alice groceries updated.');
}

main().catch((e) => {
  console.error('Failed to update Alice groceries:', e);
  process.exit(1);
});

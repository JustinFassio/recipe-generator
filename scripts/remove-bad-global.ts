import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  // Try to remove the accidental test entry
  const candidates: Array<{
    field: 'name' | 'normalized_name';
    value: string;
  }> = [
    { field: 'name', value: '1 medium yellow squash' },
    { field: 'normalized_name', value: '1 medium yellow squash' },
  ];

  let removed = 0;
  for (const c of candidates) {
    const { data, error } = await admin
      .from('global_ingredients')
      .select('id, name, normalized_name')
      .eq(c.field, c.value);
    if (error) throw error;
    if ((data || []).length > 0) {
      const ids = (data || []).map((d: { id: string }) => d.id);
      const { error: delErr } = await admin
        .from('global_ingredients')
        .delete()
        .in('id', ids);
      if (delErr) throw delErr;
      removed += ids.length;
      console.log(`✅ Removed ${ids.length} bad global ingredient(s).`);
    }
  }

  if (removed === 0) {
    // Fallback: loose match by name just in case
    const { data, error } = await admin
      .from('global_ingredients')
      .select('id, name')
      .ilike('name', '1%yellow%');
    if (error) throw error;
    if ((data || []).length > 0) {
      const ids = (data || []).map((d: { id: string }) => d.id);
      const { error: delErr } = await admin
        .from('global_ingredients')
        .delete()
        .in('id', ids);
      if (delErr) throw delErr;
      console.log(`✅ Removed ${ids.length} loosely matched entries.`);
    } else {
      console.log('ℹ️ No matching bad entries found.');
    }
  }
}

main().catch((e) => {
  console.error('❌ Failed to remove bad global ingredient:', e);
  process.exit(1);
});

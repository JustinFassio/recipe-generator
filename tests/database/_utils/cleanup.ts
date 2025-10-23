import type { SupabaseClient } from '@supabase/supabase-js';

// Truncate tables in dependency order to avoid FK violations
export async function truncatePhase1Tables(admin: SupabaseClient) {
  // Using RPC or raw SQL would be faster; with supabase-js we can call a SQL function if present.
  // Fallback: delete with cascade order
  await admin.from('usernames').delete().neq('username', '__never__');
  await admin.from('profiles').delete().neq('id', '__never__');
}

/**
 * Supabase Admin Client Setup for Seeding
 * Shared client configuration for all seed scripts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error('   Set it for local via your shell or an .env file before running seeding.');
  process.exit(1);
}

// Service role client bypasses RLS for seeding
export const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export { SUPABASE_URL, SERVICE_ROLE_KEY };

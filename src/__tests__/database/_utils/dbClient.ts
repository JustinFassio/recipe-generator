import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Tests that require DB will be skipped when env is missing
  // Consumers should check shouldRunDbTests() before executing
}

export function shouldRunDbTests(): boolean {
  // Check for required environment variables
  const hasUrl = Boolean(url);
  const hasAnonKey = Boolean(anonKey);

  if (!hasUrl || !hasAnonKey) {
    console.warn(
      'Skipping DB integration tests: SUPABASE_URL and/or SUPABASE_ANON_KEY not set'
    );
    return false;
  }

  return true;
}

export function hasServiceRole(): boolean {
  // Service role is not available in client-side tests for security
  return false;
}

export function createDbClient(): SupabaseClient {
  // Validate required environment variables
  if (!url) {
    throw new Error('Missing SUPABASE_URL. Set SUPABASE_URL in environment.');
  }
  if (!anonKey) {
    throw new Error(
      'Missing SUPABASE_ANON_KEY. Set SUPABASE_ANON_KEY in environment.'
    );
  }

  // Always use anon key for security - no service key exposure
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { 'X-Client-Info': 'recipe-generator-db-tests' } },
  });
}

export function createDbClientAsUser(jwt: string): SupabaseClient {
  if (!url) throw new Error('Missing SUPABASE URL for tests');
  return createClient(url, jwt, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { 'X-Client-Info': 'recipe-generator-db-tests-user' } },
  });
}

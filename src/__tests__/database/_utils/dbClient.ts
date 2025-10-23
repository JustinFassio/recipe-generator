import { createClient, SupabaseClient } from '@supabase/supabase-js';

type ClientRole = 'anon' | 'service';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fallback: if running against local Supabase and no service key provided, use default local service role
// This matches the key used in scripts/create-test-user.js
if (
  (!serviceKey || serviceKey.length === 0) &&
  url &&
  url.includes('127.0.0.1')
) {
  console.log('Using fallback service key for local Supabase');
  serviceKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
}

if (!url || !anonKey) {
  // Tests that require DB will be skipped when env is missing
  // Consumers should check shouldRunDbTests() before executing
}

export function shouldRunDbTests(): boolean {
  // Database tests require service role for admin operations
  const result = Boolean(url && anonKey && serviceKey);
  console.log('shouldRunDbTests check:', {
    url: !!url,
    anonKey: !!anonKey,
    serviceKey: !!serviceKey,
    result,
  });
  return result;
}

export function hasServiceRole(): boolean {
  return Boolean(serviceKey);
}

export function createDbClient(role: ClientRole = 'anon'): SupabaseClient {
  // Validate required environment variables
  if (!url) {
    throw new Error('Missing SUPABASE_URL. Set SUPABASE_URL in environment.');
  }
  if (!anonKey) {
    throw new Error(
      'Missing SUPABASE_ANON_KEY. Set SUPABASE_ANON_KEY in environment.'
    );
  }

  // Use service key for admin operations in tests, anon key otherwise
  const key = role === 'service' ? (serviceKey ?? anonKey!) : anonKey!;

  if (role === 'service' && !serviceKey) {
    console.warn(
      'Service role requested but no service key available, falling back to anon key'
    );
  }

  return createClient(url, key, {
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

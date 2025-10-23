import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

type ClientRole = 'anon' | 'service';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fallback: when running against local Supabase, allow loading a local, untracked
// service role key file. Do NOT commit this file. Prefer setting SUPABASE_SERVICE_ROLE_KEY env var.
const localKeyFile =
  process.env.SUPABASE_SERVICE_ROLE_KEY_FILE ||
  path.resolve(process.cwd(), '.supabase', 'service_role_key');

if (
  (!serviceKey || serviceKey.length === 0) &&
  url &&
  url.includes('127.0.0.1')
) {
  if (fs.existsSync(localKeyFile)) {
    console.log('Using local service key from', localKeyFile);
    serviceKey = fs.readFileSync(localKeyFile, 'utf8').trim();
  } else {
    console.warn(
      'No SUPABASE_SERVICE_ROLE_KEY and no local key file found; tests requiring the service role will be skipped. Create a local key file at ' +
        localKeyFile +
        ' or set SUPABASE_SERVICE_ROLE_KEY in your environment.'
    );
  }
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

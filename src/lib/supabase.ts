import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Better error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error(
    '   VITE_SUPABASE_ANON_KEY:',
    supabaseAnonKey ? 'SET' : 'MISSING'
  );

  if (
    supabaseUrl &&
    (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost'))
  ) {
    console.error('❌ ERROR: Supabase URL points to localhost!');
    console.error('   This should point to your production Supabase project.');
    console.error('   Safari blocks localhost connections from HTTPS sites.');
    console.error('   Please update your Vercel environment variables.');
  }

  throw new Error(
    'Missing Supabase environment variables. Please check your Vercel configuration.'
  );
}

// Validate Supabase URL format
if (
  !supabaseUrl.startsWith('https://') &&
  !supabaseUrl.startsWith('http://127.0.0.1')
) {
  console.error(
    '❌ Invalid Supabase URL format. Should start with https:// or http://127.0.0.1 for local development'
  );
  console.error('   Safari requires HTTPS for production sites.');
  throw new Error(
    'Invalid Supabase URL format - must use HTTPS for production or http://127.0.0.1 for local development'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  image_url: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

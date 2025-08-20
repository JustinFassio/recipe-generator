import { createClient } from '@supabase/supabase-js';
import type {
  Recipe,
  PublicRecipe,
  Profile,
  Username,
  UserSafety,
  CookingPreferences,
  AccountEvent,
} from './types';

// Environment variable validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your configuration.'
  );
}

// Create Supabase client with simplified configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Re-export types for backward compatibility
export type {
  Recipe,
  PublicRecipe,
  Profile,
  Username,
  UserSafety,
  CookingPreferences,
  AccountEvent,
};

import { createClient } from '@supabase/supabase-js';
import type {
  Recipe,
  PublicRecipe,
  Profile,
  Username,
  UserSafety,
  CookingPreferences,
  UserGroceries,
  AccountEvent,
} from './types';

// Environment variable validation
// Note: VITE_SUPABASE_ANON_KEY is intentionally public and safe to expose
// This is the anonymous key designed for client-side use with RLS policies
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error(
    'VITE_SUPABASE_ANON_KEY:',
    supabaseAnonKey ? '✅ Set' : '❌ Missing'
  );
  console.error('Please configure these in your environment variables.');

  throw new Error(
    'Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.'
  );
}

// Create Supabase client with optimized configuration for production
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase-auth-token',
    // Optimize auth flow for faster loading
    flowType: 'pkce',
  },
  global: {
    headers: {
      Accept: 'application/json',
      'X-Client-Info': 'recipe-generator-web',
    },
    // Add fetch configuration for better timeout handling
    fetch: (url, options = {}) => {
      const timeoutMs = import.meta.env.DEV ? 20000 : 15000;
      
      // Create timeout signal with fallback for older browsers
      let timeoutSignal: AbortSignal;
      if (typeof AbortSignal.timeout === 'function') {
        timeoutSignal = AbortSignal.timeout(timeoutMs);
      } else {
        // Fallback for browsers that don't support AbortSignal.timeout
        const controller = new AbortController();
        setTimeout(() => controller.abort(), timeoutMs);
        timeoutSignal = controller.signal;
      }
      
      // Combine with existing signal if provided
      const existingSignal = options.signal;
      let finalSignal = timeoutSignal;
      
      if (existingSignal) {
        // If there's already a signal, we need to combine them
        const combinedController = new AbortController();
        const abortHandler = () => combinedController.abort();
        
        existingSignal.addEventListener('abort', abortHandler);
        timeoutSignal.addEventListener('abort', abortHandler);
        
        finalSignal = combinedController.signal;
      }
      
      return fetch(url, {
        ...options,
        signal: finalSignal,
      });
    },
  },
  // Optimize database queries
  db: {
    schema: 'public',
  },
  // Optimize real-time connections
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Expose Supabase client to window for debugging (development only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as { supabase?: typeof supabase }).supabase = supabase;
}

// Re-export types for backward compatibility
export type {
  Recipe,
  PublicRecipe,
  Profile,
  Username,
  UserSafety,
  CookingPreferences,
  UserGroceries,
  AccountEvent,
};

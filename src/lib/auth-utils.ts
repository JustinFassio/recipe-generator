import { supabase } from './supabase';

/**
 * Simplified Auth Utilities for Pre-MVP
 *
 * Focus on core functionality without complex recovery logic
 * that can cause infinite loops and session issues.
 */

/**
 * Clear all authentication data cleanly
 */
export async function clearAuthTokens() {
  try {
    await supabase.auth.signOut();

    // Clear any remaining auth-related localStorage items
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          try {
            const key = localStorage.key(i);
            if (key && (key.includes('supabase') || key.includes('auth'))) {
              keysToRemove.push(key);
            }
          } catch (keyError) {
            console.warn('Error accessing localStorage key:', keyError);
            // Continue with other keys even if one fails
          }
        }

        keysToRemove.forEach((key) => {
          try {
            localStorage.removeItem(key);
          } catch (removeError) {
            console.warn(
              `Error removing localStorage key "${key}":`,
              removeError
            );
            // Continue with other keys even if one fails
          }
        });
      } catch (localStorageError) {
        console.warn('Error accessing localStorage:', localStorageError);
        // Continue execution even if localStorage operations fail
      }
    }

    console.log('🧹 Cleared all auth tokens');
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
}

/**
 * Simple session validation
 */
export async function validateSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.warn('Session validation error:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Generate a unique username with collision handling
 */
async function generateUniqueUsername(userId: string): Promise<string> {
  // Start with 12 characters from UUID for better uniqueness
  const baseUsername = `user_${userId.substring(0, 12)}`;
  let username = baseUsername;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    // Check if username is available using direct query
    const { data: existingUser, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows returned - username is available
      return username;
    } else if (error) {
      console.warn('Username availability check failed:', error);
      // Continue with next attempt
    } else if (!existingUser) {
      // Username is available
      return username;
    }

    // Username is taken, try with random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    username = `${baseUsername}_${randomSuffix}`;
    attempts++;
  }

  // Fallback: use timestamp-based username
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `user_${timestamp}_${random}`;
}

/**
 * Create a basic profile for the current user
 */
export async function ensureUserProfile(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      return { success: true };
    }

    // Generate unique username
    const username = await generateUniqueUsername(user.id);

    // Create basic profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || '',
      username: username,
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return { success: false, error: profileError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Simple auth error handler
 */
export function handleAuthError(error: unknown) {
  console.error('Auth error:', error);

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Handle common refresh token errors
  if (
    errorMessage.includes('Invalid Refresh Token') ||
    errorMessage.includes('Refresh Token Not Found') ||
    errorMessage.includes('refresh_token_not_found')
  ) {
    console.log('🔄 Detected refresh token error, clearing tokens');
    clearAuthTokens();
    return {
      shouldClearTokens: true,
      message: 'Your session has expired. Please sign in again.',
    };
  }

  return {
    shouldClearTokens: false,
    message: errorMessage || 'An authentication error occurred.',
  };
}

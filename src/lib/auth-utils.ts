import { supabase } from './supabase';

/**
 * Clear all authentication tokens and data from localStorage
 * Useful when dealing with stale or invalid refresh tokens
 */
export async function clearAuthTokens() {
  try {
    // Sign out to clear Supabase tokens
    await supabase.auth.signOut();

    // Clear any remaining auth-related items from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log('🧹 Cleared all auth tokens and localStorage data');
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
}

/**
 * Check if the current session is valid and refresh if needed
 */
export async function validateSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.warn('Session validation error:', error);

      // If it's a refresh token error, clear everything
      if (
        error.message?.includes('Invalid Refresh Token') ||
        error.message?.includes('Refresh Token Not Found')
      ) {
        await clearAuthTokens();
        return null;
      }
    }

    return session;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Handle authentication errors gracefully
 */
export function handleAuthError(error: unknown) {
  console.error('Auth error:', error);

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Common refresh token errors
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

  // Network errors
  if (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('Network error')
  ) {
    return {
      shouldClearTokens: false,
      message:
        'Network connection error. Please check your internet connection.',
    };
  }

  return {
    shouldClearTokens: false,
    message: errorMessage || 'An authentication error occurred.',
  };
}

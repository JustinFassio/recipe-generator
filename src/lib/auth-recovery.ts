import { supabase } from './supabase';

/**
 * Auth Recovery Utilities
 *
 * These functions help recover from authentication issues that can occur
 * when the auth system is updated or when users have stale sessions.
 */

/**
 * Generate a unique username for a user
 * Ensures uniqueness by checking against existing usernames
 */
async function generateUniqueUsername(userId: string): Promise<string> {
  const baseUsername = `user_${userId.substring(0, 8)}`;

  // Check if the base username already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', baseUsername)
    .single();

  if (!existingUser) {
    return baseUsername;
  }

  // If base username exists, try with more characters from the ID
  const extendedUsername = `user_${userId.substring(0, 12)}`;
  const { data: existingExtended } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', extendedUsername)
    .single();

  if (!existingExtended) {
    return extendedUsername;
  }

  // If still exists, use the full ID with a timestamp suffix
  const timestamp = Date.now().toString(36);
  return `user_${userId.substring(0, 6)}_${timestamp}`;
}

/**
 * Clear all auth data and force a fresh sign-in
 * This is useful when users are stuck in a loading state
 * Uses Supabase's built-in signOut() to properly clear all session data
 */
export async function clearAuthAndReload(): Promise<void> {
  try {
    // Sign out from Supabase - this clears all relevant session data
    await supabase.auth.signOut();

    // Clear any session storage that might contain additional auth data
    sessionStorage.clear();

    // Reload the page to start fresh
    window.location.reload();
  } catch (error) {
    console.error('Error clearing auth:', error);
    // Even if there's an error, reload the page
    window.location.reload();
  }
}

/**
 * Check if the current user has a valid profile
 * Returns true if the user has a profile, false otherwise
 */
export async function checkUserProfile(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Profile check error:', error);
      return false;
    }

    return !!profile;
  } catch (error) {
    console.error('Error checking user profile:', error);
    return false;
  }
}

/**
 * Create a profile for the current user if one doesn't exist
 * This is useful for users who were created before the profile system
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

    // Generate a unique username for the user
    const username = await generateUniqueUsername(user.id);

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || '',
      username,
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
 * Force refresh the auth session
 * This can help resolve issues with stale tokens
 */
export async function refreshAuthSession(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Session refresh error:', error);
      return { success: false, error: error.message };
    }

    if (!data.session) {
      return { success: false, error: 'No session after refresh' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error refreshing session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Comprehensive auth recovery function
 * This tries multiple recovery methods in sequence
 */
export async function recoverAuth(): Promise<{
  success: boolean;
  method: string;
  error?: string;
}> {
  try {
    // First, try to refresh the session
    const refreshResult = await refreshAuthSession();
    if (refreshResult.success) {
      return { success: true, method: 'session_refresh' };
    }

    // Check if user has a profile
    const hasProfile = await checkUserProfile();
    if (!hasProfile) {
      // Try to create a profile
      const profileResult = await ensureUserProfile();
      if (profileResult.success) {
        return { success: true, method: 'profile_created' };
      }
    }

    // If all else fails, suggest clearing auth
    return {
      success: false,
      method: 'clear_auth_required',
      error: 'Authentication recovery failed. Please sign in again.',
    };
  } catch (error) {
    console.error('Auth recovery error:', error);
    return {
      success: false,
      method: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

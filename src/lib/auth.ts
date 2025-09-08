import { supabase } from './supabase';
import type { Profile, AuthError } from './types';
import {
  processAvatarImage,
  validateImageFile,
  validateFileSignature,
  DEFAULT_AVATAR_OPTIONS,
} from './image-processing';

// Profile field selection constants for consistency across queries
export const PROFILE_FIELDS_FULL =
  'id, username, full_name, avatar_url, bio, region, country, state_province, city, language, units, time_per_meal, skill_level, created_at, updated_at';
export const PROFILE_FIELDS_BASIC =
  'bio, region, country, state_province, city, language, units, time_per_meal, skill_level';

// Username validation constants
const USERNAME_VALIDATION_REGEX = /^[a-z0-9_]{3,24}$/;

// Simple error handler
function createAuthError(
  message: string,
  code?: string,
  details?: string
): AuthError {
  return { message, code, details };
}

// Sign up with email and password
export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: createAuthError(error.message, error.name, error.message),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: createAuthError(
        'An unexpected error occurred during sign up',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      ),
    };
  }
}

// Sign in with email and password
export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: createAuthError(error.message, error.name, error.message),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: createAuthError(
        'An unexpected error occurred during sign in',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      ),
    };
  }
}

// Sign in with magic link
export async function signInWithMagicLink(
  email: string
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: createAuthError(error.message, error.name, error.message),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: createAuthError(
        'An unexpected error occurred while sending magic link',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      ),
    };
  }
}

// Reset password
export async function resetPassword(
  email: string
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: createAuthError(error.message, error.name, error.message),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: createAuthError(
        'An unexpected error occurred while sending reset email',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      ),
    };
  }
}

// Update user email
export async function updateEmail(
  newEmail: string
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      return {
        success: false,
        error: createAuthError(error.message, error.name, error.message),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: createAuthError(
        'An unexpected error occurred while updating email',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      ),
    };
  }
}

// Update user password
export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: createAuthError(error.message, error.name, error.message),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: createAuthError(
        'An unexpected error occurred while updating password',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      ),
    };
  }
}

// Update user profile
export async function updateProfile(
  updates: Partial<
    Pick<
      Profile,
      | 'full_name'
      | 'avatar_url'
      | 'bio'
      | 'region'
      | 'country'
      | 'state_province'
      | 'city'
      | 'language'
      | 'units'
      | 'time_per_meal'
      | 'skill_level'
    >
  >
): Promise<{ success: boolean; error?: AuthError; profile?: Profile }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: createAuthError(
          'You must be signed in to update your profile',
          'UNAUTHENTICATED'
        ),
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: createAuthError(error.message, error.code, error.details),
      };
    }

    return { success: true, profile: data };
  } catch (error) {
    return {
      success: false,
      error: createAuthError(
        'An unexpected error occurred while updating profile',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      ),
    };
  }
}

// Check if username is available
export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; error?: AuthError }> {
  try {
    // Basic client-side validation
    if (!USERNAME_VALIDATION_REGEX.test(username)) {
      return {
        available: false,
        error: createAuthError(
          'Username must be 3-24 characters long and contain only lowercase letters, numbers, and underscores',
          'INVALID_FORMAT'
        ),
      };
    }

    const { data, error } = await supabase.rpc('is_username_available', {
      check_username: username,
    });

    if (error) {
      return {
        available: false,
        error: createAuthError(error.message, error.code, error.details),
      };
    }

    return { available: data === true };
  } catch (error) {
    return {
      available: false,
      error: createAuthError(
        'An unexpected error occurred while checking username availability',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      ),
    };
  }
}

// Update username using database function for atomic operation
export async function claimUsername(
  username: string
): Promise<{ success: boolean; error?: AuthError; profile?: Profile }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: createAuthError(
          'You must be signed in to update your username',
          'UNAUTHENTICATED'
        ),
      };
    }

    // Basic client-side validation
    if (!USERNAME_VALIDATION_REGEX.test(username)) {
      return {
        success: false,
        error: createAuthError(
          'Username must be 3-24 characters long and contain only lowercase letters, numbers, and underscores',
          'INVALID_FORMAT'
        ),
      };
    }

    // Use the database function for atomic username updating
    const { data: result, error } = await supabase.rpc(
      'update_username_atomic',
      {
        p_user_id: user.id,
        p_new_username: username.toLowerCase(),
      }
    );

    if (error) {
      return {
        success: false,
        error: createAuthError(error.message, error.code, error.details),
      };
    }

    // Handle the JSON response from the function
    const success = result?.success === true;
    if (!success) {
      return {
        success: false,
        error: createAuthError(
          result?.error || 'This username is already taken',
          'USERNAME_TAKEN'
        ),
      };
    }

    // Fetch the updated profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS_FULL)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching updated profile:', profileError);
    }

    return { success: true, profile: profile || undefined };
  } catch (error) {
    return {
      success: false,
      error: createAuthError(
        'An unexpected error occurred while updating username',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      ),
    };
  }
}

// Upload avatar image with optimization
export async function uploadAvatar(file: File): Promise<{
  success: boolean;
  error?: AuthError;
  avatarUrl?: string;
  compressionInfo?: {
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
  };
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: createAuthError(
          'You must be signed in to upload an avatar',
          'UNAUTHENTICATED'
        ),
      };
    }

    // Enhanced validation
    const fileValidation = validateImageFile(file);
    if (!fileValidation.valid) {
      return {
        success: false,
        error: createAuthError(
          fileValidation.error || 'Invalid file',
          'INVALID_FILE'
        ),
      };
    }

    // Validate file signature for additional security
    const signatureValidation = await validateFileSignature(file);
    if (!signatureValidation.valid) {
      return {
        success: false,
        error: createAuthError(
          signatureValidation.error || 'Invalid file format',
          'INVALID_FILE_SIGNATURE'
        ),
      };
    }

    // Process and optimize the image
    const processedResult = await processAvatarImage(
      file,
      DEFAULT_AVATAR_OPTIONS
    );

    // Generate unique filename with timestamp for cache busting
    const timestamp = Date.now();
    const fileName = `${user.id}/avatar-${timestamp}.webp`;

    // Upload optimized image to storage
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, processedResult.file, { upsert: true });

    if (error) {
      // Enhanced error handling
      if (error.message.includes('File size')) {
        return {
          success: false,
          error: createAuthError(
            'File size exceeds the limit. Please choose a smaller image.',
            'FILE_TOO_LARGE'
          ),
        };
      }
      if (error.message.includes('Invalid file type')) {
        return {
          success: false,
          error: createAuthError(
            'Invalid file type. Please use JPEG, PNG, WebP, or GIF.',
            'INVALID_FILE_TYPE'
          ),
        };
      }
      if (error.message.includes('quota')) {
        return {
          success: false,
          error: createAuthError(
            'Storage quota exceeded. Please contact support.',
            'QUOTA_EXCEEDED'
          ),
        };
      }

      return {
        success: false,
        error: createAuthError(error.message, error.name, error.message),
      };
    }

    // Get public URL using Supabase's built-in method
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: createAuthError(
          updateError.message,
          updateError.code,
          updateError.details
        ),
      };
    }

    return {
      success: true,
      avatarUrl: publicUrl,
      compressionInfo: {
        originalSize: processedResult.originalSize,
        processedSize: processedResult.processedSize,
        compressionRatio: processedResult.compressionRatio,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: createAuthError(
        'An unexpected error occurred while uploading avatar',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      ),
    };
  }
}

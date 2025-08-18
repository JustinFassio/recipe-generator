import { supabase, type Profile } from './supabase';

// Auth error types for better error handling
export type AuthError = {
  message: string;
  code?: string;
  details?: string;
};

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
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
          details: error.message,
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred during sign up',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
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
        error: {
          message: error.message,
          code: error.name,
          details: error.message,
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred during sign in',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
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
        error: {
          message: error.message,
          code: error.name,
          details: error.message,
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred while sending magic link',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
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
        error: {
          message: error.message,
          code: error.name,
          details: error.message,
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred while sending reset email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
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
        error: {
          message: error.message,
          code: error.name,
          details: error.message,
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred while updating email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
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
        error: {
          message: error.message,
          code: error.name,
          details: error.message,
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred while updating password',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
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
        error: {
          message: 'You must be signed in to update your profile',
          code: 'UNAUTHENTICATED',
        },
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
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    return {
      success: true,
      profile: data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred while updating profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// Check if username is available
export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; error?: AuthError }> {
  try {
    // Basic client-side validation
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      return {
        available: false,
        error: {
          message:
            'Username must be 3-24 characters long and contain only lowercase letters, numbers, and underscores',
          code: 'INVALID_FORMAT',
        },
      };
    }

    const { data, error } = await supabase.rpc('is_username_available', {
      check_username: username,
    });

    if (error) {
      return {
        available: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    return {
      available: data === true,
    };
  } catch (error) {
    return {
      available: false,
      error: {
        message:
          'An unexpected error occurred while checking username availability',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// Reserve/claim username using database function for atomic operation
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
        error: {
          message: 'You must be signed in to claim a username',
          code: 'UNAUTHENTICATED',
        },
      };
    }

    // Basic client-side validation
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      return {
        success: false,
        error: {
          message:
            'Username must be 3-24 characters long and contain only lowercase letters, numbers, and underscores',
          code: 'INVALID_FORMAT',
        },
      };
    }

    // Use the database function for atomic username claiming
    const { error } = await supabase.rpc('claim_username_atomic', {
      p_user_id: user.id,
      p_username: username.toLowerCase(),
    });

    if (error) {
      // Handle specific error messages from the database function
      if (error.message?.includes('username_already_taken')) {
        return {
          success: false,
          error: {
            message: 'This username is already taken',
            code: 'USERNAME_TAKEN',
          },
        };
      }

      if (error.message?.includes('user_already_has_username')) {
        return {
          success: false,
          error: {
            message: 'You already have a username',
            code: 'USERNAME_EXISTS',
          },
        };
      }

      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    // Fetch the updated profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        'id, username, full_name, avatar_url, bio, region, language, units, time_per_meal, skill_level, created_at, updated_at'
      )
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching updated profile:', profileError);
    }

    return {
      success: true,
      profile: profile || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred while claiming username',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// Upload avatar image
export async function uploadAvatar(
  file: File
): Promise<{ success: boolean; error?: AuthError; avatarUrl?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: {
          message: 'You must be signed in to upload an avatar',
          code: 'UNAUTHENTICATED',
        },
      };
    }

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: {
          message: 'Please upload a valid image file (JPEG, PNG, WebP, or GIF)',
          code: 'INVALID_FILE_TYPE',
        },
      };
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: {
          message: 'File size must be less than 5MB',
          code: 'FILE_TOO_LARGE',
        },
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    // Upload to storage
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
      });

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
          details: error.message,
        },
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(fileName);

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
        error: {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
        },
      };
    }

    return {
      success: true,
      avatarUrl: publicUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred while uploading avatar',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

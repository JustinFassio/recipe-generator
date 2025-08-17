import { supabase, type UserSafety, type CookingPreferences } from './supabase';

/**
 * Helper functions for managing user preferences data
 * Following the Phase 1 atomic feature approach
 */

// Phase 1B: User Safety Functions
export async function getUserSafety(
  userId: string
): Promise<UserSafety | null> {
  try {
    const { data, error } = await supabase
      .from('user_safety')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No safety data found - return default
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user safety data:', error);
    return null;
  }
}

export async function updateUserSafety(
  userId: string,
  safetyData: Partial<
    Pick<
      UserSafety,
      'allergies' | 'dietary_restrictions' | 'medical_conditions'
    >
  >
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('user_safety').upsert(
      {
        user_id: userId,
        ...safetyData,
      },
      { onConflict: 'user_id' }
    );

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating user safety data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Phase 1C: Cooking Preferences Functions
export async function getCookingPreferences(
  userId: string
): Promise<CookingPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('cooking_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No cooking preferences found - return default
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching cooking preferences:', error);
    return null;
  }
}

export async function updateCookingPreferences(
  userId: string,
  preferencesData: Partial<
    Pick<
      CookingPreferences,
      | 'preferred_cuisines'
      | 'available_equipment'
      | 'disliked_ingredients'
      | 'spice_tolerance'
    >
  >
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('cooking_preferences').upsert(
      {
        user_id: userId,
        ...preferencesData,
      },
      { onConflict: 'user_id' }
    );

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating cooking preferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Combined function to get all user preference data for AI integration
export async function getAllUserPreferences(userId: string) {
  try {
    const [profile, safety, cooking] = await Promise.all([
      supabase
        .from('profiles')
        .select('region, language, units, time_per_meal, skill_level')
        .eq('id', userId)
        .single(),
      getUserSafety(userId),
      getCookingPreferences(userId),
    ]);

    return {
      profile: profile.data,
      safety,
      cooking,
    };
  } catch (error) {
    console.error('Error fetching all user preferences:', error);
    return null;
  }
}

// Validation helpers
export function validateAllergies(allergies: string[]): boolean {
  // Basic validation - ensure no empty strings
  return allergies.every((allergy) => allergy.trim().length > 0);
}

export function validateSpiceTolerance(level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= 5;
}

export function validateTimePerMeal(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= 10 && minutes <= 120;
}

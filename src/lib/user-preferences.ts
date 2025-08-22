import { supabase, type UserSafety, type CookingPreferences } from './supabase';

/**
 * Helper functions for managing user preferences data
 * Following the Phase 1 atomic feature approach
 */

// Validation constants - match database constraints

// Time per meal (minutes)
export const MIN_TIME_PER_MEAL = 10;
export const MAX_TIME_PER_MEAL = 120;

// Spice tolerance (scale 1-5)
export const MIN_SPICE_TOLERANCE = 1;
export const MAX_SPICE_TOLERANCE = 5;

/**
 * Get user safety data (allergies, dietary restrictions, medical conditions)
 */
export async function getUserSafety(
  userId: string
): Promise<UserSafety | null> {
  try {
    const { data, error } = await supabase
      .from('user_safety')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        // No safety data found - return default values
        console.log('No user safety data found for user:', userId);
        return {
          user_id: userId,
          allergies: [],
          dietary_restrictions: [],
          medical_conditions: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      // If the table doesn't exist yet (migrations not run), fail gracefully
      if (error.code === '42P01' || error.code === 'PGRST205') {
        console.warn('user_safety table does not exist yet');
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user safety data:', error);
    // Return default values instead of null to prevent infinite loops
    return {
      user_id: userId,
      allergies: [],
      dietary_restrictions: [],
      medical_conditions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
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
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (error) {
      console.error('Error updating user safety:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateUserSafety:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get cooking preferences (cuisines, equipment, ingredients, spice tolerance)
 */
export async function getCookingPreferences(
  userId: string
): Promise<CookingPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('cooking_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found - return default values
        console.log('No cooking preferences found for user:', userId);
        return {
          user_id: userId,
          preferred_cuisines: [],
          available_equipment: [],
          disliked_ingredients: [],
          spice_tolerance: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      // If the table doesn't exist yet (migrations not run), fail gracefully
      if (error.code === '42P01' || error.code === 'PGRST205') {
        console.warn('cooking_preferences table does not exist yet');
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching cooking preferences:', error);
    // Return default values instead of null to prevent infinite loops
    return {
      user_id: userId,
      preferred_cuisines: [],
      available_equipment: [],
      disliked_ingredients: [],
      spice_tolerance: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
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
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (error) {
      console.error('Error updating cooking preferences:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateCookingPreferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all user preferences in one call for efficiency
 */
export async function getAllUserPreferences(userId: string): Promise<{
  safety: UserSafety | null;
  cooking: CookingPreferences | null;
} | null> {
  try {
    const [safetyResult, cookingResult] = await Promise.allSettled([
      getUserSafety(userId),
      getCookingPreferences(userId),
    ]);

    const safety =
      safetyResult.status === 'fulfilled' ? safetyResult.value : null;
    const cooking =
      cookingResult.status === 'fulfilled' ? cookingResult.value : null;

    return { safety, cooking };
  } catch (error) {
    console.error('Error fetching all user preferences:', error);
    return null;
  }
}

// Validation functions
export function validateAllergies(allergies: string[]): boolean {
  return (
    Array.isArray(allergies) &&
    allergies.every(
      (item) => typeof item === 'string' && item.trim().length > 0
    )
  );
}

export function validateDietaryRestrictions(restrictions: string[]): boolean {
  return (
    Array.isArray(restrictions) &&
    restrictions.every(
      (item) => typeof item === 'string' && item.trim().length > 0
    )
  );
}

export function validateMedicalConditions(conditions: string[]): boolean {
  return (
    Array.isArray(conditions) &&
    conditions.every(
      (item) => typeof item === 'string' && item.trim().length > 0
    )
  );
}

export function validateCuisines(cuisines: string[]): boolean {
  return (
    Array.isArray(cuisines) &&
    cuisines.every((item) => typeof item === 'string' && item.trim().length > 0)
  );
}

export function validateEquipment(equipment: string[]): boolean {
  return (
    Array.isArray(equipment) &&
    equipment.every(
      (item) => typeof item === 'string' && item.trim().length > 0
    )
  );
}

export function validateIngredients(ingredients: string[]): boolean {
  return (
    Array.isArray(ingredients) &&
    ingredients.every(
      (item) => typeof item === 'string' && item.trim().length > 0
    )
  );
}

export function validateSpiceTolerance(level: number): boolean {
  return (
    Number.isInteger(level) &&
    level >= MIN_SPICE_TOLERANCE &&
    level <= MAX_SPICE_TOLERANCE
  );
}

export function validateTimePerMeal(minutes: number): boolean {
  return (
    Number.isInteger(minutes) &&
    minutes >= MIN_TIME_PER_MEAL &&
    minutes <= MAX_TIME_PER_MEAL
  );
}

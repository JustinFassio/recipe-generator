/**
 * Shared Types and Utilities for Seed Scripts
 * Common interfaces, constants, and helper functions
 */

// Type definitions for better maintainability and type safety
export interface SupabaseAdminUser {
  email?: string;
  id?: string;
}

export interface SeedUser {
  email: string;
  password: string;
  fullName: string;
  username: string;
  profile?: Partial<{
    bio: string;
    country: string;
    state_province: string;
    city: string;
    region: string; // Legacy field
  }>;
  safety?: Partial<{
    allergies: string[];
    dietary_restrictions: string[];
  }>;
  cooking?: Partial<{
    preferred_cuisines: string[];
    available_equipment: string[];
    disliked_ingredients: string[];
    spice_tolerance: number;
  }>;
}

export interface SeedRecipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  notes?: string;
  setup?: string[];
  image_url?: string;
  user_email: string;
  is_public: boolean;
  categories: string[];
}

// Constants
export const DEFAULT_MOOD = 'Mood: Simple';
export const MAX_CATEGORIES_PER_RECIPE = 6; // Database constraint

// Utility functions
export function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

export function logError(message: string, error?: unknown) {
  console.error(`❌ ${message}`, error || '');
}

export function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

export function logWarning(message: string) {
  console.warn(`⚠️  ${message}`);
}

/**
 * Find user by email from admin user list
 */
export function findUserByEmail(
  users: SupabaseAdminUser[],
  email: string
): SupabaseAdminUser | undefined {
  return users.find(
    (x: SupabaseAdminUser) => x.email?.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(requiredVars: string[]) {
  const missing = requiredVars.filter((varName) => !process.env[varName]);
  if (missing.length > 0) {
    logError(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

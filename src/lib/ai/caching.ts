/**
 * Data fetching and caching for AI integration
 * Phase 4: Integration with AI System
 */

import type { UserPreferencesForAI } from './userPreferencesToPrompt';

export interface CachedUserData {
  userData: UserPreferencesForAI;
  lastUpdated: number;
  cacheKey: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  allergies: string[];
  dietary_restrictions: string[];
  medical_conditions: string[];
  preferences: {
    disliked_ingredients: string[];
    preferred_cuisines: string[];
    spice_tolerance?: number;
  };
}

/**
 * Mock data for development - replace with actual API calls
 */
const mockUserData: UserPreferencesForAI = {
  profile: {
    region: 'North America',
    language: 'en',
    units: 'imperial',
    time_per_meal: 45,
    skill_level: 'intermediate',
  },
  safety: {
    allergies: ['tree nuts', 'shellfish'],
    dietary_restrictions: ['lactose intolerant'],
    medical_conditions: ['prediabetes'],
  },
  cooking: {
    preferred_cuisines: ['mediterranean', 'japanese', 'mexican'],
    available_equipment: ['oven', 'stovetop', 'blender', 'slow cooker'],
    disliked_ingredients: ['brussels sprouts', 'liver', 'blue cheese'],
    spice_tolerance: 3,
  },
};

const mockHouseholdMembers: HouseholdMember[] = [
  {
    id: '1',
    name: 'Spouse',
    allergies: ['peanuts'],
    dietary_restrictions: ['vegetarian'],
    medical_conditions: [],
    preferences: {
      disliked_ingredients: ['mushrooms', 'olives'],
      preferred_cuisines: ['italian', 'indian'],
      spice_tolerance: 4,
    },
  },
  {
    id: '2',
    name: 'Child',
    allergies: [],
    dietary_restrictions: [],
    medical_conditions: [],
    preferences: {
      disliked_ingredients: ['vegetables', 'spicy food'],
      preferred_cuisines: ['american', 'pizza'],
      spice_tolerance: 1,
    },
  },
];

/**
 * Get user data for AI integration with caching
 */
export const getUserDataForAI = async (
  userId: string
): Promise<UserPreferencesForAI> => {
  const cacheKey = `user-data-${userId}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed: CachedUserData = JSON.parse(cached);
      const cacheAge = Date.now() - parsed.lastUpdated;

      // Cache for 5 minutes
      if (cacheAge < 5 * 60 * 1000) {
        console.log('Using cached user data for AI');
        return parsed.userData;
      }
    } catch (error) {
      console.warn('Failed to parse cached user data:', error);
    }
  }

  // Fetch fresh data (mock for now)
  console.log('Fetching fresh user data for AI');
  const userData = await fetchUserData(userId);

  // Cache the data
  const cacheData: CachedUserData = {
    userData,
    lastUpdated: Date.now(),
    cacheKey,
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache user data:', error);
  }

  return userData;
};

/**
 * Get household members for AI integration
 */
export const getHouseholdMembersForAI = async (
  userId: string
): Promise<HouseholdMember[]> => {
  const cacheKey = `household-${userId}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const cacheAge = Date.now() - parsed.lastUpdated;

      // Cache for 10 minutes (household data changes less frequently)
      if (cacheAge < 10 * 60 * 1000) {
        return parsed.household;
      }
    } catch (error) {
      console.warn('Failed to parse cached household data:', error);
    }
  }

  // Fetch fresh data (mock for now)
  const household = await fetchHouseholdMembers(userId);

  // Cache the data
  const cacheData = {
    household,
    lastUpdated: Date.now(),
    cacheKey,
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache household data:', error);
  }

  return household;
};

/**
 * Mock API calls - replace with actual implementations
 */
async function fetchUserData(_userId: string): Promise<UserPreferencesForAI> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // For development, return mock data
  // In production, this would call your actual API
  return mockUserData;
}

async function fetchHouseholdMembers(_userId: string): Promise<HouseholdMember[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // For development, return mock data
  // In production, this would call your actual API
  return mockHouseholdMembers;
}

/**
 * Clear user data cache
 */
export const clearUserDataCache = (userId: string): void => {
  const cacheKey = `user-data-${userId}`;
  localStorage.removeItem(cacheKey);
  
  const householdKey = `household-${userId}`;
  localStorage.removeItem(householdKey);
  
  console.log('Cleared user data cache for:', userId);
};

/**
 * Update user data cache
 */
export const updateUserDataCache = (
  userId: string,
  userData: UserPreferencesForAI
): void => {
  const cacheKey = `user-data-${userId}`;
  const cacheData: CachedUserData = {
    userData,
    lastUpdated: Date.now(),
    cacheKey,
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('Updated user data cache for:', userId);
  } catch (error) {
    console.warn('Failed to update user data cache:', error);
  }
};

/**
 * Get comprehensive user context for AI
 */
export const getComprehensiveUserContext = async (
  userId: string
): Promise<{
  userData: UserPreferencesForAI;
  household: HouseholdMember[];
  combinedPreferences: UserPreferencesForAI;
}> => {
  const [userData, household] = await Promise.all([
    getUserDataForAI(userId),
    getHouseholdMembersForAI(userId),
  ]);

  // Combine user and household preferences for comprehensive context
  const combinedPreferences = combineUserAndHouseholdPreferences(userData, household);

  return {
    userData,
    household,
    combinedPreferences,
  };
};

/**
 * Combine user and household preferences
 */
function combineUserAndHouseholdPreferences(
  userData: UserPreferencesForAI,
  household: HouseholdMember[]
): UserPreferencesForAI {
  const combined = { ...userData };

  // Add household allergies and restrictions
  household.forEach(member => {
    combined.safety.allergies.push(...member.allergies);
    combined.safety.dietary_restrictions.push(...member.dietary_restrictions);
    combined.safety.medical_conditions.push(...member.medical_conditions);
  });

  // Remove duplicates
  combined.safety.allergies = [...new Set(combined.safety.allergies)];
  combined.safety.dietary_restrictions = [...new Set(combined.safety.dietary_restrictions)];
  combined.safety.medical_conditions = [...new Set(combined.safety.medical_conditions)];

  return combined;
}

/**
 * Check if user data is stale
 */
export const isUserDataStale = (userId: string): boolean => {
  const cacheKey = `user-data-${userId}`;
  const cached = localStorage.getItem(cacheKey);

  if (!cached) return true;

  try {
    const parsed: CachedUserData = JSON.parse(cached);
    const cacheAge = Date.now() - parsed.lastUpdated;
    return cacheAge > 5 * 60 * 1000; // 5 minutes
  } catch {
    return true;
  }
};

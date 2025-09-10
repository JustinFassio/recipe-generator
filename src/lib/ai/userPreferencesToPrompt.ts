/**
 * Convert user profile data to AI-friendly prompts
 * Phase 4: Integration with AI System
 */

export interface UserPreferencesForAI {
  // Phase 1A: Basic profile data
  profile: {
    bio?: string;
    region?: string;
    country?: string;
    state_province?: string;
    city?: string;
    language?: string;
    units?: 'metric' | 'imperial';
    time_per_meal?: number;
    skill_level?: 'beginner' | 'intermediate' | 'advanced';
  };

  // Phase 1B: Safety data
  safety: {
    allergies: string[];
    dietary_restrictions: string[];
    medical_conditions: string[];
  };

  // Phase 1C: Cooking preferences
  cooking: {
    preferred_cuisines: string[];
    available_equipment: string[];
    disliked_ingredients: string[];
    spice_tolerance?: number;
    // live-available ingredients can be injected at runtime; we keep the type here for symmetry
    available_ingredients?: string[];
  };
}

/**
 * Build user context prompt for AI agents
 */
export const buildUserContextPrompt = (
  userData: UserPreferencesForAI
): string => {
  const sections = [];

  // Safety section (highest priority)
  if (userData.safety.allergies.length > 0) {
    sections.push(
      `CRITICAL: User has allergies to: ${userData.safety.allergies.join(', ')}. NEVER include these ingredients.`
    );
  }

  if (userData.safety.dietary_restrictions.length > 0) {
    sections.push(
      `Dietary restrictions: ${userData.safety.dietary_restrictions.join(', ')}`
    );
  }

  if (userData.safety.medical_conditions.length > 0) {
    sections.push(
      `Medical conditions: ${userData.safety.medical_conditions.join(', ')}`
    );
  }

  // Basic profile preferences
  if (userData.profile.bio) {
    sections.push(`User Bio: ${userData.profile.bio}`);
  }

  if (userData.profile.time_per_meal) {
    sections.push(`Cooking time: ${userData.profile.time_per_meal} minutes`);
  }

  if (userData.profile.skill_level) {
    sections.push(`Skill level: ${userData.profile.skill_level}`);
  }

  if (userData.profile.units) {
    sections.push(`Measurement units: ${userData.profile.units}`);
  }

  if (userData.profile.region) {
    sections.push(`Region: ${userData.profile.region}`);
  }

  // Location information
  const locationParts = [];
  if (userData.profile.city) locationParts.push(userData.profile.city);
  if (userData.profile.state_province)
    locationParts.push(userData.profile.state_province);
  if (userData.profile.country) locationParts.push(userData.profile.country);

  if (locationParts.length > 0) {
    sections.push(`Location: ${locationParts.join(', ')}`);
  }

  // Cooking preferences
  if (userData.cooking.preferred_cuisines.length > 0) {
    sections.push(
      `Preferred cuisines: ${userData.cooking.preferred_cuisines.join(', ')}`
    );
  }

  if (userData.cooking.spice_tolerance) {
    sections.push(`Spice tolerance: ${userData.cooking.spice_tolerance}/5`);
  }

  if (userData.cooking.available_equipment.length > 0) {
    sections.push(
      `Available equipment: ${userData.cooking.available_equipment.join(', ')}`
    );
  }

  if (userData.cooking.disliked_ingredients.length > 0) {
    sections.push(
      `Disliked ingredients: ${userData.cooking.disliked_ingredients.join(', ')}`
    );
  }

  return sections.join('\n');
};

/**
 * Build cultural context prompt
 */
export const buildCulturalPrompt = (context: {
  preferred_cuisines: string[];
  spice_tolerance?: number;
  region?: string;
  country?: string;
  state_province?: string;
  city?: string;
}): string => {
  const sections = [];

  // Cuisine preferences
  if (context.preferred_cuisines.length > 0) {
    sections.push(
      `Preferred cuisines: ${context.preferred_cuisines.join(', ')}`
    );
    if (context.preferred_cuisines.length === 1) {
      sections.push(
        `Focus on authentic ${context.preferred_cuisines[0]} flavors and techniques`
      );
    }
  }

  // Spice level
  if (context.spice_tolerance) {
    sections.push(
      `Spice tolerance: ${context.spice_tolerance}/5 (1=mild, 5=very hot)`
    );
  }

  // Regional preferences
  if (context.region) {
    sections.push(
      `Region: ${context.region} - consider local ingredients and cooking methods`
    );
  }

  // Location-specific preferences
  const locationParts = [];
  if (context.city) locationParts.push(context.city);
  if (context.state_province) locationParts.push(context.state_province);
  if (context.country) locationParts.push(context.country);

  if (locationParts.length > 0) {
    sections.push(
      `Location: ${locationParts.join(', ')} - consider local ingredients, seasonal availability, and regional cooking traditions`
    );
  }

  return sections.join('\n');
};

/**
 * Build comprehensive AI prompt with user context
 */
export const buildRecipeGenerationPrompt = (
  userRequest: string,
  userData: UserPreferencesForAI
): string => {
  const userContext = buildUserContextPrompt(userData);
  const culturalContext = buildCulturalPrompt({
    preferred_cuisines: userData.cooking.preferred_cuisines,
    spice_tolerance: userData.cooking.spice_tolerance,
    region: userData.profile.region,
    country: userData.profile.country,
    state_province: userData.profile.state_province,
    city: userData.profile.city,
  });

  return `
You are an expert chef and nutritionist creating personalized recipes.

USER REQUEST: ${userRequest}

USER CONTEXT:
${userContext}

CULTURAL PREFERENCES:
${culturalContext}

REQUIREMENTS:
1. NEVER include ingredients from the user's allergy list
2. Respect all dietary restrictions  
3. Use available cooking equipment and respect time constraints
4. Match the user's skill level
5. Incorporate preferred cuisines and spice levels
6. Avoid disliked ingredients when possible
7. Use appropriate measurement units (metric/imperial)
8. Provide clear, step-by-step instructions
9. Include estimated cooking time
10. Suggest substitutions for any problematic ingredients

Generate a recipe that meets all these requirements while being delicious and achievable.
`;
};

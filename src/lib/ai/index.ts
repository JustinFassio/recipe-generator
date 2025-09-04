/**
 * Main AI Integration Module
 * Phase 4: Integration with AI System
 *
 * This module provides the complete integration between user account data
 * and the AI recipe generation system.
 */

// Core user preferences and prompt building
export type { UserPreferencesForAI } from './userPreferencesToPrompt';
export {
  buildUserContextPrompt,
  buildCulturalPrompt,
  buildRecipeGenerationPrompt,
} from './userPreferencesToPrompt';

// Safety guardrails and validation
export type {
  SafetyCheck,
  SafetyResult,
  RecipeSafetyResult,
} from './safetyGuardrails';
export {
  checkIngredientSafety,
  validateRecipeSafety,
  estimateRecipeTime,
  assessRecipeDifficulty,
  checkEquipmentAvailability,
  calculateCuisineMatch,
} from './safetyGuardrails';

// Recipe filtering and scoring
export type { RecipeScore } from './recipeFiltering';
export {
  scoreRecipeForUser,
  filterAndRankRecipes,
  generatePersonalizedRecommendations,
} from './recipeFiltering';

// Data fetching and caching
export type { CachedUserData, HouseholdMember } from './caching';
export {
  getUserDataForAI,
  getHouseholdMembersForAI,
  getComprehensiveUserContext,
  clearUserDataCache,
  updateUserDataCache,
  isUserDataStale,
} from './caching';

// Import functions for internal use
import type { UserPreferencesForAI } from './userPreferencesToPrompt';
import {
  buildUserContextPrompt,
  buildCulturalPrompt,
} from './userPreferencesToPrompt';
import {
  validateRecipeSafety,
  estimateRecipeTime,
  assessRecipeDifficulty,
  checkEquipmentAvailability,
} from './safetyGuardrails';

/**
 * Enhanced AI prompt builder with user context
 */
export const buildEnhancedAIPrompt = (
  basePrompt: string,
  userRequest: string,
  userData: UserPreferencesForAI
): string => {
  const userContext = buildUserContextPrompt(userData);
  const culturalContext = buildCulturalPrompt({
    preferred_cuisines: userData.cooking.preferred_cuisines,
    spice_tolerance: userData.cooking.spice_tolerance,
    region: userData.profile.region,
  });

  return `
${basePrompt}

USER REQUEST: ${userRequest}

USER CONTEXT:
${userContext}

CULTURAL PREFERENCES:
${culturalContext}

IMPORTANT REQUIREMENTS:
1. NEVER include ingredients from the user's allergy list
2. Respect all dietary restrictions  
3. Use available cooking equipment and respect time constraints
4. Match the user's skill level
5. Incorporate preferred cuisines and spice levels
6. Avoid disliked ingredients when possible
7. Use appropriate measurement units (${userData.profile.units || 'imperial'})
8. Provide clear, step-by-step instructions
9. Include estimated cooking time
10. Suggest substitutions for any problematic ingredients

Remember: Safety first, personalization second, deliciousness third.
`;
};

/**
 * Enhanced AI prompt builder with live selection overrides
 */
export const buildEnhancedAIPromptWithOverrides = (
  basePrompt: string,
  userRequest: string,
  userData: UserPreferencesForAI,
  liveSelections: {
    categories: string[];
    cuisines: string[];
    moods: string[];
  }
): string => {
  // Build base user context (safety and core preferences)
  const userContext = buildUserContextPrompt(userData);

  // Build cultural context with LIVE SELECTION OVERRIDES
  const effectiveCuisines =
    liveSelections.cuisines.length > 0
      ? liveSelections.cuisines
      : userData.cooking.preferred_cuisines;

  const culturalContext = buildCulturalPrompt({
    preferred_cuisines: effectiveCuisines,
    spice_tolerance: userData.cooking.spice_tolerance,
    region: userData.profile.region,
  });

  // Build live selection context
  let liveSelectionContext = '';
  if (
    liveSelections.categories.length > 0 ||
    liveSelections.cuisines.length > 0 ||
    liveSelections.moods.length > 0
  ) {
    liveSelectionContext =
      '\nLIVE MEAL PREFERENCES (Override account preferences):\n';

    if (liveSelections.categories.length > 0) {
      liveSelectionContext += `• **Categories:** ${liveSelections.categories.join(', ')}\n`;
    }
    if (liveSelections.cuisines.length > 0) {
      liveSelectionContext += `• **Cuisines:** ${liveSelections.cuisines.join(', ')} (Override: ${userData.cooking.preferred_cuisines.join(', ')})\n`;
    }
    if (liveSelections.moods.length > 0) {
      liveSelectionContext += `• **Moods:** ${liveSelections.moods.join(', ')}\n`;
    }

    liveSelectionContext +=
      '\n**Note:** These live selections override your account preferences for this specific meal.\n';
  }

  return `
${basePrompt}

USER REQUEST: ${userRequest}

USER CONTEXT (Account Preferences):
${userContext}

CULTURAL PREFERENCES (Live Selections Override Account):
${culturalContext}${liveSelectionContext}

IMPORTANT REQUIREMENTS:
1. NEVER include ingredients from the user's allergy list
2. Respect all dietary restrictions  
3. Use available cooking equipment and respect time constraints
4. Match the user's skill level
5. PRIORITIZE live cuisine selections over account preferences
6. Focus on selected categories and moods for this meal
7. Avoid disliked ingredients when possible
8. Use appropriate measurement units (${userData.profile.units || 'imperial'})
9. Provide clear, step-by-step instructions
10. Include estimated cooking time
11. Suggest substitutions for any problematic ingredients

Remember: Safety first, live selections second, account preferences third, deliciousness fourth.
`;
};

/**
 * Quick safety check for immediate validation
 */
export const quickSafetyCheck = (
  ingredients: string[],
  userData: UserPreferencesForAI
): {
  safe: boolean;
  blockedIngredients: string[];
  warnings: string[];
} => {
  const blockedIngredients: string[] = [];
  const warnings: string[] = [];

  ingredients.forEach((ingredient) => {
    // Check allergies (blocking)
    if (
      userData.safety.allergies.some((allergy) =>
        ingredient.toLowerCase().includes(allergy.toLowerCase())
      )
    ) {
      blockedIngredients.push(ingredient);
    }

    // Check dietary restrictions (warning)
    if (
      userData.safety.dietary_restrictions.some((restriction) =>
        ingredient.toLowerCase().includes(restriction.toLowerCase())
      )
    ) {
      warnings.push(`${ingredient} conflicts with dietary restrictions`);
    }

    // Check disliked ingredients (warning)
    if (
      userData.cooking.disliked_ingredients.some((disliked) =>
        ingredient.toLowerCase().includes(disliked.toLowerCase())
      )
    ) {
      warnings.push(`${ingredient} is on your disliked list`);
    }
  });

  return {
    safe: blockedIngredients.length === 0,
    blockedIngredients,
    warnings,
  };
};

/**
 * Generate personalized cooking tips
 */
export const generatePersonalizedCookingTips = (
  userData: UserPreferencesForAI
): string[] => {
  const tips = [];

  // Safety tips
  if (userData.safety.allergies.length > 0) {
    tips.push(
      `Always check ingredient labels for: ${userData.safety.allergies.join(', ')}`
    );
  }

  if (userData.safety.dietary_restrictions.length > 0) {
    tips.push(
      `Look for ${userData.safety.dietary_restrictions.join(', ')} alternatives`
    );
  }

  // Skill level tips
  if (userData.profile.skill_level === 'beginner') {
    tips.push('Start with simple recipes and build confidence');
    tips.push('Focus on basic cooking techniques like chopping and sautéing');
  } else if (userData.profile.skill_level === 'advanced') {
    tips.push('Experiment with complex flavor combinations');
    tips.push('Try advanced cooking techniques like sous vide or fermentation');
  }

  // Time management tips
  if (userData.profile.time_per_meal && userData.profile.time_per_meal < 30) {
    tips.push('Consider meal prep on weekends to save time during the week');
    tips.push('Look for quick-cooking ingredients like pre-cut vegetables');
  }

  // Cuisine tips
  if (userData.cooking.preferred_cuisines.length > 0) {
    tips.push(
      `Explore authentic ${userData.cooking.preferred_cuisines.join(', ')} recipes`
    );
  }

  // Equipment tips
  if (userData.cooking.available_equipment.includes('slow cooker')) {
    tips.push('Use your slow cooker for hands-off meal preparation');
  }
  if (userData.cooking.available_equipment.includes('blender')) {
    tips.push('Your blender is great for smoothies, soups, and sauces');
  }

  return tips;
};

/**
 * Validate recipe against user constraints
 */
export const validateRecipeForUser = (
  recipe: {
    title: string;
    ingredients: string[];
    instructions: string;
    notes?: string;
  },
  userData: UserPreferencesForAI
): {
  isValid: boolean;
  safetyIssues: string[];
  timeIssues: string[];
  skillIssues: string[];
  equipmentIssues: string[];
  recommendations: string[];
} => {
  const safetyResult = validateRecipeSafety(recipe, userData);
  const estimatedTime = estimateRecipeTime(recipe);
  const difficulty = assessRecipeDifficulty(recipe);
  const equipmentCheck = checkEquipmentAvailability(
    recipe,
    userData.cooking.available_equipment
  );

  const issues: {
    isValid: boolean;
    safetyIssues: string[];
    timeIssues: string[];
    skillIssues: string[];
    equipmentIssues: string[];
    recommendations: string[];
  } = {
    isValid: true,
    safetyIssues: safetyResult.warnings,
    timeIssues: [],
    skillIssues: [],
    equipmentIssues: [],
    recommendations: [],
  };

  // Time validation
  if (
    userData.profile.time_per_meal &&
    estimatedTime > userData.profile.time_per_meal
  ) {
    issues.timeIssues.push(
      `Recipe takes ${estimatedTime} minutes, but you have ${userData.profile.time_per_meal} minutes`
    );
    issues.isValid = false;
  }

  // Skill validation
  if (userData.profile.skill_level) {
    const skillLevels: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };
    const userSkill = skillLevels[userData.profile.skill_level] || 2;
    const recipeSkill = skillLevels[difficulty] || 2;

    if (recipeSkill > userSkill) {
      issues.skillIssues.push(
        `Recipe is ${difficulty} level, but you're ${userData.profile.skill_level}`
      );
      issues.isValid = false;
    }
  }

  // Equipment validation
  if (!equipmentCheck.available) {
    issues.equipmentIssues.push(
      `Missing equipment: ${equipmentCheck.missing.join(', ')}`
    );
    issues.isValid = false;
  }

  // Safety validation
  if (safetyResult.blocked) {
    issues.isValid = false;
  }

  // Generate recommendations
  if (issues.timeIssues.length > 0) {
    issues.recommendations.push(
      'Consider simpler preparation methods or meal prep'
    );
  }
  if (issues.skillIssues.length > 0) {
    issues.recommendations.push(
      'Break down complex steps or practice basic techniques first'
    );
  }
  if (issues.equipmentIssues.length > 0) {
    issues.recommendations.push(
      'Look for alternative cooking methods or consider purchasing equipment'
    );
  }
  if (issues.safetyIssues.length > 0) {
    issues.recommendations.push(
      'Review ingredients carefully and consider substitutions'
    );
  }

  return issues;
};

/**
 * Build comprehensive user context for OpenAI Assistants
 * This creates a detailed, structured context that gives the AI complete understanding
 * of the user's profile, preferences, and constraints
 */
export const buildComprehensiveUserContext = async (
  userId: string
): Promise<string> => {
  try {
    // Import the function to avoid circular dependency issues
    const { getUserDataForAI } = await import('./caching');
    const userData = await getUserDataForAI(userId);

    return `SYSTEM CONTEXT INJECTION - COMPREHENSIVE USER PROFILE FOR HEALTH ASSESSMENT

**CRITICAL SAFETY INFORMATION (ALWAYS PRIORITIZE):**
- ALLERGIES: ${userData.safety.allergies.length > 0 ? userData.safety.allergies.join(', ') : 'None reported'}
- DIETARY RESTRICTIONS: ${userData.safety.dietary_restrictions.length > 0 ? userData.safety.dietary_restrictions.join(', ') : 'None reported'}
- MEDICAL CONDITIONS: ${userData.safety.medical_conditions.length > 0 ? userData.safety.medical_conditions.join(', ') : 'None reported'}

**COOKING PROFILE & CAPABILITIES:**
- SKILL LEVEL: ${userData.profile.skill_level || 'Not specified'}
- TIME AVAILABILITY: ${userData.profile.time_per_meal || 'Not specified'} minutes per meal
- EQUIPMENT AVAILABLE: ${userData.cooking.available_equipment.join(', ')}
- SPICE TOLERANCE: ${userData.cooking.spice_tolerance || 'Not specified'}/5
- DISLIKED INGREDIENTS: ${userData.cooking.disliked_ingredients.length > 0 ? userData.cooking.disliked_ingredients.join(', ') : 'None reported'}

**CULINARY PREFERENCES & BACKGROUND:**
- PREFERRED CUISINES: ${userData.cooking.preferred_cuisines.join(', ')}
- REGION: ${userData.profile.region || 'Not specified'}
- MEASUREMENT UNITS: ${userData.profile.units || 'Not specified'}

**HEALTH ASSESSMENT INSTRUCTIONS:**
1. ALWAYS prioritize safety - NEVER suggest anything that could cause allergic reactions or medical complications
2. Use this profile data to personalize your health assessment and recommendations
3. Consider their cooking skill level when suggesting meal preparation strategies
4. Factor in their time constraints when recommending meal planning approaches
5. Incorporate their available equipment into practical meal suggestions
6. Respect their spice tolerance and cultural preferences in dietary recommendations
7. Use their preferred cuisines to suggest culturally appropriate healthy options
8. Consider their disliked ingredients when suggesting alternatives
9. Provide portion guidance appropriate for their household size
10. Offer cooking tips and meal prep strategies that match their skill level and time availability

**CONVERSATION STYLE:**
- Be warm, professional, and medically authoritative
- Acknowledge their profile data naturally in your assessment
- Provide evidence-based health recommendations
- Be systematic and thorough in your evaluation process
- Always prioritize safety and health considerations
- Offer actionable, personalized guidance

Remember: This user has chosen you as their Personalized Health Assessment & Habit Formation Expert. Use this comprehensive context to provide the most personalized, safe, and effective health evaluation possible.`;
  } catch (error) {
    console.warn('Failed to build comprehensive user context:', error);
    return 'SYSTEM CONTEXT INJECTION - UNABLE TO LOAD USER PROFILE DATA';
  }
};

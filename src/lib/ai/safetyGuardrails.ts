/**
 * Safety guardrails for recipe validation
 * Phase 4: Integration with AI System
 */

import type { UserPreferencesForAI } from './userPreferencesToPrompt';

export interface SafetyCheck {
  ingredient: string;
  userAllergies: string[];
  userDietaryRestrictions: string[];
  userDislikedIngredients: string[];
}

export interface SafetyResult {
  safe: boolean;
  blocked: boolean;
  reason?: string;
  severity: 'safe' | 'warning' | 'critical';
  warnings: string[];
}

export interface RecipeSafetyResult {
  safe: boolean;
  blocked: boolean;
  warnings: string[];
  ingredientIssues: SafetyResult[];
}

/**
 * Check if a single ingredient is safe for the user
 */
export const checkIngredientSafety = (check: SafetyCheck): SafetyResult => {
  const warnings = [];
  let blocked = false;
  let severity: 'safe' | 'warning' | 'critical' = 'safe';

  // Check allergies (blocking - critical)
  if (
    check.userAllergies.some((allergy) =>
      check.ingredient.toLowerCase().includes(allergy.toLowerCase())
    )
  ) {
    return {
      safe: false,
      blocked: true,
      reason: 'Contains user allergen',
      severity: 'critical',
      warnings: [`Contains ${check.ingredient} which you are allergic to`],
    };
  }

  // Check dietary restrictions (warning)
  if (
    check.userDietaryRestrictions.some((restriction) =>
      check.ingredient.toLowerCase().includes(restriction.toLowerCase())
    )
  ) {
    warnings.push(
      `Contains ${check.ingredient} which conflicts with dietary restrictions`
    );
    severity = 'warning';
  }

  // Check disliked ingredients (warning)
  if (
    check.userDislikedIngredients.some((disliked) =>
      check.ingredient.toLowerCase().includes(disliked.toLowerCase())
    )
  ) {
    warnings.push(`Contains ${check.ingredient} which you dislike`);
    severity = 'warning';
  }

  return {
    safe: warnings.length === 0,
    blocked,
    warnings,
    severity,
  };
};

/**
 * Validate entire recipe for safety
 */
export const validateRecipeSafety = (
  recipe: {
    title: string;
    ingredients: string[];
    instructions: string;
    notes?: string;
  },
  userData: UserPreferencesForAI
): RecipeSafetyResult => {
  const ingredientChecks = recipe.ingredients.map((ingredient) =>
    checkIngredientSafety({
      ingredient,
      userAllergies: userData.safety.allergies,
      userDietaryRestrictions: userData.safety.dietary_restrictions,
      userDislikedIngredients: userData.cooking.disliked_ingredients,
    })
  );

  const hasBlockingIssues = ingredientChecks.some((check) => check.blocked);
  const warnings = ingredientChecks.flatMap((check) => check.warnings);

  return {
    safe: !hasBlockingIssues,
    blocked: hasBlockingIssues,
    warnings,
    ingredientIssues: ingredientChecks.filter((check) => !check.safe),
  };
};

/**
 * Estimate recipe cooking time from instructions
 */
export const estimateRecipeTime = (recipe: {
  instructions: string;
  ingredients: string[];
}): number => {
  // Simple estimation based on instruction complexity
  const instructionLines = recipe.instructions.split('\n').filter(line => line.trim().length > 0);
  const baseTime = 15; // Base prep time
  const perInstruction = 5; // Time per instruction step
  
  return baseTime + (instructionLines.length * perInstruction);
};

/**
 * Assess recipe difficulty level
 */
export const assessRecipeDifficulty = (recipe: {
  instructions: string;
  ingredients: string[];
}): 'beginner' | 'intermediate' | 'advanced' => {
  const instructionLines = recipe.instructions.split('\n').filter(line => line.trim().length > 0);
  const ingredientCount = recipe.ingredients.length;
  
  // Simple difficulty assessment
  if (instructionLines.length <= 3 && ingredientCount <= 5) {
    return 'beginner';
  } else if (instructionLines.length <= 6 && ingredientCount <= 8) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
};

/**
 * Check if recipe requires equipment the user doesn't have
 */
export const checkEquipmentAvailability = (
  recipe: {
    instructions: string;
    notes?: string;
  },
  availableEquipment: string[]
): {
  available: boolean;
  missing: string[];
} => {
  const commonEquipment = [
    'oven', 'stovetop', 'microwave', 'blender', 'food processor',
    'slow cooker', 'instant pot', 'air fryer', 'grill', 'smoker'
  ];
  
  const requiredEquipment: string[] = [];
  
  // Check instructions for equipment mentions
  const lowerInstructions = recipe.instructions.toLowerCase();
  const lowerNotes = (recipe.notes || '').toLowerCase();
  const allText = `${lowerInstructions} ${lowerNotes}`;
  
  commonEquipment.forEach(equipment => {
    if (allText.includes(equipment) && !availableEquipment.some(available => 
      available.toLowerCase().includes(equipment)
    )) {
      requiredEquipment.push(equipment);
    }
  });
  
  return {
    available: requiredEquipment.length === 0,
    missing: requiredEquipment,
  };
};

/**
 * Calculate cuisine match score
 */
export const calculateCuisineMatch = (
  recipe: {
    title: string;
    notes?: string;
  },
  preferredCuisines: string[]
): number => {
  if (preferredCuisines.length === 0) return 0.5; // Neutral if no preferences
  
  const recipeText = `${recipe.title} ${recipe.notes || ''}`.toLowerCase();
  
  const matches = preferredCuisines.filter(cuisine => 
    recipeText.includes(cuisine.toLowerCase())
  );
  
  return matches.length / preferredCuisines.length;
};

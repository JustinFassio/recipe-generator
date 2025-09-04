/**
 * Recipe filtering and scoring system
 * Phase 4: Integration with AI System
 */

import type { UserPreferencesForAI } from './userPreferencesToPrompt';
import {
  validateRecipeSafety,
  estimateRecipeTime,
  assessRecipeDifficulty,
  checkEquipmentAvailability,
  calculateCuisineMatch,
} from './safetyGuardrails';

// Constants for recipe analysis
const SPICE_KEYWORDS = ['spicy', 'hot', 'chili', 'pepper', 'heat'] as const;

export interface RecipeScore {
  recipe: {
    title: string;
    ingredients: string[];
    instructions: string;
    notes?: string;
  };
  score: number;
  reasons: string[];
  safetyIssues: string[];
  recommendations: string[];
}

/**
 * Score a recipe for a specific user
 */
export const scoreRecipeForUser = (
  recipe: {
    title: string;
    ingredients: string[];
    instructions: string;
    notes?: string;
  },
  userData: UserPreferencesForAI
): RecipeScore => {
  let score = 100;
  const reasons = [];
  const safetyIssues = [];
  const recommendations = [];

  // Safety check (critical - can reduce score to 0)
  const safetyResult = validateRecipeSafety(recipe, userData);
  if (safetyResult.blocked) {
    score = 0;
    safetyIssues.push('Contains user allergens');
    reasons.push('Recipe blocked due to safety concerns');
  } else if (safetyResult.warnings.length > 0) {
    score -= 20;
    safetyIssues.push(...safetyResult.warnings);
    reasons.push('Contains ingredients that may cause issues');
  }

  // Time constraint
  if (userData.profile.time_per_meal) {
    const estimatedTime = estimateRecipeTime(recipe);
    if (estimatedTime > userData.profile.time_per_meal) {
      score -= 15;
      reasons.push(
        `Exceeds time limit (${estimatedTime} min vs ${userData.profile.time_per_meal} min)`
      );
      recommendations.push('Consider simpler preparation methods');
    } else if (estimatedTime <= userData.profile.time_per_meal * 0.7) {
      score += 5;
      reasons.push('Well within time constraints');
    }
  }

  // Skill level
  if (userData.profile.skill_level) {
    const recipeDifficulty = assessRecipeDifficulty(recipe);
    const skillLevels = { beginner: 1, intermediate: 2, advanced: 3 };
    const userSkill = skillLevels[userData.profile.skill_level];
    const recipeSkill = skillLevels[recipeDifficulty];

    if (recipeSkill > userSkill) {
      score -= 10;
      reasons.push(
        `Above skill level (${recipeDifficulty} vs ${userData.profile.skill_level})`
      );
      recommendations.push('Consider breaking down into simpler steps');
    } else if (recipeSkill < userSkill) {
      score += 5;
      reasons.push('Appropriate for skill level');
    }
  }

  // Cuisine preference
  if (userData.cooking.preferred_cuisines.length > 0) {
    const cuisineMatch = calculateCuisineMatch(
      recipe,
      userData.cooking.preferred_cuisines
    );
    if (cuisineMatch < 0.5) {
      score -= 10;
      reasons.push('Not preferred cuisine');
      recommendations.push('Consider adapting to preferred cuisines');
    } else if (cuisineMatch > 0.8) {
      score += 10;
      reasons.push('Excellent cuisine match');
    }
  }

  // Equipment availability
  if (userData.cooking.available_equipment.length > 0) {
    const equipmentMatch = checkEquipmentAvailability(
      recipe,
      userData.cooking.available_equipment
    );
    if (!equipmentMatch.available) {
      score -= 15;
      reasons.push(
        `Requires missing equipment: ${equipmentMatch.missing.join(', ')}`
      );
      recommendations.push('Consider alternative cooking methods');
    } else {
      score += 5;
      reasons.push('Uses available equipment');
    }
  }

  // Spice tolerance
  if (userData.cooking.spice_tolerance && recipe.notes) {
    const hasSpice = SPICE_KEYWORDS.some((keyword) =>
      recipe.notes!.toLowerCase().includes(keyword)
    );

    if (hasSpice && userData.cooking.spice_tolerance < 3) {
      score -= 8;
      reasons.push('May be too spicy for your tolerance');
      recommendations.push('Reduce spice amounts or use milder alternatives');
    }
  }

  // Ingredient preferences
  if (userData.cooking.disliked_ingredients.length > 0) {
    const dislikedCount = userData.cooking.disliked_ingredients.filter(
      (disliked) =>
        recipe.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(disliked.toLowerCase())
        )
    ).length;

    if (dislikedCount > 0) {
      score -= dislikedCount * 5;
      reasons.push(`Contains ${dislikedCount} disliked ingredients`);
      recommendations.push('Consider ingredient substitutions');
    }
  }

  // Measurement units
  if (userData.profile.units && recipe.notes) {
    const hasMetric = /\d+\s*(g|kg|ml|l|cm)/i.test(recipe.notes);
    const hasImperial = /\d+\s*(oz|lb|cup|tbsp|tsp|inch)/i.test(recipe.notes);

    if (userData.profile.units === 'metric' && hasImperial && !hasMetric) {
      score -= 5;
      reasons.push('Uses imperial measurements');
      recommendations.push('Convert to metric units');
    } else if (
      userData.profile.units === 'imperial' &&
      hasMetric &&
      !hasImperial
    ) {
      score -= 5;
      reasons.push('Uses metric measurements');
      recommendations.push('Convert to imperial units');
    }
  }

  return {
    recipe,
    score: Math.max(0, score),
    reasons,
    safetyIssues,
    recommendations,
  };
};

/**
 * Filter and rank multiple recipes for a user
 */
export const filterAndRankRecipes = (
  recipes: Array<{
    title: string;
    ingredients: string[];
    instructions: string;
    notes?: string;
  }>,
  userData: UserPreferencesForAI,
  options: {
    minScore?: number;
    maxResults?: number;
    includeBlocked?: boolean;
  } = {}
): RecipeScore[] => {
  const { minScore = 50, maxResults = 10, includeBlocked = false } = options;

  // Score all recipes
  const scoredRecipes = recipes.map((recipe) =>
    scoreRecipeForUser(recipe, userData)
  );

  // Filter based on criteria
  let filteredRecipes = scoredRecipes;

  if (!includeBlocked) {
    filteredRecipes = filteredRecipes.filter((recipe) => recipe.score > 0);
  }

  if (minScore > 0) {
    filteredRecipes = filteredRecipes.filter(
      (recipe) => recipe.score >= minScore
    );
  }

  // Sort by score (highest first)
  const sortedRecipes = filteredRecipes.sort((a, b) => b.score - a.score);

  // Limit results
  return sortedRecipes.slice(0, maxResults);
};

/**
 * Generate personalized recipe recommendations
 */
export const generatePersonalizedRecommendations = (
  userData: UserPreferencesForAI
): string[] => {
  const recommendations = [];

  // Safety recommendations
  if (userData.safety.allergies.length > 0) {
    recommendations.push(
      `Always check ingredient labels for: ${userData.safety.allergies.join(', ')}`
    );
  }

  if (userData.safety.dietary_restrictions.length > 0) {
    recommendations.push(
      `Look for ${userData.safety.dietary_restrictions.join(', ')} alternatives`
    );
  }

  // Skill level recommendations
  if (userData.profile.skill_level === 'beginner') {
    recommendations.push('Start with simple recipes and build confidence');
    recommendations.push('Focus on basic cooking techniques');
  } else if (userData.profile.skill_level === 'advanced') {
    recommendations.push('Experiment with complex flavor combinations');
    recommendations.push('Try advanced cooking techniques');
  }

  // Time management recommendations
  if (userData.profile.time_per_meal && userData.profile.time_per_meal < 30) {
    recommendations.push('Consider meal prep on weekends');
    recommendations.push('Look for quick-cooking ingredients');
  }

  // Cuisine recommendations
  if (userData.cooking.preferred_cuisines.length > 0) {
    recommendations.push(
      `Explore authentic ${userData.cooking.preferred_cuisines.join(', ')} recipes`
    );
  }

  return recommendations;
};

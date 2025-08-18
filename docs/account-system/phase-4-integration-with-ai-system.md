# Phase 4: Integration with AI System

## Overview

**Feature-First Integration**: Integrate the revised Phase 1 user profile data with the AI recipe generation system to provide personalized, safe, and culturally appropriate recipe recommendations. Build atomic integration components that align with the simplified database schema while maintaining safety-first filtering and intelligent personalization.

## Design Principles

1. **Safety-First Filtering**: Allergies and health restrictions are non-negotiable
2. **Intelligent Personalization**: Use all available data to enhance recipe relevance
3. **Cultural Sensitivity**: Respect dietary and cultural preferences
4. **Household Awareness**: Consider all family members' needs
5. **Performance Optimization**: Efficient data processing and caching

## Data Utilization Strategy

### 1. Simplified User Preference Integration (Aligned with Phase 1)

```typescript
// src/lib/ai/userPreferencesToPrompt.ts
interface UserPreferencesForAI {
  // Phase 1A: Basic profile data
  profile: {
    region?: string;
    language?: string;
    units?: 'metric' | 'imperial';
    time_per_meal?: number;
    skill_level?: 'beginner' | 'intermediate' | 'advanced';
  };

  // Phase 1B: Safety data
  safety: {
    allergies: string[];
    dietary_restrictions: string[];
  };

  // Phase 1C: Cooking preferences
  cooking: {
    preferred_cuisines: string[];
    available_equipment: string[];
    disliked_ingredients: string[];
    spice_tolerance?: number;
  };
}

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

  // Basic profile preferences
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
```

### 2. Safety Guardrails Implementation

```typescript
// src/lib/ai/safetyGuardrails.ts
interface SafetyCheck {
  ingredient: string;
  userAllergies: string[];
  userDietaryRestrictions: string[];
  userDislikedIngredients: string[];
}

export const checkIngredientSafety = (check: SafetyCheck): SafetyResult => {
  const warnings = [];
  const blocked = false;

  // Check allergies (blocking)
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
  }

  // Check disliked ingredients (warning)
  if (
    check.userDislikedIngredients.some((disliked) =>
      check.ingredient.toLowerCase().includes(disliked.toLowerCase())
    )
  ) {
    warnings.push(`Contains ${check.ingredient} which you dislike`);
  }

  return {
    safe: warnings.length === 0,
    blocked,
    warnings,
    severity: warnings.length > 0 ? 'warning' : 'safe',
  };
};

export const validateRecipeSafety = (
  recipe: Recipe,
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
```

### 3. Cultural Integration (Simplified)

```typescript
// src/lib/ai/culturalIntegration.ts
interface CulturalContext {
  preferred_cuisines: string[];
  spice_tolerance?: number;
  region?: string;
}

export const buildCulturalPrompt = (context: CulturalContext): string => {
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

  return sections.join('\n');
};
```

## AI Prompt Engineering

### 1. Enhanced Recipe Generation Prompts

```typescript
// src/lib/ai/enhancedPrompts.ts
export const buildRecipeGenerationPrompt = (
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
```

### 2. Recipe Filtering and Ranking

```typescript
// src/lib/ai/recipeFiltering.ts
interface RecipeScore {
  recipe: Recipe;
  score: number;
  reasons: string[];
  safetyIssues: string[];
}

export const scoreRecipeForUser = (
  recipe: Recipe,
  userData: UserPreferencesForAI
): RecipeScore => {
  let score = 100;
  const reasons = [];
  const safetyIssues = [];

  // Safety check (critical - can reduce score to 0)
  const safetyResult = validateRecipeSafety(recipe, userData);
  if (safetyResult.blocked) {
    score = 0;
    safetyIssues.push('Contains user allergens');
  } else if (safetyResult.warnings.length > 0) {
    score -= 20;
    safetyIssues.push(...safetyResult.warnings);
  }

  // Time constraint
  const estimatedTime = estimateRecipeTime(recipe);
  if (
    userData.profile.time_per_meal &&
    estimatedTime > userData.profile.time_per_meal
  ) {
    score -= 15;
    reasons.push('Exceeds time limit');
  }

  // Skill level
  const recipeDifficulty = assessRecipeDifficulty(recipe);
  if (
    userData.profile.skill_level &&
    recipeDifficulty > userData.profile.skill_level
  ) {
    score -= 10;
    reasons.push('Above skill level');
  }

  // Cuisine preference
  const cuisineMatch = calculateCuisineMatch(
    recipe,
    userData.cooking.preferred_cuisines
  );
  if (cuisineMatch < 0.5) {
    score -= 10;
    reasons.push('Not preferred cuisine');
  }

  // Equipment availability
  const equipmentMatch = checkEquipmentAvailability(
    recipe,
    userData.cooking.available_equipment
  );
  if (!equipmentMatch.available) {
    score -= 15;
    reasons.push(`Requires ${equipmentMatch.missing.join(', ')}`);
  }

  return {
    recipe,
    score: Math.max(0, score),
    reasons,
    safetyIssues,
  };
};
```

## Integration Points

### 1. Chat Interface Integration

```typescript
// src/components/chat/ChatInterface.tsx
const ChatInterface: React.FC = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = async (content: string) => {
    // Get comprehensive user data
    const userData = await getUserDataForAI(user.id);

    // Build enhanced prompt
    const prompt = buildRecipeGenerationPrompt(content, userData);

    // Send to AI with user context
    const response = await sendToAI(prompt, {
      userContext: userData,
      safetyChecks: true
    });

    // Validate response safety
    const safetyResult = validateRecipeSafety(response.recipe, userData);
    if (safetyResult.blocked) {
      // Handle safety violation
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I cannot recommend this recipe due to safety concerns. Let me suggest an alternative.',
        recipe: null,
        safetyIssues: safetyResult.warnings
      }]);
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.content,
        recipe: response.recipe,
        safetyIssues: safetyResult.warnings
      }]);
    }
  };

  return (
    <div className="chat-interface">
      <ChatMessages messages={messages} />
      <ChatInput onSend={sendMessage} />
    </div>
  );
};
```

### 2. Recipe Display with Safety Warnings

```typescript
// src/components/recipes/RecipeDisplay.tsx
interface RecipeDisplayProps {
  recipe: Recipe;
  userData: UserPreferencesForAI;
}

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe, userData }) => {
  const safetyResult = validateRecipeSafety(recipe, userData);

  return (
    <div className="recipe-display">
      {/* Safety Warnings */}
      {safetyResult.blocked && (
        <div className="safety-warning critical">
          <AlertTriangle className="w-4 h-4" />
          <span>This recipe contains ingredients you're allergic to</span>
        </div>
      )}

      {safetyResult.warnings.length > 0 && (
        <div className="safety-warning">
          <AlertCircle className="w-4 h-4" />
          <span>Considerations: {safetyResult.warnings.join(', ')}</span>
        </div>
      )}



      {/* Recipe Content */}
      <RecipeContent recipe={recipe} />

      {/* Substitution Suggestions */}
      <SubstitutionSuggestions
        recipe={recipe}
        userData={userData}
        safetyIssues={safetyResult.warnings}
      />
    </div>
  );
};
```

## Performance Optimization

### 1. Data Caching Strategy

```typescript
// src/lib/ai/caching.ts
interface CachedUserData {
  userData: UserPreferencesForAI;
  household: HouseholdMember[];
  lastUpdated: number;
  cacheKey: string;
}

export const getUserDataForAI = async (
  userId: string
): Promise<UserPreferencesForAI> => {
  const cacheKey = `user-data-${userId}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    const parsed: CachedUserData = JSON.parse(cached);
    const cacheAge = Date.now() - parsed.lastUpdated;

    // Cache for 5 minutes
    if (cacheAge < 5 * 60 * 1000) {
      return parsed.userData;
    }
  }

  // Fetch fresh data
  const userData = await fetchUserData(userId);
  const household = await fetchHouseholdMembers(userId);

  // Cache the data
  const cacheData: CachedUserData = {
    userData,
    household,
    lastUpdated: Date.now(),
    cacheKey,
  };

  localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  return userData;
};
```

### 2. Batch Processing for Recipe Validation

```typescript
// src/lib/ai/batchProcessing.ts
export const validateMultipleRecipes = async (
  recipes: Recipe[],
  userData: UserPreferencesForAI
): Promise<RecipeScore[]> => {
  // Process in batches for performance
  const batchSize = 10;
  const results: RecipeScore[] = [];

  for (let i = 0; i < recipes.length; i += batchSize) {
    const batch = recipes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((recipe) => scoreRecipeForUser(recipe, userData))
    );
    results.push(...batchResults);
  }

  return results.sort((a, b) => b.score - a.score);
};
```

## Implementation Timeline

### Week 1: Core Integration

- User data to prompt conversion
- Basic safety validation
- Recipe filtering system

### Week 2: Advanced Features

- Household member constraints
- Cultural integration
- Traditional medicine support

### Week 3: UI Integration

- Safety warnings in recipe display
- Chat interface integration
- Substitution suggestions

### Week 4: Optimization

- Performance optimization
- Caching implementation
- Error handling and fallbacks

## Success Metrics

### Safety Metrics

- Zero allergy incidents
- Safety warning accuracy
- User safety satisfaction

### Personalization Metrics

- Recipe relevance scores
- User preference satisfaction
- Cultural accuracy ratings

### Performance Metrics

- AI response time
- Data processing efficiency
- Cache hit rates

### User Engagement

- Recipe completion rates
- User feedback scores
- Return usage patterns

This integration ensures that the AI system leverages all available user data to provide safe, personalized, and culturally appropriate recipe recommendations while maintaining high performance and user satisfaction.

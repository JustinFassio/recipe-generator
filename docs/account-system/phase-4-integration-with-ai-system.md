# Phase 4: Integration with AI System

## Overview

Integrate the comprehensive user profile data with the AI recipe generation system to provide personalized, safe, and culturally appropriate recipe recommendations. Focus on safety-first filtering, intelligent personalization, and seamless data flow between user preferences and AI prompts.

## Design Principles

1. **Safety-First Filtering**: Allergies and health restrictions are non-negotiable
2. **Intelligent Personalization**: Use all available data to enhance recipe relevance
3. **Cultural Sensitivity**: Respect dietary and cultural preferences
4. **Household Awareness**: Consider all family members' needs
5. **Performance Optimization**: Efficient data processing and caching

## Data Utilization Strategy

### 1. User Preference Integration

```typescript
// src/lib/ai/userPreferencesToPrompt.ts
interface UserPreferencesForAI {
  safety: {
    allergies: string[];
    intolerances: string[];
    dietary_pattern: string[];
  };
  preferences: {
    time_per_meal: string;
    skill_level: string;
    budget: string;
    cuisines: string[];
    spice_level: number;
    equipment: string[];
  };
  health: {
    health_concerns: string[];
    medications: string[];
    sodium_limit_mg?: number;
    protein_g_per_kg?: number;
    fiber_g_per_day?: number;
  };
  household: {
    members: HouseholdMember[];
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

  if (userData.safety.intolerances.length > 0) {
    sections.push(
      `User has intolerances to: ${userData.safety.intolerances.join(', ')}. Avoid these ingredients.`
    );
  }

  if (userData.safety.dietary_pattern.length > 0) {
    sections.push(
      `Dietary pattern: ${userData.safety.dietary_pattern.join(', ')}`
    );
  }

  // Health considerations
  if (userData.health.health_concerns.length > 0) {
    sections.push(
      `Health considerations: ${userData.health.health_concerns.join(', ')}`
    );
  }

  if (userData.health.sodium_limit_mg) {
    sections.push(`Sodium limit: ${userData.health.sodium_limit_mg}mg per day`);
  }

  // Preferences
  sections.push(`Cooking time: ${userData.preferences.time_per_meal} minutes`);
  sections.push(`Skill level: ${userData.preferences.skill_level}`);
  sections.push(
    `Preferred cuisines: ${userData.preferences.cuisines.join(', ')}`
  );
  sections.push(`Spice tolerance: ${userData.preferences.spice_level}/5`);

  // Equipment
  if (userData.preferences.equipment.length > 0) {
    sections.push(
      `Available equipment: ${userData.preferences.equipment.join(', ')}`
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
  userIntolerances: string[];
  healthConcerns: string[];
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

  // Check intolerances (warning)
  if (
    check.userIntolerances.some((intolerance) =>
      check.ingredient.toLowerCase().includes(intolerance.toLowerCase())
    )
  ) {
    warnings.push(`Contains ${check.ingredient} which may cause intolerance`);
  }

  // Check health concerns
  if (
    check.healthConcerns.includes('diabetes') &&
    check.ingredient.toLowerCase().includes('sugar')
  ) {
    warnings.push('High sugar content - consider diabetes management');
  }

  if (
    check.healthConcerns.includes('hypertension') &&
    check.ingredient.toLowerCase().includes('salt')
  ) {
    warnings.push('High sodium content - consider blood pressure management');
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
      userIntolerances: userData.safety.intolerances,
      healthConcerns: userData.health.health_concerns,
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

### 3. Household Member Constraints

```typescript
// src/lib/ai/householdConstraints.ts
interface HouseholdConstraint {
  member: HouseholdMember;
  restrictions: {
    allergies: string[];
    intolerances: string[];
    dietary_pattern: string[];
    age_band: string;
  };
}

export const buildHouseholdContext = (household: HouseholdMember[]): string => {
  if (household.length === 0) return '';

  const constraints = household.map((member) => {
    const restrictions = member.restrictions;
    const parts = [];

    if (restrictions.allergies?.length > 0) {
      parts.push(`allergies: ${restrictions.allergies.join(', ')}`);
    }

    if (restrictions.dietary_pattern?.length > 0) {
      parts.push(`diet: ${restrictions.dietary_pattern.join(', ')}`);
    }

    if (restrictions.age_band === 'child') {
      parts.push('child-friendly (no alcohol, mild spices, safe portions)');
    }

    return `${member.nickname} (${restrictions.age_band}): ${parts.join(', ')}`;
  });

  return `Household members:\n${constraints.join('\n')}`;
};

export const validateRecipeForHousehold = (
  recipe: Recipe,
  household: HouseholdMember[]
): HouseholdValidationResult => {
  const memberResults = household.map((member) => {
    const memberConstraints = {
      allergies: member.restrictions.allergies || [],
      intolerances: member.restrictions.intolerances || [],
      dietary_pattern: member.restrictions.dietary_pattern || [],
      age_band: member.restrictions.age_band,
    };

    const safetyCheck = validateRecipeSafety(recipe, {
      safety: memberConstraints,
      preferences: {},
      health: {},
      household: [],
    });

    return {
      member: member.nickname,
      canEat: safetyCheck.safe,
      issues: safetyCheck.warnings,
      ageAppropriate: isRecipeAgeAppropriate(
        recipe,
        member.restrictions.age_band
      ),
    };
  });

  return {
    allMembersCanEat: memberResults.every((result) => result.canEat),
    memberResults,
    recommendations: generateHouseholdRecommendations(memberResults),
  };
};
```

### 4. Cultural and Traditional Medicine Integration

```typescript
// src/lib/ai/culturalIntegration.ts
interface CulturalContext {
  cuisines: string[];
  spice_level: number;
  traditional_medicine?: {
    ayurveda_doshas?: string[];
    tcm_opt_in?: boolean;
  };
}

export const buildCulturalPrompt = (context: CulturalContext): string => {
  const sections = [];

  // Cuisine preferences
  if (context.cuisines.length > 0) {
    sections.push(`Preferred cuisines: ${context.cuisines.join(', ')}`);
    sections.push(
      `Focus on authentic ${context.cuisines[0]} flavors and techniques`
    );
  }

  // Spice level
  sections.push(
    `Spice tolerance: ${context.spice_level}/5 (1=mild, 5=very hot)`
  );

  // Traditional medicine considerations
  if (context.traditional_medicine?.ayurveda_doshas?.length > 0) {
    const doshas = context.traditional_medicine.ayurveda_doshas;
    sections.push(
      `Ayurvedic considerations: Balance for ${doshas.join(', ')} dosha(s)`
    );

    // Add dosha-specific guidance
    if (doshas.includes('vata')) {
      sections.push(
        'Vata balancing: Warm, moist, grounding foods; avoid cold, dry, light foods'
      );
    }
    if (doshas.includes('pitta')) {
      sections.push(
        'Pitta balancing: Cooling, sweet, bitter foods; avoid hot, spicy, sour foods'
      );
    }
    if (doshas.includes('kapha')) {
      sections.push(
        'Kapha balancing: Light, dry, warm foods; avoid heavy, oily, cold foods'
      );
    }
  }

  if (context.traditional_medicine?.tcm_opt_in) {
    sections.push(
      'TCM considerations: Balance warming/cooling energetics, support Spleen-Qi'
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
  userData: UserPreferencesForAI,
  household: HouseholdMember[]
): string => {
  const userContext = buildUserContextPrompt(userData);
  const householdContext = buildHouseholdContext(household);
  const culturalContext = buildCulturalPrompt({
    cuisines: userData.preferences.cuisines,
    spice_level: userData.preferences.spice_level,
    traditional_medicine: userData.preferences.traditional_medicine,
  });

  return `
You are an expert chef and nutritionist creating personalized recipes.

USER REQUEST: ${userRequest}

USER CONTEXT:
${userContext}

HOUSEHOLD CONTEXT:
${householdContext}

CULTURAL PREFERENCES:
${culturalContext}

REQUIREMENTS:
1. NEVER include ingredients from the user's allergy list
2. Respect all dietary restrictions and health concerns
3. Ensure the recipe is appropriate for all household members
4. Use available cooking equipment and respect time constraints
5. Stay within budget considerations
6. Incorporate preferred cuisines and spice levels
7. Consider traditional medicine principles if requested
8. Provide clear, step-by-step instructions
9. Include nutritional information
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
  userData: UserPreferencesForAI,
  household: HouseholdMember[]
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
  const userTimeLimit = parseTimeConstraint(userData.preferences.time_per_meal);
  if (estimatedTime > userTimeLimit) {
    score -= 15;
    reasons.push('Exceeds time limit');
  }

  // Skill level
  const recipeDifficulty = assessRecipeDifficulty(recipe);
  if (recipeDifficulty > userData.preferences.skill_level) {
    score -= 10;
    reasons.push('Above skill level');
  }

  // Cuisine preference
  const cuisineMatch = calculateCuisineMatch(
    recipe,
    userData.preferences.cuisines
  );
  if (cuisineMatch < 0.5) {
    score -= 10;
    reasons.push('Not preferred cuisine');
  }

  // Equipment availability
  const equipmentMatch = checkEquipmentAvailability(
    recipe,
    userData.preferences.equipment
  );
  if (!equipmentMatch.available) {
    score -= 15;
    reasons.push(`Requires ${equipmentMatch.missing.join(', ')}`);
  }

  // Household compatibility
  const householdResult = validateRecipeForHousehold(recipe, household);
  if (!householdResult.allMembersCanEat) {
    score -= 25;
    reasons.push('Not suitable for all household members');
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
    const household = await getHouseholdMembers(user.id);

    // Build enhanced prompt
    const prompt = buildRecipeGenerationPrompt(content, userData, household);

    // Send to AI with user context
    const response = await sendToAI(prompt, {
      userContext: userData,
      household,
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
  household: HouseholdMember[];
}

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe, userData, household }) => {
  const safetyResult = validateRecipeSafety(recipe, userData);
  const householdResult = validateRecipeForHousehold(recipe, household);

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

      {/* Household Compatibility */}
      {!householdResult.allMembersCanEat && (
        <div className="household-warning">
          <Users className="w-4 h-4" />
          <span>Not suitable for all household members</span>
          <ul>
            {householdResult.memberResults
              .filter(result => !result.canEat)
              .map(result => (
                <li key={result.member}>
                  {result.member}: {result.issues.join(', ')}
                </li>
              ))}
          </ul>
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

### 2. Batch Processing for Household Validation

```typescript
// src/lib/ai/batchProcessing.ts
export const validateMultipleRecipes = async (
  recipes: Recipe[],
  userData: UserPreferencesForAI,
  household: HouseholdMember[]
): Promise<RecipeScore[]> => {
  // Process in batches for performance
  const batchSize = 10;
  const results: RecipeScore[] = [];

  for (let i = 0; i < recipes.length; i += batchSize) {
    const batch = recipes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((recipe) => scoreRecipeForUser(recipe, userData, household))
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

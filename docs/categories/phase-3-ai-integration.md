# Phase 3: AI Integration

**AI persona updates and structured recipe generation with categories**

---

## 🎯 **Phase Objectives**

Integrate category generation into the AI system by updating persona configurations, structured recipe generation, and ensuring consistent category suggestions across all AI assistants.

## 📋 **Deliverables**

- [x] Persona system prompt updates
- [x] Structured recipe generation enhancements
- [x] Category suggestion logic
- [x] AI response validation
- [x] Integration testing

## 🤖 **AI Persona Updates**

### **1. Enhanced Persona Configurations**

**File**: `src/lib/openai.ts` (updates to existing `RECIPE_BOT_PERSONAS`)

```typescript
// Enhanced category instruction for all personas
const CATEGORY_INSTRUCTION = `
When providing recipes, include relevant categories using this format:
"categories": ["Namespace: Value", "Namespace: Value"]

Use these namespaces when appropriate:
- Course: Appetizer, Main, Side, Dessert, Breakfast, Brunch, Snack
- Dish Type: Soup, Salad, Sandwich, Curry, Stir-Fry, Stew, Pasta, Bowl, Casserole
- Component: Sauce, Dressing, Marinade, Spice Blend, Rub, Stock/Broth
- Technique: Bake, Roast, Grill, Sauté, Steam, Air Fryer, Instant Pot, No-Cook
- Collection: Anti-Inflammatory, Low-FODMAP, High-Protein, Gluten-Free, Kid-Friendly
- Cuisine: Italian, Mexican, Indian, Thai, Japanese, Mediterranean, etc.
- Beverage: Cocktail, Mocktail, Smoothie, Juice, Tea, Coffee
- Occasion: Weeknight, Meal Prep, Holiday, Party, Picnic

Examples: ["Course: Main", "Cuisine: Italian", "Technique: Bake", "Collection: High-Protein"]
`;

export const RECIPE_BOT_PERSONAS: Record<string, PersonaConfig> = {
  chef: {
    name: 'Chef Marco',
    systemPrompt: `You are Chef Marco, an experienced Italian chef with 20+ years of culinary expertise. You're passionate about traditional Italian cooking techniques, fresh ingredients, and teaching others the art of Italian cuisine.

Your personality:
- Warm, enthusiastic, and encouraging
- Loves sharing cooking tips and techniques
- Emphasizes fresh ingredients and traditional methods
- Speaks with culinary authority but remains approachable
- Uses Italian cooking terms and explains them

Your role:
- Help users create delicious recipes step by step
- Ask thoughtful questions about preferences and skill level
- Provide cooking tips and technique explanations
- Suggest ingredient substitutions and variations
- Guide users through the entire recipe creation process

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step-by-step cooking instructions",
  "notes": "Tips, variations, and additional notes",
  "categories": ["Course: Main", "Cuisine: Italian"]
}

${CATEGORY_INSTRUCTION}

Focus on Italian cuisine categories like "Cuisine: Italian", classic courses, and traditional techniques like "Technique: Sauté" or "Technique: Roast".`,
  },

  nutritionist: {
    name: 'Dr. Sarah',
    systemPrompt: `You are Dr. Sarah, a registered dietitian and nutrition expert. You focus on healthy, balanced meals that are both nutritious and delicious.

Your personality:
- Knowledgeable about nutrition and health
- Encouraging and supportive of healthy eating
- Practical and realistic about cooking time and ingredients
- Explains the nutritional benefits of ingredients
- Suggests healthy alternatives and substitutions

Your role:
- Help users create nutritious, balanced recipes
- Consider dietary restrictions and health goals
- Explain nutritional benefits of ingredients
- Suggest healthy cooking methods
- Provide portion and serving size guidance

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step-by-step cooking instructions",
  "notes": "Nutritional info, tips, and healthy variations",
  "categories": ["Collection: Anti-Inflammatory", "Technique: Steam"]
}

${CATEGORY_INSTRUCTION}

Emphasize health-focused categories like "Collection: Anti-Inflammatory", "Collection: High-Protein", "Collection: Low-FODMAP", and healthy techniques like "Technique: Steam" or "Technique: No-Cook".`,
  },

  homeCook: {
    name: 'Aunt Jenny',
    systemPrompt: `You are Aunt Jenny, a beloved home cook who has been cooking for family and friends for decades. You specialize in comfort food and family-friendly recipes.

Your personality:
- Warm, nurturing, and family-oriented
- Loves sharing family recipes and traditions
- Practical about time and budget constraints
- Encouraging for cooks of all skill levels
- Uses simple, accessible ingredients

Your role:
- Help users create comforting, family-friendly recipes
- Focus on practical cooking for busy families
- Suggest budget-friendly ingredient options
- Share cooking tips learned from experience
- Emphasize the joy of cooking and sharing meals

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step-by-step cooking instructions",
  "notes": "Family tips, variations, and serving suggestions",
  "categories": ["Collection: Kid-Friendly", "Occasion: Weeknight"]
}

${CATEGORY_INSTRUCTION}

Focus on family-oriented categories like "Collection: Kid-Friendly", "Occasion: Weeknight", "Occasion: Meal Prep", and comfort food dishes.`,
  },

  assistantNutritionist: {
    name: 'Dr. Sage Vitalis',
    assistantId: 'asst_o3VGUZBpdYTdKEyKYoKua8ys',
    isAssistantPowered: true,
    systemPrompt: `You are Dr. Sage Vitalis, an advanced AI nutritionist with deep expertise in personalized nutrition, metabolic health, and evidence-based dietary interventions.

Your capabilities:
- Personalized meal planning based on individual health profiles
- Advanced nutritional analysis and optimization
- Integration of latest nutritional research
- Consideration of genetic factors, lifestyle, and health conditions

Your personality:
- Scientifically rigorous yet approachable
- Focuses on sustainable, evidence-based recommendations
- Considers individual bio-individuality
- Emphasizes long-term health optimization

Your role:
- Help users create optimized, personalized recipes
- Provide detailed nutritional analysis and recommendations
- Consider individual health goals and dietary restrictions
- Suggest evidence-based ingredient modifications
- Guide users through personalized nutrition strategies

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step-by-step cooking instructions",
  "notes": "Detailed nutritional analysis and health benefits",
  "categories": ["Collection: Anti-Inflammatory", "Collection: High-Protein"]
}

${CATEGORY_INSTRUCTION}

Emphasize science-based categories like "Collection: Anti-Inflammatory", "Collection: Low-FODMAP", "Collection: High-Protein", and evidence-based techniques.`,
    description:
      'AI-powered nutritionist with access to comprehensive dietary databases and personalized nutrition algorithms. Provides advanced nutritional analysis and evidence-based recommendations.',
  },
};
```

### **2. Enhanced Structured Recipe Generation**

**File**: `src/lib/openai.ts` (update to existing `generateStructuredRecipe` method)

```typescript
/**
 * Generate structured recipe with enhanced category support
 */
async generateStructuredRecipe(
  messages: Message[],
  persona: PersonaType
): Promise<ChatResponse> {
  const personaConfig = RECIPE_BOT_PERSONAS[persona];

  // Limit conversation history
  const recentMessages = messages.slice(-this.maxConversationTurns);

  const openAIMessages = [
    {
      role: 'system' as const,
      content: personaConfig.systemPrompt +
        '\n\nPlease respond with a valid JSON object containing the complete recipe in this exact format: ' +
        '{"title": "Recipe Name", "ingredients": ["ingredient 1", "ingredient 2"], "instructions": "Step-by-step instructions", "notes": "Additional notes", "categories": ["Namespace: Value", "Namespace: Value"]}' +
        '\n\nInclude 2-4 relevant categories using the namespaces provided in your instructions.',
    },
    ...recentMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: 'Please create a complete, structured recipe with appropriate categories based on our conversation.',
    },
  ];

  try {
    const response = await this.requestWithRetry(
      `${this.baseURL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: openAIMessages,
          temperature: 0.7,
          max_tokens: 1200, // Increased for categories
          response_format: { type: 'json_object' },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment and try again.'
        );
      }
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from OpenAI API');
    }

    try {
      const parsed = JSON.parse(assistantMessage);

      // Validate required fields
      if (parsed.title && parsed.ingredients && parsed.instructions) {
        // Process categories using our parsing infrastructure
        const { normalizeCategories } = await import('./category-parsing');
        const normalizedCategories = normalizeCategories(parsed.categories || []);

        return {
          message: `Perfect! I've created a complete recipe with categories for you:`,
          recipe: {
            title: parsed.title,
            ingredients: Array.isArray(parsed.ingredients)
              ? parsed.ingredients
              : [],
            instructions: parsed.instructions,
            notes: parsed.notes || '',
            categories: normalizedCategories
          },
        };
      }
    } catch (parseError) {
      console.error('JSON parsing failed in structured generation:', parseError);
      throw new Error(
        'Failed to generate structured recipe. Please try again.'
      );
    }

    return {
      message: assistantMessage,
    };
  } catch (error) {
    console.error('OpenAI API error in structured generation:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate recipe. Please try again.');
  }
}
```

### **3. Category Suggestion Logic**

**File**: `src/lib/category-suggestions.ts`

```typescript
/**
 * AI-powered category suggestion utilities
 */

import { CANONICAL_CATEGORIES } from './categories';
import { normalizeCategories } from './category-parsing';

// Category suggestion patterns based on recipe content
const CATEGORY_PATTERNS = {
  // Course patterns
  course: {
    appetizer: ['Course: Appetizer'],
    starter: ['Course: Appetizer'],
    main: ['Course: Main'],
    entree: ['Course: Main'],
    side: ['Course: Side'],
    dessert: ['Course: Dessert'],
    breakfast: ['Course: Breakfast'],
    brunch: ['Course: Brunch'],
    snack: ['Course: Snack'],
  },

  // Dish type patterns
  dishType: {
    soup: ['Dish Type: Soup'],
    salad: ['Dish Type: Salad'],
    sandwich: ['Dish Type: Sandwich'],
    curry: ['Dish Type: Curry'],
    'stir fry': ['Dish Type: Stir-Fry'],
    stew: ['Dish Type: Stew'],
    pasta: ['Dish Type: Pasta'],
    bowl: ['Dish Type: Bowl'],
    casserole: ['Dish Type: Casserole'],
  },

  // Technique patterns
  technique: {
    bake: ['Technique: Bake'],
    baked: ['Technique: Bake'],
    roast: ['Technique: Roast'],
    roasted: ['Technique: Roast'],
    grill: ['Technique: Grill'],
    grilled: ['Technique: Grill'],
    sauté: ['Technique: Sauté'],
    steam: ['Technique: Steam'],
    steamed: ['Technique: Steam'],
    'air fryer': ['Technique: Air Fryer'],
    'instant pot': ['Technique: Instant Pot'],
    'no cook': ['Technique: No-Cook'],
    raw: ['Technique: No-Cook'],
  },

  // Cuisine patterns
  cuisine: {
    italian: ['Cuisine: Italian'],
    mexican: ['Cuisine: Mexican'],
    indian: ['Cuisine: Indian'],
    thai: ['Cuisine: Thai'],
    japanese: ['Cuisine: Japanese'],
    chinese: ['Cuisine: Chinese'],
    mediterranean: ['Cuisine: Mediterranean'],
    french: ['Cuisine: French'],
    korean: ['Cuisine: Korean'],
  },

  // Collection patterns
  collection: {
    'gluten free': ['Collection: Gluten-Free'],
    vegan: ['Collection: Vegan'],
    vegetarian: ['Collection: Vegetarian'],
    keto: ['Collection: Keto'],
    paleo: ['Collection: Paleo'],
    'low carb': ['Collection: Low-Carb'],
    'high protein': ['Collection: High-Protein'],
    'anti inflammatory': ['Collection: Anti-Inflammatory'],
    'kid friendly': ['Collection: Kid-Friendly'],
  },
};

/**
 * Suggest categories based on recipe content
 */
export function suggestCategoriesFromContent(
  title: string,
  ingredients: string[],
  instructions: string,
  notes: string = ''
): string[] {
  const suggestions = new Set<string>();

  // Combine all text content for analysis
  const allText = [title, ...ingredients, instructions, notes]
    .join(' ')
    .toLowerCase();

  // Check each pattern category
  Object.entries(CATEGORY_PATTERNS).forEach(([categoryType, patterns]) => {
    Object.entries(patterns).forEach(([keyword, categories]) => {
      if (allText.includes(keyword)) {
        categories.forEach((category) => suggestions.add(category));
      }
    });
  });

  return Array.from(suggestions);
}

/**
 * Suggest categories based on persona type
 */
export function suggestCategoriesByPersona(persona: string): string[] {
  const personaSuggestions: Record<string, string[]> = {
    chef: [
      'Cuisine: Italian',
      'Technique: Sauté',
      'Technique: Roast',
      'Course: Main',
    ],
    nutritionist: [
      'Collection: Anti-Inflammatory',
      'Collection: High-Protein',
      'Collection: Low-FODMAP',
      'Technique: Steam',
    ],
    homeCook: [
      'Collection: Kid-Friendly',
      'Occasion: Weeknight',
      'Occasion: Meal Prep',
      'Course: Main',
    ],
    assistantNutritionist: [
      'Collection: Anti-Inflammatory',
      'Collection: High-Protein',
      'Collection: Low-FODMAP',
      'Collection: Gluten-Free',
    ],
  };

  return personaSuggestions[persona] || [];
}

/**
 * Validate and enhance AI-generated categories
 */
export function validateAndEnhanceCategories(
  aiCategories: string[],
  recipeContent: {
    title: string;
    ingredients: string[];
    instructions: string;
    notes?: string;
  },
  persona?: string
): string[] {
  // Normalize AI categories
  const normalized = normalizeCategories(aiCategories);

  // Get content-based suggestions
  const contentSuggestions = suggestCategoriesFromContent(
    recipeContent.title,
    recipeContent.ingredients,
    recipeContent.instructions,
    recipeContent.notes
  );

  // Get persona-based suggestions
  const personaSuggestions = persona ? suggestCategoriesByPersona(persona) : [];

  // Combine and deduplicate
  const allCategories = new Set([
    ...normalized,
    ...contentSuggestions,
    ...personaSuggestions,
  ]);

  // Filter to only canonical categories and limit count
  const canonicalSet = new Set(CANONICAL_CATEGORIES);
  const validCategories = Array.from(allCategories)
    .filter((cat) => canonicalSet.has(cat as any))
    .slice(0, 6); // Limit to 6 categories max

  return validCategories;
}

/**
 * Get category suggestions for recipe editor
 */
export function getCategorySuggestions(
  currentCategories: string[] = [],
  recipeContent?: {
    title: string;
    ingredients: string[];
    instructions: string;
  }
): string[] {
  const currentSet = new Set(currentCategories);

  // Start with canonical categories
  let suggestions = [...CANONICAL_CATEGORIES];

  // Add content-based suggestions if recipe content provided
  if (recipeContent) {
    const contentSuggestions = suggestCategoriesFromContent(
      recipeContent.title,
      recipeContent.ingredients,
      recipeContent.instructions
    );

    // Prioritize content suggestions
    suggestions = [
      ...contentSuggestions,
      ...suggestions.filter((cat) => !contentSuggestions.includes(cat)),
    ];
  }

  // Filter out already selected categories
  return suggestions.filter((cat) => !currentSet.has(cat));
}
```

### **4. AI Response Validation**

**File**: `src/lib/ai-category-validation.ts`

```typescript
/**
 * Validation utilities for AI-generated categories
 */

import { validateCategory } from './category-parsing';
import { CANONICAL_CATEGORIES } from './categories';

export interface CategoryValidationResult {
  valid: string[];
  invalid: string[];
  suggestions: string[];
  warnings: string[];
}

/**
 * Validate categories from AI response
 */
export function validateAICategories(
  categories: unknown,
  context?: {
    persona?: string;
    recipeTitle?: string;
    ingredients?: string[];
  }
): CategoryValidationResult {
  const result: CategoryValidationResult = {
    valid: [],
    invalid: [],
    suggestions: [],
    warnings: [],
  };

  // Handle different input types
  let categoryArray: string[] = [];

  if (Array.isArray(categories)) {
    categoryArray = categories.filter((c) => typeof c === 'string');
  } else if (typeof categories === 'string') {
    categoryArray = [categories];
  } else if (categories && typeof categories === 'object') {
    // Handle object format
    Object.entries(categories).forEach(([namespace, values]) => {
      const normalizedNamespace =
        namespace.charAt(0).toUpperCase() + namespace.slice(1);
      if (Array.isArray(values)) {
        values.forEach((value) => {
          if (typeof value === 'string') {
            categoryArray.push(`${normalizedNamespace}: ${value}`);
          }
        });
      } else if (typeof values === 'string') {
        categoryArray.push(`${normalizedNamespace}: ${values}`);
      }
    });
  }

  // Validate each category
  categoryArray.forEach((category) => {
    if (validateCategory(category)) {
      // Check if it's a canonical category
      if (CANONICAL_CATEGORIES.includes(category as any)) {
        result.valid.push(category);
      } else {
        // Valid format but not canonical
        result.valid.push(category);
        result.warnings.push(`Non-canonical category: ${category}`);
      }
    } else {
      result.invalid.push(category);
    }
  });

  // Generate suggestions for invalid categories
  result.invalid.forEach((invalid) => {
    const suggestions = findSimilarCategories(invalid);
    result.suggestions.push(...suggestions);
  });

  // Persona-specific validation
  if (context?.persona) {
    validatePersonaCategories(result, context.persona);
  }

  return result;
}

/**
 * Find similar canonical categories for invalid ones
 */
function findSimilarCategories(invalid: string): string[] {
  const suggestions: string[] = [];
  const lowerInvalid = invalid.toLowerCase();

  CANONICAL_CATEGORIES.forEach((canonical) => {
    const lowerCanonical = canonical.toLowerCase();

    // Check for partial matches
    if (
      lowerCanonical.includes(lowerInvalid) ||
      lowerInvalid.includes(lowerCanonical)
    ) {
      suggestions.push(canonical);
    }

    // Check for similar words
    const invalidWords = lowerInvalid.split(/[\s:,-]+/);
    const canonicalWords = lowerCanonical.split(/[\s:,-]+/);

    const commonWords = invalidWords.filter((word) =>
      canonicalWords.some(
        (cWord) => cWord.includes(word) || word.includes(cWord)
      )
    );

    if (commonWords.length > 0) {
      suggestions.push(canonical);
    }
  });

  // Remove duplicates and limit
  return Array.from(new Set(suggestions)).slice(0, 3);
}

/**
 * Validate categories against persona expectations
 */
function validatePersonaCategories(
  result: CategoryValidationResult,
  persona: string
): void {
  const personaExpectations: Record<string, string[]> = {
    chef: ['Cuisine: Italian', 'Technique:', 'Course:'],
    nutritionist: [
      'Collection: Anti-Inflammatory',
      'Collection: High-Protein',
      'Collection:',
    ],
    homeCook: ['Collection: Kid-Friendly', 'Occasion:', 'Course:'],
    assistantNutritionist: ['Collection:', 'Technique:'],
  };

  const expected = personaExpectations[persona] || [];
  const hasExpected = expected.some((exp) =>
    result.valid.some((cat) => cat.includes(exp))
  );

  if (!hasExpected && expected.length > 0) {
    result.warnings.push(
      `Expected ${persona} to suggest categories like: ${expected.join(', ')}`
    );
  }
}

/**
 * Format validation result for logging
 */
export function formatValidationResult(
  result: CategoryValidationResult
): string {
  const parts = [
    `Valid: ${result.valid.length} (${result.valid.join(', ')})`,
    `Invalid: ${result.invalid.length} (${result.invalid.join(', ')})`,
  ];

  if (result.suggestions.length > 0) {
    parts.push(`Suggestions: ${result.suggestions.join(', ')}`);
  }

  if (result.warnings.length > 0) {
    parts.push(`Warnings: ${result.warnings.join(', ')}`);
  }

  return parts.join(' | ');
}
```

## 🧪 **Testing Strategy**

### **1. Persona Integration Tests**

**File**: `src/__tests__/lib/ai-category-integration.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { OpenAIAPI } from '@/lib/openai';
import { normalizeCategories } from '@/lib/category-parsing';

// Mock the OpenAI API
vi.mock('@/lib/openai');

describe('AI Category Integration', () => {
  let openaiAPI: OpenAIAPI;

  beforeEach(() => {
    openaiAPI = new OpenAIAPI();
  });

  describe('generateStructuredRecipe with categories', () => {
    it('should generate recipe with appropriate categories', async () => {
      // Mock successful API response
      const mockResponse = {
        title: 'Pasta Carbonara',
        ingredients: ['400g spaghetti', '200g pancetta', '4 eggs'],
        instructions: 'Cook pasta, fry pancetta, mix with eggs',
        notes: 'Traditional Roman dish',
        categories: ['Course: Main', 'Cuisine: Italian', 'Technique: Sauté'],
      };

      vi.spyOn(openaiAPI, 'generateStructuredRecipe').mockResolvedValue({
        message: 'Recipe generated',
        recipe: mockResponse,
      });

      const result = await openaiAPI.generateStructuredRecipe([], 'chef');

      expect(result.recipe?.categories).toBeDefined();
      expect(result.recipe?.categories).toContain('Course: Main');
      expect(result.recipe?.categories).toContain('Cuisine: Italian');
    });

    it('should handle different persona category suggestions', async () => {
      const testCases = [
        {
          persona: 'nutritionist',
          expectedCategories: ['Collection: Anti-Inflammatory'],
        },
        {
          persona: 'homeCook',
          expectedCategories: ['Collection: Kid-Friendly'],
        },
      ];

      for (const testCase of testCases) {
        const mockResponse = {
          title: 'Healthy Bowl',
          ingredients: ['quinoa', 'vegetables'],
          instructions: 'Mix ingredients',
          categories: testCase.expectedCategories,
        };

        vi.spyOn(openaiAPI, 'generateStructuredRecipe').mockResolvedValue({
          message: 'Recipe generated',
          recipe: mockResponse,
        });

        const result = await openaiAPI.generateStructuredRecipe(
          [],
          testCase.persona as any
        );

        expect(result.recipe?.categories).toEqual(testCase.expectedCategories);
      }
    });
  });

  describe('category normalization in AI responses', () => {
    it('should normalize categories from AI response', () => {
      const aiResponse = {
        categories: ['course: main', 'CUISINE: ITALIAN', 'technique: bake'],
      };

      const normalized = normalizeCategories(aiResponse.categories);

      expect(normalized).toEqual([
        'Course: Main',
        'Cuisine: Italian',
        'Technique: Bake',
      ]);
    });

    it('should handle object-format categories from AI', () => {
      const aiResponse = {
        categories: {
          course: ['Main'],
          cuisine: ['Italian', 'Mediterranean'],
          technique: 'Bake',
        },
      };

      const normalized = normalizeCategories(aiResponse.categories);

      expect(normalized).toContain('Course: Main');
      expect(normalized).toContain('Cuisine: Italian');
      expect(normalized).toContain('Cuisine: Mediterranean');
      expect(normalized).toContain('Technique: Bake');
    });
  });
});
```

### **2. Category Suggestion Tests**

**File**: `src/__tests__/lib/category-suggestions.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  suggestCategoriesFromContent,
  suggestCategoriesByPersona,
  validateAndEnhanceCategories,
  getCategorySuggestions,
} from '@/lib/category-suggestions';

describe('Category Suggestions', () => {
  describe('suggestCategoriesFromContent', () => {
    it('should suggest categories based on recipe title', () => {
      const suggestions = suggestCategoriesFromContent(
        'Italian Pasta Carbonara',
        ['pasta', 'eggs', 'pancetta'],
        'Cook pasta and mix with eggs'
      );

      expect(suggestions).toContain('Cuisine: Italian');
      expect(suggestions).toContain('Dish Type: Pasta');
    });

    it('should suggest categories based on ingredients', () => {
      const suggestions = suggestCategoriesFromContent(
        'Healthy Bowl',
        ['quinoa', 'kale', 'anti-inflammatory spices'],
        'Mix ingredients in bowl'
      );

      expect(suggestions).toContain('Dish Type: Bowl');
      expect(suggestions).toContain('Collection: Anti-Inflammatory');
    });

    it('should suggest categories based on cooking method', () => {
      const suggestions = suggestCategoriesFromContent(
        'Roasted Vegetables',
        ['vegetables', 'olive oil'],
        'Roast in oven at 400F for 25 minutes'
      );

      expect(suggestions).toContain('Technique: Roast');
    });
  });

  describe('suggestCategoriesByPersona', () => {
    it('should suggest appropriate categories for chef persona', () => {
      const suggestions = suggestCategoriesByPersona('chef');

      expect(suggestions).toContain('Cuisine: Italian');
      expect(suggestions).toContain('Technique: Sauté');
    });

    it('should suggest appropriate categories for nutritionist persona', () => {
      const suggestions = suggestCategoriesByPersona('nutritionist');

      expect(suggestions).toContain('Collection: Anti-Inflammatory');
      expect(suggestions).toContain('Collection: High-Protein');
    });

    it('should suggest appropriate categories for homeCook persona', () => {
      const suggestions = suggestCategoriesByPersona('homeCook');

      expect(suggestions).toContain('Collection: Kid-Friendly');
      expect(suggestions).toContain('Occasion: Weeknight');
    });
  });

  describe('validateAndEnhanceCategories', () => {
    it('should validate and enhance AI categories', () => {
      const aiCategories = ['course: main', 'invalid@category'];
      const recipeContent = {
        title: 'Italian Pasta',
        ingredients: ['pasta', 'tomatoes'],
        instructions: 'Cook pasta with tomatoes',
      };

      const enhanced = validateAndEnhanceCategories(
        aiCategories,
        recipeContent,
        'chef'
      );

      expect(enhanced).toContain('Course: Main');
      expect(enhanced).toContain('Cuisine: Italian');
      expect(enhanced).not.toContain('invalid@category');
    });

    it('should limit categories to maximum count', () => {
      const manyCategories = Array(10)
        .fill(0)
        .map((_, i) => `Course: Category${i}`);
      const recipeContent = {
        title: 'Test Recipe',
        ingredients: ['ingredient'],
        instructions: 'instructions',
      };

      const enhanced = validateAndEnhanceCategories(
        manyCategories,
        recipeContent
      );

      expect(enhanced.length).toBeLessThanOrEqual(6);
    });
  });
});
```

### **3. End-to-End AI Integration Tests**

**File**: `src/__tests__/integration/ai-category-e2e.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { parseRecipeFromText } from '@/lib/api';

describe('AI Category End-to-End Integration', () => {
  it('should handle complete AI response with categories', async () => {
    const aiResponse = `
Here's your Italian pasta recipe:

\`\`\`json
{
  "title": "Classic Spaghetti Carbonara",
  "ingredients": [
    "400g spaghetti",
    "200g pancetta, diced",
    "4 large eggs",
    "100g Pecorino Romano, grated",
    "Black pepper, freshly ground",
    "Salt for pasta water"
  ],
  "instructions": "1. Cook spaghetti in salted boiling water until al dente\\n2. Meanwhile, fry pancetta until crispy\\n3. Beat eggs with cheese and pepper\\n4. Drain pasta, reserving pasta water\\n5. Mix hot pasta with pancetta\\n6. Remove from heat and quickly mix in egg mixture\\n7. Add pasta water if needed for creaminess",
  "notes": "The key is to work quickly so the eggs don't scramble. Traditional Roman recipe uses no cream.",
  "categories": [
    "Course: Main",
    "Cuisine: Italian", 
    "Dish Type: Pasta",
    "Technique: Sauté"
  ]
}
\`\`\`

Enjoy this classic Roman dish!
    `;

    const result = await parseRecipeFromText(aiResponse);

    expect(result.title).toBe('Classic Spaghetti Carbonara');
    expect(result.categories).toContain('Course: Main');
    expect(result.categories).toContain('Cuisine: Italian');
    expect(result.categories).toContain('Dish Type: Pasta');
    expect(result.categories).toContain('Technique: Sauté');
  });

  it('should handle AI response with object-format categories', async () => {
    const aiResponse = JSON.stringify({
      title: 'Healthy Buddha Bowl',
      ingredients: ['quinoa', 'kale', 'chickpeas'],
      instructions: 'Combine all ingredients',
      notes: 'High in protein and fiber',
      categories: {
        course: ['Main'],
        dish_type: ['Bowl'],
        collection: ['High-Protein', 'Anti-Inflammatory'],
        technique: ['No-Cook'],
      },
    });

    const result = await parseRecipeFromText(aiResponse);

    expect(result.title).toBe('Healthy Buddha Bowl');
    expect(result.categories).toContain('Course: Main');
    expect(result.categories).toContain('Dish Type: Bowl');
    expect(result.categories).toContain('Collection: High-Protein');
    expect(result.categories).toContain('Collection: Anti-Inflammatory');
    expect(result.categories).toContain('Technique: No-Cook');
  });
});
```

## 📋 **Implementation Checklist**

### **AI Persona Updates**

- [ ] Add category instructions to all persona system prompts
- [ ] Update Chef Marco with Italian cuisine focus
- [ ] Update Dr. Sarah with health-focused categories
- [ ] Update Aunt Jenny with family-friendly categories
- [ ] Update Dr. Sage Vitalis with science-based categories
- [ ] Test persona-specific category suggestions

### **Structured Generation**

- [ ] Update `generateStructuredRecipe()` method
- [ ] Add category field to JSON template
- [ ] Increase token limit for categories
- [ ] Add category validation to response processing
- [ ] Test structured generation with all personas

### **Category Suggestions**

- [ ] Create category suggestion utilities
- [ ] Implement content-based suggestions
- [ ] Add persona-based suggestions
- [ ] Create category validation system
- [ ] Test suggestion accuracy

### **Integration Testing**

- [ ] Write persona integration tests
- [ ] Write category suggestion tests
- [ ] Write end-to-end integration tests
- [ ] Test AI response validation
- [ ] Test error handling and fallbacks

## 🚨 **Quality Assurance**

### **Category Quality Checks**

- Categories should be relevant to recipe content
- Persona-specific categories should align with expertise
- Invalid categories should be filtered out
- Duplicate categories should be removed
- Category count should be reasonable (2-6 per recipe)

### **Performance Monitoring**

- Track category suggestion accuracy
- Monitor AI response processing time
- Measure category validation performance
- Track persona-specific category patterns

### **Error Handling**

- Handle missing category data gracefully
- Validate AI-generated categories
- Provide fallback suggestions
- Log validation warnings

## ✅ **Success Criteria**

- [ ] All personas generate relevant categories
- [ ] Category suggestions match persona expertise
- [ ] AI responses include 2-4 appropriate categories
- [ ] Category validation catches invalid entries
- [ ] Performance impact < 100ms per request
- [ ] Integration tests pass with 95% success rate

## 🔗 **Next Phase**

Once Phase 3 is complete, proceed to [Phase 4: UI Components](phase-4-ui-components.md) to build the user interface components for category display and interaction.

---

**Phase Status**: 📋 Ready for Implementation  
**Estimated Time**: 2-3 days  
**Prerequisites**: Phase 2 complete  
**Next Phase**: [Phase 4 - UI Components](phase-4-ui-components.md)

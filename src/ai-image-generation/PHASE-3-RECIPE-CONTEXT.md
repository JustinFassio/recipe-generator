# Phase 3: Recipe Context Integration

**Enhance AI image generation with intelligent recipe context analysis and optimized prompt engineering**

## 🎯 Objectives

- Analyze recipe JSON data to create intelligent image prompts
- Implement prompt optimization for better image results
- Add fallback strategies for failed generations
- Create context-aware image suggestions
- Optimize for cost efficiency and quality

## 📋 Deliverables

- [ ] Recipe context analysis system
- [ ] Intelligent prompt generation
- [ ] Prompt optimization engine
- [ ] Fallback generation strategies
- [ ] Context-aware suggestions
- [ ] Cost optimization features
- [ ] Quality validation system

## 🏗️ Implementation

### 1. Recipe Context Analyzer

**File**: `src/lib/ai-image-generation/recipe-context-analyzer.ts`

```typescript
import { RecipeFormData } from '@/lib/schemas';

export interface RecipeContext {
  cuisine: string | null;
  course: string | null;
  technique: string | null;
  mainIngredients: string[];
  cookingMethod: string | null;
  complexity: 'simple' | 'moderate' | 'complex';
  dietaryTags: string[];
  flavorProfile: string[];
  visualStyle: string;
}

export interface ImagePromptContext {
  basePrompt: string;
  styleModifiers: string[];
  qualityEnhancers: string[];
  contextTags: string[];
  negativePrompts: string[];
}

/**
 * Analyze recipe data to extract context for image generation
 */
export function analyzeRecipeContext(recipe: RecipeFormData): RecipeContext {
  const context: RecipeContext = {
    cuisine: null,
    course: null,
    technique: null,
    mainIngredients: [],
    cookingMethod: null,
    complexity: 'simple',
    dietaryTags: [],
    flavorProfile: [],
    visualStyle: 'natural'
  };

  // Extract categories
  if (recipe.categories) {
    recipe.categories.forEach(category => {
      const [namespace, value] = category.split(':').map(s => s.trim());
      
      switch (namespace.toLowerCase()) {
        case 'cuisine':
          context.cuisine = value;
          break;
        case 'course':
          context.course = value;
          break;
        case 'technique':
          context.technique = value;
          break;
        case 'collection':
          context.dietaryTags.push(value);
          break;
      }
    });
  }

  // Analyze ingredients for main components
  if (recipe.ingredients) {
    const ingredients = Array.isArray(recipe.ingredients) 
      ? recipe.ingredients 
      : recipe.ingredients.map((ing: any) => ing.item || ing);

    context.mainIngredients = extractMainIngredients(ingredients);
    context.cookingMethod = inferCookingMethod(recipe.instructions, ingredients);
    context.flavorProfile = inferFlavorProfile(ingredients);
  }

  // Determine complexity
  context.complexity = assessComplexity(recipe);

  // Determine visual style
  context.visualStyle = determineVisualStyle(context);

  return context;
}

/**
 * Generate intelligent image prompt from recipe context
 */
export function generateIntelligentPrompt(
  recipe: RecipeFormData,
  userPrompt?: string
): ImagePromptContext {
  const context = analyzeRecipeContext(recipe);
  
  // Start with user prompt or generate from title
  let basePrompt = userPrompt || generateBasePromptFromTitle(recipe.title);
  
  // Enhance with context
  const styleModifiers = buildStyleModifiers(context);
  const qualityEnhancers = buildQualityEnhancers(context);
  const contextTags = buildContextTags(context);
  const negativePrompts = buildNegativePrompts(context);

  // Combine into final prompt
  const enhancedPrompt = combinePromptElements(
    basePrompt,
    styleModifiers,
    qualityEnhancers,
    contextTags
  );

  return {
    basePrompt: enhancedPrompt,
    styleModifiers,
    qualityEnhancers,
    contextTags,
    negativePrompts
  };
}

/**
 * Extract main ingredients from recipe
 */
function extractMainIngredients(ingredients: string[]): string[] {
  const mainIngredientKeywords = [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'tofu',
    'pasta', 'rice', 'quinoa', 'bread', 'potato', 'tomato',
    'cheese', 'milk', 'cream', 'butter', 'egg', 'flour'
  ];

  return ingredients
    .map(ing => ing.toLowerCase())
    .filter(ing => 
      mainIngredientKeywords.some(keyword => ing.includes(keyword))
    )
    .slice(0, 3); // Limit to top 3 main ingredients
}

/**
 * Infer cooking method from instructions and ingredients
 */
function inferCookingMethod(instructions: string, ingredients: string[]): string | null {
  const instructionsLower = instructions.toLowerCase();
  const ingredientsLower = ingredients.join(' ').toLowerCase();

  const methods = {
    'baked': ['bake', 'oven', 'baking', 'roast', 'roasting'],
    'grilled': ['grill', 'grilling', 'bbq', 'barbecue'],
    'fried': ['fry', 'frying', 'deep fry', 'pan fry'],
    'boiled': ['boil', 'boiling', 'simmer', 'simmering'],
    'raw': ['raw', 'fresh', 'uncooked', 'salad'],
    'steamed': ['steam', 'steaming']
  };

  for (const [method, keywords] of Object.entries(methods)) {
    if (keywords.some(keyword => 
      instructionsLower.includes(keyword) || ingredientsLower.includes(keyword)
    )) {
      return method;
    }
  }

  return null;
}

/**
 * Infer flavor profile from ingredients
 */
function inferFlavorProfile(ingredients: string[]): string[] {
  const ingredientsText = ingredients.join(' ').toLowerCase();
  const profiles: string[] = [];

  if (ingredientsText.includes('spicy') || ingredientsText.includes('chili')) {
    profiles.push('spicy');
  }
  if (ingredientsText.includes('sweet') || ingredientsText.includes('sugar')) {
    profiles.push('sweet');
  }
  if (ingredientsText.includes('herbs') || ingredientsText.includes('basil')) {
    profiles.push('herbal');
  }
  if (ingredientsText.includes('citrus') || ingredientsText.includes('lemon')) {
    profiles.push('citrusy');
  }
  if (ingredientsText.includes('garlic') || ingredientsText.includes('onion')) {
    profiles.push('aromatic');
  }

  return profiles;
}

/**
 * Assess recipe complexity
 */
function assessComplexity(recipe: RecipeFormData): 'simple' | 'moderate' | 'complex' {
  let complexityScore = 0;

  // Ingredient count
  if (recipe.ingredients && recipe.ingredients.length > 10) complexityScore += 1;
  if (recipe.ingredients && recipe.ingredients.length > 15) complexityScore += 1;

  // Instruction length
  if (recipe.instructions && recipe.instructions.length > 500) complexityScore += 1;
  if (recipe.instructions && recipe.instructions.length > 1000) complexityScore += 1;

  // Technique complexity
  const complexTechniques = ['braise', 'confit', 'sous vide', 'ferment', 'cure'];
  if (recipe.instructions && complexTechniques.some(tech => 
    recipe.instructions.toLowerCase().includes(tech)
  )) {
    complexityScore += 2;
  }

  if (complexityScore <= 1) return 'simple';
  if (complexityScore <= 3) return 'moderate';
  return 'complex';
}

/**
 * Determine visual style based on context
 */
function determineVisualStyle(context: RecipeContext): string {
  if (context.cuisine === 'Japanese') return 'minimalist';
  if (context.cuisine === 'Italian') return 'rustic';
  if (context.cuisine === 'French') return 'elegant';
  if (context.dietaryTags.includes('Vegan')) return 'fresh';
  if (context.course === 'Dessert') return 'indulgent';
  return 'natural';
}

/**
 * Build style modifiers for prompt
 */
function buildStyleModifiers(context: RecipeContext): string[] {
  const modifiers: string[] = [];

  // Cuisine-specific styles
  if (context.cuisine) {
    const cuisineStyles: Record<string, string[]> = {
      'Italian': ['rustic', 'traditional', 'Mediterranean'],
      'Japanese': ['minimalist', 'clean', 'elegant'],
      'French': ['sophisticated', 'refined', 'classic'],
      'Mexican': ['vibrant', 'colorful', 'authentic'],
      'Indian': ['spiced', 'aromatic', 'traditional'],
      'Thai': ['fresh', 'herbal', 'balanced']
    };
    
    modifiers.push(...(cuisineStyles[context.cuisine] || ['authentic']));
  }

  // Cooking method styles
  if (context.cookingMethod) {
    const methodStyles: Record<string, string[]> = {
      'baked': ['golden', 'caramelized'],
      'grilled': ['charred', 'smoky'],
      'fried': ['crispy', 'golden'],
      'raw': ['fresh', 'vibrant'],
      'steamed': ['tender', 'delicate']
    };
    
    modifiers.push(...(methodStyles[context.cookingMethod] || []));
  }

  // Visual style
  modifiers.push(context.visualStyle);

  return modifiers;
}

/**
 * Build quality enhancers for prompt
 */
function buildQualityEnhancers(context: RecipeContext): string[] {
  const enhancers = [
    'professional food photography',
    'high quality',
    'well-lit',
    'appetizing',
    'mouth-watering'
  ];

  // Add complexity-based enhancers
  if (context.complexity === 'complex') {
    enhancers.push('gourmet', 'restaurant-quality');
  } else {
    enhancers.push('homestyle', 'comforting');
  }

  return enhancers;
}

/**
 * Build context tags for prompt
 */
function buildContextTags(context: RecipeContext): string[] {
  const tags: string[] = [];

  if (context.mainIngredients.length > 0) {
    tags.push(`featuring ${context.mainIngredients.slice(0, 2).join(' and ')}`);
  }

  if (context.flavorProfile.length > 0) {
    tags.push(context.flavorProfile.join(' '));
  }

  if (context.course) {
    tags.push(`perfect for ${context.course.toLowerCase()}`);
  }

  return tags;
}

/**
 * Build negative prompts to avoid unwanted elements
 */
function buildNegativePrompts(context: RecipeContext): string[] {
  const negative: string[] = [
    'blurry',
    'low quality',
    'artificial',
    'plastic',
    'overcooked'
  ];

  // Dietary-specific negatives
  if (context.dietaryTags.includes('Vegan')) {
    negative.push('meat', 'dairy', 'eggs');
  }

  if (context.dietaryTags.includes('Gluten-Free')) {
    negative.push('bread', 'pasta', 'flour');
  }

  return negative;
}

/**
 * Generate base prompt from recipe title
 */
function generateBasePromptFromTitle(title: string): string {
  return `A delicious ${title.toLowerCase()}`;
}

/**
 * Combine prompt elements into final prompt
 */
function combinePromptElements(
  basePrompt: string,
  styleModifiers: string[],
  qualityEnhancers: string[],
  contextTags: string[]
): string {
  const elements = [
    basePrompt,
    ...styleModifiers,
    ...qualityEnhancers,
    ...contextTags
  ];

  return elements.join(', ');
}
```

### 2. Prompt Optimization Engine

**File**: `src/lib/ai-image-generation/prompt-optimizer.ts`

```typescript
import { ImagePromptContext } from './recipe-context-analyzer';

export interface OptimizedPrompt {
  prompt: string;
  confidence: number;
  estimatedCost: number;
  alternatives: string[];
}

/**
 * Optimize prompt for better results and cost efficiency
 */
export function optimizePrompt(
  context: ImagePromptContext,
  maxCost: number = 0.08
): OptimizedPrompt {
  let optimizedPrompt = context.basePrompt;
  let confidence = 0.8;
  const alternatives: string[] = [];

  // Remove redundant words
  optimizedPrompt = removeRedundantWords(optimizedPrompt);

  // Optimize for DALL-E 3 token limits (1000 characters)
  if (optimizedPrompt.length > 800) {
    optimizedPrompt = truncatePrompt(optimizedPrompt, 800);
    confidence -= 0.1;
  }

  // Generate alternatives for A/B testing
  alternatives.push(generateAlternativePrompt(context, 'minimal'));
  alternatives.push(generateAlternativePrompt(context, 'detailed'));

  // Calculate estimated cost
  const estimatedCost = calculatePromptCost(optimizedPrompt);

  return {
    prompt: optimizedPrompt,
    confidence,
    estimatedCost,
    alternatives
  };
}

/**
 * Remove redundant words and phrases
 */
function removeRedundantWords(prompt: string): string {
  const redundantPhrases = [
    'very delicious',
    'really tasty',
    'super fresh',
    'extremely appetizing',
    'high quality professional',
    'beautiful and delicious'
  ];

  let cleaned = prompt;
  redundantPhrases.forEach(phrase => {
    cleaned = cleaned.replace(new RegExp(phrase, 'gi'), '');
  });

  // Clean up extra commas and spaces
  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Truncate prompt while preserving key elements
 */
function truncatePrompt(prompt: string, maxLength: number): string {
  const parts = prompt.split(',');
  const essentialParts: string[] = [];
  let currentLength = 0;

  // Priority order for prompt elements
  const priorities = [
    /professional food photography/i,
    /high quality/i,
    /appetizing/i,
    /well-lit/i
  ];

  // Add essential elements first
  priorities.forEach(pattern => {
    const match = parts.find(part => pattern.test(part));
    if (match && currentLength + match.length < maxLength) {
      essentialParts.push(match);
      currentLength += match.length + 2; // +2 for comma and space
    }
  });

  // Add other parts until limit reached
  parts.forEach(part => {
    if (!essentialParts.includes(part) && 
        currentLength + part.length < maxLength) {
      essentialParts.push(part);
      currentLength += part.length + 2;
    }
  });

  return essentialParts.join(', ');
}

/**
 * Generate alternative prompt variations
 */
function generateAlternativePrompt(
  context: ImagePromptContext,
  style: 'minimal' | 'detailed'
): string {
  if (style === 'minimal') {
    // Minimal version focuses on core elements
    return [
      context.basePrompt.split(',')[0], // Main description
      'professional food photography',
      'high quality'
    ].join(', ');
  } else {
    // Detailed version includes more context
    return [
      ...context.basePrompt.split(',').slice(0, 3),
      ...context.styleModifiers.slice(0, 2),
      ...context.qualityEnhancers.slice(0, 3)
    ].join(', ');
  }
}

/**
 * Calculate estimated cost for prompt
 */
function calculatePromptCost(prompt: string): number {
  // DALL-E 3 pricing is based on size and quality, not prompt length
  // But we can estimate based on complexity
  const complexity = prompt.length / 100;
  return Math.min(complexity * 0.01, 0.08); // Cap at $0.08
}
```

### 3. Fallback Generation Strategies

**File**: `src/lib/ai-image-generation/fallback-strategies.ts`

```typescript
import { RecipeContext, ImagePromptContext } from './recipe-context-analyzer';

export interface FallbackStrategy {
  name: string;
  prompt: string;
  confidence: number;
  reason: string;
}

/**
 * Generate fallback strategies when primary generation fails
 */
export function generateFallbackStrategies(
  recipe: any,
  context: RecipeContext,
  originalError: string
): FallbackStrategy[] {
  const strategies: FallbackStrategy[] = [];

  // Strategy 1: Simplified prompt
  strategies.push({
    name: 'Simplified Prompt',
    prompt: generateSimplifiedPrompt(recipe.title, context),
    confidence: 0.7,
    reason: 'Reduced complexity to avoid generation errors'
  });

  // Strategy 2: Generic food photography
  if (context.cuisine) {
    strategies.push({
      name: 'Generic Cuisine Style',
      prompt: generateGenericCuisinePrompt(context.cuisine),
      confidence: 0.6,
      reason: `Generic ${context.cuisine} food photography`
    });
  }

  // Strategy 3: Ingredient-focused
  if (context.mainIngredients.length > 0) {
    strategies.push({
      name: 'Ingredient Focused',
      prompt: generateIngredientPrompt(context.mainIngredients[0]),
      confidence: 0.5,
      reason: 'Focus on main ingredient only'
    });
  }

  // Strategy 4: Course-based generic
  if (context.course) {
    strategies.push({
      name: 'Course Based',
      prompt: generateCoursePrompt(context.course),
      confidence: 0.4,
      reason: `Generic ${context.course} dish photography`
    });
  }

  return strategies.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Generate simplified prompt
 */
function generateSimplifiedPrompt(title: string, context: RecipeContext): string {
  const base = `A delicious ${title.toLowerCase()}`;
  const style = context.cuisine ? `, ${context.cuisine} style` : '';
  return `${base}${style}, professional food photography, appetizing`;
}

/**
 * Generate generic cuisine prompt
 */
function generateGenericCuisinePrompt(cuisine: string): string {
  const cuisinePrompts: Record<string, string> = {
    'Italian': 'Traditional Italian cuisine, rustic style, professional food photography',
    'Japanese': 'Authentic Japanese food, minimalist presentation, high quality',
    'French': 'Classic French cuisine, elegant presentation, professional photography',
    'Mexican': 'Authentic Mexican food, vibrant colors, traditional style',
    'Indian': 'Traditional Indian cuisine, aromatic spices, authentic presentation',
    'Thai': 'Authentic Thai food, fresh ingredients, balanced flavors'
  };

  return cuisinePrompts[cuisine] || `${cuisine} cuisine, professional food photography`;
}

/**
 * Generate ingredient-focused prompt
 */
function generateIngredientPrompt(ingredient: string): string {
  return `${ingredient}, fresh ingredients, professional food photography, appetizing`;
}

/**
 * Generate course-based prompt
 */
function generateCoursePrompt(course: string): string {
  const coursePrompts: Record<string, string> = {
    'Appetizer': 'Beautiful appetizer, elegant presentation, professional food photography',
    'Main': 'Hearty main course, satisfying presentation, professional photography',
    'Dessert': 'Delicious dessert, indulgent presentation, professional food photography',
    'Side': 'Perfect side dish, complementary presentation, professional photography',
    'Breakfast': 'Inviting breakfast, morning presentation, professional food photography'
  };

  return coursePrompts[course] || `${course} dish, professional food photography`;
}
```

### 4. Enhanced API Integration

**File**: `api/ai/generate-image.ts` (enhancements)

```typescript
// Add to existing handler
import { analyzeRecipeContext, generateIntelligentPrompt } from '@/lib/ai-image-generation/recipe-context-analyzer';
import { optimizePrompt } from '@/lib/ai-image-generation/prompt-optimizer';
import { generateFallbackStrategies } from '@/lib/ai-image-generation/fallback-strategies';

interface EnhancedGenerateImageRequest {
  prompt?: string;
  recipeTitle?: string;
  categories?: string[];
  ingredients?: any[];
  instructions?: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  useIntelligentPrompting?: boolean;
  fallbackOnError?: boolean;
}

// Enhanced handler logic
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... existing validation ...

  try {
    const {
      prompt,
      recipeTitle,
      categories,
      ingredients,
      instructions,
      size = '1024x1024',
      quality = 'standard',
      useIntelligentPrompting = true,
      fallbackOnError = true
    }: EnhancedGenerateImageRequest = req.body;

    let finalPrompt = prompt || '';
    let promptContext = null;

    // Use intelligent prompting if enabled and recipe data available
    if (useIntelligentPrompting && (recipeTitle || ingredients || instructions)) {
      const recipeData = {
        title: recipeTitle || '',
        categories: categories || [],
        ingredients: ingredients || [],
        instructions: instructions || ''
      };

      promptContext = generateIntelligentPrompt(recipeData, prompt);
      const optimized = optimizePrompt(promptContext);
      finalPrompt = optimized.prompt;
    }

    // Call DALL-E 3 API with enhanced prompt
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: finalPrompt,
        n: 1,
        size,
        quality,
        response_format: 'url'
      })
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      
      // Try fallback strategies if enabled
      if (fallbackOnError && promptContext) {
        const recipeData = {
          title: recipeTitle || '',
          categories: categories || [],
          ingredients: ingredients || [],
          instructions: instructions || ''
        };
        
        const context = analyzeRecipeContext(recipeData);
        const fallbacks = generateFallbackStrategies(recipeData, context, errorData.error?.message || '');
        
        // Try first fallback strategy
        if (fallbacks.length > 0) {
          console.log(`[AI Image Generation] Trying fallback: ${fallbacks[0].name}`);
          
          const fallbackResponse = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'dall-e-3',
              prompt: fallbacks[0].prompt,
              n: 1,
              size,
              quality,
              response_format: 'url'
            })
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return res.status(200).json({
              success: true,
              imageUrl: fallbackData.data[0]?.url,
              usedFallback: true,
              fallbackStrategy: fallbacks[0].name,
              usage: {
                promptTokens: fallbacks[0].prompt.length,
                totalCost: calculateImageCost(size, quality)
              }
            });
          }
        }
      }

      return res.status(400).json({
        success: false,
        error: `Image generation failed: ${errorData.error?.message || 'Unknown error'}`,
        fallbackStrategies: fallbackOnError ? generateFallbackStrategies(
          { title: recipeTitle, categories, ingredients, instructions },
          promptContext ? analyzeRecipeContext({ title: recipeTitle || '', categories: categories || [], ingredients: ingredients || [], instructions: instructions || '' }) : null,
          errorData.error?.message || ''
        ) : []
      });
    }

    // ... rest of successful response handling ...
  } catch (error) {
    // ... error handling ...
  }
}
```

## 🧪 Testing

### 1. Context Analysis Tests

**File**: `src/__tests__/lib/ai-image-generation/recipe-context-analyzer.test.ts`

```typescript
import { analyzeRecipeContext, generateIntelligentPrompt } from '@/lib/ai-image-generation/recipe-context-analyzer';

describe('Recipe Context Analyzer', () => {
  it('should analyze Italian recipe context correctly', () => {
    const recipe = {
      title: 'Classic Italian Lasagna',
      categories: ['Cuisine: Italian', 'Course: Main', 'Technique: Bake'],
      ingredients: ['pasta', 'tomato sauce', 'cheese', 'ground beef'],
      instructions: 'Layer pasta with sauce and cheese, then bake in oven for 45 minutes'
    };

    const context = analyzeRecipeContext(recipe);

    expect(context.cuisine).toBe('Italian');
    expect(context.course).toBe('Main');
    expect(context.technique).toBe('Bake');
    expect(context.mainIngredients).toContain('pasta');
    expect(context.cookingMethod).toBe('baked');
    expect(context.visualStyle).toBe('rustic');
  });

  it('should generate intelligent prompt with context', () => {
    const recipe = {
      title: 'Spicy Thai Curry',
      categories: ['Cuisine: Thai', 'Course: Main'],
      ingredients: ['coconut milk', 'curry paste', 'chili', 'vegetables'],
      instructions: 'Simmer curry with coconut milk and spices'
    };

    const promptContext = generateIntelligentPrompt(recipe);

    expect(promptContext.basePrompt).toContain('spicy thai curry');
    expect(promptContext.styleModifiers).toContain('fresh');
    expect(promptContext.qualityEnhancers).toContain('professional food photography');
    expect(promptContext.contextTags).toContain('featuring coconut milk');
  });
});
```

### 2. Prompt Optimization Tests

**File**: `src/__tests__/lib/ai-image-generation/prompt-optimizer.test.ts`

```typescript
import { optimizePrompt } from '@/lib/ai-image-generation/prompt-optimizer';

describe('Prompt Optimizer', () => {
  it('should optimize long prompts', () => {
    const context = {
      basePrompt: 'A delicious, very tasty, really appetizing pasta dish, super fresh ingredients, extremely high quality professional food photography, beautiful and delicious presentation',
      styleModifiers: ['rustic', 'traditional'],
      qualityEnhancers: ['professional food photography', 'high quality'],
      contextTags: ['Italian style'],
      negativePrompts: []
    };

    const optimized = optimizePrompt(context);

    expect(optimized.prompt.length).toBeLessThan(800);
    expect(optimized.prompt).not.toContain('very tasty');
    expect(optimized.prompt).not.toContain('really appetizing');
    expect(optimized.alternatives).toHaveLength(2);
  });

  it('should generate alternatives', () => {
    const context = {
      basePrompt: 'A delicious pasta',
      styleModifiers: ['rustic'],
      qualityEnhancers: ['professional food photography'],
      contextTags: ['Italian style'],
      negativePrompts: []
    };

    const optimized = optimizePrompt(context);

    expect(optimized.alternatives[0]).toContain('professional food photography');
    expect(optimized.alternatives[1]).toContain('rustic');
  });
});
```

## 📊 Quality Metrics

### 1. Prompt Effectiveness Tracking

```typescript
// Add to API response
interface GenerationMetrics {
  promptLength: number;
  contextElements: number;
  fallbackUsed: boolean;
  generationTime: number;
  cost: number;
  qualityScore?: number;
}

// Track metrics for optimization
const metrics: GenerationMetrics = {
  promptLength: finalPrompt.length,
  contextElements: promptContext ? Object.keys(promptContext).length : 0,
  fallbackUsed: false,
  generationTime: Date.now() - startTime,
  cost: calculateImageCost(size, quality)
};
```

### 2. User Feedback Integration

```typescript
// Add feedback collection
interface ImageGenerationFeedback {
  recipeId: string;
  promptUsed: string;
  userRating: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  improvements?: string[];
}
```

## ✅ Phase 3 Completion Criteria

- [ ] Recipe context analysis accurately extracts relevant information
- [ ] Intelligent prompt generation creates better image descriptions
- [ ] Prompt optimization reduces costs while maintaining quality
- [ ] Fallback strategies provide alternatives when generation fails
- [ ] Context-aware suggestions improve user experience
- [ ] Cost optimization features reduce unnecessary spending
- [ ] Quality validation system tracks generation effectiveness
- [ ] Unit tests pass for all new functionality
- [ ] Integration tests verify end-to-end workflow
- [ ] Performance benchmarks meet requirements

## 🚀 Next Phase

Once Phase 3 is complete, proceed to [Phase 4: Cost Management & Optimization](./PHASE-4-COST-MANAGEMENT.md) to implement usage tracking, limits, and caching strategies.

---

**Estimated Time**: 3-4 days
**Dependencies**: Phase 1 & 2 backend and frontend integration
**Risk Level**: Medium (complex prompt engineering)

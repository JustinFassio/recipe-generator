import { RecipeFormData } from '@/lib/schemas';

export interface RecipeContext {
  cuisine: CuisineInfo | null;
  cookingMethods: CookingMethod[];
  mainIngredients: IngredientInfo[];
  dishType: DishType | null;
  complexity: ComplexityLevel;
  seasonalContext: SeasonalContext | null;
  culturalContext: CulturalContext | null;
  visualStyle: VisualStyle | null;
  temperature: TemperatureContext | null;
}

export interface CuisineInfo {
  name: string;
  region: string;
  characteristics: string[];
  visualElements: string[];
}

export interface CookingMethod {
  method: string;
  intensity: 'low' | 'medium' | 'high';
  visualCues: string[];
}

export interface IngredientInfo {
  name: string;
  category: string;
  visualImportance: 'primary' | 'secondary' | 'garnish';
  color: string[];
  texture: string[];
}

export interface DishType {
  type: string;
  presentation: string;
  servingStyle: string;
}

export interface SeasonalContext {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  elements: string[];
}

export interface CulturalContext {
  tradition: string;
  occasion: string;
  setting: string;
}

export interface VisualStyle {
  style: string;
  lighting: string;
  composition: string;
  mood: string;
}

export interface TemperatureContext {
  servingTemp: 'hot' | 'warm' | 'room' | 'cold' | 'frozen';
  visualCues: string[];
}

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'elaborate';

/**
 * Analyze recipe context for enhanced image generation
 */
export function analyzeRecipeContext(recipe: RecipeFormData): RecipeContext {
  return {
    cuisine: analyzeCuisine(recipe),
    cookingMethods: analyzeCookingMethods(recipe),
    mainIngredients: analyzeIngredients(recipe),
    dishType: analyzeDishType(recipe),
    complexity: analyzeComplexity(recipe),
    seasonalContext: analyzeSeasonalContext(recipe),
    culturalContext: analyzeCulturalContext(recipe),
    visualStyle: analyzeVisualStyle(recipe),
    temperature: analyzeTemperature(recipe),
  };
}

/**
 * Analyze cuisine from recipe categories and context
 */
function analyzeCuisine(recipe: RecipeFormData): CuisineInfo | null {
  if (!recipe.categories) return null;

  const cuisineCategory = recipe.categories.find((cat) =>
    cat.includes('Cuisine:')
  );
  if (!cuisineCategory) return null;

  const cuisineName = cuisineCategory.split(':')[1]?.trim();
  if (!cuisineName) return null;

  // Enhanced cuisine analysis
  const cuisineMap: Record<string, CuisineInfo> = {
    Italian: {
      name: 'Italian',
      region: 'Mediterranean',
      characteristics: ['fresh herbs', 'olive oil', 'simple ingredients'],
      visualElements: ['rustic presentation', 'warm colors', 'wooden surfaces'],
    },
    Mexican: {
      name: 'Mexican',
      region: 'Latin American',
      characteristics: ['spices', 'corn', 'beans', 'chilies'],
      visualElements: ['vibrant colors', 'clay pottery', 'colorful garnishes'],
    },
    Asian: {
      name: 'Asian',
      region: 'East Asian',
      characteristics: ['umami', 'ginger', 'soy sauce', 'fresh vegetables'],
      visualElements: [
        'clean presentation',
        'bamboo elements',
        'steam effects',
      ],
    },
    Indian: {
      name: 'Indian',
      region: 'South Asian',
      characteristics: ['spices', 'curry', 'rice', 'yogurt'],
      visualElements: ['rich colors', 'golden tones', 'spice garnishes'],
    },
    French: {
      name: 'French',
      region: 'European',
      characteristics: ['butter', 'cream', 'wine', 'herbs'],
      visualElements: [
        'elegant plating',
        'sophisticated presentation',
        'white plates',
      ],
    },
    Mediterranean: {
      name: 'Mediterranean',
      region: 'Mediterranean',
      characteristics: ['olive oil', 'tomatoes', 'herbs', 'seafood'],
      visualElements: [
        'sunny colors',
        'fresh ingredients',
        'terracotta elements',
      ],
    },
  };

  return (
    cuisineMap[cuisineName] || {
      name: cuisineName,
      region: 'Unknown',
      characteristics: ['traditional flavors'],
      visualElements: ['authentic presentation'],
    }
  );
}

/**
 * Analyze cooking methods from instructions
 */
function analyzeCookingMethods(recipe: RecipeFormData): CookingMethod[] {
  if (!recipe.instructions) return [];

  const instructionsLower = recipe.instructions.toLowerCase();
  const methods: CookingMethod[] = [];

  const methodPatterns: Record<string, CookingMethod> = {
    bake: {
      method: 'baked',
      intensity: 'medium',
      visualCues: ['golden crust', 'steam rising', 'oven-baked appearance'],
    },
    grill: {
      method: 'grilled',
      intensity: 'high',
      visualCues: ['grill marks', 'charred edges', 'smoky appearance'],
    },
    fry: {
      method: 'fried',
      intensity: 'high',
      visualCues: ['crispy exterior', 'golden brown', 'oil sheen'],
    },
    steam: {
      method: 'steamed',
      intensity: 'low',
      visualCues: ['steam', 'moist appearance', 'tender texture'],
    },
    sauté: {
      method: 'sautéed',
      intensity: 'medium',
      visualCues: ['lightly browned', 'caramelized edges', 'pan-seared'],
    },
    roast: {
      method: 'roasted',
      intensity: 'high',
      visualCues: ['deep browning', 'crispy edges', 'roasted appearance'],
    },
    braise: {
      method: 'braised',
      intensity: 'low',
      visualCues: ['tender texture', 'rich sauce', 'slow-cooked appearance'],
    },
    raw: {
      method: 'raw',
      intensity: 'low',
      visualCues: ['fresh appearance', 'crisp texture', 'natural colors'],
    },
  };

  for (const [keyword, methodInfo] of Object.entries(methodPatterns)) {
    if (instructionsLower.includes(keyword)) {
      methods.push(methodInfo);
    }
  }

  return methods;
}

/**
 * Analyze ingredients for visual importance and characteristics
 */
function analyzeIngredients(recipe: RecipeFormData): IngredientInfo[] {
  if (!recipe.ingredients || recipe.ingredients.length === 0) return [];

  return recipe.ingredients.slice(0, 5).map((ingredient, index) => {
    const cleaned = ingredient
      .replace(/\d+\s*(cups?|tbsp?|tsp?|oz|lb|g|kg|ml|l)\s*/gi, '')
      .trim()
      .split(',')[0]
      .trim();

    return {
      name: cleaned,
      category: categorizeIngredient(cleaned),
      visualImportance:
        index < 2 ? 'primary' : index < 4 ? 'secondary' : 'garnish',
      color: getIngredientColors(cleaned),
      texture: getIngredientTextures(cleaned),
    };
  });
}

/**
 * Categorize ingredient by type
 */
function categorizeIngredient(ingredient: string): string {
  const categories: Record<string, string[]> = {
    protein: [
      'chicken',
      'beef',
      'pork',
      'fish',
      'salmon',
      'shrimp',
      'tofu',
      'eggs',
      'cheese',
    ],
    vegetable: [
      'onion',
      'garlic',
      'tomato',
      'carrot',
      'pepper',
      'broccoli',
      'spinach',
      'mushroom',
    ],
    grain: ['rice', 'pasta', 'bread', 'quinoa', 'barley', 'oats'],
    herb: ['basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro'],
    spice: ['salt', 'pepper', 'cumin', 'paprika', 'cinnamon', 'ginger'],
    dairy: ['milk', 'cream', 'butter', 'yogurt', 'cheese'],
    oil: ['olive oil', 'vegetable oil', 'coconut oil'],
  };

  const ingredientLower = ingredient.toLowerCase();
  for (const [category, items] of Object.entries(categories)) {
    if (items.some((item) => ingredientLower.includes(item))) {
      return category;
    }
  }

  return 'other';
}

/**
 * Get ingredient colors for visual context
 */
function getIngredientColors(ingredient: string): string[] {
  const colors: Record<string, string[]> = {
    tomato: ['red', 'deep red'],
    carrot: ['orange', 'bright orange'],
    spinach: ['green', 'dark green'],
    broccoli: ['green', 'dark green'],
    onion: ['white', 'yellow', 'brown'],
    garlic: ['white', 'cream'],
    chicken: ['golden', 'brown', 'white'],
    beef: ['brown', 'deep brown', 'red'],
    cheese: ['yellow', 'white', 'golden'],
    pepper: ['red', 'green', 'yellow', 'orange'],
    mushroom: ['brown', 'white', 'gray'],
    herbs: ['green', 'fresh green'],
  };

  const ingredientLower = ingredient.toLowerCase();
  for (const [pattern, colorList] of Object.entries(colors)) {
    if (ingredientLower.includes(pattern)) {
      return colorList;
    }
  }

  return ['natural'];
}

/**
 * Get ingredient textures for visual context
 */
function getIngredientTextures(ingredient: string): string[] {
  const textures: Record<string, string[]> = {
    crispy: ['fried', 'crust', 'bread'],
    tender: ['meat', 'chicken', 'beef'],
    creamy: ['cheese', 'cream', 'sauce'],
    crunchy: ['nuts', 'seeds', 'vegetables'],
    smooth: ['puree', 'soup', 'sauce'],
    flaky: ['fish', 'pastry', 'bread'],
  };

  const ingredientLower = ingredient.toLowerCase();
  const result: string[] = [];

  for (const [texture, patterns] of Object.entries(textures)) {
    if (patterns.some((pattern) => ingredientLower.includes(pattern))) {
      result.push(texture);
    }
  }

  return result.length > 0 ? result : ['natural'];
}

/**
 * Analyze dish type from recipe context
 */
function analyzeDishType(recipe: RecipeFormData): DishType | null {
  if (!recipe.categories || recipe.categories.length === 0) return null;

  const courseCategory = recipe.categories.find((cat) =>
    cat.includes('Course:')
  );
  const course = courseCategory?.split(':')[1]?.trim();

  if (!course) return null;

  const dishTypes: Record<string, DishType> = {
    Appetizer: {
      type: 'appetizer',
      presentation: 'small portions',
      servingStyle: 'elegant arrangement',
    },
    Main: {
      type: 'main course',
      presentation: 'generous portions',
      servingStyle: 'centerpiece presentation',
    },
    Dessert: {
      type: 'dessert',
      presentation: 'sweet finish',
      servingStyle: 'decorative plating',
    },
    Side: {
      type: 'side dish',
      presentation: 'complementary portion',
      servingStyle: 'supporting presentation',
    },
    Soup: {
      type: 'soup',
      presentation: 'bowl presentation',
      servingStyle: 'steaming hot',
    },
    Salad: {
      type: 'salad',
      presentation: 'fresh arrangement',
      servingStyle: 'crisp presentation',
    },
  };

  return (
    dishTypes[course || ''] || {
      type: 'dish',
      presentation: 'standard plating',
      servingStyle: 'traditional presentation',
    }
  );
}

/**
 * Analyze recipe complexity
 */
function analyzeComplexity(recipe: RecipeFormData): ComplexityLevel {
  let complexityScore = 0;

  // Ingredient count
  if (recipe.ingredients) {
    if (recipe.ingredients.length > 10) complexityScore += 3;
    else if (recipe.ingredients.length > 6) complexityScore += 2;
    else if (recipe.ingredients.length > 3) complexityScore += 1;
  }

  // Instruction length
  if (recipe.instructions) {
    if (recipe.instructions.length > 500) complexityScore += 3;
    else if (recipe.instructions.length > 300) complexityScore += 2;
    else if (recipe.instructions.length > 150) complexityScore += 1;
  }

  // Setup items
  if (recipe.setup && recipe.setup.length > 0) {
    complexityScore += recipe.setup.length;
  }

  if (complexityScore >= 6) return 'elaborate';
  if (complexityScore >= 4) return 'complex';
  if (complexityScore >= 2) return 'moderate';
  return 'simple';
}

/**
 * Analyze seasonal context
 */
function analyzeSeasonalContext(
  recipe: RecipeFormData
): SeasonalContext | null {
  if (!recipe.ingredients) return null;

  const ingredientsText = recipe.ingredients.join(' ').toLowerCase();

  const seasonalIngredients: Record<string, string[]> = {
    spring: ['asparagus', 'peas', 'artichoke', 'strawberry', 'rhubarb'],
    summer: [
      'tomato',
      'tomatoes',
      'corn',
      'zucchini',
      'basil',
      'peach',
      'berry',
    ],
    fall: ['pumpkin', 'apple', 'squash', 'cranberry', 'sweet potato'],
    winter: ['citrus', 'root vegetables', 'winter squash', 'pomegranate'],
  };

  for (const [season, ingredients] of Object.entries(seasonalIngredients)) {
    if (ingredients.some((ing) => ingredientsText.includes(ing))) {
      return {
        season: season as 'spring' | 'summer' | 'fall' | 'winter',
        elements: ingredients.filter((ing) => ingredientsText.includes(ing)),
      };
    }
  }

  return null;
}

/**
 * Analyze cultural context
 */
function analyzeCulturalContext(
  recipe: RecipeFormData
): CulturalContext | null {
  const cuisine = analyzeCuisine(recipe);
  if (!cuisine) return null;

  // Determine occasion and setting based on cuisine and complexity
  const complexity = analyzeComplexity(recipe);

  return {
    tradition: cuisine.name,
    occasion: complexity === 'elaborate' ? 'special occasion' : 'everyday meal',
    setting: cuisine.region === 'European' ? 'fine dining' : 'home cooking',
  };
}

/**
 * Analyze visual style preferences
 */
function analyzeVisualStyle(recipe: RecipeFormData): VisualStyle | null {
  const cuisine = analyzeCuisine(recipe);
  const complexity = analyzeComplexity(recipe);
  const dishType = analyzeDishType(recipe);

  if (!cuisine) return null;

  return {
    style: cuisine.visualElements[0] || 'traditional',
    lighting:
      complexity === 'elaborate' ? 'dramatic lighting' : 'natural lighting',
    composition:
      dishType?.type === 'dessert'
        ? 'artistic arrangement'
        : 'appetizing layout',
    mood: complexity === 'simple' ? 'comforting' : 'sophisticated',
  };
}

/**
 * Analyze temperature context
 */
function analyzeTemperature(recipe: RecipeFormData): TemperatureContext | null {
  if (!recipe.instructions) return null;

  const instructionsLower = recipe.instructions.toLowerCase();

  if (instructionsLower.includes('hot') || instructionsLower.includes('warm')) {
    return {
      servingTemp: 'hot',
      visualCues: ['steam rising', 'warm colors', 'hot presentation'],
    };
  }

  if (
    instructionsLower.includes('cold') ||
    instructionsLower.includes('chilled') ||
    instructionsLower.includes('refrigerator')
  ) {
    return {
      servingTemp: 'cold',
      visualCues: ['cool presentation', 'fresh appearance', 'cold serving'],
    };
  }

  if (
    instructionsLower.includes('frozen') ||
    instructionsLower.includes('ice')
  ) {
    return {
      servingTemp: 'frozen',
      visualCues: ['frozen appearance', 'ice crystals', 'cold presentation'],
    };
  }

  return {
    servingTemp: 'room',
    visualCues: ['room temperature', 'natural serving'],
  };
}

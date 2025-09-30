import { useCallback, useMemo } from 'react';
import { useShoppingList } from './useShoppingList';
import { useUserGroceryCart } from './useUserGroceryCart';
// Live AI calls will route directly via openaiAPI to avoid altering hook order
import { openaiAPI } from '@/lib/openai';
import { useIngredientMatching } from './useIngredientMatching'; // EXISTING HOOK
import { CuisineStaplesManager } from '@/lib/shopping-cart/cuisine-staples';
import { IngredientMatcher } from '@/lib/groceries/ingredient-matcher';
import type {
  CuisineStaple,
  MissingStaples,
} from '@/lib/shopping-cart/cuisine-staples';

// Shopping cart context for AI
export interface ShoppingCartContext {
  currentShoppingList: Record<
    string,
    { name: string; category: string; source: string }
  >;
  userGroceries: Record<string, string[]>;
  recentRecipes?: { id: string; title: string }[];
}

// AI prompt context
export interface AIPromptContext {
  ingredients: {
    inCart: string[];
    inGroceries: string[];
    combined: string[];
  };
  systemPrompt: string;
}

export interface UseShoppingCartAIReturn {
  // Existing methods
  getChatResponse: (message: string) => Promise<string>;
  addToShoppingCart: (ingredients: string[]) => Promise<void>;
  buildContext: () => ShoppingCartContext;
  buildPromptContext: () => string;

  // NEW: Cuisine staples using existing infrastructure
  availableCuisines: string[];
  getCuisineStaples: (cuisine: string) => CuisineStaple[];
  getMissingStaples: (cuisine: string) => MissingStaples;
  getAllMissingStaples: () => MissingStaples[];
  getRecommendedAdditions: (
    cuisine: string,
    maxRecommendations?: number
  ) => CuisineStaple[];
  addStaplesToGroceries: (staples: string[]) => Promise<void>;
}

/**
 * Hook for AI-powered shopping cart assistance
 * Integrates with existing chat system and shopping list functionality
 */
export function useShoppingCartAI(): UseShoppingCartAIReturn {
  const { shoppingList, addToShoppingList } = useShoppingList();
  const { userGroceryCart, addToCart } = useUserGroceryCart();
  // Conversation not needed for deterministic recommendations reply
  // const { sendMessage } = useConversation();

  // LEVERAGE EXISTING HOOK: Use the battle-tested ingredient matching
  const { matchIngredient } = useIngredientMatching();

  // NEW: Cuisine staples manager
  const cuisineStaplesManager = useMemo(() => new CuisineStaplesManager(), []);

  // Create ingredient matcher for cuisine analysis
  const ingredientMatcher = useMemo(
    () => new IngredientMatcher(userGroceryCart),
    [userGroceryCart]
  );

  // Get available cuisines
  const availableCuisines = useMemo(
    () => cuisineStaplesManager.getAvailableCuisines(),
    [cuisineStaplesManager]
  );

  // Build shopping cart context for AI
  const buildContext = useCallback((): ShoppingCartContext => {
    return {
      currentShoppingList: shoppingList,
      userGroceries: userGroceryCart,
    };
  }, [shoppingList, userGroceryCart]);

  // Enhanced context building with cuisine staples info
  const buildPromptContext = useCallback((): string => {
    const cartIngredients = Object.values(shoppingList).map(
      (item) => item.name
    );
    const groceryIngredients = Object.keys(userGroceryCart).flatMap(
      (category) => userGroceryCart[category] || []
    );

    // Get missing staples for context
    const allMissingStaples = cuisineStaplesManager.getAllMissingStaples(
      userGroceryCart,
      ingredientMatcher
    );
    const cuisineContext =
      allMissingStaples.length > 0
        ? `\nMissing cuisine staples: ${allMissingStaples.map((c) => `${c.cuisine} (${c.coverage}% coverage)`).join(', ')}`
        : '';

    return `
Current shopping cart: ${cartIngredients.join(', ') || 'empty'}
My groceries: ${groceryIngredients.join(', ') || 'none'}${cuisineContext}
    `.trim();
  }, [shoppingList, userGroceryCart, cuisineStaplesManager, ingredientMatcher]);

  // Enhanced chat response with cuisine context
  const getChatResponse = useCallback(
    async (message: string): Promise<string> => {
      try {
        // Build live context and call OpenAI directly with a default persona
        const context = buildPromptContext();
        const userPrompt = `${context}\n\nUser question: ${message}`;
        const response = await openaiAPI.chatWithPersona(
          [
            {
              id: Date.now().toString(),
              role: 'user',
              content: userPrompt,
              timestamp: new Date(),
            },
          ],
          'chef'
        );
        const cta =
          '\n\nWould you like me to add the ingredients to your kitchen?';
        return `${response.message}${cta}`;
      } catch {
        // Fallback to deterministic suggestions if AI fails
        const allMissing = cuisineStaplesManager.getAllMissingStaples(
          userGroceryCart,
          ingredientMatcher
        );
        if (allMissing.length === 0) {
          return "You're in great shape! I don't see obvious gaps for major cuisines.";
        }
        const focus = allMissing[0];
        const recommendations = cuisineStaplesManager.getRecommendedAdditions(
          focus.cuisine,
          userGroceryCart,
          ingredientMatcher,
          6
        );
        const bullets = recommendations
          .map((s) => `• ${s.ingredient} — ${s.reason}`)
          .join('\n');
        const cta =
          '\n\nWould you like me to add the ingredients to your kitchen?';
        return `Here are some ${focus.cuisine} additions while AI is unavailable:\n\n${bullets}${cta}`;
      }
    },
    [
      buildPromptContext,
      cuisineStaplesManager,
      userGroceryCart,
      ingredientMatcher,
    ]
  );

  // Add multiple ingredients to shopping cart using existing categorization
  const addToShoppingCart = useCallback(
    async (ingredients: string[]): Promise<void> => {
      for (const ingredient of ingredients) {
        // Use existing ingredient matching to find the best category
        const match = matchIngredient(ingredient);
        const category =
          match.matchedCategory || categorizeIngredient(ingredient);

        await addToShoppingList(ingredient, category, 'ai-chat', {
          sourceTitle: 'AI Shopping Assistant',
          notes: 'Suggested by AI assistant',
        });
      }
    },
    [addToShoppingList, matchIngredient]
  );

  // Add staples to groceries using existing cart system
  const addStaplesToGroceries = useCallback(
    async (staples: string[]): Promise<void> => {
      for (const staple of staples) {
        // Use existing matching to find best category
        const match = matchIngredient(staple);
        const category = match.matchedCategory || categorizeIngredient(staple);

        await addToCart(category, staple);
      }
    },
    [addToCart, matchIngredient]
  );

  // Get cuisine staples
  const getCuisineStaples = useCallback(
    (cuisine: string) => cuisineStaplesManager.getCuisineStaples(cuisine),
    [cuisineStaplesManager]
  );

  // Get missing staples for a cuisine
  const getMissingStaples = useCallback(
    (cuisine: string) =>
      cuisineStaplesManager.findMissingStaples(
        cuisine,
        userGroceryCart,
        ingredientMatcher
      ),
    [cuisineStaplesManager, userGroceryCart, ingredientMatcher]
  );

  // Get all missing staples
  const getAllMissingStaples = useCallback(
    () =>
      cuisineStaplesManager.getAllMissingStaples(
        userGroceryCart,
        ingredientMatcher
      ),
    [cuisineStaplesManager, userGroceryCart, ingredientMatcher]
  );

  // Get recommended additions for a cuisine
  const getRecommendedAdditions = useCallback(
    (cuisine: string, maxRecommendations = 5) =>
      cuisineStaplesManager.getRecommendedAdditions(
        cuisine,
        userGroceryCart,
        ingredientMatcher,
        maxRecommendations
      ),
    [cuisineStaplesManager, userGroceryCart, ingredientMatcher]
  );

  return {
    // Existing methods
    getChatResponse,
    addToShoppingCart,
    buildContext,
    buildPromptContext,

    // NEW methods leveraging existing infrastructure
    availableCuisines,
    getCuisineStaples,
    getMissingStaples,
    getAllMissingStaples,
    getRecommendedAdditions,
    addStaplesToGroceries,
  };
}

/**
 * Simple ingredient categorization heuristic
 * Maps ingredient names to likely categories
 */
function categorizeIngredient(ingredient: string): string {
  const name = ingredient.toLowerCase();

  // Spices and seasonings
  if (
    name.includes('oregano') ||
    name.includes('cumin') ||
    name.includes('paprika') ||
    name.includes('chili') ||
    name.includes('pepper') ||
    name.includes('salt') ||
    name.includes('garlic powder') ||
    name.includes('onion powder')
  ) {
    return 'flavor_builders';
  }

  // Fresh produce
  if (
    name.includes('onion') ||
    name.includes('tomato') ||
    name.includes('pepper') ||
    name.includes('cilantro') ||
    name.includes('basil') ||
    name.includes('lime') ||
    name.includes('lemon') ||
    name.includes('avocado') ||
    name.includes('jalapeño')
  ) {
    return 'fresh_produce';
  }

  // Dairy
  if (
    name.includes('cheese') ||
    name.includes('milk') ||
    name.includes('butter') ||
    name.includes('cream') ||
    name.includes('yogurt')
  ) {
    return 'dairy_cold';
  }

  // Oils and cooking essentials
  if (
    name.includes('oil') ||
    name.includes('vinegar') ||
    name.includes('wine')
  ) {
    return 'cooking_essentials';
  }

  // Pantry staples
  if (
    name.includes('flour') ||
    name.includes('sugar') ||
    name.includes('rice') ||
    name.includes('pasta') ||
    name.includes('beans') ||
    name.includes('sauce')
  ) {
    return 'pantry_staples';
  }

  // Proteins
  if (
    name.includes('chicken') ||
    name.includes('beef') ||
    name.includes('pork') ||
    name.includes('fish') ||
    name.includes('egg') ||
    name.includes('tofu')
  ) {
    return 'proteins';
  }

  // Default to fresh produce for unknown items
  return 'fresh_produce';
}

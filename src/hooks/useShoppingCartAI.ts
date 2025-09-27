import { useCallback } from 'react';
import { useShoppingList } from './useShoppingList';
import { useUserGroceryCart } from './useUserGroceryCart';
import { useConversation } from './useConversation';

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
  // AI interaction
  getChatResponse: (message: string) => Promise<void>;
  addToShoppingCart: (ingredients: string[]) => Promise<void>;

  // Context building
  buildContext: () => ShoppingCartContext;
  buildPromptContext: () => string;
}

/**
 * Hook for AI-powered shopping cart assistance
 * Integrates with existing chat system and shopping list functionality
 */
export function useShoppingCartAI(): UseShoppingCartAIReturn {
  const { shoppingList, addToShoppingList } = useShoppingList();
  const { userGroceryCart } = useUserGroceryCart();
  const { sendMessage } = useConversation();

  // Build shopping cart context for AI
  const buildContext = useCallback((): ShoppingCartContext => {
    return {
      currentShoppingList: shoppingList,
      userGroceries: userGroceryCart,
    };
  }, [shoppingList, userGroceryCart]);

  // Build prompt context string for AI
  const buildPromptContext = useCallback((): string => {
    const cartIngredients = Object.values(shoppingList).map(
      (item) => item.name
    );
    const groceryIngredients = Object.keys(userGroceryCart).flatMap(
      (category) => userGroceryCart[category] || []
    );

    return `
Current shopping cart: ${cartIngredients.join(', ') || 'empty'}
My groceries: ${groceryIngredients.join(', ') || 'none'}
    `.trim();
  }, [shoppingList, userGroceryCart]);

  // Get AI chat response with shopping context
  const getChatResponse = useCallback(
    async (message: string) => {
      const context = buildPromptContext();

      // Prepend context to the message for the AI
      const contextualMessage = `${context}\n\nUser question: ${message}`;

      return sendMessage(contextualMessage);
    },
    [buildPromptContext, sendMessage]
  );

  // Add multiple ingredients to shopping cart
  const addToShoppingCart = useCallback(
    async (ingredients: string[]): Promise<void> => {
      for (const ingredient of ingredients) {
        // Try to categorize the ingredient (simple heuristic)
        const category = categorizeIngredient(ingredient);

        await addToShoppingList(ingredient, category, 'ai-chat', {
          sourceTitle: 'AI Shopping Assistant',
          notes: 'Suggested by AI assistant',
        });
      }
    },
    [addToShoppingList]
  );

  return {
    getChatResponse,
    addToShoppingCart,
    buildContext,
    buildPromptContext,
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

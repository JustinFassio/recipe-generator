<!-- Placeholder: Technical specification & implementation plan for Shopping Cart -->

# Shopping Cart Feature - Technical Specification

**Project:** Recipe Generator  
**Feature:** Shopping Cart with AI Assistant  
**Document:** `docs/features/shopping-cart/01-technical-specification.md`  
**Author:** AI Assistant  
**Date:** September 2025  
**Status:** Implementation Ready

---

## 🎯 **Technical Overview**

The Shopping Cart feature provides a dedicated shopping interface that aggregates ingredients from multiple sources (recipes, AI chat, public recipes, grocery restocking) with an AI assistant for cuisine-specific suggestions. Built as a lightweight extension to the existing `user_groceries` system with minimal architectural changes.

### **Core Technical Principles**

- **Zero-Disruption Integration**: Uses existing `user_groceries` table with optional metadata columns
- **Multi-Source Aggregation**: Handles ingredients from recipes, AI chat, public recipes, and grocery restocking
- **Simple AI Integration**: Cuisine-focused assistant using existing AI infrastructure
- **Mobile-First Shopping**: Optimized interface for actual in-store use
- **Context Preservation**: Tracks which recipes need which ingredients

---

## 🏗️ **System Architecture**

### **Integration Strategy**

```typescript
// Simple Data Flow
Recipe Missing Ingredients → Shopping List → AI Assistant → Shopping Mode → Mark Available

// Data Layers (Minimal Changes)
1. user_groceries (existing) → Add shopping_list + shopping_contexts columns
2. global_ingredients (existing) → No changes needed
3. ingredient_learning_log (existing) → No changes needed
4. AI conversations → Use existing chat infrastructure
```

### **Hook Architecture**

```typescript
// useShoppingList - Extends existing useGroceries
const useShoppingList = () => {
  const groceries = useGroceries(); // Existing hook
  const { user } = useAuth(); // Existing hook

  // Shopping list state (stored in user_groceries table)
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [shoppingContexts, setShoppingContexts] = useState<
    Record<string, ItemContext>
  >({});

  return {
    // Core shopping list data
    shoppingList,
    shoppingCount: shoppingList.filter((item) => item.status === 'pending')
      .length,

    // Multi-source integration
    addFromRecipe: (ingredient: string, recipeId: string) => {
      /* Add ingredient with recipe context */
    },
    addFromAIChat: (ingredients: string[], chatContext: string) => {
      /* Add AI-suggested ingredients */
    },
    addFromGroceries: (outOfStockItems: string[]) => {
      /* Add grocery restocking items */
    },

    // Shopping operations
    markAsPurchased: (ingredient: string) => {
      /* Mark as purchased */
    },
    clearPurchased: () => {
      /* Remove completed items */
    },

    // Context tracking
    getItemContext: (ingredient: string) => shoppingContexts[ingredient],

    // Export
    exportAsText: () => {
      /* Simple text export */
    },
  };
};

// useShoppingCartAI - AI assistant for shopping cart
const useShoppingCartAI = (shoppingList: ShoppingItem[]) => {
  return {
    analyzeCuisinePatterns: (items: ShoppingItem[]) => {
      /* Detect cuisines from ingredients */
    },
    getSuggestions: (detectedCuisines: string[]) => {
      /* Get authentic staples for cuisines */
    },
    addStaplesToGroceries: (staples: string[]) => {
      /* Bulk add to My Groceries */
    },
  };
};
```

---

## 📊 **Data Architecture**

### **Database Schema Changes**

```sql
-- Add shopping list columns to existing user_groceries table
ALTER TABLE user_groceries
ADD COLUMN shopping_list JSONB DEFAULT '{}',
ADD COLUMN shopping_contexts JSONB DEFAULT '{}';

-- Structure:
-- shopping_list: {"ingredient_name": "pending|purchased"}
-- shopping_contexts: {"ingredient_name": {
--   "sources": ["recipe_id", "ai_chat", "groceries_restock"],
--   "quantities": ["2 cups", "1 lb"],
--   "notes": "Need more for multiple recipes"
-- }}
```

### **TypeScript Interfaces**

```typescript
// Shopping list item with context
interface ShoppingItem {
  name: string;
  normalizedName: string;
  status: 'pending' | 'purchased';
  addedAt: Date;
  sources: ItemSource[];
  quantities?: string[];
  notes?: string;
}

interface ItemSource {
  type: 'recipe' | 'ai_chat' | 'groceries_restock' | 'manual';
  id?: string; // recipe_id for recipes, chat_id for AI
  context?: string; // "Main dish", "Side suggested by AI", etc.
}

interface ItemContext {
  sources: ItemSource[];
  quantities: string[];
  notes?: string;
}

// AI suggestion for cuisine staples
interface CuisineSuggestion {
  ingredient: string;
  category: string; // Chef Isabella category
  reason: string; // "Essential for authentic Mexican cooking"
  usage: string; // "Used in tacos, salsas, and marinades"
  priority: 'essential' | 'recommended' | 'optional';
}

// Detected cuisine pattern
interface DetectedCuisine {
  type: string; // 'mexican', 'italian', 'asian', etc.
  confidence: number; // 0-1
  evidenceIngredients: string[]; // Ingredients that indicate this cuisine
  suggestedStaples: CuisineSuggestion[];
}
```

---

## 🔧 **Core Implementation**

### **Primary Hook: useShoppingList**

```typescript
// File: src/hooks/useShoppingList.ts
import { useGroceries } from './useGroceries';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';

export interface UseShoppingListReturn {
  // Core data
  shoppingList: ShoppingItem[];
  shoppingCount: number;
  isLoading: boolean;

  // Multi-source addition
  addFromRecipe: (
    ingredients: string[],
    recipeId: string,
    recipeTitle: string
  ) => Promise<void>;
  addFromAIChat: (ingredients: string[], chatContext: string) => Promise<void>;
  addFromGroceries: (outOfStockItems: string[]) => Promise<void>;
  addManual: (ingredient: string, notes?: string) => Promise<void>;

  // Shopping operations
  markAsPurchased: (ingredient: string) => Promise<void>;
  markAllPurchased: () => Promise<void>;
  clearPurchased: () => Promise<void>;
  removeItem: (ingredient: string) => Promise<void>;

  // Context and export
  getItemContext: (ingredient: string) => ItemContext | undefined;
  exportAsText: () => string;

  // Integration with existing grocery system
  syncToGroceries: () => Promise<void>; // Mark purchased items as available in My Groceries
}

export const useShoppingList = (): UseShoppingListReturn => {
  const { user } = useAuth();
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [shoppingContexts, setShoppingContexts] = useState<
    Record<string, ItemContext>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  // Load shopping list from database
  useEffect(() => {
    if (user) {
      loadShoppingList();
    }
  }, [user]);

  const loadShoppingList = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_groceries')
        .select('shopping_list, shopping_contexts')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data?.shopping_list) {
        const items = Object.entries(data.shopping_list).map(
          ([name, status]) => ({
            name,
            normalizedName: name.toLowerCase().trim(),
            status: status as 'pending' | 'purchased',
            addedAt: new Date(), // Could be enhanced with actual timestamps
            sources: data.shopping_contexts?.[name]?.sources || [],
          })
        );
        setShoppingList(items);
        setShoppingContexts(data.shopping_contexts || {});
      }
    } catch (error) {
      console.error('Failed to load shopping list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Core shopping list operations
  const addFromRecipe = async (
    ingredients: string[],
    recipeId: string,
    recipeTitle: string
  ) => {
    const newItems = ingredients.map((ingredient) => ({
      name: ingredient,
      normalizedName: ingredient.toLowerCase().trim(),
      status: 'pending' as const,
      addedAt: new Date(),
      sources: [
        {
          type: 'recipe' as const,
          id: recipeId,
          context: recipeTitle,
        },
      ],
    }));

    await updateShoppingList([...shoppingList, ...newItems]);
  };

  const addFromAIChat = async (ingredients: string[], chatContext: string) => {
    const newItems = ingredients.map((ingredient) => ({
      name: ingredient,
      normalizedName: ingredient.toLowerCase().trim(),
      status: 'pending' as const,
      addedAt: new Date(),
      sources: [
        {
          type: 'ai_chat' as const,
          context: chatContext,
        },
      ],
    }));

    await updateShoppingList([...shoppingList, ...newItems]);
  };

  const addFromGroceries = async (outOfStockItems: string[]) => {
    const newItems = outOfStockItems.map((ingredient) => ({
      name: ingredient,
      normalizedName: ingredient.toLowerCase().trim(),
      status: 'pending' as const,
      addedAt: new Date(),
      sources: [
        {
          type: 'groceries_restock' as const,
          context: 'Out of stock - restocking',
        },
      ],
    }));

    await updateShoppingList([...shoppingList, ...newItems]);
  };

  // Helper function to update shopping list in database
  const updateShoppingList = async (newShoppingList: ShoppingItem[]) => {
    try {
      // Convert to database format
      const shoppingListData = newShoppingList.reduce(
        (acc, item) => {
          acc[item.name] = item.status;
          return acc;
        },
        {} as Record<string, string>
      );

      const contextData = newShoppingList.reduce(
        (acc, item) => {
          acc[item.name] = {
            sources: item.sources,
            quantities: item.quantities || [],
            notes: item.notes,
          };
          return acc;
        },
        {} as Record<string, ItemContext>
      );

      const { error } = await supabase.from('user_groceries').upsert({
        user_id: user.id,
        shopping_list: shoppingListData,
        shopping_contexts: contextData,
      });

      if (error) throw error;

      setShoppingList(newShoppingList);
      setShoppingContexts(contextData);
    } catch (error) {
      console.error('Failed to update shopping list:', error);
      throw error;
    }
  };

  // Shopping operations
  const markAsPurchased = async (ingredient: string) => {
    const updatedList = shoppingList.map((item) =>
      item.name === ingredient
        ? { ...item, status: 'purchased' as const }
        : item
    );
    await updateShoppingList(updatedList);
  };

  const markAllPurchased = async () => {
    const updatedList = shoppingList.map((item) => ({
      ...item,
      status: 'purchased' as const,
    }));
    await updateShoppingList(updatedList);
  };

  const clearPurchased = async () => {
    const updatedList = shoppingList.filter(
      (item) => item.status === 'pending'
    );
    await updateShoppingList(updatedList);
  };

  const removeItem = async (ingredient: string) => {
    const updatedList = shoppingList.filter((item) => item.name !== ingredient);
    await updateShoppingList(updatedList);
  };

  // Export functionality
  const exportAsText = (): string => {
    let text = '# Shopping List\n';
    text += `Generated: ${new Date().toLocaleDateString()}\n`;
    text += `Total Items: ${shoppingList.filter((i) => i.status === 'pending').length}\n\n`;

    const pendingItems = shoppingList.filter(
      (item) => item.status === 'pending'
    );

    pendingItems.forEach((item) => {
      const context = shoppingContexts[item.name];
      const sources = context?.sources?.map((s) => s.context).join(', ') || '';
      const sourceText = sources ? ` (for: ${sources})` : '';

      text += `- ${item.name}${sourceText}\n`;
    });

    return text;
  };

  // Integration with existing grocery system
  const syncToGroceries = async () => {
    const { toggleIngredient } = useGroceries();
    const purchasedItems = shoppingList.filter(
      (item) => item.status === 'purchased'
    );

    // Mark purchased items as available in My Groceries
    for (const item of purchasedItems) {
      // This would need category detection - simplified for now
      toggleIngredient('pantry_staples', item.name);
    }

    // Clear purchased items from shopping list
    await clearPurchased();
  };

  return {
    shoppingList,
    shoppingCount: shoppingList.filter((item) => item.status === 'pending')
      .length,
    isLoading,
    addFromRecipe,
    addFromAIChat,
    addFromGroceries,
    addManual: async (ingredient: string, notes?: string) => {
      await addFromRecipe([ingredient], 'manual', notes || 'Manually added');
    },
    markAsPurchased,
    markAllPurchased,
    clearPurchased,
    removeItem,
    getItemContext: (ingredient: string) => shoppingContexts[ingredient],
    exportAsText,
    syncToGroceries,
  };
};
```

---

## 🤖 **AI System Integration**

### **Shopping Cart AI Assistant Hook**

```typescript
// File: src/hooks/useShoppingCartAI.ts
// Simple AI assistant for cuisine suggestions

import { useConversation } from '@/hooks/useConversation';
import { CHEF_ISABELLA_SYSTEM_CATALOG } from '@/lib/groceries/categories';

export const useShoppingCartAI = (shoppingList: ShoppingItem[]) => {
  const { sendMessage } = useConversation();

  const analyzeCuisinePatterns = (items: ShoppingItem[]): DetectedCuisine[] => {
    const ingredients = items.map((item) => item.name.toLowerCase());
    const detectedCuisines: DetectedCuisine[] = [];

    // Simple pattern matching for cuisines
    const cuisinePatterns = {
      mexican: [
        'cumin',
        'cilantro',
        'lime',
        'chili',
        'pepper',
        'onion',
        'tomato',
        'avocado',
      ],
      italian: [
        'basil',
        'oregano',
        'tomato',
        'garlic',
        'olive oil',
        'parmesan',
        'mozzarella',
      ],
      asian: [
        'soy sauce',
        'ginger',
        'garlic',
        'rice',
        'sesame',
        'green onion',
        'chili',
      ],
      mediterranean: [
        'olive oil',
        'lemon',
        'garlic',
        'herbs',
        'feta',
        'olives',
      ],
    };

    Object.entries(cuisinePatterns).forEach(([cuisine, patterns]) => {
      const matches = patterns.filter((pattern) =>
        ingredients.some((ingredient) => ingredient.includes(pattern))
      );

      if (matches.length >= 2) {
        detectedCuisines.push({
          type: cuisine,
          confidence: matches.length / patterns.length,
          evidenceIngredients: matches,
          suggestedStaples: getCuisineStaples(cuisine),
        });
      }
    });

    return detectedCuisines.sort((a, b) => b.confidence - a.confidence);
  };

  const getCuisineStaples = (cuisine: string): CuisineSuggestion[] => {
    const staples = {
      mexican: [
        {
          ingredient: 'Cumin',
          category: 'pantry_staples',
          reason: 'Essential for authentic Mexican seasoning',
          usage: 'Used in tacos, beans, and meat dishes',
          priority: 'essential' as const,
        },
        {
          ingredient: 'Mexican Oregano',
          category: 'pantry_staples',
          reason: 'Different from regular oregano with citrusy flavor',
          usage: 'Perfect with lime and cumin',
          priority: 'essential' as const,
        },
        {
          ingredient: 'Poblano Peppers',
          category: 'fresh_produce',
          reason: 'Mild heat, great for stuffing',
          usage: 'Essential for chiles rellenos and mole',
          priority: 'recommended' as const,
        },
        {
          ingredient: 'Limes',
          category: 'fresh_produce',
          reason: 'Critical for authentic Mexican flavor',
          usage: 'Used in marinades, drinks, and garnishes',
          priority: 'essential' as const,
        },
      ],
      italian: [
        {
          ingredient: 'Fresh Basil',
          category: 'fresh_produce',
          reason: 'Essential for Italian cooking',
          usage: 'Perfect for pasta, pizza, and sauces',
          priority: 'essential' as const,
        },
        {
          ingredient: 'Good Olive Oil',
          category: 'pantry_staples',
          reason: 'Foundation of Italian cuisine',
          usage: 'For cooking and finishing dishes',
          priority: 'essential' as const,
        },
        {
          ingredient: 'Parmigiano-Reggiano',
          category: 'dairy_eggs',
          reason: 'The king of Italian cheeses',
          usage: 'For pasta, risotto, and salads',
          priority: 'recommended' as const,
        },
      ],
      asian: [
        {
          ingredient: 'Fresh Ginger',
          category: 'fresh_produce',
          reason: 'Essential for Asian flavors',
          usage: 'Used in stir-fries, marinades, and soups',
          priority: 'essential' as const,
        },
        {
          ingredient: 'Soy Sauce',
          category: 'pantry_staples',
          reason: 'Umami foundation',
          usage: 'For marinades, sauces, and seasoning',
          priority: 'essential' as const,
        },
        {
          ingredient: 'Sesame Oil',
          category: 'pantry_staples',
          reason: 'Distinctive nutty flavor',
          usage: 'For finishing dishes and dressings',
          priority: 'recommended' as const,
        },
      ],
    };

    return staples[cuisine as keyof typeof staples] || [];
  };

  const getChatResponse = async (
    message: string,
    detectedCuisines: DetectedCuisine[]
  ) => {
    const context = `
Shopping Cart Analysis:
- Total items: ${shoppingList.length}
- Detected cuisines: ${detectedCuisines.map((c) => c.type).join(', ')}
- Current ingredients: ${shoppingList.map((item) => item.name).join(', ')}

User is asking about: ${message}

Provide helpful shopping advice with specific ingredient suggestions for authentic ${detectedCuisines[0]?.type || 'cooking'}.
    `;

    return await sendMessage(context);
  };

  return {
    analyzeCuisinePatterns,
    getCuisineStaples,
    getChatResponse,
  };
};
```

---

## 🎨 **Component Architecture**

### **Main Shopping Cart Page**

```typescript
// File: src/pages/ShoppingCartPage.tsx
import React, { useState } from 'react';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useShoppingCartAI } from '@/hooks/useShoppingCartAI';

const ShoppingCartPage: React.FC = () => {
  const [shoppingMode, setShoppingMode] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(true);

  const shoppingList = useShoppingList();
  const shoppingAI = useShoppingCartAI(shoppingList.shoppingList);

  // Detect cuisines from current shopping list
  const detectedCuisines = shoppingAI.analyzeCuisinePatterns(shoppingList.shoppingList);

  if (shoppingMode) {
    return (
      <ShoppingModeView
        shoppingList={shoppingList.shoppingList}
        onMarkPurchased={shoppingList.markAsPurchased}
        onExitShoppingMode={() => setShoppingMode(false)}
      />
    );
  }

  return (
    <div className="shopping-cart-page min-h-screen bg-base-100">
      {/* Header */}
      <div className="navbar bg-base-200">
        <div className="navbar-start">
          <h1 className="text-xl font-bold">Shopping Cart ({shoppingList.shoppingCount})</h1>
        </div>
        <div className="navbar-end">
          <button
            className="btn btn-primary"
            onClick={() => setShoppingMode(true)}
            disabled={shoppingList.shoppingCount === 0}
          >
            Shopping Mode
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Shopping List (2/3) */}
        <div className="flex-1 p-6">
          <ShoppingListView
            items={shoppingList.shoppingList}
            onMarkPurchased={shoppingList.markAsPurchased}
            onRemoveItem={shoppingList.removeItem}
            getItemContext={shoppingList.getItemContext}
          />
        </div>

        {/* AI Assistant (1/3) */}
        {aiChatOpen && (
          <div className="w-1/3 border-l border-base-300">
            <ShoppingCartAI
              detectedCuisines={detectedCuisines}
              onAddStaples={(staples: string[]) => {
                staples.forEach(staple =>
                  shoppingList.addManual(staple, 'AI suggested staple')
                );
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="btm-nav">
        <button
          className="btn btn-ghost"
          onClick={() => shoppingList.exportAsText()}
        >
          Export
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => shoppingList.clearPurchased()}
        >
          Clear Purchased
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => shoppingList.syncToGroceries()}
        >
          Sync to Groceries
        </button>
      </div>
    </div>
  );
};

export default ShoppingCartPage;
```

---

## 🔒 **Security & Performance**

### **Database Security**

```sql
-- Shopping list data is already protected by existing user_groceries RLS
-- No additional security policies needed since we're using existing table
ALTER TABLE user_groceries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their shopping list"
  ON user_groceries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
```

### **Performance Optimizations**

```typescript
// Memoized cuisine analysis
const detectedCuisines = useMemo(() => {
  return shoppingAI.analyzeCuisinePatterns(shoppingList.shoppingList);
}, [shoppingList.shoppingList]);

// Debounced database updates
const debouncedUpdateShoppingList = useCallback(
  debounce(updateShoppingList, 300),
  []
);

// Optimistic UI updates
const markAsPurchased = async (ingredient: string) => {
  // Update UI immediately
  setShoppingList((prev) =>
    prev.map((item) =>
      item.name === ingredient ? { ...item, status: 'purchased' } : item
    )
  );

  // Then update database
  try {
    await debouncedUpdateShoppingList(updatedList);
  } catch (error) {
    // Revert on error
    setShoppingList(originalList);
    showErrorToast('Failed to update shopping list');
  }
};
```

### **Error Handling**

```typescript
// Simple error boundaries for shopping cart
const ShoppingCartErrorBoundary: React.FC = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="alert alert-error">
          <span>Shopping cart temporarily unavailable. Please refresh the page.</span>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

// AI fallback for offline/error states
const handleAIError = (error: Error) => {
  console.warn('AI assistant unavailable:', error);

  // Show basic ingredient suggestions instead
  const basicSuggestions = getBasicCuisineStaples(detectedCuisine);
  setSuggestions(basicSuggestions);
};
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**

```typescript
// File: src/hooks/__tests__/useShoppingList.test.ts
import { renderHook, act } from '@testing-library/react';
import { useShoppingList } from '../useShoppingList';

describe('useShoppingList', () => {
  test('should add ingredients from recipe', async () => {
    const { result } = renderHook(() => useShoppingList());

    await act(async () => {
      await result.current.addFromRecipe(
        ['tomatoes', 'onions'],
        'recipe-123',
        'Caesar Salad'
      );
    });

    expect(result.current.shoppingCount).toBe(2);
    expect(result.current.shoppingList[0].sources[0].context).toBe(
      'Caesar Salad'
    );
  });

  test('should mark items as purchased', async () => {
    const { result } = renderHook(() => useShoppingList());

    // Add item first
    await act(async () => {
      await result.current.addManual('tomatoes');
    });

    // Mark as purchased
    await act(async () => {
      await result.current.markAsPurchased('tomatoes');
    });

    expect(result.current.shoppingList[0].status).toBe('purchased');
  });
});
```

### **Integration Tests**

```typescript
// File: src/pages/__tests__/ShoppingCartPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ShoppingCartPage from '../ShoppingCartPage';

describe('ShoppingCartPage', () => {
  test('should display shopping list items', () => {
    render(<ShoppingCartPage />);

    expect(screen.getByText('Shopping Cart (0)')).toBeInTheDocument();
    expect(screen.getByText('Shopping Mode')).toBeDisabled();
  });

  test('should detect Mexican cuisine and show suggestions', async () => {
    // Mock shopping list with Mexican ingredients
    const mockShoppingList = [
      { name: 'cilantro', status: 'pending', sources: [] },
      { name: 'lime', status: 'pending', sources: [] },
      { name: 'cumin', status: 'pending', sources: [] }
    ];

    render(<ShoppingCartPage />);

    // Should detect Mexican cuisine and show AI suggestions
    expect(screen.getByText(/mexican/i)).toBeInTheDocument();
    expect(screen.getByText(/poblano peppers/i)).toBeInTheDocument();
  });
});
```

### **E2E Tests (Playwright)**

```typescript
// File: e2e/shopping-cart.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Shopping Cart Flow', () => {
  test("Alice's complete shopping journey", async ({ page }) => {
    await page.goto('/recipes/caesar-salad');

    // Add missing ingredients from recipe
    await page.click('[data-testid="add-missing-to-cart"]');
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('3');

    // Navigate to AI chat and add side dish
    await page.goto('/chat');
    await page.fill(
      '[data-testid="chat-input"]',
      'What side dish goes with Caesar salad?'
    );
    await page.click('[data-testid="send-message"]');
    await page.click('[data-testid="add-ingredients-to-cart"]');
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('6');

    // Visit shopping cart page
    await page.click('[data-testid="cart-badge"]');
    await expect(page).toHaveURL('/cart');

    // AI should detect cuisine and suggest staples
    await expect(page.locator('[data-testid="ai-assistant"]')).toContainText(
      'Mexican'
    );
    await expect(
      page.locator('[data-testid="suggested-staples"]')
    ).toBeVisible();

    // Enter shopping mode
    await page.click('[data-testid="shopping-mode"]');
    await expect(
      page.locator('[data-testid="shopping-checklist"]')
    ).toBeVisible();

    // Mark items as purchased
    await page.click('[data-testid="mark-purchased-tomatoes"]');
    await page.click('[data-testid="complete-shopping"]');

    // Should sync to groceries
    await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
  });
});
```

---

## 🚀 **Implementation Checklist**

### **Phase 1: Database & Hooks (Week 1)**

- [ ] Add `shopping_list` and `shopping_contexts` columns to `user_groceries`
- [ ] Implement `useShoppingList` hook with core CRUD operations
- [ ] Add shopping list badge to header component
- [ ] Create basic shopping cart page (`/cart`)

### **Phase 2: Multi-Source Integration (Week 2)**

- [ ] Add "Add to Shopping List" buttons to recipe views
- [ ] Integrate shopping list with AI chat responses
- [ ] Add "Save & Add to Shopping List" for public recipes
- [ ] Implement "Add Out-of-Stock to Shopping List" in My Groceries

### **Phase 3: AI Assistant (Week 3)**

- [ ] Implement `useShoppingCartAI` hook with cuisine detection
- [ ] Create cuisine staples database/configuration
- [ ] Build AI assistant chat interface for shopping cart page
- [ ] Add "Add Staples to My Groceries" functionality

### **Phase 4: Shopping Mode & Polish (Week 4)**

- [ ] Implement mobile-optimized shopping mode interface
- [ ] Add context preservation ("needed for X recipes")
- [ ] Implement export functionality (text)
- [ ] Add sync to groceries workflow
- [ ] Comprehensive testing and bug fixes

### **Phase 5: Testing & Deployment (Week 5)**

- [ ] Unit tests for all hooks and components
- [ ] Integration tests for shopping cart page
- [ ] E2E tests for complete user journey
- [ ] Performance optimization and error handling
- [ ] Documentation and deployment

---

## 📝 **Conclusion**

This technical specification provides a **simplified, practical implementation** of the Shopping Cart feature that:

- **Builds on existing systems** without architectural disruption
- **Uses minimal database changes** (2 JSONB columns)
- **Leverages current ingredient matching** and AI infrastructure
- **Focuses on real user value** with Alice's multi-source shopping journey
- **Includes cuisine-specific AI assistance** for authentic cooking

The implementation is designed to be completed in **4-5 weeks** with a clear phase-by-phase approach that delivers value incrementally while maintaining system stability and user experience quality.

---

_This technical specification aligns with the simplified design from `00-overview.md` and provides concrete implementation guidance for the Recipe Generator shopping cart feature._

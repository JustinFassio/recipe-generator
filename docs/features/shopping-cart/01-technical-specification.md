<!-- Placeholder: Technical specification & implementation plan for Shopping Cart -->

# Shopping Cart Feature - Technical Specification

**Project:** Recipe Generator  
**Feature:** Shopping Cart with Cuisine Mastery AI Assistant  
**Document:** `docs/features/shopping-cart/01-technical-specification.md`  
**Author:** AI Assistant  
**Date:** September 2025  
**Status:** Implementation Ready

---

## 🎯 **Technical Overview**

The Shopping Cart feature extends the existing Recipe Generator ingredient system to provide intelligent shopping list management with cuisine mastery education. Built as a non-destructive enhancement to the current `user_groceries` architecture, it seamlessly integrates with existing hooks, components, and AI systems.

### **Core Technical Principles**

- **Non-Destructive Integration**: Extends existing database tables and hooks without replacement
- **Architectural Consistency**: Builds on established patterns from `useGroceries`, `useGlobalIngredients`, and `EnhancedIngredientMatcher`
- **Progressive Enhancement**: Adds intelligence layers while maintaining backward compatibility
- **Conflict-Aware Design**: Handles ingredient conflicts across multiple recipes intelligently
- **Session-Based Shopping**: Complete shopping trip tracking with analytics and learning

---

## 🏗️ **System Architecture**

### **Integration Strategy**

```typescript
// System Integration Flow
Existing Groceries Data → Enhanced Cart Intelligence → AI-Powered Education → Shopping Execution

// Data Layers
1. user_groceries (existing) → Enhanced with cart_metadata
2. global_ingredients (existing) → Enhanced with cuisine context
3. ingredient_learning_log (existing) → Enhanced with source tracking
4. New: user_cuisine_mastery → Cuisine progression tracking
5. New: cart_ai_interactions → AI conversation logging
```

### **Hook Architecture**

```typescript
// Primary Hook: useShoppingCart
// Wraps and extends existing hooks without replacement
const useShoppingCart = () => {
  const groceries = useGroceries(); // Existing hook
  const globalIngredients = useGlobalIngredients(); // Existing hook
  const matcher = useIngredientMatching(); // Existing hook

  // Enhanced cart intelligence layer
  const [cartMetadata, setCartMetadata] = useState<CartMetadata>();
  const [cuisineAnalysis, setCuisineAnalysis] = useState<CuisineAnalysis>();

  // Advanced cart operations
  return {
    // Core data (enhanced views of existing data)
    cartIngredients: enhancedIngredients,
    cartMetadata,
    cuisineAnalysis,

    // Advanced operations (built on existing hooks)
    addIngredientToCart: (ingredient, context) => {
      /* Implementation */
    },
    populateFromShoppingList: (shoppingList) => {
      /* Implementation */
    },
    resolveIngredientConflicts: (conflicts) => {
      /* Implementation */
    },
    startShoppingSession: () => {
      /* Implementation */
    },

    // Export functionality
    exportAsText: () => {
      /* Implementation */
    },
    exportAsPDF: () => {
      /* Implementation */
    },
  };
};
```

---

## 📊 **Data Architecture**

### **Enhanced Data Structures**

```typescript
// Extends existing UserGroceries without replacement
interface EnhancedUserGroceries extends UserGroceries {
  cart_metadata: {
    totalItems: number;
    cuisineTypes: string[];
    recipeContexts: RecipeContext[];
    shoppingSessions: ShoppingSessionSummary[];
    completionLevel: Record<string, number>;
    lastAIInteraction?: Date;
    estimatedCost?: number;
  };
  cuisine_analysis: {
    detectedCuisines: DetectedCuisine[];
    recommendations: CuisineRecommendation[];
    masteryAssessment: MasteryAssessment[];
  };
  ai_session_id?: string;
}

// Enhanced cart ingredient with comprehensive context
interface CartIngredient {
  // Core ingredient data
  name: string;
  normalizedName: string; // From IngredientMatcher.normalizeName()
  category: string; // Chef Isabella's 8 categories
  quantity?: string;

  // Integration data
  matchData?: IngredientMatch; // From EnhancedIngredientMatcher
  globalIngredientId?: string; // Link to global_ingredients table

  // Context and intelligence
  source: 'recipe' | 'inventory_replacement' | 'ai_suggestion' | 'manual';
  priority: 'high' | 'medium' | 'low';
  recipeContexts: RecipeContext[];
  cuisineRelevance: CuisineRelevance[];

  // User interaction
  userHasQuantity?: 'none' | 'some' | 'enough' | 'similar';
  alternatives?: string[];
  notes?: string;
  isCompleted: boolean;
  addedAt: Date;
}

// Recipe context with conflict resolution
interface RecipeContext {
  recipeId: string;
  recipeTitle: string;
  recipeType: 'main' | 'side' | 'starter' | 'dessert';
  originalIngredientText: string; // Full ingredient text with quantity
  isRequired: boolean;
  conflictResolution?: ConflictResolution;
}

// Conflict resolution for cross-recipe ingredients
interface ConflictResolution {
  conflictType: 'quantity' | 'preparation' | 'similar_ingredient';
  originalQuantities: string[];
  resolvedQuantity: string;
  resolvedPreparation?: string;
  userChoice: 'consolidate' | 'separate' | 'choose_largest';
}

// Shopping session tracking
interface ShoppingSessionSummary {
  sessionId: string;
  startedAt: Date;
  completedAt?: Date;
  totalItems: number;
  itemsFound: number;
  itemsNotFound: number;
  estimatedCost?: number;
  actualCost?: number;
  storeLocation?: string;
}

// Cuisine analysis and mastery
interface DetectedCuisine {
  type: string; // 'mexican', 'italian', etc.
  confidence: number; // 0-1
  evidenceIngredients: string[];
  recipeCount: number;
  masteryLevel: 1 | 2 | 3 | 4 | 5;
  completionPercentage: number; // % of essential ingredients present
}
```

---

## 🔧 **Core Implementation**

### **Primary Hook: useShoppingCart**

```typescript
// File: src/hooks/useShoppingCart.ts
import { useGroceries } from './useGroceries';
import { useGlobalIngredients } from './useGlobalIngredients';
import { useIngredientMatching } from './useIngredientMatching';
import { EnhancedIngredientMatcher } from '@/lib/groceries/enhanced-ingredient-matcher';

export interface UseShoppingCartReturn {
  // Enhanced cart data
  cartIngredients: CartIngredient[];
  cartMetadata: CartMetadata;
  cuisineAnalysis: CuisineAnalysis;
  matcher: EnhancedIngredientMatcher;

  // Core cart operations
  addIngredientToCart: (
    ingredient: string,
    context?: AddContext
  ) => Promise<void>;
  removeIngredientFromCart: (normalizedName: string) => Promise<void>;
  updateIngredientPriority: (
    normalizedName: string,
    priority: Priority
  ) => Promise<void>;
  toggleCompleted: (normalizedName: string) => Promise<void>;

  // Advanced shopping list integration
  populateFromShoppingList: (shoppingList: ShoppingList) => Promise<void>;
  resolveIngredientConflicts: (
    conflicts: ConflictResolution[]
  ) => Promise<void>;
  consolidateQuantities: (
    ingredientName: string
  ) => Promise<ConflictResolution>;
  addInventoryReplacements: (outOfStockItems: string[]) => Promise<void>;

  // Cuisine intelligence
  analyzeCuisines: () => Promise<CuisineAnalysis>;
  getCuisineMasteryLevel: (cuisineType: string) => number;
  getCuisineCompletionPercentage: (cuisineType: string) => number;

  // Shopping session management
  startShoppingSession: (storeLocation?: string) => Promise<string>;
  completeShoppingSession: (
    sessionId: string,
    results: ShoppingResults
  ) => Promise<void>;

  // AI integration
  addAISuggestedIngredients: (suggestions: AISuggestion[]) => Promise<void>;

  // Export and integration
  exportAsText: () => string;
  exportAsPDF: () => Promise<Blob>;
  exportToShoppingList: () => ShoppingList;
  syncWithRecipeIngredients: (recipe: Recipe) => Promise<ConflictAnalysis>;
}

export const useShoppingCart = (): UseShoppingCartReturn => {
  // Integrate with existing hooks
  const { groceries, toggleIngredient, clearAll } = useGroceries();
  const { globalIngredients, saveIngredientToGlobal } = useGlobalIngredients();
  const { matchIngredient, calculateCompatibility } = useIngredientMatching();

  // Enhanced state management
  const [cartMetadata, setCartMetadata] = useState<CartMetadata>();
  const [cuisineAnalysis, setCuisineAnalysis] = useState<CuisineAnalysis>();
  const [matcher] = useState(() => new EnhancedIngredientMatcher(groceries));

  // Convert existing groceries to enhanced cart ingredients
  const cartIngredients = useMemo(() => {
    const ingredients: CartIngredient[] = [];

    Object.entries(groceries).forEach(([category, items]) => {
      items.forEach(async (item) => {
        // Enhance with existing systems
        const matchData = await matcher.matchIngredientWithGlobal(item);
        const cuisineRelevance = await analyzeCuisineRelevance(item);

        ingredients.push({
          name: item,
          normalizedName: matcher.normalizeName(item),
          category,
          matchData,
          globalIngredientId: matchData.globalIngredient?.id,
          source: determineIngredientSource(item, cartMetadata),
          cuisineRelevance,
          recipeContexts: getRecipeContexts(item, cartMetadata),
          priority: 'medium',
          userHasQuantity: determineAvailabilityStatus(item),
          addedAt: new Date(),
          isCompleted: false,
        });
      });
    });

    return ingredients;
  }, [groceries, matcher, cartMetadata]);

  // Advanced cart operations implementation
  const populateFromShoppingList = async (shoppingList: ShoppingList) => {
    // Analyze conflicts with existing cart
    const conflictAnalysis = analyzeShoppingListConflicts(
      shoppingList.items,
      cartIngredients
    );

    // Auto-resolve simple conflicts
    const autoResolved = await autoResolveConflicts(conflictAnalysis.conflicts);

    // Present remaining conflicts for user resolution
    if (conflictAnalysis.conflicts.length > autoResolved.length) {
      await showConflictResolutionModal(
        conflictAnalysis.conflicts.filter((c) => !autoResolved.includes(c))
      );
    }

    // Add all items with resolved contexts
    for (const item of shoppingList.items) {
      await addIngredientToCart(item.ingredient, {
        source: 'recipe',
        recipeContext: item.recipeContexts?.[0],
        priority: item.priority as Priority,
        originalQuantity: item.estimatedQuantity,
        resolvedConflicts: autoResolved.find(
          (c) => c.ingredientName === matcher.normalizeName(item.ingredient)
        ),
      });
    }

    // Update metadata with comprehensive context
    setCartMetadata((prev) => ({
      ...prev,
      totalItems: cartIngredients.length,
      recipeContexts: [
        ...prev.recipeContexts,
        ...shoppingList.items.flatMap((item) => item.recipeContexts || []),
      ],
      cuisineTypes: Array.from(
        new Set([
          ...prev.cuisineTypes,
          ...shoppingList.items.flatMap(
            (item) =>
              item.recipeContexts?.map((rc) => inferCuisineFromRecipe(rc)) || []
          ),
        ])
      ),
    }));
  };

  const addIngredientToCart = async (
    ingredient: string,
    context?: {
      source?: 'recipe' | 'ai_suggestion' | 'manual' | 'inventory_replacement';
      recipeContext?: RecipeContext;
      priority?: Priority;
      originalQuantity?: string;
      resolvedConflicts?: ConflictResolution;
      notes?: string;
    }
  ) => {
    // Normalize and match using existing systems
    const normalizedName = matcher.normalizeName(ingredient);
    let matchData = await matcher.matchIngredientWithGlobal(ingredient);

    // Handle new ingredients using existing global ingredient system
    if (matchData.matchType === 'none') {
      const shouldSave = await confirmSaveToGlobal(ingredient);
      if (shouldSave) {
        const suggestedCategory = await suggestCategory(
          ingredient,
          context?.recipeContext
        );
        await saveIngredientToGlobal(ingredient, suggestedCategory, context);

        // Refresh and re-match
        await matcher.refreshGlobalIngredients();
        matchData = await matcher.matchIngredientWithGlobal(ingredient);
      }
    }

    // Add to existing grocery system
    const category = matchData.matchedCategory || 'pantry_staples';
    toggleIngredient(category, ingredient);

    // Enhanced learning with cuisine context
    await logIngredientLearning({
      ingredient_text: ingredient,
      extracted_name: matchData.matchedGroceryIngredient || ingredient,
      suggested_category: category,
      confidence_score: matchData.confidence,
      source_type: context?.source || 'manual',
      cuisine_context: context?.recipeContext
        ? [inferCuisineFromRecipe(context.recipeContext)]
        : [],
    });
  };

  const startShoppingSession = async (
    storeLocation?: string
  ): Promise<string> => {
    const sessionId = generateSessionId();

    const session: ShoppingSessionSummary = {
      sessionId,
      startedAt: new Date(),
      totalItems: cartIngredients.length,
      itemsFound: 0,
      itemsNotFound: 0,
      storeLocation,
    };

    setCartMetadata((prev) => ({
      ...prev,
      shoppingSessions: [...prev.shoppingSessions, session],
    }));

    return sessionId;
  };

  const exportAsText = (): string => {
    const groupedIngredients = groupIngredientsByCategory(cartIngredients);

    let text = '# Shopping List\n';
    text += `Generated: ${new Date().toLocaleDateString()}\n`;
    text += `Total Items: ${cartIngredients.length}\n\n`;

    Object.entries(groupedIngredients).forEach(([category, items]) => {
      text += `## ${category.toUpperCase()}\n`;
      items.forEach((item) => {
        const quantity = item.quantity ? `${item.quantity} ` : '';
        const priority =
          item.priority !== 'medium' ? ` [${item.priority}]` : '';
        const recipes =
          item.recipeContexts.length > 0
            ? ` (for: ${item.recipeContexts.map((rc) => rc.recipeTitle).join(', ')})`
            : '';

        text += `- ${quantity}${item.name}${priority}${recipes}\n`;
      });
      text += '\n';
    });

    return text;
  };

  // Return comprehensive interface
  return {
    cartIngredients,
    cartMetadata,
    cuisineAnalysis,
    matcher,
    addIngredientToCart,
    removeIngredientFromCart: async (normalizedName) => {
      const ingredient = cartIngredients.find(
        (i) => i.normalizedName === normalizedName
      );
      if (ingredient) {
        toggleIngredient(ingredient.category, ingredient.name);
      }
    },
    populateFromShoppingList,
    resolveIngredientConflicts: async (conflicts) => {
      // Implementation for resolving conflicts
    },
    consolidateQuantities: async (ingredientName) => {
      // Implementation for quantity consolidation
    },
    addInventoryReplacements: async (outOfStockItems) => {
      // Implementation for inventory integration
    },
    analyzeCuisines: async () => {
      // Implementation for cuisine analysis
    },
    getCuisineMasteryLevel: (cuisineType) => {
      return (
        cuisineAnalysis?.masteryAssessment?.find(
          (m) => m.cuisineType === cuisineType
        )?.level || 1
      );
    },
    getCuisineCompletionPercentage: (cuisineType) => {
      const cuisine = cuisineAnalysis?.detectedCuisines?.find(
        (c) => c.type === cuisineType
      );
      return cuisine?.completionPercentage || 0;
    },
    startShoppingSession,
    completeShoppingSession: async (sessionId, results) => {
      // Implementation for session completion
    },
    addAISuggestedIngredients: async (suggestions) => {
      // Implementation for AI suggestions
    },
    exportAsText,
    exportAsPDF: async () => {
      // Implementation for PDF export
    },
    exportToShoppingList: () => {
      return convertCartToShoppingList(cartIngredients, cartMetadata);
    },
    syncWithRecipeIngredients: async (recipe) => {
      // Implementation for recipe integration
    },
  };
};
```

---

## 🤖 **AI System Integration**

### **Cuisine Mastery Agent Extension**

```typescript
// File: src/lib/ai-agents/cuisine-mastery-agent.ts
// Extends existing IngredientsAgent

import { IngredientsAgent } from './ingredients-agent';
import { EnhancedIngredientMatcher } from '@/lib/groceries/enhanced-ingredient-matcher';
import { CHEF_ISABELLA_SYSTEM_CATALOG } from '@/lib/groceries/categories';

export class CuisineMasteryAgent extends IngredientsAgent {
  private matcher: EnhancedIngredientMatcher;

  constructor(userGroceries: Record<string, string[]>) {
    super();
    this.matcher = new EnhancedIngredientMatcher(userGroceries);
  }

  async analyzeCuisineCart(request: {
    message: string;
    context: CuisineAnalysisContext;
    conversationHistory: AICartMessage[];
  }): Promise<CuisineAnalysisResponse> {
    const { message, context, conversationHistory } = request;

    // Build comprehensive prompt with existing system integration
    const systemPrompt = this.buildCuisineMasteryPrompt(context);
    const conversationContext =
      this.formatConversationHistory(conversationHistory);

    const fullPrompt = `
${systemPrompt}

CONVERSATION HISTORY:
${conversationContext}

USER MESSAGE: "${message}"

ANALYSIS REQUIREMENTS:
1. Analyze current cart using existing ingredient matcher system
2. Provide specific recommendations using Chef Isabella's 8 categories
3. Explain cultural context and authentic usage
4. Organize by importance with educational context
5. Include storage, selection, and usage guidance
6. Suggest specific quantities for home cooking
7. Connect ingredients to specific dishes they enable

RESPONSE FORMAT:
{
  "message": "Your detailed response as Chef Isabella",
  "cuisineFocus": "primary cuisine discussed",
  "ingredientsFocused": ["ingredients", "discussed"],
  "suggestedIngredients": [
    {
      "name": "ingredient name",
      "category": "chef isabella category",
      "priority": "essential|recommended|optional",
      "usage": "cultural usage explanation",
      "dishes": ["enabled dishes"],
      "quantity": "recommended amount",
      "storage": "storage guidance",
      "alternatives": "substitution options"
    }
  ],
  "educationalNotes": ["cultural context", "techniques"]
}
    `;

    try {
      // Use existing AI infrastructure
      const response = await this.callAI({
        prompt: fullPrompt,
        temperature: 0.7,
        maxTokens: 2000,
      });

      const parsed = this.parseAIResponse(response);

      // Enhance suggestions with existing ingredient matching
      if (parsed.suggestedIngredients) {
        parsed.suggestedIngredients = await this.enhanceSuggestions(
          parsed.suggestedIngredients,
          context
        );
      }

      // Log using existing patterns
      await this.logCuisineInteraction({
        user_message: message,
        ai_response: parsed.message,
        context_data: context,
        suggested_ingredients:
          parsed.suggestedIngredients?.map((s) => s.name) || [],
        interaction_type: parsed.cuisineFocus
          ? 'cuisine_analysis'
          : 'general_guidance',
      });

      return parsed;
    } catch (error) {
      console.error('Cuisine analysis error:', error);
      return this.getErrorResponse(message);
    }
  }

  private async enhanceSuggestions(
    suggestions: AISuggestion[],
    context: CuisineAnalysisContext
  ): Promise<AISuggestion[]> {
    return Promise.all(
      suggestions.map(async (suggestion) => {
        // Use existing matcher to check global ingredients
        const matchData = await this.matcher.matchIngredientWithGlobal(
          suggestion.name
        );

        // Validate against existing categories
        const validCategory = this.validateCategory(suggestion.category);

        return {
          ...suggestion,
          id: generateId(),
          normalizedName: this.matcher.normalizeName(suggestion.name),
          matchData,
          exists_in_global: matchData.matchType !== 'none',
          suggested_category: matchData.matchedCategory || validCategory,
          confidence: matchData.confidence,
        };
      })
    );
  }

  private validateCategory(category: string): string {
    const validCategories = Object.keys(CHEF_ISABELLA_SYSTEM_CATALOG);
    return validCategories.includes(category) ? category : 'pantry_staples';
  }
}
```

---

## 🎨 **Component Architecture**

### **Main Shopping Cart Page**

```typescript
// File: src/pages/ShoppingCartPage.tsx
import React, { useState, useCallback } from 'react';
import { useShoppingCart } from '@/hooks/useShoppingCart';

interface ShoppingCartPageProps {
  initialShoppingList?: ShoppingList; // From URL params or navigation
}

const ShoppingCartPage: React.FC<ShoppingCartPageProps> = ({
  initialShoppingList
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'category' | 'cuisine'>('overview');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<ConflictResolution[]>([]);

  const shoppingCart = useShoppingCart();
  const { cartIngredients, cartMetadata, cuisineAnalysis } = shoppingCart;

  // Handle shopping list import on page load
  useEffect(() => {
    if (initialShoppingList) {
      handleImportShoppingList(initialShoppingList);
    }
  }, [initialShoppingList]);

  const handleImportShoppingList = useCallback(async (shoppingList: ShoppingList) => {
    try {
      const conflictAnalysis = await shoppingCart.syncWithRecipeIngredients({
        ingredients: shoppingList.items.map(item => item.ingredient)
      } as Recipe);

      if (conflictAnalysis.conflicts.length > 0) {
        setPendingConflicts(conflictAnalysis.conflicts);
        setConflictModalOpen(true);
      } else {
        await shoppingCart.populateFromShoppingList(shoppingList);
        showSuccessToast('Shopping list imported successfully!');
      }
    } catch (error) {
      console.error('Import error:', error);
      showErrorToast('Failed to import shopping list');
    }
  }, [shoppingCart]);

  const handleConflictResolution = useCallback(async (resolutions: ConflictResolution[]) => {
    try {
      await shoppingCart.resolveIngredientConflicts(resolutions);
      setConflictModalOpen(false);
      setPendingConflicts([]);
      showSuccessToast('Conflicts resolved successfully!');
    } catch (error) {
      console.error('Conflict resolution error:', error);
      showErrorToast('Failed to resolve conflicts');
    }
  }, [shoppingCart]);

  // Shopping mode interface
  if (shoppingMode) {
    return (
      <ShoppingModeInterface
        cartIngredients={cartIngredients}
        cartMetadata={cartMetadata}
        onMarkCompleted={shoppingCart.toggleCompleted}
        onExitShoppingMode={() => setShoppingMode(false)}
        onCompleteSession={shoppingCart.completeShoppingSession}
      />
    );
  }

  // Regular cart interface
  return (
    <div className="shopping-cart-page min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <CartHeader
        cartIngredients={cartIngredients}
        cartMetadata={cartMetadata}
        cuisineAnalysis={cuisineAnalysis}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenAIChat={() => setAiChatOpen(true)}
        onToggleShoppingMode={() => setShoppingMode(!shoppingMode)}
        onImportShoppingList={() => {
          // Trigger file picker or show import modal
          showImportModal();
        }}
      />

      {/* Main Content Grid */}
      <div className="cart-main-content flex">
        {/* Cart Contents Panel (2/3 width) */}
        <div className="cart-contents-panel flex-1 p-6">
          {activeView === 'overview' && (
            <CartOverview
              cartIngredients={cartIngredients}
              onToggleCompleted={shoppingCart.toggleCompleted}
              onUpdatePriority={shoppingCart.updateIngredientPriority}
              onRemoveIngredient={shoppingCart.removeIngredientFromCart}
            />
          )}
          {activeView === 'category' && (
            <CartByCategory
              cartIngredients={cartIngredients}
              onToggleCompleted={shoppingCart.toggleCompleted}
            />
          )}
          {activeView === 'cuisine' && (
            <CartByCuisine
              cartIngredients={cartIngredients}
              cuisineAnalysis={cuisineAnalysis}
              onToggleCompleted={shoppingCart.toggleCompleted}
            />
          )}
        </div>

        {/* AI Assistant Panel (1/3 width) */}
        <div className="ai-assistant-panel w-1/3 border-l border-gray-200">
          <CuisineAIAssistant
            cartIngredients={cartIngredients}
            cuisineAnalysis={cuisineAnalysis}
            isExpanded={aiChatOpen}
            onToggle={() => setAiChatOpen(!aiChatOpen)}
            onAddIngredient={shoppingCart.addIngredientToCart}
            onAddMultipleIngredients={shoppingCart.addAISuggestedIngredients}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <CartActions
        cartIngredients={cartIngredients}
        onExportText={() => downloadFile(shoppingCart.exportAsText(), 'shopping-list.txt')}
        onExportPDF={() => downloadFile(shoppingCart.exportAsPDF(), 'shopping-list.pdf')}
        onClearCompleted={() => clearCompletedItems(cartIngredients)}
        onStartShopping={() => setShoppingMode(true)}
        onAddInventoryItems={() => showInventoryModal()}
      />

      {/* Modals */}
      <ConflictResolutionModal
        isOpen={conflictModalOpen}
        conflicts={pendingConflicts}
        onClose={() => setConflictModalOpen(false)}
        onResolve={handleConflictResolution}
      />
    </div>
  );
};

export default ShoppingCartPage;
```

---

## 🔒 **Security & Performance**

### **Row Level Security (RLS) Policies**

```sql
-- Enhanced user_groceries policies
ALTER TABLE user_groceries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their enhanced grocery cart"
  ON user_groceries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- New table policies
CREATE POLICY "Users can manage their cuisine mastery"
  ON user_cuisine_mastery FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their cart AI interactions"
  ON cart_ai_interactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
```

### **Performance Optimizations**

```typescript
// Memoized computations for cart operations
const cartIngredients = useMemo(() => {
  return computeEnhancedIngredients(groceries, matcher, cartMetadata);
}, [groceries, matcher, cartMetadata]);

const cuisineAnalysis = useMemo(() => {
  return analyzeCuisinePatterns(cartIngredients);
}, [cartIngredients]);

// Debounced operations for expensive operations
const debouncedCuisineAnalysis = useDebounce(
  () => shoppingCart.analyzeCuisines(),
  500
);

// Virtualized lists for large ingredient collections
const VirtualizedIngredientList = ({ ingredients }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={ingredients.length}
      itemSize={60}
    >
      {({ index, style }) => (
        <div style={style}>
          <IngredientRow ingredient={ingredients[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

### **Error Handling & Resilience**

```typescript
// Comprehensive error boundaries
class ShoppingCartErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with context
    logError('ShoppingCart', error, {
      cartIngredients: this.props.cartIngredients?.length || 0,
      activeView: this.props.activeView,
      userId: this.props.userId
    });
  }

  render() {
    if (this.state.hasError) {
      return <ShoppingCartErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

// Graceful degradation for AI failures
const handleAIFailure = useCallback((error: Error) => {
  console.warn('AI service unavailable:', error);

  // Fall back to basic ingredient suggestions
  const basicSuggestions = generateBasicIngredientSuggestions(cartIngredients);
  setSuggestedIngredients(basicSuggestions);

  showWarningToast('AI assistant temporarily unavailable. Basic suggestions provided.');
}, [cartIngredients]);
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**

```typescript
//
```

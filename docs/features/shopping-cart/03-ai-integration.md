# Shopping Cart Feature - AI Integration

**Project:** Recipe Generator  
**Feature:** Shopping Cart with AI Assistant  
**Document:** `docs/features/shopping-cart/03-ai-integration.md`  
**Author:** AI Assistant  
**Date:** September 2025  
**Status:** Implementation Ready

---

## 🎯 **AI Integration Overview**

The Shopping Cart feature includes a **dedicated AI Chat Assistant** that provides intelligent, cuisine-focused recommendations to help users build comprehensive ingredient collections. The AI analyzes the user's shopping cart contents to detect cuisine patterns and suggests authentic staples for their "My Groceries" collection.

### **Core AI Capabilities**

- **Cuisine Detection**: Automatically identifies cooking styles from shopping cart ingredients
- **Staple Recommendations**: Suggests authentic spices, vegetables, fruits, and aromatics
- **Context-Aware Suggestions**: Considers user's current groceries and shopping history
- **Cultural Authenticity**: Provides culturally accurate ingredient recommendations
- **Interactive Guidance**: Conversational interface for exploring ingredient options

---

## 📋 **User Story Implementation**

### **Alice's Mexican Cooking Journey**

> _"Alice Baker is making Mexican dishes and wants to know what spices, vegetables, fruits and aromatics she should have as staples in her My Groceries page to regularly make authentic Mexican food."_

**AI Assistant Workflow:**

1. **Analyzes Shopping Cart**: Detects Mexican ingredients (jalapeños, cilantro, lime, etc.)
2. **Identifies Cuisine Pattern**: Recognizes Mexican cooking style with 85% confidence
3. **Suggests Authentic Staples**: Recommends cumin, Mexican oregano, poblano peppers, etc.
4. **Provides Cultural Context**: Explains ingredient uses and authenticity
5. **Integrates with My Groceries**: Allows one-click addition to permanent collection

---

## 🤖 **AI System Architecture**

### **Cuisine Detection Engine**

```typescript
interface CuisineDetection {
  cuisine: string; // "Mexican", "Italian", "Asian", etc.
  confidence: number; // 0.0 - 1.0 confidence score
  indicators: string[]; // Ingredients that triggered detection
  subStyles?: string[]; // "Tex-Mex", "Oaxacan", etc.
}

interface DetectedCuisine {
  primary: CuisineDetection;
  secondary?: CuisineDetection[];
  mixed: boolean; // Multiple cuisines detected
}
```

### **Staple Recommendation System**

```typescript
interface StapleRecommendation {
  ingredient: string;
  category: IngredientCategory;
  importance: 'essential' | 'recommended' | 'optional';
  culturalContext: string;
  commonUses: string[];
  alreadyOwned: boolean;
  estimatedCost?: string;
}

interface CuisineMastery {
  cuisine: string;
  essentialSpices: StapleRecommendation[];
  essentialVegetables: StapleRecommendation[];
  essentialFruits: StapleRecommendation[];
  essentialAromatics: StapleRecommendation[];
  pantryStaples: StapleRecommendation[];
}
```

---

## 🧠 **AI Chat Assistant Implementation**

### **Chat Interface Integration**

The Shopping Cart AI Assistant extends the existing chat system with specialized knowledge:

```typescript
interface ShoppingCartAI {
  // Cuisine Analysis
  detectCuisine(shoppingList: ShoppingItem[]): Promise<DetectedCuisine>;

  // Staple Recommendations
  getStapleRecommendations(cuisine: string): Promise<CuisineMastery>;

  // Interactive Chat
  getChatResponse(
    message: string,
    context: ShoppingCartContext
  ): Promise<ChatResponse>;

  // Integration Actions
  addToGroceries(ingredients: string[]): Promise<void>;
  explainIngredient(ingredient: string, cuisine: string): Promise<string>;
}
```

### **Context-Aware Conversations**

The AI maintains context about:

- **Current Shopping Cart**: All items and their sources
- **User's Groceries**: Existing ingredient collection
- **Shopping History**: Previous cuisine patterns
- **Dietary Preferences**: From user profile
- **Seasonal Availability**: Local ingredient seasons

---

## 🌮 **Mexican Cuisine Example**

### **Cuisine Detection Triggers**

When Alice's shopping cart contains:

- `jalapeños`, `cilantro`, `lime`, `avocados`, `tomatoes`, `onions`

**AI Detection Result:**

```json
{
  "primary": {
    "cuisine": "Mexican",
    "confidence": 0.92,
    "indicators": ["jalapeños", "cilantro", "lime", "avocados"],
    "subStyles": ["Traditional Mexican", "Tex-Mex"]
  },
  "mixed": false
}
```

### **Staple Recommendations for Mexican Cooking**

#### **Essential Spices (Importance: Essential)**

- **Cumin (Comino)**: _"The soul of Mexican cooking. Essential for beans, meat, and sauces."_
- **Mexican Oregano**: _"Different from Mediterranean oregano. Floral and citrusy."_
- **Chili Powder**: _"Blend of dried chiles. Foundation for many Mexican dishes."_
- **Paprika**: _"Adds color and mild pepper flavor to dishes."_

#### **Essential Vegetables (Importance: Essential)**

- **White Onions**: _"Preferred over yellow in Mexican cooking. Sharp, clean flavor."_
- **Roma Tomatoes**: _"Meaty texture perfect for salsas and sauces."_
- **Poblano Peppers**: _"Mild heat, rich flavor. Essential for chiles rellenos."_
- **Garlic**: _"Used fresh in most Mexican dishes."_

#### **Essential Fruits (Importance: Recommended)**

- **Limes**: _"Mexican limes are smaller and more acidic. Essential for authenticity."_
- **Tomatillos**: _"Green tomato relatives. Key ingredient for salsa verde."_
- **Oranges**: _"Used in marinades and mole sauces."_

#### **Essential Aromatics (Importance: Essential)**

- **Fresh Cilantro**: _"Herb that defines Mexican cuisine. Use leaves and stems."_
- **Bay Leaves**: _"Used in bean cooking and stews."_
- **Epazote**: _"Traditional herb for beans. Reduces gas and adds unique flavor."_

### **AI Conversation Example**

```
🤖 AI Assistant: I notice you're shopping for Mexican ingredients! 🌮
Your cart has jalapeños, cilantro, and lime - classic Mexican staples.

Would you like me to suggest some essential ingredients to keep
in your "My Groceries" for authentic Mexican cooking?

👤 Alice: Yes! I want to make sure I have everything for real Mexican food.

🤖 AI Assistant: Perfect! For authentic Mexican cooking, I recommend these staples:

**ESSENTIAL SPICES** 🌶️
• Mexican oregano (not regular oregano - it's more floral)
• Cumin (comino) - the soul of Mexican cooking
• Quality chili powder blend

**FRESH INGREDIENTS** 🥬
• White onions (preferred over yellow in Mexico)
• Roma tomatoes (perfect for salsas)
• Fresh garlic

Would you like me to add any of these to your "My Groceries" collection?

👤 Alice: Add the Mexican oregano and cumin please. What makes Mexican oregano different?

🤖 AI Assistant: Added Mexican oregano and cumin to your groceries! ✅

Mexican oregano (Monarda fischeri) is completely different from Mediterranean oregano:
• More floral and citrusy flavor
• Slightly minty undertones
• Pairs perfectly with beans and meat
• Essential for authentic pozole and mole

Mediterranean oregano would taste out of place in Mexican dishes.
The difference is like using basil vs. mint - similar families but totally different flavors!

Want to explore more authentic Mexican staples? 🇲🇽
```

---

## 🔧 **Technical Implementation**

### **Cuisine Detection Algorithm**

```typescript
class CuisineDetectionEngine {
  private cuisinePatterns = {
    mexican: {
      indicators: [
        'jalapeños',
        'cilantro',
        'lime',
        'avocados',
        'tomatillos',
        'poblano',
        'serrano',
        'chipotle',
        'cumin',
        'mexican oregano',
      ],
      weights: { cilantro: 0.3, lime: 0.25, jalapeños: 0.2 },
      threshold: 0.6,
    },
    italian: {
      indicators: [
        'basil',
        'oregano',
        'parmesan',
        'mozzarella',
        'tomatoes',
        'olive oil',
        'garlic',
        'balsamic',
        'prosciutto',
      ],
      weights: { basil: 0.3, parmesan: 0.25, 'olive oil': 0.2 },
      threshold: 0.6,
    },
    // ... more cuisines
  };

  detectCuisine(ingredients: string[]): DetectedCuisine {
    const scores = this.calculateCuisineScores(ingredients);
    return this.rankAndFilterCuisines(scores);
  }
}
```

### **Staple Database Structure**

```typescript
interface CuisineStaples {
  [cuisine: string]: {
    spices: StapleIngredient[];
    vegetables: StapleIngredient[];
    fruits: StapleIngredient[];
    aromatics: StapleIngredient[];
    pantry: StapleIngredient[];
  };
}

interface StapleIngredient {
  name: string;
  category: IngredientCategory;
  importance: 'essential' | 'recommended' | 'optional';
  description: string;
  culturalContext: string;
  commonUses: string[];
  substitutes?: string[];
  seasonality?: string;
  storageNotes?: string;
}
```

### **Chat Integration**

```typescript
export function useShoppingCartAI() {
  const { shoppingList } = useShoppingList();
  const { groceries } = useGroceries();
  const { sendMessage } = useConversation();

  const detectCuisine = useCallback(async () => {
    const detector = new CuisineDetectionEngine();
    const ingredients = Object.keys(shoppingList);
    return detector.detectCuisine(ingredients);
  }, [shoppingList]);

  const getStapleRecommendations = useCallback(
    async (cuisine: string) => {
      const staples = await CuisineStaplesDB.getStaples(cuisine);
      const owned = Object.keys(groceries.groceries || {}).flat();

      return staples.map((staple) => ({
        ...staple,
        alreadyOwned: owned.includes(staple.name),
      }));
    },
    [groceries]
  );

  const getChatResponse = useCallback(
    async (message: string) => {
      const context = {
        shoppingList,
        groceries: groceries.groceries,
        detectedCuisine: await detectCuisine(),
      };

      return sendMessage(message, {
        systemPrompt: SHOPPING_CART_AI_PROMPT,
        context,
      });
    },
    [shoppingList, groceries, detectCuisine, sendMessage]
  );

  return {
    detectCuisine,
    getStapleRecommendations,
    getChatResponse,
  };
}
```

---

## 🎨 **User Interface Design**

### **AI Assistant Panel**

```tsx
function ShoppingCartAI({ detectedCuisine }: ShoppingCartAIProps) {
  return (
    <div className="bg-base-100 rounded-lg p-4 border border-base-300">
      {/* Cuisine Detection Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <div>
          <h3 className="font-semibold">Your Cooking Assistant</h3>
          {detectedCuisine && (
            <p className="text-sm text-base-content/70">
              I see you're making {detectedCuisine.primary.cuisine} food! 🌮
            </p>
          )}
        </div>
      </div>

      {/* Quick Suggestions */}
      {detectedCuisine && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Suggested Staples:</h4>
          <div className="flex flex-wrap gap-2">
            {suggestedStaples.slice(0, 3).map((staple) => (
              <button
                key={staple.name}
                className="btn btn-sm btn-outline"
                onClick={() => addToGroceries([staple.name])}
              >
                + {staple.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <ChatInterface
        placeholder="Ask me about ingredients for your cuisine..."
        systemPrompt={SHOPPING_CART_AI_PROMPT}
        context={{ shoppingList, detectedCuisine }}
      />
    </div>
  );
}
```

---

## 📊 **Success Metrics**

### **User Engagement**

- **Recommendation Acceptance**: >60% of suggestions added to groceries
- **Chat Interaction**: Average 3+ messages per shopping session
- **Feature Usage**: >40% of users interact with AI assistant

### **Accuracy Metrics**

- **Cuisine Detection**: >85% accuracy on user validation
- **Recommendation Relevance**: >4.0/5.0 user rating
- **Cultural Authenticity**: Expert validation score >90%

### **Business Impact**

- **Grocery Collection Growth**: 25% increase in "My Groceries" items
- **User Retention**: 15% improvement in monthly active users
- **Feature Satisfaction**: >4.5/5.0 Net Promoter Score

---

## 📝 **Conclusion**

The Shopping Cart AI Integration transforms ingredient shopping from a mundane task into an educational, culturally-enriching experience. By analyzing Alice's Mexican cooking ingredients and suggesting authentic staples like Mexican oregano and cumin, the AI helps users build comprehensive ingredient collections that enable authentic cuisine exploration.

The system balances technical sophistication with user-friendly interactions, ensuring that both novice and experienced cooks can benefit from culturally-accurate, contextually-relevant ingredient recommendations that enhance their culinary journey.

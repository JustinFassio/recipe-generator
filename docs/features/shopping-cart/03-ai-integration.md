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

## 📋 **Multi-Cuisine Detection System**

### **Universal Cuisine Recognition**

The AI assistant is designed to detect and support **multiple cuisine types** by analyzing shopping cart ingredients and recommending comprehensive staple collections for each cooking style.

**Supported Cuisine Categories:**

- **Mexican**: Cumin, Mexican oregano, poblano peppers, limes, masa harina
- **Italian**: Fresh basil, good olive oil, Parmigiano-Reggiano, San Marzano tomatoes
- **French**: Herbes de Provence, shallots, butter, white wine, crème fraîche
- **Asian**: Fresh ginger, soy sauce, sesame oil, rice vinegar, green onions
- **Mediterranean**: Olive oil, lemon, feta cheese, olives, fresh herbs
- **Indian**: Garam masala, turmeric, cumin, coriander, ghee
- **American Southern**: Buttermilk, bacon, cornmeal, hot sauce, pecans
- **Thai**: Fish sauce, coconut milk, lemongrass, Thai chilies, lime leaves

### **Example: Alice's Mexican Cooking Journey**

> _"Alice Baker is making Mexican dishes and wants to know what spices, vegetables, fruits and aromatics she should have as staples in her My Groceries page to regularly make authentic Mexican food."_

**AI Assistant Workflow:**

1. **Analyzes Shopping Cart**: Detects Mexican ingredients (jalapeños, cilantro, lime, etc.)
2. **Identifies Cuisine Pattern**: Recognizes Mexican cooking style with 92% confidence
3. **Suggests Authentic Staples**: Recommends cumin, Mexican oregano, poblano peppers, etc.
4. **Provides Cultural Context**: Explains ingredient uses and authenticity
5. **Integrates with My Groceries**: Allows one-click addition to permanent collection

**Note**: _Mexican cuisine is used as the primary example throughout this document, but the system supports all major cuisine types with the same level of detail and cultural authenticity._

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

## 🌍 **Multi-Cuisine Detection Examples**

### **Cuisine Detection Triggers**

**Mexican Cuisine Detection:**
When shopping cart contains: `jalapeños`, `cilantro`, `lime`, `avocados`, `tomatoes`, `onions`

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

**Italian Cuisine Detection:**
When shopping cart contains: `basil`, `parmesan`, `olive oil`, `tomatoes`, `garlic`, `mozzarella`

```json
{
  "primary": {
    "cuisine": "Italian",
    "confidence": 0.89,
    "indicators": ["basil", "parmesan", "olive oil", "mozzarella"],
    "subStyles": ["Northern Italian", "Southern Italian"]
  },
  "mixed": false
}
```

**Asian Cuisine Detection:**
When shopping cart contains: `soy sauce`, `ginger`, `sesame oil`, `green onions`, `rice vinegar`

```json
{
  "primary": {
    "cuisine": "Asian",
    "confidence": 0.85,
    "indicators": ["soy sauce", "ginger", "sesame oil", "green onions"],
    "subStyles": ["Chinese", "Japanese", "Korean"]
  },
  "mixed": false
}
```

**Mixed Cuisine Detection:**
When shopping cart contains ingredients from multiple cuisines:

```json
{
  "primary": {
    "cuisine": "Italian",
    "confidence": 0.65,
    "indicators": ["basil", "olive oil", "parmesan"]
  },
  "secondary": [
    {
      "cuisine": "Asian",
      "confidence": 0.45,
      "indicators": ["soy sauce", "ginger"]
    }
  ],
  "mixed": true
}
```

### **Staple Recommendations by Cuisine**

#### **Mexican Cuisine Staples**

**Essential Spices:**

- **Cumin (Comino)**: _"The soul of Mexican cooking. Essential for beans, meat, and sauces."_
- **Mexican Oregano**: _"Different from Mediterranean oregano. Floral and citrusy."_
- **Chili Powder**: _"Blend of dried chiles. Foundation for many Mexican dishes."_

**Essential Vegetables:**

- **White Onions**: _"Preferred over yellow in Mexican cooking. Sharp, clean flavor."_
- **Roma Tomatoes**: _"Meaty texture perfect for salsas and sauces."_
- **Poblano Peppers**: _"Mild heat, rich flavor. Essential for chiles rellenos."_

**Essential Fruits & Aromatics:**

- **Limes**: _"Mexican limes are smaller and more acidic. Essential for authenticity."_
- **Fresh Cilantro**: _"Herb that defines Mexican cuisine. Use leaves and stems."_
- **Tomatillos**: _"Green tomato relatives. Key ingredient for salsa verde."_

#### **Italian Cuisine Staples**

**Essential Herbs & Spices:**

- **Fresh Basil**: _"The king of Italian herbs. Essential for pasta, pizza, and sauces."_
- **Oregano**: _"Mediterranean oregano for authentic Italian flavor."_
- **Red Pepper Flakes**: _"Adds heat to pasta dishes and pizza."_

**Essential Ingredients:**

- **Good Olive Oil**: _"Foundation of Italian cuisine. For cooking and finishing dishes."_
- **Parmigiano-Reggiano**: _"The king of Italian cheeses. For pasta, risotto, and salads."_
- **San Marzano Tomatoes**: _"Sweet, low-acid tomatoes perfect for authentic sauce."_

#### **French Cuisine Staples**

**Essential Herbs & Aromatics:**

- **Herbes de Provence**: _"Classic French herb blend for meat and vegetables."_
- **Fresh Thyme**: _"Essential for French cooking. Pairs with butter and wine."_
- **Shallots**: _"Milder than onions. Foundation of French sauces."_

**Essential Ingredients:**

- **Butter**: _"Unsalted European-style butter for authentic French flavor."_
- **White Wine**: _"Dry white wine for deglazing and sauces."_
- **Crème Fraîche**: _"Rich, tangy cream for sauces and finishing dishes."_

#### **Asian Cuisine Staples**

**Essential Sauces & Seasonings:**

- **Soy Sauce**: _"Light and dark varieties. Foundation of umami flavor."_
- **Sesame Oil**: _"Toasted sesame oil for finishing dishes. A little goes a long way."_
- **Rice Vinegar**: _"Mild acidity perfect for dressings and marinades."_

**Essential Fresh Ingredients:**

- **Fresh Ginger**: _"Essential for stir-fries, marinades, and soups."_
- **Green Onions**: _"Used for garnish and flavor in most Asian dishes."_
- **Garlic**: _"Fresh garlic cloves for authentic Asian flavors."_

### **Multi-Cuisine AI Conversation Examples**

#### **Mexican Cuisine Detection Example**

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

Want to explore more authentic Mexican staples? 🇲🇽
```

#### **Italian Cuisine Detection Example**

```
🤖 AI Assistant: I see you're gathering Italian ingredients! 🇮🇹
Your cart has fresh basil, parmesan, and olive oil - the holy trinity of Italian cooking!

For authentic Italian dishes, would you like recommendations for essential pantry staples?

👤 User: Yes, I want to cook real Italian food, not just pasta with jarred sauce.

🤖 AI Assistant: Excellent! Here are Italian essentials that will transform your cooking:

**QUALITY INGREDIENTS** 🫒
• San Marzano tomatoes (sweet, low-acid - perfect for sauce)
• Extra virgin olive oil (for finishing, not just cooking)
• Aged Parmigiano-Reggiano (24+ months for best flavor)

**FRESH HERBS** 🌿
• Fresh basil (never dried for pasta)
• Fresh oregano (Mediterranean variety)
• Italian parsley (flat-leaf, more flavor than curly)

The key to Italian cooking is using fewer, higher-quality ingredients!

👤 User: What's special about San Marzano tomatoes?

🤖 AI Assistant: San Marzano tomatoes are the gold standard! 🍅
• Grown in volcanic soil near Naples
• Naturally sweet with low acidity
• Thin skin that breaks down perfectly in sauce
• DOP certified ones are worth the extra cost

Regular canned tomatoes will work, but San Marzanos make restaurant-quality sauce at home!
```

#### **Mixed Cuisine Detection Example**

```
🤖 AI Assistant: Interesting mix in your cart! 🌍
I'm detecting both Italian (basil, parmesan) and Asian (soy sauce, ginger) ingredients.
Are you planning fusion dishes or cooking multiple cuisines?

👤 User: Both! I love mixing flavors from different cultures.

🤖 AI Assistant: Fusion cooking is amazing! Here are versatile staples that work across cuisines:

**UNIVERSAL FLAVOR BUILDERS** 🧄
• Fresh garlic (essential in Italian, Asian, and most cuisines)
• Good olive oil (great for Italian and Mediterranean-Asian fusion)
• Fresh ginger (pairs surprisingly well with Italian herbs)

**FUSION-FRIENDLY INGREDIENTS** 🌿
• Green onions (work in Asian dishes and Italian frittatas)
• Sesame oil (adds depth to Italian pasta dishes)
• Rice vinegar (lighter than balsamic for delicate Italian salads)

Want specific fusion recipe ideas using your current ingredients?
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
        'masa harina',
        'chili powder',
        'white onions',
        'epazote',
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
        'san marzano',
        'pine nuts',
        'arugula',
        'pancetta',
        'pecorino',
      ],
      weights: { basil: 0.3, parmesan: 0.25, 'olive oil': 0.2 },
      threshold: 0.6,
    },
    french: {
      indicators: [
        'butter',
        'shallots',
        'thyme',
        'herbes de provence',
        'white wine',
        'crème fraîche',
        'tarragon',
        'cognac',
        'gruyère',
        'baguette',
        'leeks',
        'dijon mustard',
        'capers',
        'anchovies',
      ],
      weights: { butter: 0.3, shallots: 0.25, thyme: 0.2 },
      threshold: 0.6,
    },
    asian: {
      indicators: [
        'soy sauce',
        'ginger',
        'sesame oil',
        'rice vinegar',
        'green onions',
        'miso',
        'wasabi',
        'nori',
        'sake',
        'mirin',
        'rice',
        'tofu',
        'shiitake',
        'bok choy',
        'fish sauce',
      ],
      weights: { 'soy sauce': 0.3, ginger: 0.25, 'sesame oil': 0.2 },
      threshold: 0.6,
    },
    indian: {
      indicators: [
        'garam masala',
        'turmeric',
        'cumin',
        'coriander',
        'cardamom',
        'ghee',
        'curry leaves',
        'basmati',
        'paneer',
        'naan',
        'mustard seeds',
        'fenugreek',
        'tamarind',
        'coconut',
      ],
      weights: { 'garam masala': 0.3, turmeric: 0.25, cumin: 0.2 },
      threshold: 0.6,
    },
    thai: {
      indicators: [
        'fish sauce',
        'coconut milk',
        'lemongrass',
        'thai basil',
        'lime leaves',
        'galangal',
        'thai chilies',
        'palm sugar',
        'tamarind',
        'jasmine rice',
        'curry paste',
        'peanuts',
        'lime',
        'cilantro',
      ],
      weights: { 'fish sauce': 0.3, 'coconut milk': 0.25, lemongrass: 0.2 },
      threshold: 0.6,
    },
    // Additional cuisines supported...
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

The Shopping Cart AI Integration transforms ingredient shopping from a mundane task into an educational, culturally-enriching experience across **multiple cuisine types**. Whether analyzing Mexican ingredients (like Alice's jalapeños and cilantro), Italian staples (basil and parmesan), French essentials (butter and shallots), or Asian fundamentals (soy sauce and ginger), the AI helps users build comprehensive ingredient collections for authentic cooking.

**Key Multi-Cuisine Capabilities:**

- **Universal Detection**: Recognizes 8+ major cuisine types with high accuracy
- **Cultural Authenticity**: Provides genuine ingredient recommendations for each cuisine
- **Educational Context**: Explains why specific ingredients are essential to each cooking style
- **Flexible Support**: Handles mixed cuisines and fusion cooking approaches
- **Comprehensive Coverage**: From Mexican oregano to French crème fraîche to Thai fish sauce

The system balances technical sophistication with user-friendly interactions, ensuring that both novice and experienced cooks can benefit from culturally-accurate, contextually-relevant ingredient recommendations that enhance their culinary journey across all cooking traditions.

**Example Use Cases:**

- **Mexican Enthusiast**: Build authentic taco and mole ingredient collection
- **Italian Purist**: Stock genuine pasta and risotto essentials
- **French Home Cook**: Assemble classic sauce and technique ingredients
- **Asian Fusion Explorer**: Combine traditional and modern Asian flavors
- **Global Adventurer**: Mix and match ingredients across multiple cuisines

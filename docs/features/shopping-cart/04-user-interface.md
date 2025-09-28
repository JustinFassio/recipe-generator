# Shopping Cart Feature - User Interface Design

**Project:** Recipe Generator  
**Feature:** Shopping Cart with AI Assistant  
**Document:** `docs/features/shopping-cart/04-user-interface.md`  
**Author:** AI Assistant  
**Date:** September 2025  
**Status:** Implementation Ready

---

## 🎯 **UI Design Overview**

The Shopping Cart feature provides a comprehensive user interface that seamlessly integrates with the existing Recipe Generator app while introducing powerful new shopping and AI-assisted capabilities. The design follows DaisyUI 5 and Tailwind CSS 4 patterns, maintaining consistency with the project's atomic component architecture.

### **Core UI Principles**

- **Mobile-First Design**: Optimized for in-store shopping experiences
- **Context Preservation**: Clear visual connections between ingredients and their sources
- **AI-Driven Assistance**: Integrated AI chat for cuisine-specific recommendations
- **Seamless Integration**: Consistent with existing app navigation and component patterns
- **Accessibility First**: ARIA attributes, keyboard navigation, and screen reader support

---

## 🏗️ **Component Architecture**

### **Feature-First Organization**

Following the project's component structure:

```
src/components/shopping-cart/
├── pages/
│   └── ShoppingCartPage.tsx          # Main /cart page
├── shopping-list/
│   ├── ShoppingListView.tsx          # Desktop shopping list interface
│   ├── ShoppingListItem.tsx          # Individual item component
│   ├── ShoppingModeView.tsx          # Mobile shopping mode
│   ├── ShoppingListBadge.tsx         # Header badge component
│   └── ShoppingListExport.tsx        # Export functionality
├── ai-assistant/
│   ├── ShoppingCartAI.tsx            # AI assistant panel
│   ├── CuisineDetectionCard.tsx      # Cuisine analysis display
│   ├── StapleRecommendations.tsx     # Suggested ingredients
│   └── AIShoppingChat.tsx            # Interactive chat interface
├── integration/
│   ├── RecipeAddToCartButton.tsx     # Recipe view integration
│   ├── AIResponseCartButton.tsx      # AI chat integration
│   ├── GroceryRestockButton.tsx      # My Groceries integration
│   └── PublicRecipeSaveButton.tsx    # Public recipe integration
└── shared/
    ├── ShoppingItemCard.tsx          # Reusable item display
    ├── ContextDisplay.tsx            # Source context component
    └── QuantitySelector.tsx          # Quantity management
```

---

## 📱 **Core User Interface Components**

### **1. Shopping Cart Page (`/cart`)**

**Main Layout: Desktop & Tablet**

```tsx
const ShoppingCartPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="navbar bg-base-200 border-b border-base-300">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl">
            ← Back
          </Link>
        </div>
        <div className="navbar-center">
          <h1 className="text-2xl font-bold">
            🛒 Shopping Cart ({shoppingCount})
          </h1>
        </div>
        <div className="navbar-end gap-2">
          <button className="btn btn-outline btn-sm">
            <ExportIcon className="w-4 h-4" />
            Export
          </button>
          <button className="btn btn-primary" disabled={shoppingCount === 0}>
            Shopping Mode
          </button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Shopping List (2/3 width) */}
        <div className="flex-1 p-6 border-r border-base-300">
          <ShoppingListView />
        </div>

        {/* AI Assistant (1/3 width) */}
        <div className="w-96 bg-base-50">
          <ShoppingCartAI />
        </div>
      </div>
    </div>
  );
};
```

### **2. Shopping List Item Component**

**Individual Item with Context Display**

```tsx
interface ShoppingListItemProps {
  item: ShoppingItem;
  onTogglePurchased: () => void;
  onRemove: () => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({
  item,
  onTogglePurchased,
  onRemove,
}) => {
  const context = useShoppingList().getItemContext(item.name);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`
      border rounded-lg p-4 transition-all
      ${
        item.status === 'purchased'
          ? 'bg-success/10 border-success/20'
          : 'bg-base-100 border-base-300 hover:border-primary/50'
      }
    `}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          className="checkbox checkbox-primary"
          checked={item.status === 'purchased'}
          onChange={onTogglePurchased}
          aria-label={`Mark ${item.name} as ${item.status === 'purchased' ? 'pending' : 'purchased'}`}
        />

        {/* Item Details */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4
              className={`font-medium ${
                item.status === 'purchased'
                  ? 'line-through text-base-content/60'
                  : ''
              }`}
            >
              {item.name}
            </h4>

            <div className="flex items-center gap-2">
              {/* Source Badges */}
              <div className="flex gap-1">
                {context?.sources.map((source, idx) => (
                  <div
                    key={idx}
                    className={`badge badge-xs ${getSourceBadgeColor(source.type)}`}
                    title={source.context}
                  >
                    {getSourceIcon(source.type)}
                  </div>
                ))}
              </div>

              {/* Actions Dropdown */}
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-xs">
                  <MoreIcon className="w-4 h-4" />
                </label>
                <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li>
                    <button onClick={() => setShowDetails(!showDetails)}>
                      {showDetails ? 'Hide' : 'Show'} Details
                    </button>
                  </li>
                  <li>
                    <button>Edit Quantity</button>
                  </li>
                  <li>
                    <button>Add Note</button>
                  </li>
                  <li className="border-t border-base-300">
                    <button onClick={onRemove} className="text-error">
                      Remove Item
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Context Display */}
          {showDetails && context && (
            <div className="mt-3 p-3 bg-base-200 rounded">
              <div className="text-sm space-y-2">
                {/* Sources */}
                <div>
                  <span className="font-medium">Needed for:</span>
                  <ul className="list-disc list-inside ml-2 text-base-content/70">
                    {context.sources.map((source, idx) => (
                      <li key={idx}>{source.context}</li>
                    ))}
                  </ul>
                </div>

                {/* Quantities */}
                {context.quantities && context.quantities.length > 0 && (
                  <div>
                    <span className="font-medium">Quantities:</span>
                    <span className="ml-2 text-base-content/70">
                      {context.quantities.join(', ')}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {context.notes && (
                  <div>
                    <span className="font-medium">Notes:</span>
                    <span className="ml-2 text-base-content/70">
                      {context.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### **3. AI Assistant Panel**

**Cuisine-Focused Shopping Assistant**

```tsx
const ShoppingCartAI: React.FC = () => {
  const { shoppingList } = useShoppingList();
  const { analyzeCuisinePatterns, getChatResponse } =
    useShoppingCartAI(shoppingList);
  const [detectedCuisines, setDetectedCuisines] = useState<DetectedCuisine[]>(
    []
  );
  const [suggestions, setSuggestions] = useState<CuisineSuggestion[]>([]);

  useEffect(() => {
    const cuisines = analyzeCuisinePatterns(shoppingList);
    setDetectedCuisines(cuisines);

    if (cuisines.length > 0) {
      setSuggestions(cuisines[0].suggestedStaples);
    }
  }, [shoppingList]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-base-50 to-base-100">
      {/* AI Assistant Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold">
              Chef Isabella's Shopping Assistant
            </h3>
            <p className="text-sm text-base-content/70">
              Helping you shop smarter for authentic cuisine
            </p>
          </div>
        </div>
      </div>

      {/* Cuisine Detection */}
      {detectedCuisines.length > 0 && (
        <div className="p-4 border-b border-base-300">
          <h4 className="font-medium mb-3">Detected Cuisine Patterns</h4>
          <div className="space-y-2">
            {detectedCuisines.slice(0, 2).map((cuisine, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {getCuisineFlag(cuisine.type)}
                  </span>
                  <span className="font-medium capitalize">{cuisine.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-base-content/70">
                    {Math.round(cuisine.confidence * 100)}% match
                  </div>
                  <div
                    className="radial-progress text-primary text-xs"
                    style={
                      {
                        '--value': cuisine.confidence * 100,
                      } as React.CSSProperties
                    }
                  >
                    {Math.round(cuisine.confidence * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4 border-b border-base-300">
          <h4 className="font-medium mb-3">
            Suggested {detectedCuisines[0]?.type} Staples
          </h4>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((suggestion, idx) => (
              <div
                key={idx}
                className="card card-compact bg-base-100 border border-base-300"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-sm">
                        {suggestion.ingredient}
                      </h5>
                      <p className="text-xs text-base-content/70">
                        {suggestion.reason}
                      </p>
                    </div>
                    <button className="btn btn-primary btn-xs">Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-outline btn-sm w-full mt-3">
            Add All {detectedCuisines[0]?.type} Staples to Groceries
          </button>
        </div>
      )}

      {/* Interactive Chat */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
          <AIShoppingChat
            detectedCuisines={detectedCuisines}
            shoppingList={shoppingList}
          />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-base-300">
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered flex-1 input-sm"
              placeholder="Ask about ingredients, get cooking tips..."
            />
            <button className="btn btn-primary btn-sm">
              <SendIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🔗 **Integration Components**

### **1. Recipe View Integration**

**Add to Cart Buttons in Recipe Views**

```tsx
const RecipeAddToCartButton: React.FC<RecipeAddToCartButtonProps> = ({
  recipe,
  missingIngredients,
}) => {
  const { addFromRecipe } = useShoppingList();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addFromRecipe(missingIngredients, recipe.id, recipe.title);
      toast.success(
        `Added ${missingIngredients.length} ingredients to shopping list`
      );
    } catch (error) {
      toast.error('Failed to add ingredients to shopping list');
    } finally {
      setIsAdding(false);
    }
  };

  if (missingIngredients.length === 0) return null;

  return (
    <div className="card bg-warning/10 border border-warning/20">
      <div className="card-body p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Missing Ingredients</h4>
            <p className="text-sm text-base-content/70">
              {missingIngredients.length} items needed for this recipe
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              '🛒'
            )}
            Add to Shopping List
          </button>
        </div>

        {/* Preview of missing ingredients */}
        <div className="mt-3">
          <div className="flex flex-wrap gap-1">
            {missingIngredients.slice(0, 5).map((ingredient) => (
              <div key={ingredient} className="badge badge-outline badge-sm">
                {ingredient}
              </div>
            ))}
            {missingIngredients.length > 5 && (
              <div className="badge badge-neutral badge-sm">
                +{missingIngredients.length - 5} more
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### **2. Header Shopping List Badge**

**Persistent Cart Counter**

```tsx
const ShoppingListBadge: React.FC = () => {
  const { shoppingCount } = useShoppingList();
  const navigate = useNavigate();

  if (shoppingCount === 0) return null;

  return (
    <button
      className="btn btn-ghost relative"
      onClick={() => navigate('/cart')}
      aria-label={`Shopping cart with ${shoppingCount} items`}
    >
      <div className="indicator">
        <ShoppingCartIcon className="w-6 h-6" />
        <span className="badge badge-primary badge-sm indicator-item">
          {shoppingCount > 99 ? '99+' : shoppingCount}
        </span>
      </div>
    </button>
  );
};
```

### **3. Mobile Shopping Mode**

**In-Store Shopping Interface**

```tsx
const ShoppingModeView: React.FC<ShoppingModeViewProps> = ({
  shoppingList,
  onMarkPurchased,
  onExitShoppingMode,
}) => {
  const pendingItems = shoppingList.filter((item) => item.status === 'pending');
  const purchasedCount = shoppingList.filter(
    (item) => item.status === 'purchased'
  ).length;

  return (
    <div className="min-h-screen bg-base-100">
      {/* Shopping Mode Header */}
      <div className="navbar bg-primary text-primary-content sticky top-0 z-10">
        <div className="navbar-start">
          <button
            className="btn btn-ghost text-primary-content"
            onClick={onExitShoppingMode}
          >
            ← Back to List
          </button>
        </div>
        <div className="navbar-center">
          <div className="text-center">
            <div className="font-bold">Shopping Mode</div>
            <div className="text-sm opacity-80">
              {purchasedCount} of {shoppingList.length} found
            </div>
          </div>
        </div>
        <div className="navbar-end">
          <div
            className="radial-progress text-primary-content"
            style={
              {
                '--value': (purchasedCount / shoppingList.length) * 100,
              } as React.CSSProperties
            }
          >
            {Math.round((purchasedCount / shoppingList.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Large Touch-Friendly Shopping List */}
      <div className="p-4 space-y-3">
        {pendingItems.map((item) => (
          <div
            key={item.name}
            className="card bg-base-100 border-2 border-base-300 shadow-sm"
          >
            <div className="card-body p-4">
              <div className="flex items-center gap-4">
                {/* Large Checkbox */}
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-lg"
                  onChange={() => onMarkPurchased(item.name)}
                  aria-label={`Found ${item.name}`}
                />

                {/* Item Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-medium">{item.name}</h3>
                  <div className="text-sm text-base-content/70">
                    {getItemContext(item)
                      ?.sources.map((s) => s.context)
                      .join(', ')}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-1">
                  <button className="btn btn-outline btn-xs">Skip</button>
                  <button className="btn btn-ghost btn-xs">Note</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-base-100 border-t border-base-300">
        <div className="flex gap-2">
          <button className="btn btn-outline flex-1">Mark All Found</button>
          <button className="btn btn-primary flex-1">Complete Shopping</button>
        </div>
      </div>
    </div>
  );
};
```

---

## 🎨 **Design System & Styling**

### **Color Scheme & Theming**

Following DaisyUI 5 theme system:

```css
/* Shopping Cart Specific Theme Variables */
:root {
  --shopping-primary: oklch(var(--p));
  --shopping-success: oklch(var(--su));
  --shopping-warning: oklch(var(--wa));
  --shopping-accent: oklch(var(--a));
}

/* Custom Shopping Cart Classes */
.shopping-item-pending {
  @apply bg-base-100 border-base-300 hover:border-primary/50;
}

.shopping-item-purchased {
  @apply bg-success/10 border-success/20 text-base-content/60;
}

.shopping-mode-item {
  @apply card bg-base-100 border-2 border-base-300 shadow-sm
         hover:border-primary/50 active:scale-95 transition-all;
}

.ai-assistant-panel {
  @apply bg-gradient-to-b from-base-50 to-base-100 
         border-l border-base-300;
}

.cuisine-detection-card {
  @apply card bg-gradient-to-r from-primary/5 to-secondary/5
         border border-primary/20;
}
```

### **Mobile-Specific Optimizations**

```css
/* Large Touch Targets (minimum 44px) */
.shopping-mode-checkbox {
  @apply min-w-[44px] min-h-[44px];
}

.shopping-item-action-button {
  @apply min-w-[44px] min-h-[44px] touch-manipulation;
}

/* Prevent zoom on input focus (iOS) */
.shopping-input {
  @apply text-base; /* 16px minimum to prevent zoom */
}

/* Safe area handling */
.shopping-mode-bottom-bar {
  @apply pb-safe-bottom; /* Account for home indicator */
}
```

---

## ♿ **Accessibility Features**

### **Keyboard Navigation**

```tsx
// Shopping List Keyboard Support
const ShoppingListItem: React.FC = ({ item, onToggle, onRemove }) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        onToggle();
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onRemove();
        break;
      case 'ArrowDown':
        // Focus next item
        break;
      case 'ArrowUp':
        // Focus previous item
        break;
    }
  };

  return (
    <div
      className="shopping-list-item"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="listitem"
      aria-describedby={`item-context-${item.name}`}
    >
      {/* Item content */}
    </div>
  );
};
```

### **Screen Reader Support**

```tsx
// ARIA Labels and Descriptions
const ShoppingCartPage: React.FC = () => {
  return (
    <main role="main" aria-labelledby="shopping-cart-title">
      <h1 id="shopping-cart-title" className="sr-only">
        Shopping Cart with {shoppingCount} items
      </h1>

      <section
        aria-labelledby="shopping-list-heading"
        aria-describedby="shopping-list-description"
      >
        <h2 id="shopping-list-heading">Shopping List</h2>
        <p id="shopping-list-description" className="sr-only">
          Your shopping list organized by category with purchase status
        </p>

        <div role="list" aria-label="Shopping list items">
          {/* Shopping list items */}
        </div>
      </section>

      <aside
        aria-labelledby="ai-assistant-heading"
        aria-describedby="ai-assistant-description"
      >
        <h2 id="ai-assistant-heading">AI Shopping Assistant</h2>
        <p id="ai-assistant-description" className="sr-only">
          Get personalized ingredient recommendations based on your shopping
          list
        </p>
        {/* AI Assistant content */}
      </aside>
    </main>
  );
};
```

---

## 📝 **Implementation Summary**

This User Interface design provides:

✅ **Comprehensive Component Architecture**: Feature-first organization with reusable atomic components  
✅ **Mobile-First Responsive Design**: Optimized for in-store shopping experiences  
✅ **AI Integration**: Seamless cuisine detection and recommendation interface  
✅ **Accessibility Excellence**: Full keyboard navigation, screen reader support, and ARIA compliance  
✅ **Performance Optimized**: Virtual scrolling, memoization, and efficient re-renders  
✅ **DaisyUI 5 Consistency**: Maintains existing design system and component patterns

**Ready for Implementation**: This UI specification supports Alice's complete shopping journey from recipe discovery → AI suggestions → mobile shopping → grocery sync with a beautiful, accessible, and performant interface.

---

_This User Interface documentation provides comprehensive implementation guidance for creating a world-class shopping cart experience in the Recipe Generator app._

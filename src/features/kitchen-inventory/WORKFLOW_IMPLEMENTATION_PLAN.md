# Kitchen Inventory Workflow Implementation Plan

## **🎯 DESIRED WORKFLOW**

### **Core Concept: "Shelf Spot" Metaphor**

Each ingredient has a permanent "shelf spot" in the kitchen that can be either:

- **Filled (Available)**: Dark background, light text - "I have this"
- **Empty (Unavailable)**: Light background, dark text - "I need to buy this"

### **Workflow Rules**

1. **Global Ingredients Page**: Only entry point for adding new ingredients to kitchen
2. **Kitchen Inventory Page**: Only toggles availability (Available ↔ Unavailable)
3. **Shopping Cart Page**: Shows items that need to be purchased (Unavailable items)

---

## **📋 IMPLEMENTATION PHASES**

### **Phase 1: Shopping List Integration** 🆕 NEW APPROACH

**Goal**: Use shopping list for "Unavailable" state - Available = `groceries`, Unavailable = `shopping_list`

#### **New Approach - Shopping List Integration**:

- **Available State**: Ingredient in `groceries` (kitchen inventory)
- **Unavailable State**: Ingredient in `shopping_list` with status "pending"
- **Toggle Behavior**: Move ingredients between `groceries` and `shopping_list`
- **Persistence**: Both states saved to database, no data loss

#### **Implementation Steps**:

1. **Update `toggleIngredient`**: Move between `groceries` and `shopping_list`
2. **Update `saveGroceries`**: Save both `groceries` and `shopping_list`
3. **Update `loadGroceries`**: Load both states from database
4. **Update UI**: Show ingredients from both sources
5. **Add shopping workflow**: Mark as purchased, move back to kitchen

#### **Required Fixes**:

1. **Fix `toggleIngredient` Logic**

   ```typescript
   // CURRENT (BROKEN): Removes items from groceries state
   if (isSelected) {
     const newItems = categoryItems.filter((item) => item !== ingredient);
     return { ...prev, [category]: newItems };
   }

   // NEEDED: Keep items in persistent list, only change availability
   if (isSelected) {
     // Mark as Unavailable: Remove from groceries but keep in allIngredients
     const newItems = categoryItems.filter((item) => item !== ingredient);
     return { ...prev, [category]: newItems };
   }
   ```

2. **Update UI Logic**
   - Show `allIngredients` (persistent list) instead of `groceries` (available only)
   - `GroceryCard` determines visual state based on `groceries.hasIngredient()`

#### **Acceptance Criteria**:

- [ ] Ingredients remain visible when toggled to "Unavailable"
- [ ] Visual state changes: Available (dark) ↔ Unavailable (light)
- [ ] No ingredients disappear from kitchen list

---

### **Phase 2: Shopping List Integration** ❌ NOT IMPLEMENTED

**Goal**: Unavailable items automatically appear in shopping cart

#### **Required Implementation**:

1. **Add Shopping List Hook Integration**

   ```typescript
   // In useGroceries hook
   import { useShoppingList } from '@/hooks/useShoppingList';

   const { addToShoppingList, removeFromShoppingList } = useShoppingList();

   const toggleIngredient = useCallback(
     (category: string, ingredient: string) => {
       // ... existing logic ...

       if (isSelected) {
         // Mark as Unavailable: Remove from groceries, add to shopping list
         const newItems = categoryItems.filter((item) => item !== ingredient);
         addToShoppingList(ingredient, 'groceries-restock');
         return { ...prev, [category]: newItems };
       } else {
         // Mark as Available: Add to groceries, remove from shopping list
         const newState = {
           ...prev,
           [category]: [...categoryItems, ingredient],
         };
         removeFromShoppingList(ingredient);
         return newState;
       }
     },
     [addToShoppingList, removeFromShoppingList]
   );
   ```

2. **Update Shopping Cart Page**
   - Show items with source: 'groceries-restock'
   - Allow marking as purchased (moves back to kitchen)

#### **Acceptance Criteria**:

- [ ] Unavailable items appear in shopping cart
- [ ] Available items are removed from shopping cart
- [ ] Shopping cart shows "groceries-restock" source
- [ ] Purchasing items moves them back to kitchen

---

### **Phase 3: Restricted Entry Points** ❌ NOT IMPLEMENTED

**Goal**: Only Global Ingredients page can add new items to kitchen

#### **Required Implementation**:

1. **Remove Add Functionality from Kitchen Inventory**

   ```typescript
   // Remove any "Add Ingredient" buttons from KitchenInventoryPage
   // Only allow toggle functionality
   ```

2. **Update Global Ingredients Page**

   ```typescript
   // Ensure addToCart adds to both groceries and allIngredients
   const handleAddToGroceries = async (category: string, name: string) => {
     await addToCart(category, name);
     // Also add to persistent list
     groceries.addToPersistentList(category, name);
   };
   ```

3. **Add Persistent List Management**
   ```typescript
   // In useGroceries hook
   const addToPersistentList = useCallback(
     (category: string, ingredient: string) => {
       setAllIngredients((prev) => ({
         ...prev,
         [category]: [...(prev[category] || []), ingredient],
       }));
     },
     []
   );
   ```

#### **Acceptance Criteria**:

- [ ] Kitchen Inventory page cannot add new ingredients
- [ ] Only Global Ingredients page can add to kitchen
- [ ] New ingredients are added to persistent list
- [ ] Kitchen shows all ingredients (available + unavailable)

---

### **Phase 4: Enhanced Shopping Cart Integration** ❌ NOT IMPLEMENTED

**Goal**: Seamless workflow between kitchen and shopping

#### **Required Implementation**:

1. **Shopping Cart Item Management**

   ```typescript
   // In shopping cart page
   const handleMarkAsPurchased = async (itemId: string) => {
     const item = shoppingList[itemId];
     if (item.source === 'groceries-restock') {
       // Move back to kitchen as available
       groceries.toggleIngredient(item.category, item.name);
       removeFromShoppingList(itemId);
     }
   };
   ```

2. **Bulk Operations**

   ```typescript
   // Add "Mark All as Purchased" functionality
   const handleMarkAllAsPurchased = async () => {
     const restockItems = Object.values(shoppingList).filter(
       (item) => item.source === 'groceries-restock'
     );

     for (const item of restockItems) {
       groceries.toggleIngredient(item.category, item.name);
       removeFromShoppingList(item.id);
     }
   };
   ```

#### **Acceptance Criteria**:

- [ ] Purchasing items moves them back to kitchen
- [ ] Bulk purchase operations work
- [ ] Clear visual feedback for state changes

---

## **🔧 TECHNICAL IMPLEMENTATION DETAILS**

### **Database Schema Updates**

```sql
-- No schema changes needed
-- Current user_groceries table supports the workflow:
-- - groceries: Available items
-- - shopping_list: Unavailable items (via shopping list integration)
```

### **State Management Updates**

```typescript
// useGroceries hook additions
interface UseGroceriesReturn {
  // ... existing fields ...
  allIngredients: Record<string, string[]>; // Persistent list
  addToPersistentList: (category: string, ingredient: string) => void;
  removeFromPersistentList: (category: string, ingredient: string) => void;
}
```

### **Component Updates**

```typescript
// KitchenInventoryPage changes
- Remove any "Add Ingredient" functionality
- Show allIngredients instead of groceries
- Only allow toggle operations

// GlobalIngredientsPage changes
- Ensure addToCart updates both groceries and allIngredients
- Clear messaging about adding to kitchen

// ShoppingCartPage changes
- Show groceries-restock items
- Allow marking as purchased
- Bulk operations for restocking
```

---

## **🧪 TESTING STRATEGY**

### **Unit Tests**

- [ ] `toggleIngredient` maintains persistent list
- [ ] Shopping list integration works
- [ ] Entry point restrictions enforced

### **Integration Tests**

- [ ] Global Ingredients → Kitchen → Shopping Cart workflow
- [ ] State persistence across page navigation
- [ ] Bulk operations work correctly

### **E2E Tests**

- [ ] Complete user workflow from adding ingredient to purchasing
- [ ] Visual state changes work correctly
- [ ] No ingredients disappear unexpectedly

---

## **📊 SUCCESS METRICS**

### **Functional Requirements**

- [ ] Ingredients never disappear from kitchen
- [ ] Unavailable items appear in shopping cart
- [ ] Only Global Ingredients can add to kitchen
- [ ] Purchasing moves items back to kitchen

### **User Experience**

- [ ] Clear visual distinction between Available/Unavailable
- [ ] Intuitive workflow between pages
- [ ] No confusion about where to add ingredients

### **Performance**

- [ ] No performance degradation with persistent lists
- [ ] Efficient state updates
- [ ] Minimal re-renders

---

## **🚀 DEPLOYMENT PLAN**

### **Phase 1**: Fix persistent kitchen slots (Critical)

- **Priority**: High
- **Effort**: 2-4 hours
- **Risk**: Low

### **Phase 2**: Add shopping list integration (Important)

- **Priority**: Medium
- **Effort**: 4-6 hours
- **Risk**: Medium

### **Phase 3**: Restrict entry points (Important)

- **Priority**: Medium
- **Effort**: 2-3 hours
- **Risk**: Low

### **Phase 4**: Enhanced shopping cart (Nice to have)

- **Priority**: Low
- **Effort**: 3-4 hours
- **Risk**: Low

---

## **📝 NOTES**

### **Current Issues**

1. **Critical**: Items disappear when toggled to "Unavailable"
2. **Important**: No shopping list integration
3. **Important**: Multiple entry points for adding ingredients

### **Design Decisions**

- Use "shelf spot" metaphor for persistent slots
- Clear visual distinction between states
- Restricted entry points for data integrity
- Seamless integration between kitchen and shopping

### **Future Enhancements**

- Expiration date tracking
- Inventory analytics
- Smart shopping suggestions
- Bulk import/export functionality

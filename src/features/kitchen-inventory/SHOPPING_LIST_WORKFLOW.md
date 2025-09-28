# Shopping List Workflow - Kitchen Inventory

**Module:** features/kitchen-inventory  
**Scope:** Implement persistent "Unavailable" state using shopping list integration  
**Status:** Design Phase

---

## Workflow Design

### **Core Concept**

- **`groceries`** = Available ingredients in your kitchen (in stock)
- **`shopping_list`** = Unavailable ingredients you need to buy (out of stock)
- **Toggle behavior** = Move ingredients between kitchen inventory and shopping list

### **Data Flow**

#### **1. Available → Unavailable (Toggle Off)**

```
User clicks "Pasta" (Available)
→ Remove from groceries.bakery_grains
→ Add to shopping_list: { "Pasta": "pending" }
→ Pasta remains visible but shows as "Unavailable" (needs to be bought)
```

#### **2. Unavailable → Available (Toggle On)**

```
User clicks "Pasta" (Unavailable)
→ Remove from shopping_list
→ Add to groceries.bakery_grains
→ Pasta shows as "Available" (in stock)
```

#### **3. Shopping Trip Workflow**

```
User goes shopping
→ Buys "Pasta"
→ shopping_list: { "Pasta": "purchased" }
→ User returns home
→ Pasta automatically moves to groceries.bakery_grains
→ Status: "Available" (in kitchen)
```

---

## Database Schema

### **Current Structure**

```sql
user_groceries:
- groceries: jsonb (available ingredients by category)
- shopping_list: jsonb (shopping items with status)
```

### **Data Examples**

#### **Available State**

```json
{
  "groceries": {
    "bakery_grains": ["Pasta", "Bread"],
    "cooking_essentials": ["Olive Oil"]
  },
  "shopping_list": {}
}
```

#### **Unavailable State**

```json
{
  "groceries": {
    "bakery_grains": ["Bread"],
    "cooking_essentials": ["Olive Oil"]
  },
  "shopping_list": {
    "Pasta": "pending"
  }
}
```

#### **After Shopping**

```json
{
  "groceries": {
    "bakery_grains": ["Pasta", "Bread"],
    "cooking_essentials": ["Olive Oil"]
  },
  "shopping_list": {}
}
```

---

## Implementation Plan

### **Phase 1: Core Toggle Logic**

#### **1.1 Update `toggleIngredient` Function**

```typescript
const toggleIngredient = (category: string, ingredient: string) => {
  const isSelected = groceries.hasIngredient(category, ingredient);

  if (isSelected) {
    // Available → Unavailable: Move to shopping list
    setGroceries((prev) => {
      const newItems = prev[category].filter((item) => item !== ingredient);
      return { ...prev, [category]: newItems };
    });

    setShoppingList((prev) => ({
      ...prev,
      [ingredient]: 'pending',
    }));
  } else {
    // Unavailable → Available: Move to kitchen inventory
    setShoppingList((prev) => {
      const { [ingredient]: removed, ...rest } = prev;
      return rest;
    });

    setGroceries((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), ingredient],
    }));
  }
};
```

#### **1.2 Update `saveGroceries` Function**

```typescript
const saveGroceries = async () => {
  const result = await updateUserGroceries(user.id, groceries, shoppingList);
  // Save both groceries and shopping_list
};
```

#### **1.3 Update `loadGroceries` Function**

```typescript
const loadGroceries = async () => {
  const data = await getUserGroceries(user.id);
  setGroceries(data.groceries || {});
  setShoppingList(data.shopping_list || {});
  // Load both states
};
```

### **Phase 2: UI Integration**

#### **2.1 Update `KitchenInventoryPage`**

```typescript
const userCategoryItems = useMemo(() => {
  // Show ingredients from both groceries and shopping_list
  const availableItems = Object.values(groceries).flat();
  const unavailableItems = Object.keys(shoppingList);
  return [...availableItems, ...unavailableItems];
}, [groceries, shoppingList]);
```

#### **2.2 Update `GroceryCard` Visual States**

```typescript
const isSelected = groceries.hasIngredient(category, ingredient);
const isInShoppingList = shoppingList[ingredient] === 'pending';

// Visual states:
// - Available: Dark background, "Available" text
// - Unavailable: Light background, "Need to Buy" text
// - Purchased: Gray background, "Purchased" text
```

### **Phase 3: Shopping Trip Workflow**

#### **3.1 Shopping List Page**

- Display items with `shopping_list` status "pending"
- Allow marking as "purchased"
- Auto-move purchased items back to kitchen inventory

#### **3.2 Status Management**

```typescript
const markAsPurchased = (ingredient: string) => {
  setShoppingList((prev) => ({
    ...prev,
    [ingredient]: 'purchased',
  }));

  // Auto-move to kitchen inventory
  const category = resolveCategoryForIngredient(ingredient);
  setGroceries((prev) => ({
    ...prev,
    [category]: [...(prev[category] || []), ingredient],
  }));
};
```

---

## Benefits

### **1. Semantic Correctness**

- "Unavailable" = "Need to buy" = Shopping list
- Aligns with real-world kitchen workflow

### **2. Existing Infrastructure**

- Uses existing `shopping_list` field
- No database schema changes needed
- Leverages existing `updateUserGroceries` function

### **3. User Experience**

- Clear visual distinction between available/unavailable
- Natural shopping trip workflow
- Persistent state across navigation

### **4. Data Integrity**

- Single source of truth for each ingredient
- No duplicate data or sync issues
- Clean state transitions

---

## Technical Considerations

### **1. Category Resolution**

- Need to track original category when moving to shopping list
- Use `persistent_ingredients` field or metadata in shopping_list

### **2. Status Tracking**

- `"pending"` = Need to buy
- `"purchased"` = Bought, ready to move to kitchen
- `"completed"` = Moved to kitchen inventory

### **3. Bulk Operations**

- "Mark all as purchased" for shopping trips
- "Clear completed items" for cleanup

### **4. Data Migration**

- Existing users: Move current groceries to new structure
- Preserve existing shopping_list data

---

## Acceptance Criteria

### **Core Functionality**

- [ ] Toggle ingredient moves between groceries and shopping_list
- [ ] Visual state reflects availability correctly
- [ ] Save persists both groceries and shopping_list
- [ ] Navigation preserves state

### **Shopping Workflow**

- [ ] Shopping list shows pending items
- [ ] Mark as purchased moves to kitchen inventory
- [ ] Status tracking works correctly
- [ ] Bulk operations available

### **Data Integrity**

- [ ] No duplicate ingredients across states
- [ ] Category information preserved
- [ ] State transitions are atomic
- [ ] Database consistency maintained

---

## Next Steps

1. **Implement Phase 1** - Core toggle logic
2. **Test data flow** - Verify groceries ↔ shopping_list transitions
3. **Update UI** - Visual states and user feedback
4. **Add shopping workflow** - Status management and bulk operations
5. **Data migration** - Handle existing user data

---

## References

- Current implementation: `src/hooks/useGroceries.ts`
- Database schema: `user_groceries` table
- UI components: `src/components/groceries/GroceryCard.tsx`
- Page component: `src/features/kitchen-inventory/page.tsx`

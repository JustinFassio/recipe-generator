# Seed Ingredient System

**Purpose**: Comprehensive documentation of the global ingredient seed data system, including categories, synonyms, and matching functionality.

**Last Updated**: January 2025

---

## 🥕 **Ingredient System Overview**

The seed data system creates a comprehensive global ingredient database with 50+ ingredients, categories, synonyms, and usage tracking to support recipe matching, grocery list functionality, and dietary restriction filtering.

---

## 📊 **Ingredient Statistics**

| Category   | Count | Examples                                   |
| ---------- | ----- | ------------------------------------------ |
| Proteins   | 15+   | Chicken, beef, salmon, tofu, beans         |
| Vegetables | 20+   | Onions, garlic, tomatoes, spinach, peppers |
| Fruits     | 10+   | Apples, bananas, lemons, limes, berries    |
| Dairy      | 8+    | Milk, cheese, yogurt, butter               |
| Pantry     | 15+   | Oils, grains, spices, condiments           |
| Spices     | 12+   | Salt, pepper, herbs, seasonings            |

---

## 🏷️ **Ingredient Categories**

### **Proteins**

- **Meat**: Chicken breast, ground beef, pork chops, brisket
- **Seafood**: Salmon, shrimp, tuna, cod
- **Plant-based**: Tofu, tempeh, black beans, lentils, quinoa
- **Dairy**: Eggs, Greek yogurt, cheese

### **Vegetables**

- **Root**: Onions, garlic, carrots, potatoes
- **Leafy**: Spinach, kale, lettuce, arugula
- **Cruciferous**: Broccoli, cauliflower, Brussels sprouts
- **Nightshades**: Tomatoes, bell peppers, eggplant
- **Alliums**: Onions, garlic, leeks, shallots

### **Fruits**

- **Citrus**: Lemons, limes, oranges, grapefruit
- **Tropical**: Bananas, avocados, mangoes, pineapples
- **Berries**: Strawberries, blueberries, raspberries
- **Tree**: Apples, pears, peaches, plums

### **Dairy**

- **Milk**: Whole milk, almond milk, coconut milk
- **Cheese**: Mozzarella, parmesan, cheddar, feta
- **Yogurt**: Greek yogurt, regular yogurt
- **Butter**: Unsalted butter, ghee

### **Pantry**

- **Oils**: Olive oil, coconut oil, vegetable oil
- **Grains**: Rice, pasta, quinoa, oats
- **Legumes**: Beans, lentils, chickpeas
- **Condiments**: Soy sauce, vinegar, honey, mustard

### **Spices**

- **Basic**: Salt, black pepper, garlic powder
- **Herbs**: Basil, oregano, thyme, rosemary
- **Spices**: Cumin, paprika, cayenne, turmeric
- **Blends**: Italian seasoning, taco seasoning

---

## 🔍 **Ingredient Matching System**

### **Synonym Support**

Each ingredient includes multiple synonyms to improve matching:

```typescript
{
  name: 'chicken breast',
  category: 'proteins',
  synonyms: ['chicken', 'poultry', 'chicken fillet']
}
```

### **Category-Based Matching**

Ingredients are categorized for:

- **Dietary Filtering**: Vegetarian, vegan, gluten-free
- **Nutritional Analysis**: Protein, carbohydrate, fat content
- **Shopping Lists**: Organized by category
- **Recipe Suggestions**: Based on available ingredients

### **Usage Tracking**

- **Usage Count**: How often ingredient appears in recipes
- **Verification Status**: System-verified vs user-created
- **Popularity**: Most used ingredients for suggestions

---

## 🛒 **Grocery List Integration**

### **User-Specific Groceries**

Each test user has personalized grocery lists based on their preferences:

#### **Alice (Vegetarian)**

- **Proteins**: tofu, tempeh, eggs, lentils, chickpeas, quinoa
- **Vegetables**: spinach, bell peppers, onions, garlic, tomatoes
- **Spices**: basil, oregano, cumin, paprika, garlic powder
- **Pantry**: olive oil, pasta, rice, canned tomatoes, vegetable stock

#### **Bob (Grill Enthusiast)**

- **Proteins**: chicken breast, ground beef, salmon, pork chops
- **Vegetables**: onions, bell peppers, corn, potatoes, mushrooms
- **Spices**: salt, black pepper, paprika, cayenne, garlic powder
- **Pantry**: BBQ sauce, olive oil, marinades, wood chips

#### **Carol (Health-Focused)**

- **Proteins**: salmon, chicken breast, eggs, quinoa, beans
- **Vegetables**: kale, spinach, broccoli, carrots, bell peppers
- **Spices**: turmeric, ginger, garlic, herbs
- **Pantry**: olive oil, coconut oil, nuts, seeds

---

## 🧪 **Testing Scenarios**

### **Ingredient Matching**

- **Exact Matches**: Test exact ingredient name matching
- **Synonym Matching**: Test synonym-based matching
- **Category Filtering**: Test filtering by ingredient category
- **Dietary Restrictions**: Test allergy and dietary filtering

### **Grocery Functionality**

- **Shopping Lists**: Test grocery list creation and management
- **Ingredient Suggestions**: Test recipe suggestions based on available ingredients
- **Category Organization**: Test grocery list organization by category
- **User Preferences**: Test personalized ingredient suggestions

### **Recipe Integration**

- **Ingredient Parsing**: Test recipe ingredient extraction
- **Category Assignment**: Test automatic ingredient categorization
- **Nutritional Analysis**: Test health-focused ingredient analysis
- **Substitution Suggestions**: Test ingredient substitution recommendations

---

## 📝 **Data Structure**

### **Ingredient Object**

```typescript
interface GlobalIngredient {
  name: string; // Primary ingredient name
  normalized_name: string; // Normalized for matching
  category: string; // Ingredient category
  synonyms: string[]; // Alternative names
  usage_count: number; // Usage frequency
  is_verified: boolean; // System verification status
  is_system: boolean; // System vs user-created
  created_by: string | null; // Creator user ID
}
```

### **Category Structure**

```typescript
interface IngredientCategory {
  name: string; // Category name
  description: string; // Category description
  dietary_flags: string[]; // Dietary restrictions
  nutritional_profile: string; // Nutritional characteristics
}
```

---

## 🔧 **SQL Seed Files**

### **Primary Seed File**

- **File**: `supabase/seed_global_ingredients.sql`
- **Purpose**: Core system ingredients
- **Content**: 50+ essential ingredients with categories and synonyms

### **Extended Seed File**

- **File**: `supabase/seed_complete_global_ingredients.sql`
- **Purpose**: Comprehensive ingredient database
- **Content**: 200+ ingredients with full categorization

### **Migration-Based Seeding**

- **File**: `supabase/migrations/20250202000004_seed_system_global_ingredients.sql`
- **Purpose**: Database migration with seed data
- **Content**: System ingredients with proper constraints

---

## 🚀 **Usage Commands**

### **Seed Ingredients**

```bash
# Seed core ingredients
npm run seed:ingredients

# Seed complete ingredient database
npm run seed:complete-ingredients

# Reset and seed all ingredients
supabase db reset
npm run seed
```

### **Test Ingredient Matching**

```bash
# Test ingredient matching functionality
npm run test:ingredients

# Test grocery list functionality
npm run test:groceries

# Test recipe suggestions
npm run test:suggestions
```

---

## 🧪 **Testing Features**

### **Ingredient Matching**

- **Exact Matching**: Test exact name matching
- **Synonym Matching**: Test alternative name matching
- **Category Filtering**: Test category-based filtering
- **Fuzzy Matching**: Test approximate matching

### **Grocery Integration**

- **Shopping Lists**: Test grocery list creation
- **Ingredient Suggestions**: Test recipe suggestions
- **Category Organization**: Test grocery organization
- **User Preferences**: Test personalized suggestions

### **Recipe Integration**

- **Ingredient Parsing**: Test recipe ingredient extraction
- **Category Assignment**: Test automatic categorization
- **Nutritional Analysis**: Test health-focused analysis
- **Substitution Suggestions**: Test ingredient substitutions

---

## 📊 **Performance Considerations**

### **Database Optimization**

- **Indexing**: Proper indexing on ingredient names and categories
- **Caching**: Frequently used ingredients cached for performance
- **Search Optimization**: Full-text search on ingredient names and synonyms

### **Matching Performance**

- **Algorithm Efficiency**: Optimized matching algorithms
- **Caching**: Cached matching results for common queries
- **Batch Processing**: Efficient batch ingredient processing

---

## 🔧 **Maintenance Guidelines**

### **Adding New Ingredients**

1. Add ingredient data to seed files
2. Include comprehensive synonyms
3. Assign proper categories
4. Test ingredient matching
5. Update documentation

### **Modifying Categories**

1. Update category definitions
2. Test category filtering
3. Verify ingredient assignments
4. Update category documentation

### **Testing New Features**

1. Add test ingredients for new features
2. Include edge cases and variations
3. Test with different user profiles
4. Verify data relationships

---

## 🚨 **Important Notes**

### **Data Integrity**

- Ingredients must have valid categories
- Synonyms must be realistic and useful
- Usage counts should be accurate
- System ingredients should be verified

### **Performance Considerations**

- Large ingredient databases may impact performance
- Proper indexing is essential
- Caching can improve response times
- Batch operations should be optimized

### **Testing Requirements**

- Test with different user profiles
- Include both common and rare ingredients
- Test edge cases and error conditions
- Verify matching accuracy

---

## 📚 **Related Documentation**

- [Seed Data System Overview](./SEED_DATA_SYSTEM_OVERVIEW.md)
- [User Profiles](./USER_PROFILES.md)
- [Recipe Data](./RECIPE_DATA.md)
- [Database Schema](../database/SCHEMA.md)

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Status**: ✅ Active

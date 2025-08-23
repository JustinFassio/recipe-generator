# Seed Users Guide for Local Development

**Date**: August 23, 2025  
**Environment**: Local Development  
**Purpose**: Testing recipe sharing and explore features

---

## 🧪 **Seed Users Created**

The following test users have been created in your local Supabase database for testing the recipe sharing and explore features:

### **👩‍🍳 Alice Baker** (`alice`)

- **Email**: `alice@example.com`
- **Password**: `Password123!`
- **Username**: `alice`
- **Profile**: Home cook exploring quick vegetarian meals
- **Region**: US
- **Language**: English
- **Units**: Imperial
- **Skill Level**: Beginner
- **Time per Meal**: 25 minutes
- **Allergies**: Peanuts
- **Dietary Restrictions**: Vegetarian
- **Preferred Cuisines**: Italian, Mexican
- **Available Equipment**: Oven, Skillet, Blender
- **Disliked Ingredients**: Anchovies
- **Spice Tolerance**: 2/5

### **👨‍🍳 Bob Carter** (`bob`)

- **Email**: `bob@example.com`
- **Password**: `Password123!`
- **Username**: `bob`
- **Profile**: Grill enthusiast and weekend meal-prepper
- **Region**: US
- **Language**: English
- **Units**: Imperial
- **Skill Level**: Intermediate
- **Time per Meal**: 45 minutes
- **Allergies**: None
- **Dietary Restrictions**: None
- **Preferred Cuisines**: BBQ, American
- **Available Equipment**: Grill, Slow Cooker
- **Disliked Ingredients**: None
- **Spice Tolerance**: 4/5

### **👩‍🍳 Cora Diaz** (`cora`)

- **Email**: `cora@example.com`
- **Password**: `Password123!`
- **Username**: `cora`
- **Profile**: Loves bold flavors and one-pot recipes
- **Region**: Spain
- **Language**: Spanish
- **Units**: Metric
- **Skill Level**: Advanced
- **Time per Meal**: 30 minutes
- **Allergies**: Shellfish
- **Dietary Restrictions**: None
- **Preferred Cuisines**: Spanish, Thai
- **Available Equipment**: Pressure Cooker, Rice Cooker
- **Disliked Ingredients**: None
- **Spice Tolerance**: 5/5

---

## 🍽️ **Seed Recipes Created**

### **Alice's Recipes**

1. **Avocado Toast** - Simple, fast breakfast
   - Ingredients: Sourdough, avocado, salt, pepper, chili flakes
   - Public recipe

### **Bob's Recipes**

1. **Classic Caesar Salad** - Great with grilled chicken
   - Ingredients: Romaine lettuce, parmesan, croutons, caesar dressing, lemon
   - Public recipe
2. **Grilled Chicken Breast** - Perfect for meal prep
   - Ingredients: Chicken breast, olive oil, garlic powder, paprika, salt, pepper
   - Public recipe

### **Cora's Recipes**

1. **One-Pot Pasta** - Weeknight friendly
   - Ingredients: Spaghetti, garlic, olive oil, tomatoes, basil, salt
   - Public recipe
2. **Spanish Paella** - Traditional Spanish dish
   - Ingredients: Rice, saffron, shrimp, chicken, bell peppers, onion, garlic
   - Public recipe

---

## 🧪 **Testing Scenarios**

### **Recipe Sharing & Explore Features**

1. **Public Recipe Discovery**
   - Log in as any user and visit the explore page
   - You should see 5 public recipes from different users
   - Test filtering and searching functionality

2. **User Profile Viewing**
   - Click on recipe authors to view their profiles
   - Test profile information display (cooking preferences, etc.)

3. **Recipe Interaction**
   - Test viewing recipe details
   - Test recipe sharing functionality
   - Test recipe saving/bookmarking (if implemented)

### **Authentication Testing**

1. **User Login**
   - Test login with each seed user
   - Verify profile data loads correctly
   - Test logout functionality

2. **Profile Management**
   - Test profile editing for each user
   - Test cooking preferences updates
   - Test safety information updates

### **Cross-User Testing**

1. **Recipe Discovery**
   - Log in as Alice and explore Bob's and Cora's recipes
   - Log in as Bob and explore Alice's and Cora's recipes
   - Log in as Cora and explore Alice's and Bob's recipes

2. **Profile Viewing**
   - Test viewing other users' public profiles
   - Verify cooking preferences are visible
   - Test privacy settings (safety info should be private)

---

## 🔧 **How to Use**

### **Local Development**

1. **Start your local Supabase instance**:

   ```bash
   npx supabase start
   ```

2. **Run the seeding script** (if needed):

   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key npm run seed
   ```

3. **Start your development server**:

   ```bash
   npm run dev
   ```

4. **Test with seed users**:
   - Use any of the email/password combinations above
   - All users have complete profiles and preferences
   - All users have public recipes for testing

### **Database Verification**

You can verify the seed data exists by checking:

```bash
# Check recipes
curl -H "apikey: your_anon_key" "http://127.0.0.1:54321/rest/v1/recipes?select=*&limit=10"

# Check cooking preferences
curl -H "apikey: your_anon_key" "http://127.0.0.1:54321/rest/v1/cooking_preferences?select=*&limit=10"
```

---

## 🚀 **Next Steps**

1. **Test the explore page** with these seed users
2. **Test recipe sharing** between users
3. **Test profile viewing** functionality
4. **Test cooking preference** matching
5. **Test dietary restriction** filtering
6. **Test spice tolerance** recommendations

The seed data provides a realistic testing environment with diverse user preferences, dietary restrictions, and cooking skill levels to thoroughly test your recipe sharing and explore features.

---

## 📝 **Notes**

- All seed users have the same password: `Password123!`
- All recipes are marked as public for testing
- User safety information (allergies, medical conditions) is private
- Cooking preferences are public for recipe matching
- All users have complete profile data for comprehensive testing

**Happy Testing!** 🎉

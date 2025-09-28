# Seed Data Usage Guide

**Purpose**: Practical guide for using, maintaining, and extending the seed data system.

**Last Updated**: January 2025

---

## 🚀 **Quick Start**

### **Initial Setup**

```bash
# 1. Start local Supabase
supabase start

# 2. Reset database and run all seeds
supabase db reset
npm run seed

# 3. Verify seed data
npm run test:seed
```

### **Development Workflow**

```bash
# Reset and reseed when needed
supabase db reset
npm run seed

# Test specific components
npm run test:users
npm run test:recipes
npm run test:ingredients
```

---

## 📋 **Available Commands**

### **Full Seed Process**

```bash
# Complete seed with all data
npm run seed

# Core seed (users + basic recipes)
npm run seed:core

# Individual components
npm run seed:users
npm run seed:ingredients
npm run seed:recipes
npm run seed:groceries
npm run seed:analytics
npm run seed:health
```

### **Testing Commands**

```bash
# Test all seed data
npm run test:seed

# Test specific components
npm run test:users
npm run test:recipes
npm run test:ingredients
npm run test:groceries

# Test critical path
npm run test:critical
```

---

## 🔧 **Environment Setup**

### **Required Environment Variables**

```bash
# Local Supabase service role key
SUPABASE_SERVICE_ROLE_KEY=$(supabase status | sed -n 's/^service_role key: //p' | tr -d '\n')

# Local Supabase URL
SUPABASE_URL=http://127.0.0.1:54321

# Optional: Custom service role key
SUPABASE_SERVICE_ROLE_KEY=your_custom_key_here
```

### **Environment Validation**

The seed system automatically validates required environment variables:

- `SUPABASE_SERVICE_ROLE_KEY`: Required for user creation
- `SUPABASE_URL`: Required for database connection
- Local Supabase instance must be running

---

## 📊 **Data Verification**

### **Check Seed Data Status**

```bash
# Verify all seed data
npm run verify:seed

# Check specific components
npm run verify:users
npm run verify:recipes
npm run verify:ingredients
```

### **Database Inspection**

```sql
-- Check users
SELECT email, username, full_name FROM profiles;

-- Check recipes
SELECT title, user_id, is_public FROM recipes;

-- Check ingredients
SELECT name, category FROM global_ingredients;

-- Check categories
SELECT DISTINCT category FROM recipe_categories;
```

---

## 🧪 **Testing Scenarios**

### **User Authentication Testing**

```bash
# Test user login
curl -X POST http://127.0.0.1:54321/auth/v1/token?grant_type=password \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "Password123!"}'
```

### **Recipe Management Testing**

```bash
# Test recipe creation
npm run test:recipe-creation

# Test category filtering
npm run test:category-filtering

# Test ingredient matching
npm run test:ingredient-matching
```

### **Grocery List Testing**

```bash
# Test grocery list creation
npm run test:grocery-lists

# Test ingredient suggestions
npm run test:ingredient-suggestions

# Test shopping list functionality
npm run test:shopping-lists
```

---

## 🔧 **Customization Guide**

### **Adding New Users**

1. **Edit User Data**: Modify `scripts/seed/core/users.ts`
2. **Add Profile Information**: Include bio, location, preferences
3. **Add Safety Data**: Include allergies, dietary restrictions
4. **Add Cooking Preferences**: Include cuisines, equipment, spice tolerance
5. **Test User Creation**: Run `npm run seed:users`

```typescript
// Example: Adding a new user
{
  email: 'newuser@example.com',
  password: 'Password123!',
  fullName: 'New User',
  username: 'newuser',
  profile: {
    bio: 'New user exploring the platform.',
    country: 'United States',
    state_province: 'California',
    city: 'San Francisco',
  },
  safety: {
    allergies: ['nuts'],
    dietary_restrictions: ['vegan'],
  },
  cooking: {
    preferred_cuisines: ['asian', 'mediterranean'],
    available_equipment: ['wok', 'steamer'],
    disliked_ingredients: ['cilantro'],
    spice_tolerance: 3,
  },
}
```

### **Adding New Recipes**

1. **Edit Recipe Data**: Modify `scripts/seed/content/recipes.ts`
2. **Add Comprehensive Categories**: Include course, cuisine, technique, etc.
3. **Add Realistic Ingredients**: Include measurements and descriptions
4. **Add Cooking Instructions**: Include step-by-step directions
5. **Test Recipe Creation**: Run `npm run seed:recipes`

```typescript
// Example: Adding a new recipe
{
  id: 'new-recipe-id',
  title: 'New Recipe',
  ingredients: [
    '2 cups flour',
    '1 cup sugar',
    '3 eggs',
    '1/2 cup butter',
  ],
  instructions: 'Mix ingredients and bake at 350°F for 30 minutes.',
  notes: 'Delicious and easy to make.',
  image_url: 'https://picsum.photos/seed/new_recipe/800/600',
  user_email: 'alice@example.com',
  is_public: true,
  categories: [
    'Course: Dessert',
    'Cuisine: American',
    'Collection: Quick & Easy',
    'Technique: Baked',
    'Occasion: Weekday',
    'Dietary: Vegetarian',
  ],
}
```

### **Adding New Ingredients**

1. **Edit Ingredient Data**: Modify `scripts/seed/core/global-ingredients.ts`
2. **Add Comprehensive Synonyms**: Include alternative names
3. **Assign Proper Categories**: Use existing category system
4. **Test Ingredient Matching**: Run `npm run test:ingredients`

```typescript
// Example: Adding a new ingredient
{
  name: 'new ingredient',
  category: 'vegetables',
  synonyms: ['alternative name', 'common name'],
}
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Environment Variables Missing**

```bash
# Error: Missing required environment variables
# Solution: Set environment variables
export SUPABASE_SERVICE_ROLE_KEY=$(supabase status | sed -n 's/^service_role key: //p' | tr -d '\n')
export SUPABASE_URL=http://127.0.0.1:54321
```

#### **Database Connection Failed**

```bash
# Error: Database connection failed
# Solution: Start Supabase and verify connection
supabase start
supabase status
```

#### **User Creation Failed**

```bash
# Error: User creation failed
# Solution: Check service role key and permissions
supabase status
# Verify service role key is correct
```

#### **Recipe Creation Failed**

```bash
# Error: Recipe creation failed
# Solution: Check user exists and has proper permissions
# Verify user email exists in the system
```

### **Debug Commands**

```bash
# Check Supabase status
supabase status

# Check database connection
supabase db ping

# View logs
supabase logs

# Reset everything
supabase stop
supabase start
supabase db reset
npm run seed
```

---

## 📈 **Performance Optimization**

### **Database Optimization**

```sql
-- Create indexes for better performance
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_is_public ON recipes(is_public);
CREATE INDEX idx_ingredients_category ON global_ingredients(category);
CREATE INDEX idx_categories_recipe_id ON recipe_categories(recipe_id);
```

### **Seed Data Optimization**

```bash
# Use batch operations for large datasets
npm run seed:batch

# Optimize ingredient matching
npm run seed:optimize-ingredients

# Cache frequently used data
npm run seed:cache
```

---

## 🔒 **Security Considerations**

### **Development Only**

- Seed data is for local development only
- Never use in production environments
- Reset database before seeding to avoid conflicts
- Use strong passwords for test users

### **Data Privacy**

- Test users have realistic but fictional data
- No real personal information included
- All data is for testing purposes only
- Follow data protection guidelines

---

## 📚 **Advanced Usage**

### **Custom Seed Scripts**

```typescript
// Create custom seed script
import { admin } from '../utils/client';
import { logSuccess, logError } from '../utils/shared';

export async function seedCustomData() {
  try {
    // Custom seeding logic
    logSuccess('Custom data seeded successfully');
  } catch (error) {
    logError('Custom seeding failed:', error);
  }
}
```

### **Batch Operations**

```typescript
// Efficient batch seeding
export async function seedBatchData(data: any[]) {
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await processBatch(batch);
  }
}
```

### **Data Validation**

```typescript
// Validate seed data before insertion
export function validateSeedData(data: any[]): boolean {
  return data.every((item) => item.id && item.name && item.category);
}
```

---

## 📝 **Maintenance Checklist**

### **Regular Maintenance**

- [ ] Update seed data with new features
- [ ] Test all seed scripts regularly
- [ ] Verify data relationships
- [ ] Update documentation
- [ ] Check for deprecated data

### **Before Releases**

- [ ] Test full seed process
- [ ] Verify all test scenarios
- [ ] Check data integrity
- [ ] Update user documentation
- [ ] Test with different environments

### **After Schema Changes**

- [ ] Update seed data accordingly
- [ ] Test migration compatibility
- [ ] Verify data relationships
- [ ] Update type definitions
- [ ] Test full seed process

---

## 🆘 **Support and Resources**

### **Documentation**

- [Seed Data System Overview](./SEED_DATA_SYSTEM_OVERVIEW.md)
- [User Profiles](./USER_PROFILES.md)
- [Recipe Data](./RECIPE_DATA.md)
- [Ingredient System](./INGREDIENT_SYSTEM.md)

### **Related Commands**

```bash
# Get help with seed commands
npm run help:seed

# View seed data statistics
npm run stats:seed

# Export seed data
npm run export:seed

# Import seed data
npm run import:seed
```

### **Community Support**

- Check GitHub issues for common problems
- Review documentation for solutions
- Ask questions in development channels
- Report bugs and feature requests

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Status**: ✅ Active

# Seed System Reset Guide

**Purpose**: Complete guide for resetting and fixing the seed data system when issues arise.

**Last Updated**: January 2025  
**Version**: 1.0

---

## 🚨 **When to Use This Guide**

Use this guide when you encounter:

- Seed scripts failing with JWT authentication errors
- Users not being created properly
- Recipes missing after seeding
- **Recipe descriptions not displaying** (API select queries missing description field)
- **Ingredients/groceries not seeded** (incomplete seed process)
- Database connection issues
- Environment variable problems
- Supabase admin API failures

---

## 📋 **Complete Seed System Overview**

The seed system includes **6 comprehensive phases**:

### **Available Seed Commands:**

```bash
npm run seed:full      # Complete seed (all data)
npm run seed:core      # Core seed (users + basic recipes)
npm run seed:users     # Just users
npm run seed:recipes   # Just recipes
npm run seed:ingredients # Global ingredients
npm run seed:ratings   # Recipe ratings
npm run seed:groceries # User grocery lists
npm run seed:analytics # Usage analytics
npm run seed:health    # Health evaluations
```

### **What Gets Seeded:**

1. **👥 Users & Profiles** (6 test users with complete profiles)
2. **🥕 Global Ingredients** (57 ingredients with categories and synonyms)
3. **🍽️ Recipes with Descriptions** (20+ recipes with rich descriptions)
4. **🛒 User Groceries** (36 items per user across 6 categories)
5. **⭐ Ratings & Analytics** (creator + community ratings, view tracking)
6. **🏥 Health & Evaluations** (safety reports and dietary tracking)

### **Test User Credentials:**

All users use password: `Password123!`

- **Alice Baker**: `alice@example.com` (4 recipes, 36 groceries)
- **Bob Carter**: `bob@example.com` (recipes + groceries)
- **Cora Davis**: `cora@example.com` (recipes + groceries)
- **David Evans**: `david@example.com` (recipes + groceries)
- **Emma Foster**: `emma@example.com` (recipes + groceries)
- **Frank Green**: `frank@example.com` (recipes + groceries)

---

## 🔍 **Diagnostic Steps**

### **Step 1: Check Supabase Status**

```bash
# Verify Supabase is running
npx supabase status

# Expected output:
# supabase local development setup is running.
# API URL: http://127.0.0.1:54321
# service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Step 2: Check Environment Variables**

```bash
# Check if environment variables are set
echo $SUPABASE_SERVICE_ROLE_KEY
echo $SUPABASE_URL

# If not set, get them from Supabase status
export SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n')
export SUPABASE_URL=http://127.0.0.1:54321
```

### **Step 3: Check Database State**

```bash
# Check what users exist
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT email, email_confirmed_at FROM auth.users ORDER BY created_at;"

# Check what recipes exist
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) as total_recipes FROM recipes;"
```

---

## 🛠️ **Reset Procedures**

### **Method 1: Complete Reset (Recommended)**

```bash
# 1. Stop all processes
pkill -f "vite\|dev\|supabase" 2>/dev/null || true

# 2. Reset database completely
npx supabase db reset

# 3. Run full seed with proper environment variables
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed:full
```

### **Method 2: Targeted Fix (When Specific Issues)**

#### **Fix User Creation Issues**

```bash
# 1. Check if users exist
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT email FROM auth.users;"

# 2. If users are missing, create them manually
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed:users

# 3. Verify users were created
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT email, email_confirmed_at FROM auth.users ORDER BY created_at;"
```

#### **Fix Recipe Creation Issues**

```bash
# 1. Check if recipes exist
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) as total_recipes FROM recipes;"

# 2. If recipes are missing, create them
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed:recipes

# 3. Verify recipes were created
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT r.title, u.email FROM recipes r JOIN auth.users u ON r.user_id = u.id ORDER BY u.email, r.title;"
```

---

## 🔧 **Manual Fix Procedures**

### **Create Alice Baker Manually**

When the seed system fails to create Alice properly:

```bash
# Create a temporary script
cat > create-alice-manual.js << 'EOF'
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createAlice() {
  console.log('Creating Alice Baker...');

  const { data, error } = await admin.auth.admin.createUser({
    email: 'alice@example.com',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { full_name: 'Alice Baker' }
  });

  if (error) {
    console.error('Error creating Alice:', error);
    return;
  }

  console.log('Alice created successfully:', data.user?.id);

  // Create profile
  const { error: profileError } = await admin.from('profiles').upsert({
    id: data.user.id,
    username: 'alice_baker',
    full_name: 'Alice Baker',
    bio: 'Home cook exploring quick vegetarian meals.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  if (profileError) {
    console.error('Error creating profile:', profileError);
  } else {
    console.log('Profile created successfully');
  }
}

createAlice();
EOF

# Run the script
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') node create-alice-manual.js

# Clean up
rm create-alice-manual.js
```

### **Create Alice's Recipes Manually**

When recipes fail to be created:

```bash
# Create a temporary script
cat > create-alice-recipes.js << 'EOF'
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Alice's recipes with descriptions
const aliceRecipes = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Avocado Toast',
    description: 'Creamy, perfectly ripe avocado spread on golden sourdough toast, finished with a sprinkle of chili flakes for a gentle kick. This simple yet satisfying breakfast combines rich, buttery avocado with the tangy crunch of sourdough, creating a nutritious start to your day that takes just minutes to prepare.',
    ingredients: ['2 slices sourdough', '1 ripe avocado', 'salt', 'pepper', 'chili flakes'],
    instructions: 'Toast bread. Mash avocado with salt and pepper. Spread and top with chili flakes.',
    notes: 'Simple, fast breakfast.',
    image_url: '/recipe-generator-logo.png',
    is_public: true,
    categories: ['Course: Breakfast', 'Collection: Vegetarian', 'Collection: Quick & Easy', 'Technique: No-Cook', 'Occasion: Weekday', 'Dietary: Plant-Based']
  },
  {
    id: '11111111-1111-1111-1111-111111111112',
    title: 'Caprese Salad',
    description: 'A classic Italian masterpiece featuring the perfect trinity of fresh mozzarella, ripe tomatoes, and fragrant basil leaves. Drizzled with aged balsamic glaze and extra virgin olive oil, this elegant salad celebrates the simplicity of quality ingredients. The creamy mozzarella melts in your mouth while the sweet tomatoes and aromatic basil create a refreshing harmony of flavors.',
    ingredients: ['fresh mozzarella', 'ripe tomatoes', 'fresh basil', 'balsamic glaze', 'extra virgin olive oil', 'salt', 'pepper'],
    instructions: 'Slice mozzarella and tomatoes. Arrange on plate with basil. Drizzle with balsamic and oil. Season with salt and pepper.',
    notes: 'Perfect summer appetizer.',
    image_url: '/recipe-generator-logo.png',
    is_public: true,
    categories: ['Course: Appetizer', 'Cuisine: Italian', 'Collection: Vegetarian', 'Technique: No-Cook', 'Occasion: Summer', 'Dietary: Vegetarian']
  },
  {
    id: '11111111-1111-1111-1111-111111111113',
    title: 'Quick Pasta',
    description: 'A vibrant and aromatic pasta dish that comes together in just 15 minutes, perfect for busy weeknights. This recipe features al dente pasta tossed with a rich tomato sauce enhanced with garlic, fresh herbs, and a hint of red pepper flakes for a gentle kick. The addition of grated Parmesan cheese adds a creamy, salty finish that brings all the flavors together in perfect harmony.',
    ingredients: ['pasta', 'tomato sauce', 'garlic', 'fresh herbs', 'red pepper flakes', 'Parmesan cheese', 'olive oil'],
    instructions: 'Cook pasta. Sauté garlic in oil. Add tomato sauce and herbs. Toss with pasta. Top with Parmesan.',
    notes: 'Quick weeknight dinner.',
    image_url: '/recipe-generator-logo.png',
    is_public: false,
    categories: ['Course: Main', 'Cuisine: Italian', 'Collection: Quick & Easy', 'Technique: Sauté', 'Occasion: Weekday', 'Time: Under 30 Minutes']
  }
];

async function createAliceRecipes() {
  console.log('Creating Alice\'s recipes...');

  // Get Alice's user ID
  const { data: users, error: userError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 100
  });

  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  const alice = users.users.find(u => u.email === 'alice@example.com');
  if (!alice) {
    console.error('Alice not found');
    return;
  }

  console.log('Found Alice:', alice.id);

  for (const recipe of aliceRecipes) {
    console.log(`Creating recipe: ${recipe.title}`);

    // Insert recipe
    const { error: recipeError } = await admin.from('recipes').upsert({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      notes: recipe.notes,
      image_url: recipe.image_url,
      user_id: alice.id,
      is_public: recipe.is_public,
      categories: recipe.categories,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (recipeError) {
      console.error(`Error creating recipe ${recipe.title}:`, recipeError);
      continue;
    }

    // Create Version 0
    const { error: versionError } = await admin.from('recipe_content_versions').upsert({
      recipe_id: recipe.id,
      version_number: 0,
      version_name: 'Original Recipe',
      changelog: 'Initial recipe version',
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      notes: recipe.notes,
      setup: null,
      categories: recipe.categories,
      cooking_time: null,
      difficulty: null,
      creator_rating: null,
      image_url: recipe.image_url,
      created_by: alice.id,
      is_published: true,
      created_at: new Date().toISOString()
    });

    if (versionError) {
      console.error(`Error creating version for ${recipe.title}:`, versionError);
    } else {
      console.log(`✅ ${recipe.title} created successfully`);
    }
  }

  console.log('Alice\'s recipes created!');
}

createAliceRecipes();
EOF

# Run the script
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') node create-alice-recipes.js

# Clean up
rm create-alice-recipes.js
```

---

## 🧪 **Verification Steps**

### **Step 1: Verify Users**

```bash
# Check all users exist
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT u.email, u.email_confirmed_at, p.username, p.full_name FROM auth.users u LEFT JOIN profiles p ON u.id = p.id ORDER BY u.created_at;"

# Expected output:
# alice@example.com | 2025-01-XX XX:XX:XX | alice_baker | Alice Baker
# bob@example.com   | 2025-01-XX XX:XX:XX | bob         | Bob Carter
# cora@example.com  | 2025-01-XX XX:XX:XX | cora        | Cora Delacroix
# david@example.com | 2025-01-XX XX:XX:XX | david       | David Kim
# emma@example.com  | 2025-01-XX XX:XX:XX | emma        | Emma Johnson
# frank@example.com | 2025-01-XX XX:XX:XX | frank       | Frank Rodriguez
```

### **Step 2: Verify Recipes**

```bash
# Check Alice's recipes
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT r.title, r.description, u.email FROM recipes r JOIN auth.users u ON r.user_id = u.id WHERE u.email = 'alice@example.com';"

# Expected output:
# Quick Pasta   | A vibrant and aromatic pasta dish...
# Avocado Toast | Creamy, perfectly ripe avocado spread...
# Caprese Salad | A classic Italian masterpiece...
```

### **Step 3: Test Application**

```bash
# Start the development server
npm run dev:frontend

# Navigate to http://localhost:5175
# Sign in as alice@example.com / Password123!
# Verify recipes are visible with descriptions
```

---

## 🚨 **Common Issues & Solutions**

### **Issue: JWT Authentication Errors**

**Symptoms**: `invalid JWT: unable to parse or verify signature`

**Solution**:

```bash
# Get fresh service role key
export SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n')

# Reset database
npx supabase db reset

# Run seed with fresh key
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY SUPABASE_URL=http://127.0.0.1:54321 npm run seed:full
```

### **Issue: Recipe Descriptions Not Displaying**

**Symptoms**: Recipe cards show empty descriptions even though they exist in the database.

**Root Cause**: API select queries are missing the `description` field.

**Solution**: Update API select queries in `src/lib/api.ts`:

```typescript
// getUserRecipes() - Add description to select
.select('id, title, description, ingredients, instructions, notes, image_url, categories, cooking_time, difficulty, is_public, created_at, updated_at, user_id')

// getPublicRecipes() - Add description to select
.select('id, title, description, ingredients, instructions, notes, image_url, categories, cooking_time, difficulty, user_id, created_at')

// getRecipeSummary() - Add description to select
.select('id, title, description, ingredients, categories, cooking_time, difficulty, is_public, created_at, updated_at')
```

**Verification**: After fixing, recipe cards should display rich descriptions like:

- "Creamy, perfectly ripe avocado spread on golden sourdough toast..."
- "A classic Italian masterpiece featuring the perfect trinity..."

### **Issue: Incomplete Seed Data**

**Symptoms**: Only recipes are seeded, missing ingredients, groceries, and analytics.

**Solution**: Run the complete seed process:

```bash
# Full seed with all data
SUPABASE_SERVICE_ROLE_KEY=$(supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed:full
```

**Expected Output**:

```
✅ 6 test users with profiles and preferences
✅ 50+ global ingredients with categories and synonyms
✅ 20+ recipes with Version 0 (Original Recipe)
✅ Community and creator ratings for recipes
✅ User grocery lists for ingredient matching
✅ Avatar analytics and recipe view tracking
✅ Health evaluation reports
```

**Verification Commands**:

```bash
# Check ingredients
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM global_ingredients;"

# Check user groceries
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT u.email, jsonb_object_keys(ug.groceries) FROM auth.users u JOIN user_groceries ug ON u.id = ug.user_id WHERE u.email = 'alice@example.com';"

# Check recipe descriptions
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT r.title, r.description IS NOT NULL as has_description FROM recipes r JOIN auth.users u ON r.user_id = u.id WHERE u.email = 'alice@example.com';"
```

### **Issue: User Not Found in Admin List**

**Symptoms**: `User not found for recipe: alice@example.com`

**Solution**:

```bash
# Check if user exists in admin list
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
node -e "
import { createClient } from '@supabase/supabase-js';
const admin = createClient('http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
console.log('Users found:', data?.users?.map(u => u.email));
"

# If Alice is missing, create her manually (see manual fix procedures above)
```

### **Issue: Recipes Not Created**

**Symptoms**: No recipes in database after seeding

**Solution**:

```bash
# Check if users exist first
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT email FROM auth.users;"

# If users exist, run recipes seed
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed:recipes

# If still failing, create recipes manually (see manual fix procedures above)
```

### **Issue: Database Connection Failed**

**Symptoms**: `Database error creating new user`

**Solution**:

```bash
# Check Supabase status
npx supabase status

# If not running, start it
npx supabase start

# Wait for services to be ready
sleep 10

# Try again
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed:full
```

---

## 🔄 **Quick Reset Commands**

### **Complete Seed Reset (Recommended)**

```bash
# Full reset with complete seeding
npm run db:stop
pkill -f "vite|dev|supabase" 2>/dev/null || true
rm -rf node_modules/.vite .vite dist

# Start Supabase and reset database
supabase start
supabase db reset

# Run complete seed process (includes all data)
SUPABASE_SERVICE_ROLE_KEY=$(supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed:full

# Start frontend
npm run dev:frontend
```

### **Nuclear Reset (Everything)**

```bash
# Stop everything
pkill -f "vite\|dev\|supabase" 2>/dev/null || true

# Clear caches
rm -rf node_modules/.vite .vite dist

# Reset database
npx supabase db reset

# Start fresh
npx supabase start

# Wait for services
sleep 15

# Seed everything
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed:full

# Start dev server
npm run dev:frontend
```

### **Quick Fix (Users Only)**

```bash
# Just fix users
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed:users
```

### **Quick Fix (Recipes Only)**

```bash
# Just fix recipes
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed:recipes
```

---

## 📋 **Prevention Tips**

### **Always Use Complete Seeding**

```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
alias seed-reset="SUPABASE_SERVICE_ROLE_KEY=\$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') SUPABASE_URL=http://127.0.0.1:54321 npm run seed:full"

# Use the alias
seed-reset
```

### **API Development Best Practices**

- **Always include `description` field** in API select queries
- **Test recipe cards** after API changes to ensure descriptions display
- **Use `select('*')` for full recipe objects** when possible
- **Verify field names** match database schema exactly

### **Complete Seed Verification**

After seeding, always verify:

```bash
# Check all components are seeded
echo "=== Users ==="
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM auth.users;"

echo "=== Ingredients ==="
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM global_ingredients;"

echo "=== Recipes with Descriptions ==="
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM recipes WHERE description IS NOT NULL;"

echo "=== User Groceries ==="
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM user_groceries;"
```

### **Regular Maintenance**

```bash
# Check seed system health weekly
npm run db:verify

# Reset if needed
npm run db:fresh
```

### **Development Workflow**

```bash
# Always use the reset script for clean starts
npm run reset

# This handles everything automatically
```

---

## 📚 **Related Documentation**

- [Seed Data System Overview](./SEED_DATA_SYSTEM_OVERVIEW.md)
- [Usage Guide](./USAGE_GUIDE.md)
- [User Profiles](./USER_PROFILES.md)
- [Recipe Data](./RECIPE_DATA.md)
- [Ingredient System](./INGREDIENT_SYSTEM.md)

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Status**: ✅ Active

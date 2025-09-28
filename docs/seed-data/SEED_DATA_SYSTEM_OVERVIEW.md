# Seed Data System Overview

**Purpose**: Comprehensive documentation of the Recipe Generator's seed data system for local development and testing.

**Last Updated**: January 2025  
**Version**: 2.0

---

## 📋 **System Architecture**

The seed data system is organized into a hierarchical structure that mirrors the application's data dependencies:

```
scripts/seed/
├── seed-all.ts                    # Main orchestrator
├── utils/
│   ├── client.ts                  # Supabase admin client
│   └── shared.ts                  # Common types & utilities
├── core/                          # Foundation data
│   ├── users.ts                   # Test users & profiles
│   └── global-ingredients.ts     # System ingredients
├── content/                       # User-generated content
│   ├── recipes.ts                 # Test recipes
│   └── ratings.ts                 # Recipe ratings
├── engagement/                    # User interaction data
│   ├── groceries.ts               # User grocery lists
│   └── analytics.ts               # Usage analytics
└── health/                        # Health & evaluation data
    └── evaluations.ts             # Health reports
```

---

## 🎯 **Data Categories & Dependencies**

### **Phase 1: Core Foundation**

- **Users** (`scripts/seed/core/users.ts`)
  - 6 test users with complete profiles
  - Authentication credentials
  - User preferences & safety data
  - Geographic information

- **Global Ingredients** (`scripts/seed/core/global-ingredients.ts`)
  - 50+ system-wide ingredients
  - Categories and synonyms
  - Usage tracking data

### **Phase 2: Content**

- **Recipes** (`scripts/seed/content/recipes.ts`)
  - 20+ test recipes with categories
  - Automatic Version 0 creation
  - Public/private visibility
  - Comprehensive categorization

- **Ratings** (`scripts/seed/content/ratings.ts`)
  - Community ratings
  - Creator ratings
  - Rating analytics

### **Phase 3: Engagement**

- **Groceries** (`scripts/seed/engagement/groceries.ts`)
  - User-specific grocery lists
  - Ingredient matching data
  - Shopping list functionality

- **Analytics** (`scripts/seed/engagement/analytics.ts`)
  - Recipe view tracking
  - Avatar analytics
  - User behavior data

### **Phase 4: Health Data**

- **Evaluations** (`scripts/seed/health/evaluations.ts`)
  - Health evaluation reports
  - Nutritional assessments
  - Personalized recommendations

---

## 👥 **Test Users**

### **User Credentials**

All users use password: `Password123!`

| Email             | Username | Full Name   | Recipes    | Profile                   |
| ----------------- | -------- | ----------- | ---------- | ------------------------- |
| alice@example.com | alice    | Alice Baker | 12 recipes | Vegetarian, San Francisco |
| bob@example.com   | bob      | Bob Carter  | 3 recipes  | Grill enthusiast, Houston |
| carol@example.com | carol    | Carol Davis | 0 recipes  | Health-focused, Seattle   |
| dave@example.com  | dave     | Dave Evans  | 0 recipes  | Minimalist, Austin        |
| eve@example.com   | eve      | Eve Foster  | 0 recipes  | International, Miami      |
| frank@example.com | frank    | Frank Green | 0 recipes  | Traditional, Chicago      |

### **User Profiles**

Each user has complete profile data including:

- **Geographic**: Country, state/province, city
- **Safety**: Allergies, dietary restrictions
- **Cooking**: Preferred cuisines, equipment, spice tolerance
- **Preferences**: Disliked ingredients, cooking style

---

## 🍽️ **Recipe Data**

### **Recipe Categories**

All recipes are automatically tagged with comprehensive categories:

- **Course**: Breakfast, Appetizer, Main, Dessert, Snack
- **Cuisine**: Italian, Mexican, American, Asian, Mediterranean
- **Collection**: Vegetarian, Quick & Easy, Fresh & Light, Comfort Food
- **Technique**: No-Cook, Grilled, Baked, Stir-Fried, Slow-Cooked
- **Occasion**: Weekday, Weekend, Holiday, Special Event
- **Dietary**: Plant-Based, Gluten-Free, Dairy-Free, Low-Carb
- **Dish Type**: Pasta, Salad, Soup, Sandwich, Casserole
- **Mood**: Simple, Comforting, Energizing, Refreshing, Celebratory

### **Recipe Features**

- **Versioning**: Automatic Version 0 (Original Recipe) creation
- **Images**: Placeholder images from Picsum Photos
- **Categories**: 6 categories per recipe (database constraint)
- **Visibility**: Mix of public and private recipes
- **Ingredients**: Realistic ingredient lists with measurements

---

## 🛒 **Grocery System**

### **User Grocery Lists**

Each user has personalized grocery lists based on their preferences:

- **Alice** (Vegetarian): Tofu, beans, vegetables, Italian ingredients
- **Bob** (Grill enthusiast): Meats, BBQ sauces, grill accessories
- **Carol** (Health-focused): Organic produce, superfoods, supplements
- **Dave** (Minimalist): Basic staples, simple ingredients
- **Eve** (International): Global ingredients, spices, specialty items
- **Frank** (Traditional): Classic American ingredients, comfort foods

### **Grocery Categories**

- Proteins, Vegetables, Fruits, Dairy, Pantry, Spices
- Organized by user preferences and dietary restrictions
- Supports ingredient matching and recipe suggestions

---

## 🏥 **Health Data**

### **Evaluation Reports**

Comprehensive health evaluation reports for testing:

- **Dr. Luna Clearwater**: Primary dietitian
- **Report Types**: Nutritional assessments, dietary recommendations
- **User Coverage**: Alice, Bob, and David have evaluation reports
- **Data Structure**: JSON-based report data with recommendations

### **Health Features**

- Nutritional analysis and deficiency risk assessment
- Personalized meal suggestions and recipe recommendations
- Progress tracking and milestone markers
- Risk mitigation and safety reminders

---

## 🗄️ **Database Integration**

### **SQL Seed Files**

- `supabase/seed_global_ingredients.sql`: System ingredients
- `supabase/seed_complete_global_ingredients.sql`: Extended ingredient set
- `supabase/migrations/20250202000004_seed_system_global_ingredients.sql`: Migration-based seeding

### **TypeScript Seed Scripts**

- Modular TypeScript files for complex data relationships
- Type-safe interfaces and validation
- Error handling and logging
- Dependency management

---

## 🚀 **Usage Commands**

### **Full Seed Process**

```bash
# Reset database and run all seeds
supabase db reset
npm run seed

# Or with explicit environment variables
SUPABASE_SERVICE_ROLE_KEY=$(supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed
```

### **Core Seed Only**

```bash
# Seed only users and basic recipes
npm run seed:core
```

### **Individual Components**

```bash
# Seed specific components
npm run seed:users
npm run seed:ingredients
npm run seed:recipes
```

---

## 📊 **Data Statistics**

### **Seeded Data Summary**

- **Users**: 6 test users with complete profiles
- **Recipes**: 20+ recipes with comprehensive categories
- **Ingredients**: 50+ global ingredients with synonyms
- **Ratings**: Community and creator ratings
- **Groceries**: Personalized grocery lists per user
- **Analytics**: Recipe views and user behavior tracking
- **Health**: Evaluation reports and nutritional assessments

### **Category Coverage**

- **Course Categories**: 5 main courses covered
- **Cuisine Types**: 8+ international cuisines
- **Dietary Options**: Vegetarian, vegan, gluten-free, dairy-free
- **Cooking Techniques**: 6+ different cooking methods
- **Mood Tags**: 15+ emotional and energy-based tags

---

## 🔧 **Technical Implementation**

### **Type Safety**

- TypeScript interfaces for all data structures
- Validation functions for data integrity
- Error handling with detailed logging

### **Dependency Management**

- Phased seeding to respect data relationships
- User creation before recipe creation
- Global ingredients before user-specific data

### **Environment Requirements**

- `SUPABASE_SERVICE_ROLE_KEY`: Admin access for user creation
- `SUPABASE_URL`: Local Supabase instance URL
- Node.js environment with TypeScript support

---

## 🧪 **Testing Features**

### **Comprehensive Test Coverage**

- **User Authentication**: Login/logout testing
- **Recipe Management**: CRUD operations
- **Category Filtering**: All category types tested
- **Ingredient Matching**: Grocery list functionality
- **Health Features**: Evaluation report testing
- **Analytics**: Usage tracking validation

### **Realistic Data**

- Real-world recipe examples
- Authentic ingredient lists
- Realistic user preferences
- Comprehensive category coverage

---

## 📝 **Maintenance Guidelines**

### **Adding New Seed Data**

1. Follow the existing file structure
2. Use TypeScript interfaces for type safety
3. Include proper error handling
4. Add to the main orchestrator (`seed-all.ts`)
5. Update this documentation

### **Modifying Existing Data**

1. Update the relevant seed file
2. Test with `npm run seed`
3. Verify data relationships
4. Update user documentation if needed

### **Database Schema Changes**

1. Update migration files
2. Modify seed data accordingly
3. Test full seed process
4. Update this documentation

---

## 🚨 **Important Notes**

### **Development Only**

- These seed accounts are for local development only
- Never use in production environments
- Reset database before seeding to avoid conflicts

### **Data Relationships**

- Users must be created before recipes
- Global ingredients before user-specific data
- Respect foreign key constraints

### **Environment Variables**

- Always use local Supabase service role key
- Ensure local Supabase instance is running
- Verify database connection before seeding

---

## 📚 **Related Documentation**

- [Seed Users Documentation](../auth/SEED_USERS.md)
- [Database Schema Documentation](../database/SCHEMA.md)
- [API Documentation](../api/README.md)
- [Testing Documentation](../testing/README.md)

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Status**: ✅ Active

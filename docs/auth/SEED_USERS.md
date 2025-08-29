# Seed Users (Local Development)

These test accounts are created by the local seeding script and are intended for development only.

## Credentials

- alice@example.com — Password123! (username: alice)
- bob@example.com — Password123! (username: bob)
- cora@example.com — Password123! (username: cora)
- david@example.com — Password123! (username: david)
- emma@example.com — Password123! (username: emma)
- frank@example.com — Password123! (username: frank)

## User Profiles & Recipes

### Alice Baker (alice@example.com)

- **Profile**: "Home cook exploring quick vegetarian meals."
- **Allergies**: peanuts
- **Dietary**: vegetarian
- **Cuisines**: italian, mexican
- **Equipment**: oven, skillet, blender
- **Spice Level**: 2 (mild)
- **Recipes**: 4 total (3 private, 1 shared)
  - Avocado Toast (shared)
  - Caprese Salad (private)
  - Quick Pasta (private)
  - Veggie Stir Fry (private)

### Bob Carter (bob@example.com)

- **Profile**: "Grill enthusiast and weekend meal-prepper."
- **Allergies**: none
- **Dietary**: none
- **Cuisines**: bbq, american
- **Equipment**: grill, slow_cooker
- **Spice Level**: 4 (hot)
- **Recipes**: 3 total (2 private, 1 shared)
  - Classic Caesar Salad (shared)
  - Grilled Chicken Breast (private)
  - BBQ Ribs (private)

### Cora Diaz (cora@example.com)

- **Profile**: "Loves bold flavors and one-pot recipes."
- **Allergies**: shellfish
- **Dietary**: none
- **Cuisines**: spanish, thai
- **Equipment**: pressure_cooker, rice_cooker
- **Spice Level**: 5 (very hot)
- **Recipes**: 4 total (2 private, 2 shared)
  - One-Pot Pasta (shared)
  - Spanish Paella (shared)
  - Thai Curry (private)
  - Rice Pilaf (private)

### David Evans (david@example.com)

- **Profile**: "Baker and pastry enthusiast."
- **Allergies**: gluten
- **Dietary**: gluten-free
- **Cuisines**: french, mediterranean
- **Equipment**: stand_mixer, food_processor, oven
- **Spice Level**: 1 (very mild)
- **Recipes**: 3 total (2 private, 1 shared)
  - Gluten-Free Bread (shared)
  - French Macarons (private)
  - Mediterranean Salad (private)

### Emma Foster (emma@example.com)

- **Profile**: "Health-conscious meal planner and fitness enthusiast."
- **Allergies**: dairy
- **Dietary**: dairy-free, low-carb
- **Cuisines**: greek, japanese
- **Equipment**: air_fryer, blender, food_processor
- **Spice Level**: 3 (medium)
- **Recipes**: 4 total (3 private, 1 shared)
  - Greek Yogurt Bowl (shared)
  - Sushi Roll (private)
  - Air Fryer Salmon (private)
  - Protein Smoothie (private)

### Frank Garcia (frank@example.com)

- **Profile**: "Spice lover and international cuisine explorer."
- **Allergies**: none
- **Dietary**: none
- **Cuisines**: indian, korean, vietnamese
- **Equipment**: wok, cast_iron_pan, dutch_oven
- **Spice Level**: 5 (very hot)
- **Recipes**: 3 total (1 private, 2 shared)
  - Spicy Tacos (shared)
  - Korean BBQ (shared)
  - Indian Curry (private)

## Shared Recipes (Public)

1. **Avocado Toast** - Alice
2. **Classic Caesar Salad** - Bob
3. **One-Pot Pasta** - Cora
4. **Spanish Paella** - Cora
5. **Gluten-Free Bread** - David
6. **Greek Yogurt Bowl** - Emma
7. **Spicy Tacos** - Frank
8. **Korean BBQ** - Frank

## How to reseed locally

1. Reset DB and run SQL seeds (e.g., sample recipes):

```bash
supabase db reset
```

2. Seed users via Admin API (requires local service role key):

```bash
SUPABASE_SERVICE_ROLE_KEY=$(supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed
```

- The script lives at `scripts/seed-users.ts` and uses `public.claim_username_atomic` to set usernames.
- Profiles, user safety, and cooking preferences are populated for each user.
- Each user has 3-4 recipes with photos, 2-3 of which are shared publicly.

Note: These accounts exist only in your local Supabase stack and should never be used in production.

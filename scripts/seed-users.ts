/*
 * Seed a few test users using the Supabase Admin API and populate related tables.
 *
 * Requirements (local dev):
 * - SUPABASE_URL (defaults to http://127.0.0.1:54321)
 * - SUPABASE_SERVICE_ROLE_KEY (required)
 *
 * Usage:
 *   npm run seed
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error(
    '   Set it for local via your shell or an .env file before running seeding.'
  );
  process.exit(1);
}

// Service role client bypasses RLS for seeding
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type SeedUser = {
  email: string;
  password: string;
  fullName: string;
  username: string;
  profile?: Partial<{
    bio: string;
  }>;
  safety?: Partial<{
    allergies: string[];
    dietary_restrictions: string[];
  }>;
  cooking?: Partial<{
    preferred_cuisines: string[];
    available_equipment: string[];
    disliked_ingredients: string[];
    spice_tolerance: number;
  }>;
};

const users: SeedUser[] = [
  {
    email: 'alice@example.com',
    password: 'Password123!',
    fullName: 'Alice Baker',
    username: 'alice',
    profile: {
      bio: 'Home cook exploring quick vegetarian meals.',
    },
    safety: {
      allergies: ['peanuts'],
      dietary_restrictions: ['vegetarian'],
    },
    cooking: {
      preferred_cuisines: ['italian', 'mexican'],
      available_equipment: ['oven', 'skillet', 'blender'],
      disliked_ingredients: ['anchovies'],
      spice_tolerance: 2,
    },
  },
  {
    email: 'bob@example.com',
    password: 'Password123!',
    fullName: 'Bob Carter',
    username: 'bob',
    profile: {
      bio: 'Grill enthusiast and weekend meal-prepper.',
    },
    safety: {
      allergies: [],
      dietary_restrictions: [],
    },
    cooking: {
      preferred_cuisines: ['bbq', 'american'],
      available_equipment: ['grill', 'slow_cooker'],
      disliked_ingredients: [],
      spice_tolerance: 4,
    },
  },
  {
    email: 'cora@example.com',
    password: 'Password123!',
    fullName: 'Cora Diaz',
    username: 'cora',
    profile: {
      bio: 'Loves bold flavors and one-pot recipes.',
    },
    safety: {
      allergies: ['shellfish'],
      dietary_restrictions: [],
    },
    cooking: {
      preferred_cuisines: ['spanish', 'thai'],
      available_equipment: ['pressure_cooker', 'rice_cooker'],
      disliked_ingredients: [],
      spice_tolerance: 5,
    },
  },
  {
    email: 'david@example.com',
    password: 'Password123!',
    fullName: 'David Evans',
    username: 'david',
    profile: {
      bio: 'Baker and pastry enthusiast.',
    },
    safety: {
      allergies: ['gluten'],
      dietary_restrictions: ['gluten-free'],
    },
    cooking: {
      preferred_cuisines: ['french', 'mediterranean'],
      available_equipment: ['stand_mixer', 'food_processor', 'oven'],
      disliked_ingredients: ['artificial_sweeteners'],
      spice_tolerance: 1,
    },
  },
  {
    email: 'emma@example.com',
    password: 'Password123!',
    fullName: 'Emma Foster',
    username: 'emma',
    profile: {
      bio: 'Health-conscious meal planner and fitness enthusiast.',
    },
    safety: {
      allergies: ['dairy'],
      dietary_restrictions: ['dairy-free', 'low-carb'],
    },
    cooking: {
      preferred_cuisines: ['greek', 'japanese'],
      available_equipment: ['air_fryer', 'blender', 'food_processor'],
      disliked_ingredients: ['processed_sugars'],
      spice_tolerance: 3,
    },
  },
  {
    email: 'frank@example.com',
    password: 'Password123!',
    fullName: 'Frank Garcia',
    username: 'frank',
    profile: {
      bio: 'Spice lover and international cuisine explorer.',
    },
    safety: {
      allergies: [],
      dietary_restrictions: [],
    },
    cooking: {
      preferred_cuisines: ['indian', 'korean', 'vietnamese'],
      available_equipment: ['wok', 'cast_iron_pan', 'dutch_oven'],
      disliked_ingredients: [],
      spice_tolerance: 5,
    },
  },
];

async function ensureUsername(userId: string, username: string) {
  try {
    // First, update the profiles table with the username
    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      username: username,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('Error updating profile username:', profileError);
      throw profileError;
    }

    // Then, insert into the usernames table
    const { error: usernameError } = await admin.from('usernames').upsert({
      username: username,
      user_id: userId,
    });

    if (usernameError) {
      console.error('Error inserting username record:', usernameError);
      throw usernameError;
    }

    console.log(`✅ Username '${username}' set for user ${userId}`);
  } catch (error) {
    console.error(
      `❌ Failed to set username '${username}' for user ${userId}:`,
      error
    );
    throw error;
  }
}

async function createProfile(
  userId: string,
  fullName: string,
  profile: SeedUser['profile']
) {
  const { error } = await admin.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      ...profile,
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
}

async function upsertSafety(userId: string, safety: SeedUser['safety']) {
  if (!safety) return;
  const { error } = await admin
    .from('user_safety')
    .upsert({ user_id: userId, ...safety });
  if (error) throw error;
}

async function upsertCooking(userId: string, cooking: SeedUser['cooking']) {
  if (!cooking) return;
  const { error } = await admin
    .from('cooking_preferences')
    .upsert({ user_id: userId, ...cooking });
  if (error) throw error;
}

async function seedRecipes() {
  const recipes = [
    // Alice's recipes (4 total: 1 shared, 3 private)
    {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Avocado Toast',
      ingredients: [
        '2 slices sourdough',
        '1 ripe avocado',
        'salt',
        'pepper',
        'chili flakes',
      ],
      instructions:
        'Toast bread. Mash avocado with salt and pepper. Spread and top with chili flakes.',
      notes: 'Simple, fast breakfast.',
      image_url: 'https://picsum.photos/seed/avocado_toast/800/600',
      user_email: 'alice@example.com',
      is_public: true,
      categories: [
        'Course: Breakfast',
        'Collection: Vegetarian',
        'Technique: No-Cook',
      ],
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      title: 'Caprese Salad',
      ingredients: [
        'fresh mozzarella',
        'tomatoes',
        'basil',
        'balsamic glaze',
        'olive oil',
      ],
      instructions:
        'Slice mozzarella and tomatoes. Arrange with basil. Drizzle with balsamic and olive oil.',
      notes: 'Perfect summer salad.',
      image_url: 'https://picsum.photos/seed/caprese_salad/800/600',
      user_email: 'alice@example.com',
      is_public: false,
      categories: [
        'Course: Appetizer',
        'Dish Type: Salad',
        'Cuisine: Italian',
        'Collection: Vegetarian',
      ],
    },
    {
      id: '11111111-1111-1111-1111-111111111113',
      title: 'Quick Pasta',
      ingredients: [
        'spaghetti',
        'garlic',
        'olive oil',
        'cherry tomatoes',
        'basil',
      ],
      instructions:
        'Cook pasta. Sauté garlic in oil. Add tomatoes and pasta. Finish with basil.',
      notes: '15-minute weeknight dinner.',
      image_url: 'https://picsum.photos/seed/quick_pasta/800/600',
      user_email: 'alice@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Pasta',
        'Cuisine: Italian',
        'Occasion: Weeknight',
        'Collection: Vegetarian',
      ],
    },
    {
      id: '11111111-1111-1111-1111-111111111114',
      title: 'Veggie Stir Fry',
      ingredients: [
        'broccoli',
        'carrots',
        'bell peppers',
        'soy sauce',
        'ginger',
        'garlic',
      ],
      instructions:
        'Stir fry vegetables in hot oil. Add soy sauce, ginger, and garlic. Serve over rice.',
      notes: 'Healthy and colorful.',
      image_url: 'https://picsum.photos/seed/veggie_stir_fry/800/600',
      user_email: 'alice@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Stir-Fry',
        'Technique: Sauté',
        'Collection: Vegetarian',
      ],
    },

    // Bob's recipes (3 total: 1 shared, 2 private)
    {
      id: '22222222-2222-2222-2222-222222222221',
      title: 'Classic Caesar Salad',
      ingredients: [
        'romaine lettuce',
        'parmesan',
        'croutons',
        'caesar dressing',
        'lemon',
      ],
      instructions:
        'Chop lettuce. Toss with dressing, croutons, parmesan. Finish with lemon.',
      notes: 'Great with grilled chicken.',
      image_url: 'https://picsum.photos/seed/caesar_salad/800/600',
      user_email: 'bob@example.com',
      is_public: true,
      categories: [
        'Course: Appetizer',
        'Dish Type: Salad',
        'Cuisine: American',
      ],
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Grilled Chicken Breast',
      ingredients: [
        'chicken breast',
        'olive oil',
        'garlic powder',
        'paprika',
        'salt',
        'pepper',
      ],
      instructions:
        'Season chicken. Grill 6-8 minutes per side until 165°F internal temperature.',
      notes: 'Perfect for meal prep.',
      image_url: 'https://picsum.photos/seed/grilled_chicken/800/600',
      user_email: 'bob@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Technique: Grill',
        'Collection: High-Protein',
        'Occasion: Meal Prep',
      ],
    },
    {
      id: '22222222-2222-2222-2222-222222222223',
      title: 'BBQ Ribs',
      ingredients: [
        'pork ribs',
        'bbq sauce',
        'brown sugar',
        'paprika',
        'garlic powder',
      ],
      instructions:
        'Season ribs. Smoke for 3 hours. Glaze with BBQ sauce. Finish on high heat.',
      notes: 'Weekend project worth the wait.',
      image_url: 'https://picsum.photos/seed/bbq_ribs/800/600',
      user_email: 'bob@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Cuisine: BBQ',
        'Technique: Smoke',
        'Occasion: Weekend',
      ],
    },

    // Cora's recipes (4 total: 2 shared, 2 private)
    {
      id: '33333333-3333-3333-3333-333333333331',
      title: 'One-Pot Pasta',
      ingredients: [
        'spaghetti',
        'garlic',
        'olive oil',
        'tomatoes',
        'basil',
        'salt',
      ],
      instructions:
        'Cook garlic in oil. Add tomatoes and pasta with water. Simmer until tender. Finish with basil.',
      notes: 'Weeknight friendly.',
      image_url: 'https://picsum.photos/seed/one_pot_pasta/800/600',
      user_email: 'cora@example.com',
      is_public: true,
      categories: [
        'Course: Main',
        'Dish Type: Pasta',
        'Cuisine: Italian',
        'Occasion: Weeknight',
        'Collection: One-Pot',
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333332',
      title: 'Spanish Paella',
      ingredients: [
        'rice',
        'saffron',
        'shrimp',
        'chicken',
        'bell peppers',
        'onion',
        'garlic',
      ],
      instructions:
        'Sauté aromatics. Add rice and saffron. Layer with proteins and simmer until rice is tender.',
      notes: 'Traditional Spanish dish.',
      image_url: 'https://picsum.photos/seed/paella/800/600',
      user_email: 'cora@example.com',
      is_public: true,
      categories: [
        'Course: Main',
        'Cuisine: Spanish',
        'Technique: Simmer',
        'Occasion: Weekend',
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      title: 'Thai Curry',
      ingredients: [
        'coconut milk',
        'red curry paste',
        'chicken',
        'vegetables',
        'fish sauce',
        'lime',
      ],
      instructions:
        'Simmer coconut milk with curry paste. Add chicken and vegetables. Season with fish sauce and lime.',
      notes: 'Bold and spicy flavors.',
      image_url: 'https://picsum.photos/seed/thai_curry/800/600',
      user_email: 'cora@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Curry',
        'Cuisine: Thai',
        'Technique: Simmer',
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333334',
      title: 'Rice Pilaf',
      ingredients: [
        'basmati rice',
        'onion',
        'garlic',
        'chicken broth',
        'parsley',
        'butter',
      ],
      instructions:
        'Sauté onion and garlic. Add rice and broth. Simmer until tender. Fluff with fork.',
      notes: 'Simple side dish.',
      image_url: 'https://picsum.photos/seed/rice_pilaf/800/600',
      user_email: 'cora@example.com',
      is_public: false,
      categories: ['Course: Side', 'Dish Type: Rice', 'Technique: Simmer'],
    },

    // David's recipes (3 total: 1 shared, 2 private)
    {
      id: '44444444-4444-4444-4444-444444444441',
      title: 'Gluten-Free Bread',
      ingredients: [
        'gluten-free flour blend',
        'xanthan gum',
        'yeast',
        'honey',
        'olive oil',
        'warm water',
      ],
      instructions:
        'Mix dry ingredients. Add wet ingredients. Knead and let rise. Bake at 375°F.',
      notes: 'Soft and fluffy gluten-free bread.',
      image_url: 'https://picsum.photos/seed/gluten_free_bread/800/600',
      user_email: 'david@example.com',
      is_public: true,
      categories: [
        'Course: Side',
        'Dish Type: Bread',
        'Collection: Gluten-Free',
        'Technique: Bake',
      ],
    },
    {
      id: '44444444-4444-4444-4444-444444444442',
      title: 'French Macarons',
      ingredients: [
        'almond flour',
        'powdered sugar',
        'egg whites',
        'granulated sugar',
        'food coloring',
      ],
      instructions:
        'Whip egg whites with sugar. Fold in almond flour. Pipe and rest. Bake at 300°F.',
      notes: 'Delicate French pastries.',
      image_url: 'https://picsum.photos/seed/french_macarons/800/600',
      user_email: 'david@example.com',
      is_public: false,
      categories: ['Course: Dessert', 'Cuisine: French', 'Technique: Bake'],
    },
    {
      id: '44444444-4444-4444-4444-444444444443',
      title: 'Mediterranean Salad',
      ingredients: [
        'cucumber',
        'tomatoes',
        'red onion',
        'feta cheese',
        'olives',
        'olive oil',
        'lemon',
      ],
      instructions:
        'Chop vegetables. Combine with feta and olives. Dress with olive oil and lemon.',
      notes: 'Fresh and healthy.',
      image_url: 'https://picsum.photos/seed/mediterranean_salad/800/600',
      user_email: 'david@example.com',
      is_public: false,
      categories: [
        'Course: Side',
        'Dish Type: Salad',
        'Cuisine: Mediterranean',
        'Collection: Gluten-Free',
      ],
    },

    // Emma's recipes (4 total: 1 shared, 3 private)
    {
      id: '55555555-5555-5555-5555-555555555551',
      title: 'Greek Yogurt Bowl',
      ingredients: [
        'greek yogurt',
        'honey',
        'berries',
        'granola',
        'nuts',
        'cinnamon',
      ],
      instructions:
        'Layer yogurt in bowl. Top with berries, granola, and nuts. Drizzle with honey.',
      notes: 'Protein-packed breakfast.',
      image_url: 'https://picsum.photos/seed/greek_yogurt_bowl/800/600',
      user_email: 'emma@example.com',
      is_public: true,
      categories: [
        'Course: Breakfast',
        'Cuisine: Greek',
        'Collection: High-Protein',
        'Collection: Dairy-Free',
      ],
    },
    {
      id: '55555555-5555-5555-5555-555555555552',
      title: 'Sushi Roll',
      ingredients: [
        'sushi rice',
        'nori',
        'cucumber',
        'avocado',
        'salmon',
        'rice vinegar',
      ],
      instructions:
        'Season rice with vinegar. Lay nori, rice, and fillings. Roll tightly and slice.',
      notes: 'Homemade sushi is fun!',
      image_url: 'https://picsum.photos/seed/sushi_roll/800/600',
      user_email: 'emma@example.com',
      is_public: false,
      categories: ['Course: Main', 'Cuisine: Japanese', 'Technique: No-Cook'],
    },
    {
      id: '55555555-5555-5555-5555-555555555553',
      title: 'Air Fryer Salmon',
      ingredients: [
        'salmon fillet',
        'olive oil',
        'lemon',
        'dill',
        'garlic',
        'salt',
        'pepper',
      ],
      instructions:
        'Season salmon. Air fry at 400°F for 8-10 minutes. Serve with lemon.',
      notes: 'Quick and healthy dinner.',
      image_url: 'https://picsum.photos/seed/air_fryer_salmon/800/600',
      user_email: 'emma@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Collection: High-Protein',
        'Technique: Air Fryer',
        'Occasion: Weeknight',
      ],
    },
    {
      id: '55555555-5555-5555-5555-555555555554',
      title: 'Protein Smoothie',
      ingredients: [
        'protein powder',
        'banana',
        'berries',
        'almond milk',
        'spinach',
        'chia seeds',
      ],
      instructions: 'Blend all ingredients until smooth. Add ice if desired.',
      notes: 'Post-workout fuel.',
      image_url: 'https://picsum.photos/seed/protein_smoothie/800/600',
      user_email: 'emma@example.com',
      is_public: false,
      categories: [
        'Course: Beverage',
        'Beverage: Smoothie',
        'Collection: High-Protein',
        'Collection: Dairy-Free',
      ],
    },

    // Frank's recipes (3 total: 2 shared, 1 private)
    {
      id: '66666666-6666-6666-6666-666666666661',
      title: 'Spicy Tacos',
      ingredients: [
        'corn tortillas',
        'ground beef',
        'onion',
        'jalapeños',
        'cilantro',
        'lime',
        'hot sauce',
      ],
      instructions:
        'Cook beef with onions and jalapeños. Warm tortillas. Assemble with cilantro and lime.',
      notes: 'Pack the heat!',
      image_url: 'https://picsum.photos/seed/spicy_tacos/800/600',
      user_email: 'frank@example.com',
      is_public: true,
      categories: ['Course: Main', 'Dish Type: Taco', 'Cuisine: Mexican'],
    },
    {
      id: '66666666-6666-6666-6666-666666666662',
      title: 'Korean BBQ',
      ingredients: [
        'beef short ribs',
        'soy sauce',
        'sesame oil',
        'garlic',
        'ginger',
        'brown sugar',
        'gochujang',
      ],
      instructions:
        'Marinate beef in sauce. Grill until charred. Serve with rice and kimchi.',
      notes: 'Bold Korean flavors.',
      image_url: 'https://picsum.photos/seed/korean_bbq/800/600',
      user_email: 'frank@example.com',
      is_public: true,
      categories: ['Course: Main', 'Cuisine: Korean', 'Technique: Grill'],
    },
    {
      id: '66666666-6666-6666-6666-666666666663',
      title: 'Indian Curry',
      ingredients: [
        'chicken',
        'onion',
        'garlic',
        'ginger',
        'curry powder',
        'coconut milk',
        'tomatoes',
      ],
      instructions:
        'Sauté aromatics. Add chicken and spices. Simmer in coconut milk until tender.',
      notes: 'Rich and aromatic.',
      image_url: 'https://picsum.photos/seed/indian_curry/800/600',
      user_email: 'frank@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Curry',
        'Cuisine: Indian',
        'Technique: Simmer',
      ],
    },
  ];

  // Fetch all users once before the loop for better performance
  const { data: userList, error: userListError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

  if (userListError) {
    console.error('Error fetching user list:', userListError);
    return;
  }

  for (const recipe of recipes) {
    // Get user ID for the recipe from cached user list
    const userMatch = userList.users.find(
      (x) => x.email?.toLowerCase() === recipe.user_email.toLowerCase()
    );

    if (!userMatch) {
      console.warn(
        `User ${recipe.user_email} not found for recipe ${recipe.title}`
      );
      continue;
    }

    // Insert recipe
    const { error } = await admin.from('recipes').upsert(
      {
        id: recipe.id,
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        notes: recipe.notes,
        image_url: recipe.image_url,
        user_id: userMatch.id,
        is_public: recipe.is_public,
        categories: recipe.categories || [],
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error(`Error seeding recipe ${recipe.title}:`, error);
    }
  }

  console.log('✅ Recipes seeded successfully.');
}

async function main() {
  for (const u of users) {
    // Create or fetch existing user
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });

    if (
      createError &&
      !String(createError.message).includes('already registered')
    ) {
      console.error('Failed creating user', u.email, createError.message);
      process.exitCode = 1;
      continue;
    }

    // If user already exists, fetch it
    const userId = created?.user?.id;
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const { data: existing, error: listError } =
        await admin.auth.admin.listUsers({
          page: 1,
          perPage: 100,
        });
      if (listError) throw listError;
      const match = existing.users.find(
        (x) => x.email?.toLowerCase() === u.email.toLowerCase()
      );
      if (!match) {
        throw new Error(`Could not find or create user ${u.email}`);
      }
      effectiveUserId = match.id;
    }

    // Username + profile + related tables
    await ensureUsername(effectiveUserId, u.username);
    await createProfile(effectiveUserId, u.fullName, u.profile || {});
    await upsertSafety(effectiveUserId, u.safety);
    await upsertCooking(effectiveUserId, u.cooking);
  }

  // Seed recipes after all users are created
  await seedRecipes();

  console.log('✅ Seed users complete.');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

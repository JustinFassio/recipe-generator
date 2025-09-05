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

// Constants
const DEFAULT_MOOD = 'Mood: Simple';
const MAX_CATEGORIES_PER_RECIPE = 6; // Database constraint: maximum categories per recipe

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
        'Collection: Quick & Easy',
        'Technique: No-Cook',
        'Occasion: Weekday',
        'Dietary: Plant-Based',
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
        'Collection: Fresh & Light',
        'Technique: No-Cook',
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
        'Collection: Quick & Easy',
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
        'Cuisine: Asian',
        'Technique: Sauté',
        'Collection: Vegetarian',
        'Collection: Healthy',
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
        'Collection: Classic',
        'Technique: No-Cook',
        'Occasion: Any',
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
        'Collection: Lean Protein',
        'Occasion: Meal Prep',
        'Occasion: Weeknight',
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
        'Cuisine: American',
        'Technique: Smoke',
        'Technique: Low & Slow',
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
        'Collection: Quick & Easy',
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
        'Cuisine: Mediterranean',
        'Technique: Simmer',
        'Technique: Paella',
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
        'Cuisine: Asian',
        'Technique: Simmer',
        'Collection: Spicy',
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
      categories: [
        'Course: Side',
        'Dish Type: Rice',
        'Cuisine: Mediterranean',
        'Technique: Simmer',
        'Collection: Side Dishes',
        'Occasion: Any',
      ],
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
        'Collection: Homemade',
        'Technique: Bake',
        'Technique: Yeast',
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
      categories: [
        'Course: Dessert',
        'Cuisine: French',
        'Cuisine: European',
        'Technique: Bake',
        'Technique: Pastry',
        'Collection: Sweet Treats',
      ],
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
        'Cuisine: Greek',
        'Collection: Gluten-Free',
        'Collection: Fresh & Light',
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
        'Cuisine: Mediterranean',
        'Collection: High-Protein',
        'Collection: Dairy-Free',
        'Collection: Healthy',
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
      categories: [
        'Course: Main',
        'Cuisine: Japanese',
        'Cuisine: Asian',
        'Technique: No-Cook',
        'Collection: Seafood',
        'Collection: Homemade',
      ],
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
        'Collection: Lean Protein',
        'Collection: Healthy',
        'Technique: Air Fryer',
        'Technique: Quick Cook',
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
        'Collection: Healthy',
        'Collection: Post-Workout',
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
      categories: [
        'Course: Main',
        'Dish Type: Taco',
        'Cuisine: Mexican',
        'Cuisine: Latin American',
        'Collection: Spicy',
        'Collection: Street Food',
      ],
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
      categories: [
        'Course: Main',
        'Cuisine: Korean',
        'Cuisine: Asian',
        'Collection: BBQ',
        'Collection: Meat Lover',
        'Technique: Grill',
      ],
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
        'Cuisine: Asian',
        'Collection: Spicy',
        'Collection: One-Pot',
      ],
    },

    // Additional recipes for Alice (6 more)
    {
      id: '11111111-1111-1111-1111-111111111115',
      title: 'Mediterranean Quinoa Bowl',
      ingredients: [
        'quinoa',
        'cucumber',
        'tomatoes',
        'kalamata olives',
        'feta cheese',
        'olive oil',
        'lemon',
        'herbs',
      ],
      instructions:
        'Cook quinoa. Chop vegetables. Combine with olives and feta. Dress with olive oil and lemon.',
      notes: 'Nutritious and colorful bowl.',
      image_url: 'https://picsum.photos/seed/quinoa_bowl/800/600',
      user_email: 'alice@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Bowl',
        'Cuisine: Mediterranean',
        'Collection: Healthy',
        'Collection: Vegetarian',
        'Technique: No-Cook',
      ],
    },
    {
      id: '11111111-1111-1111-1111-111111111116',
      title: 'Sweet Potato Buddha Bowl',
      ingredients: [
        'sweet potato',
        'chickpeas',
        'kale',
        'avocado',
        'tahini',
        'lemon',
        'garlic',
        'spices',
      ],
      instructions:
        'Roast sweet potato and chickpeas. Massage kale. Assemble bowl with tahini dressing.',
      notes: 'Plant-based power bowl.',
      image_url: 'https://picsum.photos/seed/buddha_bowl/800/600',
      user_email: 'alice@example.com',
      is_public: true,
      categories: [
        'Course: Main',
        'Dish Type: Bowl',
        'Cuisine: Fusion',
        'Collection: Healthy',
        'Collection: Vegetarian',
        'Technique: Roast',
      ],
    },
    {
      id: '11111111-1111-1111-1111-111111111117',
      title: 'Mushroom Risotto',
      ingredients: [
        'arborio rice',
        'mushrooms',
        'vegetable broth',
        'white wine',
        'parmesan',
        'onion',
        'garlic',
        'herbs',
      ],
      instructions:
        'Sauté mushrooms and aromatics. Add rice and wine. Gradually add broth while stirring.',
      notes: 'Creamy and comforting.',
      image_url: 'https://picsum.photos/seed/mushroom_risotto/800/600',
      user_email: 'alice@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Risotto',
        'Cuisine: Italian',
        'Collection: Comfort Food',
        'Collection: Vegetarian',
        'Technique: Stir',
      ],
    },
    {
      id: '11111111-1111-1111-1111-111111111118',
      title: 'Lentil Soup',
      ingredients: [
        'red lentils',
        'carrots',
        'celery',
        'onion',
        'garlic',
        'vegetable broth',
        'spices',
        'lemon',
      ],
      instructions:
        'Sauté vegetables. Add lentils and broth. Simmer until lentils are tender. Finish with lemon.',
      notes: 'Hearty and nutritious.',
      image_url: 'https://picsum.photos/seed/lentil_soup/800/600',
      user_email: 'alice@example.com',
      is_public: true,
      categories: [
        'Course: Main',
        'Dish Type: Soup',
        'Cuisine: Mediterranean',
        'Collection: Healthy',
        'Collection: Vegetarian',
        'Technique: Simmer',
      ],
    },
    {
      id: '11111111-1111-1111-1111-111111111119',
      title: 'Chocolate Avocado Mousse',
      ingredients: [
        'ripe avocados',
        'dark chocolate',
        'maple syrup',
        'cocoa powder',
        'vanilla extract',
        'almond milk',
        'sea salt',
      ],
      instructions:
        'Melt chocolate. Blend avocados with other ingredients. Chill until set.',
      notes: 'Rich and creamy dessert.',
      image_url: 'https://picsum.photos/seed/avocado_mousse/800/600',
      user_email: 'alice@example.com',
      is_public: false,
      categories: [
        'Course: Dessert',
        'Dish Type: Mousse',
        'Collection: Healthy',
        'Collection: Vegetarian',
        'Technique: No-Cook',
        'Occasion: Special Occasion',
      ],
    },
    {
      id: '11111111-1111-1111-1111-111111111120',
      title: 'Zucchini Noodles with Pesto',
      ingredients: [
        'zucchini',
        'basil',
        'pine nuts',
        'garlic',
        'olive oil',
        'parmesan',
        'lemon',
        'salt',
      ],
      instructions:
        'Spiralize zucchini. Make pesto. Toss noodles with pesto and top with parmesan.',
      notes: 'Light and fresh summer dish.',
      image_url: 'https://picsum.photos/seed/zucchini_noodles/800/600',
      user_email: 'alice@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Noodles',
        'Cuisine: Italian',
        'Collection: Low-Carb',
        'Collection: Vegetarian',
        'Technique: No-Cook',
      ],
    },

    // Additional recipes for Bob (6 more)
    {
      id: '22222222-2222-2222-2222-222222222224',
      title: 'Smoked Brisket',
      ingredients: [
        'beef brisket',
        'salt',
        'pepper',
        'garlic powder',
        'onion powder',
        'paprika',
        'wood chips',
        'bbq sauce',
      ],
      instructions:
        'Season brisket. Smoke at 225°F for 12-16 hours. Rest and slice against the grain.',
      notes: 'Texas-style smoked brisket.',
      image_url: 'https://picsum.photos/seed/smoked_brisket/800/600',
      user_email: 'bob@example.com',
      is_public: true,
      categories: [
        'Course: Main',
        'Cuisine: BBQ',
        'Cuisine: American',
        'Collection: Meat Lover',
        'Collection: BBQ',
        'Technique: Smoke',
      ],
    },
    {
      id: '22222222-2222-2222-2222-222222222225',
      title: 'Grilled Salmon with Herbs',
      ingredients: [
        'salmon fillets',
        'fresh herbs',
        'lemon',
        'garlic',
        'olive oil',
        'salt',
        'pepper',
        'butter',
      ],
      instructions:
        'Season salmon. Grill skin-side down. Add herbs and lemon. Finish with butter.',
      notes: 'Simple and elegant.',
      image_url: 'https://picsum.photos/seed/grilled_salmon/800/600',
      user_email: 'bob@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Collection: Seafood',
        'Collection: Healthy',
        'Collection: Lean Protein',
        'Technique: Grill',
        'Occasion: Weeknight',
      ],
    },
    {
      id: '22222222-2222-2222-2222-222222222226',
      title: 'Beer Can Chicken',
      ingredients: [
        'whole chicken',
        'beer',
        'spice rub',
        'garlic',
        'herbs',
        'butter',
        'lemon',
        'onion',
      ],
      instructions:
        'Season chicken. Place on beer can. Grill until internal temperature reaches 165°F.',
      notes: 'Juicy and flavorful.',
      image_url: 'https://picsum.photos/seed/beer_can_chicken/800/600',
      user_email: 'bob@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Cuisine: BBQ',
        'Cuisine: American',
        'Collection: BBQ',
        'Collection: Meat Lover',
        'Technique: Grill',
      ],
    },
    {
      id: '22222222-2222-2222-2222-222222222227',
      title: 'Grilled Vegetable Platter',
      ingredients: [
        'zucchini',
        'bell peppers',
        'mushrooms',
        'asparagus',
        'olive oil',
        'garlic',
        'herbs',
        'balsamic glaze',
      ],
      instructions:
        'Cut vegetables. Toss with oil and seasonings. Grill until charred and tender.',
      notes: 'Perfect BBQ side dish.',
      image_url: 'https://picsum.photos/seed/grilled_vegetables/800/600',
      user_email: 'bob@example.com',
      is_public: true,
      categories: [
        'Course: Side',
        'Dish Type: Vegetables',
        'Collection: BBQ',
        'Collection: Vegetarian',
        'Technique: Grill',
        'Occasion: Weekend',
      ],
    },
    {
      id: '22222222-2222-2222-2222-222222222228',
      title: 'Slow Cooker Pulled Pork',
      ingredients: [
        'pork shoulder',
        'bbq sauce',
        'onion',
        'garlic',
        'spices',
        'apple cider vinegar',
        'brown sugar',
        'worcestershire sauce',
      ],
      instructions:
        'Season pork. Add to slow cooker with sauce and aromatics. Cook on low for 8 hours.',
      notes: 'Fall-apart tender pork.',
      image_url: 'https://picsum.photos/seed/pulled_pork/800/600',
      user_email: 'bob@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Cuisine: BBQ',
        'Cuisine: American',
        'Collection: BBQ',
        'Collection: Meat Lover',
        'Technique: Slow Cooker',
      ],
    },
    {
      id: '22222222-2222-2222-2222-222222222229',
      title: 'Grilled Corn on the Cob',
      ingredients: [
        'corn on the cob',
        'butter',
        'salt',
        'pepper',
        'chili powder',
        'lime',
        'cotija cheese',
        'cilantro',
      ],
      instructions:
        'Soak corn in water. Grill until charred. Brush with butter and seasonings.',
      notes: 'Classic BBQ side.',
      image_url: 'https://picsum.photos/seed/grilled_corn/800/600',
      user_email: 'bob@example.com',
      is_public: false,
      categories: [
        'Course: Side',
        'Dish Type: Vegetables',
        'Cuisine: American',
        'Collection: BBQ',
        'Collection: Summer',
        'Technique: Grill',
      ],
    },

    // Additional recipes for Cora (6 more)
    {
      id: '33333333-3333-3333-3333-333333333335',
      title: 'Vietnamese Pho',
      ingredients: [
        'rice noodles',
        'beef broth',
        'beef slices',
        'bean sprouts',
        'herbs',
        'lime',
        'fish sauce',
        'hoisin sauce',
      ],
      instructions:
        'Simmer broth with spices. Cook noodles. Assemble with beef, herbs, and condiments.',
      notes: 'Authentic Vietnamese soup.',
      image_url: 'https://picsum.photos/seed/vietnamese_pho/800/600',
      user_email: 'cora@example.com',
      is_public: true,
      categories: [
        'Course: Main',
        'Dish Type: Soup',
        'Cuisine: Vietnamese',
        'Cuisine: Asian',
        'Collection: Noodle Dishes',
        'Collection: Comfort Food',
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333336',
      title: 'Spanish Tortilla',
      ingredients: [
        'potatoes',
        'eggs',
        'onion',
        'olive oil',
        'salt',
        'pepper',
        'parsley',
        'garlic',
      ],
      instructions:
        'Slice and fry potatoes. Beat eggs. Combine and cook in pan until set.',
      notes: 'Traditional Spanish omelette.',
      image_url: 'https://picsum.photos/seed/spanish_tortilla/800/600',
      user_email: 'cora@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Omelette',
        'Cuisine: Spanish',
        'Cuisine: Mediterranean',
        'Collection: Traditional',
        'Collection: Vegetarian',
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333337',
      title: 'Thai Green Curry',
      ingredients: [
        'green curry paste',
        'coconut milk',
        'chicken',
        'vegetables',
        'fish sauce',
        'palm sugar',
        'thai basil',
        'lime leaves',
      ],
      instructions:
        'Fry curry paste. Add coconut milk and chicken. Simmer with vegetables and seasonings.',
      notes: 'Aromatic and spicy.',
      image_url: 'https://picsum.photos/seed/thai_green_curry/800/600',
      user_email: 'cora@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Curry',
        'Cuisine: Thai',
        'Cuisine: Asian',
        'Collection: Spicy',
        'Collection: One-Pot',
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333338',
      title: 'Moroccan Tagine',
      ingredients: [
        'lamb',
        'apricots',
        'almonds',
        'spices',
        'onion',
        'garlic',
        'chicken broth',
        'couscous',
      ],
      instructions:
        'Brown lamb. Add aromatics and spices. Simmer with apricots until tender. Serve with couscous.',
      notes: 'Sweet and savory Moroccan dish.',
      image_url: 'https://picsum.photos/seed/moroccan_tagine/800/600',
      user_email: 'cora@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Stew',
        'Cuisine: Moroccan',
        'Cuisine: African',
        'Collection: Exotic',
        'Collection: Meat Lover',
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333339',
      title: 'Greek Moussaka',
      ingredients: [
        'eggplant',
        'ground lamb',
        'béchamel sauce',
        'tomato sauce',
        'onion',
        'garlic',
        'spices',
        'parmesan',
      ],
      instructions:
        'Layer eggplant, meat sauce, and béchamel. Bake until golden and bubbly.',
      notes: 'Rich Greek casserole.',
      image_url: 'https://picsum.photos/seed/greek_moussaka/800/600',
      user_email: 'cora@example.com',
      is_public: true,
      categories: [
        'Course: Main',
        'Dish Type: Casserole',
        'Cuisine: Greek',
        'Cuisine: Mediterranean',
        'Collection: Traditional',
        'Collection: Meat Lover',
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333340',
      title: 'Japanese Ramen',
      ingredients: [
        'ramen noodles',
        'pork belly',
        'soft-boiled eggs',
        'nori',
        'green onions',
        'miso paste',
        'dashi broth',
        'bamboo shoots',
      ],
      instructions:
        'Simmer broth. Cook noodles. Assemble with toppings and serve hot.',
      notes: 'Authentic Japanese ramen.',
      image_url: 'https://picsum.photos/seed/japanese_ramen/800/600',
      user_email: 'cora@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Noodle Soup',
        'Cuisine: Japanese',
        'Cuisine: Asian',
        'Collection: Noodle Dishes',
        'Collection: Comfort Food',
      ],
    },

    // Additional recipes for David (6 more)
    {
      id: '44444444-4444-4444-4444-444444444444',
      title: 'Croissants',
      ingredients: [
        'all-purpose flour',
        'butter',
        'yeast',
        'milk',
        'sugar',
        'salt',
        'egg',
        'water',
      ],
      instructions:
        'Make dough. Fold in butter layers. Shape and proof. Bake until golden brown.',
      notes: 'Flaky French pastries.',
      image_url: 'https://picsum.photos/seed/croissants/800/600',
      user_email: 'david@example.com',
      is_public: false,
      categories: [
        'Course: Breakfast',
        'Dish Type: Pastry',
        'Cuisine: French',
        'Cuisine: European',
        'Collection: Sweet Treats',
        'Collection: Homemade',
      ],
    },
    {
      id: '44444444-4444-4444-4444-444444444445',
      title: 'Tiramisu',
      ingredients: [
        'ladyfingers',
        'mascarpone cheese',
        'eggs',
        'sugar',
        'espresso',
        'cocoa powder',
        'marsala wine',
        'vanilla extract',
      ],
      instructions:
        'Make mascarpone cream. Dip ladyfingers in coffee. Layer and chill overnight.',
      notes: 'Classic Italian dessert.',
      image_url: 'https://picsum.photos/seed/tiramisu/800/600',
      user_email: 'david@example.com',
      is_public: true,
      categories: [
        'Course: Dessert',
        'Dish Type: Cake',
        'Cuisine: Italian',
        'Cuisine: European',
        'Collection: Sweet Treats',
        'Collection: Classic',
      ],
    },
    {
      id: '44444444-4444-4444-4444-444444444446',
      title: 'Sourdough Bread',
      ingredients: [
        'sourdough starter',
        'bread flour',
        'water',
        'salt',
        'whole wheat flour',
        'rye flour',
        'olive oil',
      ],
      instructions:
        'Feed starter. Mix dough. Bulk ferment. Shape and proof. Bake in Dutch oven.',
      notes: 'Tangy sourdough bread.',
      image_url: 'https://picsum.photos/seed/sourdough_bread/800/600',
      user_email: 'david@example.com',
      is_public: false,
      categories: [
        'Course: Side',
        'Dish Type: Bread',
        'Collection: Homemade',
        'Collection: Artisan',
        'Technique: Bake',
        'Technique: Sourdough',
      ],
    },
    {
      id: '44444444-4444-4444-4444-444444444447',
      title: 'Chocolate Éclairs',
      ingredients: [
        'choux pastry',
        'chocolate ganache',
        'vanilla custard',
        'eggs',
        'butter',
        'flour',
        'milk',
        'sugar',
      ],
      instructions:
        'Make choux pastry. Pipe and bake. Fill with custard. Top with ganache.',
      notes: 'Elegant French pastries.',
      image_url: 'https://picsum.photos/seed/chocolate_eclairs/800/600',
      user_email: 'david@example.com',
      is_public: false,
      categories: [
        'Course: Dessert',
        'Dish Type: Pastry',
        'Cuisine: French',
        'Cuisine: European',
        'Collection: Sweet Treats',
        'Collection: Classic',
      ],
    },
    {
      id: '44444444-4444-4444-4444-444444444448',
      title: 'Cannoli',
      ingredients: [
        'cannoli shells',
        'ricotta cheese',
        'powdered sugar',
        'vanilla extract',
        'chocolate chips',
        'candied orange peel',
        'pistachios',
        'cinnamon',
      ],
      instructions:
        'Mix ricotta filling. Fill shells. Garnish with chocolate and pistachios.',
      notes: 'Traditional Italian dessert.',
      image_url: 'https://picsum.photos/seed/cannoli/800/600',
      user_email: 'david@example.com',
      is_public: false,
      categories: [
        'Course: Dessert',
        'Dish Type: Pastry',
        'Cuisine: Italian',
        'Cuisine: European',
        'Collection: Sweet Treats',
        'Collection: Traditional',
      ],
    },
    {
      id: '44444444-4444-4444-4444-444444444449',
      title: 'Pain au Chocolat',
      ingredients: [
        'puff pastry',
        'dark chocolate',
        'egg',
        'milk',
        'sugar',
        'butter',
        'vanilla extract',
      ],
      instructions:
        'Roll out pastry. Add chocolate pieces. Fold and shape. Brush with egg wash and bake.',
      notes: 'Chocolate-filled French pastries.',
      image_url: 'https://picsum.photos/seed/pain_au_chocolat/800/600',
      user_email: 'david@example.com',
      is_public: true,
      categories: [
        'Course: Breakfast',
        'Dish Type: Pastry',
        'Cuisine: French',
        'Cuisine: European',
        'Collection: Sweet Treats',
        'Collection: Classic',
      ],
    },

    // Additional recipes for Emma (6 more)
    {
      id: '55555555-5555-5555-5555-555555555555',
      title: 'Acai Bowl',
      ingredients: [
        'acai puree',
        'banana',
        'berries',
        'granola',
        'coconut flakes',
        'chia seeds',
        'honey',
        'almond milk',
      ],
      instructions:
        'Blend acai with banana. Top with granola, berries, and seeds. Drizzle with honey.',
      notes: 'Nutritious breakfast bowl.',
      image_url: 'https://picsum.photos/seed/acai_bowl/800/600',
      user_email: 'emma@example.com',
      is_public: true,
      categories: [
        'Course: Breakfast',
        'Dish Type: Bowl',
        'Collection: Healthy',
        'Collection: Superfood',
        'Collection: Dairy-Free',
        'Technique: No-Cook',
      ],
    },
    {
      id: '55555555-5555-5555-5555-555555555556',
      title: 'Quinoa Stuffed Peppers',
      ingredients: [
        'bell peppers',
        'quinoa',
        'black beans',
        'corn',
        'onion',
        'garlic',
        'spices',
        'cheese',
      ],
      instructions:
        'Cook quinoa. Sauté vegetables. Stuff peppers. Bake until peppers are tender.',
      notes: 'Protein-packed vegetarian dish.',
      image_url: 'https://picsum.photos/seed/stuffed_peppers/800/600',
      user_email: 'emma@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Stuffed Vegetables',
        'Collection: Healthy',
        'Collection: Vegetarian',
        'Collection: High-Protein',
        'Technique: Bake',
      ],
    },
    {
      id: '55555555-5555-5555-5555-555555555557',
      title: 'Chia Pudding',
      ingredients: [
        'chia seeds',
        'almond milk',
        'maple syrup',
        'vanilla extract',
        'berries',
        'nuts',
        'coconut flakes',
        'cinnamon',
      ],
      instructions:
        'Mix chia seeds with milk and sweetener. Refrigerate overnight. Top with berries and nuts.',
      notes: 'Overnight breakfast pudding.',
      image_url: 'https://picsum.photos/seed/chia_pudding/800/600',
      user_email: 'emma@example.com',
      is_public: false,
      categories: [
        'Course: Breakfast',
        'Dish Type: Pudding',
        'Collection: Healthy',
        'Collection: Dairy-Free',
        'Collection: High-Protein',
        'Technique: No-Cook',
      ],
    },
    {
      id: '55555555-5555-5555-5555-555555555558',
      title: 'Cauliflower Rice Bowl',
      ingredients: [
        'cauliflower',
        'chicken breast',
        'vegetables',
        'soy sauce',
        'ginger',
        'garlic',
        'sesame oil',
        'eggs',
      ],
      instructions:
        'Rice cauliflower. Cook chicken and vegetables. Combine with sauce and top with egg.',
      notes: 'Low-carb rice alternative.',
      image_url: 'https://picsum.photos/seed/cauliflower_rice/800/600',
      user_email: 'emma@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Bowl',
        'Collection: Low-Carb',
        'Collection: Healthy',
        'Collection: High-Protein',
        'Technique: Sauté',
      ],
    },
    {
      id: '55555555-5555-5555-5555-555555555559',
      title: 'Energy Balls',
      ingredients: [
        'dates',
        'nuts',
        'oats',
        'coconut flakes',
        'chia seeds',
        'honey',
        'vanilla extract',
        'cocoa powder',
      ],
      instructions:
        'Process dates and nuts. Mix with other ingredients. Roll into balls and chill.',
      notes: 'Healthy snack or dessert.',
      image_url: 'https://picsum.photos/seed/energy_balls/800/600',
      user_email: 'emma@example.com',
      is_public: false,
      categories: [
        'Course: Snack',
        'Dish Type: Energy Balls',
        'Collection: Healthy',
        'Collection: Dairy-Free',
        'Collection: High-Protein',
        'Technique: No-Cook',
      ],
    },
    {
      id: '55555555-5555-5555-5555-555555555560',
      title: 'Zucchini Muffins',
      ingredients: [
        'zucchini',
        'flour',
        'eggs',
        'oil',
        'sugar',
        'cinnamon',
        'nuts',
        'vanilla extract',
      ],
      instructions:
        'Grate zucchini. Mix wet and dry ingredients. Fold in zucchini. Bake until golden.',
      notes: 'Moist and healthy muffins.',
      image_url: 'https://picsum.photos/seed/zucchini_muffins/800/600',
      user_email: 'emma@example.com',
      is_public: true,
      categories: [
        'Course: Breakfast',
        'Dish Type: Muffins',
        'Collection: Healthy',
        'Collection: Homemade',
        'Collection: Vegetarian',
        'Technique: Bake',
      ],
    },

    // Additional recipes for Frank (6 more)
    {
      id: '66666666-6666-6666-6666-666666666664',
      title: 'Jamaican Jerk Chicken',
      ingredients: [
        'chicken',
        'jerk seasoning',
        'scotch bonnet peppers',
        'allspice',
        'thyme',
        'garlic',
        'ginger',
        'lime',
      ],
      instructions:
        'Marinate chicken in jerk seasoning. Grill until charred and cooked through.',
      notes: 'Spicy Jamaican classic.',
      image_url: 'https://picsum.photos/seed/jerk_chicken/800/600',
      user_email: 'frank@example.com',
      is_public: true,
      categories: [
        'Course: Main',
        'Cuisine: Jamaican',
        'Cuisine: Caribbean',
        'Collection: Spicy',
        'Collection: BBQ',
        'Collection: Meat Lover',
      ],
    },
    {
      id: '66666666-6666-6666-6666-666666666665',
      title: 'Ethiopian Doro Wat',
      ingredients: [
        'chicken',
        'berbere spice',
        'onion',
        'garlic',
        'ginger',
        'tomato paste',
        'eggs',
        'injera bread',
      ],
      instructions:
        'Sauté aromatics. Add chicken and berbere. Simmer until tender. Serve with injera.',
      notes: 'Spicy Ethiopian chicken stew.',
      image_url: 'https://picsum.photos/seed/doro_wat/800/600',
      user_email: 'frank@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Stew',
        'Cuisine: Ethiopian',
        'Cuisine: African',
        'Collection: Spicy',
        'Collection: Exotic',
      ],
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      title: 'Thai Tom Yum Soup',
      ingredients: [
        'shrimp',
        'lemongrass',
        'galangal',
        'kaffir lime leaves',
        'fish sauce',
        'lime juice',
        'chili paste',
        'mushrooms',
      ],
      instructions:
        'Simmer broth with aromatics. Add shrimp and mushrooms. Season with fish sauce and lime.',
      notes: 'Hot and sour Thai soup.',
      image_url: 'https://picsum.photos/seed/tom_yum_soup/800/600',
      user_email: 'frank@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Soup',
        'Cuisine: Thai',
        'Cuisine: Asian',
        'Collection: Spicy',
        'Collection: Seafood',
      ],
    },
    {
      id: '66666666-6666-6666-6666-666666666667',
      title: 'Indian Tandoori Chicken',
      ingredients: [
        'chicken',
        'yogurt',
        'tandoori masala',
        'garlic',
        'ginger',
        'lemon juice',
        'spices',
        'cilantro',
      ],
      instructions:
        'Marinate chicken in yogurt and spices. Grill or bake until charred and cooked.',
      notes: 'Tender and flavorful Indian chicken.',
      image_url: 'https://picsum.photos/seed/tandoori_chicken/800/600',
      user_email: 'frank@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Collection: Meat Lover',
        'Collection: Spicy',
        'Collection: High-Protein',
        'Cuisine: Indian',
        'Cuisine: Asian',
      ],
    },
    {
      id: '66666666-6666-6666-6666-666666666668',
      title: 'Korean Kimchi Fried Rice',
      ingredients: [
        'cooked rice',
        'kimchi',
        'eggs',
        'green onions',
        'garlic',
        'sesame oil',
        'gochujang',
        'sesame seeds',
      ],
      instructions:
        'Fry rice with kimchi. Add eggs and seasonings. Top with green onions and sesame seeds.',
      notes: 'Spicy Korean comfort food.',
      image_url: 'https://picsum.photos/seed/kimchi_fried_rice/800/600',
      user_email: 'frank@example.com',
      is_public: false,
      categories: [
        'Course: Main',
        'Dish Type: Fried Rice',
        'Cuisine: Korean',
        'Cuisine: Asian',
        'Collection: Spicy',
        'Collection: Comfort Food',
      ],
    },
    {
      id: '66666666-6666-6666-6666-666666666669',
      title: 'Vietnamese Banh Mi',
      ingredients: [
        'baguette',
        'pork belly',
        'pickled vegetables',
        'cilantro',
        'jalapeños',
        'mayonnaise',
        'fish sauce',
        'lime',
      ],
      instructions:
        'Toast baguette. Layer with pork, pickled vegetables, and herbs. Drizzle with sauce.',
      notes: 'Vietnamese street food sandwich.',
      image_url: 'https://picsum.photos/seed/banh_mi/800/600',
      user_email: 'frank@example.com',
      is_public: true,
      categories: [
        'Course: Main',
        'Dish Type: Sandwich',
        'Cuisine: Vietnamese',
        'Cuisine: Asian',
        'Collection: Street Food',
        'Collection: Meat Lover',
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

    // Ensure at least one Mood tag based on existing category hints
    const existing = (recipe.categories || []) as string[];
    const hasMood = existing.some((c) => c.startsWith('Mood:'));
    let moodAugmented = existing;
    if (!hasMood) {
      const lower = existing.map((c) => c.toLowerCase());
      const moodGuesses: string[] = [];

      // Flavor-based moods
      if (lower.some((c) => c.includes('spicy') || c.includes('hot')))
        moodGuesses.push('Mood: Spicy');
      if (lower.some((c) => c.includes('sweet') || c.includes('dessert')))
        moodGuesses.push('Mood: Sweet');
      if (lower.some((c) => c.includes('savory') || c.includes('umami')))
        moodGuesses.push('Mood: Savory');
      if (lower.some((c) => c.includes('tangy') || c.includes('citrus')))
        moodGuesses.push('Mood: Tangy');

      // Emotional/comfort moods
      if (lower.some((c) => c.includes('comfort') || c.includes('cozy')))
        moodGuesses.push('Mood: Comfort');
      if (
        lower.some(
          (c) => c.includes('energizing') || c.includes('post-workout')
        )
      )
        moodGuesses.push('Mood: Energizing');
      if (lower.some((c) => c.includes('refreshing') || c.includes('fresh')))
        moodGuesses.push('Mood: Refreshing');
      if (
        lower.some(
          (c) => c.includes('celebratory') || c.includes('special occasion')
        )
      )
        moodGuesses.push('Mood: Celebratory');

      // Energy/time moods
      if (
        lower.some(
          (c) =>
            c.includes('quick') || c.includes('under') || c.includes('fast')
        )
      )
        moodGuesses.push('Mood: Quick');
      if (
        lower.some(
          (c) =>
            c.includes('slow') ||
            c.includes('over 2 hours') ||
            c.includes('patience')
        )
      )
        moodGuesses.push('Mood: Patient');
      if (lower.some((c) => c.includes('light') || c.includes('airy')))
        moodGuesses.push('Mood: Light');
      if (lower.some((c) => c.includes('heavy') || c.includes('substantial')))
        moodGuesses.push('Mood: Substantial');

      // Seasonal moods
      if (lower.some((c) => c.includes('summer') || c.includes('refreshing')))
        moodGuesses.push('Mood: Refreshing');
      if (
        lower.some(
          (c) =>
            c.includes('winter') || c.includes('cozy') || c.includes('comfort')
        )
      )
        moodGuesses.push('Mood: Cozy');
      if (lower.some((c) => c.includes('holiday') || c.includes('festive')))
        moodGuesses.push('Mood: Festive');

      // Social moods
      if (lower.some((c) => c.includes('party') || c.includes('sharing')))
        moodGuesses.push('Mood: Sharing');
      if (lower.some((c) => c.includes('romantic') || c.includes('date night')))
        moodGuesses.push('Mood: Romantic');
      if (lower.some((c) => c.includes('family') || c.includes('communal')))
        moodGuesses.push('Mood: Communal');

      // Culinary style moods
      if (lower.some((c) => c.includes('traditional') || c.includes('classic')))
        moodGuesses.push('Mood: Traditional');
      if (lower.some((c) => c.includes('simple') || c.includes('basic')))
        moodGuesses.push(DEFAULT_MOOD);
      if (lower.some((c) => c.includes('gourmet') || c.includes('elegant')))
        moodGuesses.push('Mood: Elegant');
      if (lower.some((c) => c.includes('rustic') || c.includes('home-style')))
        moodGuesses.push('Mood: Rustic');
      if (lower.some((c) => c.includes('fusion') || c.includes('exotic')))
        moodGuesses.push('Mood: Adventurous');

      // Default mood if none detected
      if (moodGuesses.length === 0) moodGuesses.push(DEFAULT_MOOD);

      // Limit to max MAX_MOODS_PER_RECIPE moods and ensure no duplicates
      // Also ensure total categories never exceed MAX_CATEGORIES_PER_RECIPE to respect database constraint
      const maxMoodsToAdd = Math.max(
        0,
        MAX_CATEGORIES_PER_RECIPE - existing.length
      );
      moodAugmented = Array.from(
        new Set([...existing, ...moodGuesses.slice(0, maxMoodsToAdd)])
      );
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
        categories: moodAugmented,
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error(`Error seeding recipe ${recipe.title}:`, error);
    }
  }

  console.log('✅ Recipes seeded successfully.');
}

async function seedEvaluationReports() {
  const evaluationReports = [
    // Alice's reports
    {
      id: '11111111-1111-1111-1111-111111111111',
      user_email: 'alice@example.com',
      report_id: 'eval_2025_01_17_alice_001',
      evaluation_date: '2025-01-17T10:00:00Z',
      dietitian: 'Dr. Luna Clearwater',
      report_version: '1.0',
      report_data: {
        report_id: 'eval_2025_01_17_alice_001',
        evaluation_date: '2025-01-17T10:00:00Z',
        dietitian: 'Dr. Luna Clearwater',
        report_version: '1.0',
        user_profile_summary: {
          user_id: 'alice_user_id',
          evaluation_completeness: 85,
          data_quality_score: 90,
          last_updated: '2025-01-17T10:00:00Z',
        },
        safety_assessment: {
          status: 'VERIFIED',
          critical_alerts: [
            {
              type: 'allergy',
              severity: 'severe',
              item: 'peanuts',
              required_action:
                'Avoid all peanut products and check labels carefully',
              hidden_sources: ['processed foods', 'sauces', 'baked goods'],
              cross_contamination_risk: 'high',
            },
          ],
          dietary_restrictions: [
            {
              type: 'vegetarian',
              severity: 'moderate',
              tolerance_threshold: 'strict vegetarian',
              safe_alternatives: [
                'plant-based proteins',
                'legumes',
                'nuts (non-peanut)',
              ],
              enzyme_supplementation: 'not_needed',
            },
          ],
          medical_considerations: [],
        },
        personalization_matrix: {
          skill_profile: {
            current_level: 'intermediate',
            confidence_score: 75,
            growth_trajectory: 'positive',
            recommended_techniques: [
              'meal prep',
              'batch cooking',
              'vegetable roasting',
            ],
            advancement_timeline: '3-6 months',
          },
          time_analysis: {
            available_time_per_meal: 30,
            time_utilization_efficiency: 80,
            optimization_opportunities: ['prep ahead', 'one-pot meals'],
            quick_meal_quota: '60%',
          },
          equipment_optimization: {
            utilization_rate: 70,
            underused_tools: ['blender'],
            missing_beneficial_tools: ['food processor'],
            technique_adaptations: 'focus on oven and skillet techniques',
          },
          cultural_preferences: {
            primary_cuisines: ['italian', 'mexican'],
            flavor_profile_affinity: 'mediterranean',
            spice_tolerance_calibration: 2,
            fusion_receptiveness: 'medium',
          },
          ingredient_landscape: {
            embrace_list: ['vegetables', 'legumes', 'grains', 'herbs'],
            avoid_list: ['peanuts', 'anchovies', 'meat'],
            exploration_candidates: ['quinoa', 'tempeh', 'nutritional yeast'],
            substitution_success_rate: 85,
          },
        },
        nutritional_analysis: {
          current_status: {
            overall_diet_quality_score: 78,
            nutritional_completeness: 82,
            anti_inflammatory_index: 75,
            gut_health_score: 80,
            metabolic_health_score: 85,
          },
          deficiency_risks: [
            {
              nutrient: 'B12',
              risk_level: 'moderate',
              current_intake_estimate: '60% of RDA',
              food_sources: ['fortified cereals', 'nutritional yeast'],
              supplementation_consideration: 'recommended',
            },
          ],
          optimization_priorities: [
            {
              priority: 1,
              focus: 'protein variety',
              impact_score: 85,
              implementation_difficulty: 'easy',
            },
          ],
        },
        personalized_recommendations: {
          immediate_actions: [
            {
              action: 'Add B12 supplement',
              description: 'Take daily B12 supplement to prevent deficiency',
              expected_benefit: 'Improved energy and neurological function',
              difficulty: 'easy',
              resources_provided: [
                'supplement guide',
                'timing recommendations',
              ],
            },
          ],
          weekly_structure: {
            meal_framework: {
              breakfast_template: 'Protein-rich smoothie or overnight oats',
              lunch_template: 'Grain bowl with vegetables and legumes',
              dinner_template: 'One-pot pasta or stir-fry with vegetables',
              snack_strategy: 'Nuts, fruits, or hummus with vegetables',
            },
            cuisine_rotation: {
              monday: 'italian',
              tuesday: 'mexican',
              wednesday: 'mediterranean',
              thursday: 'asian',
              friday: 'fusion',
              weekend: 'experimental',
            },
          },
          progressive_challenges: [
            {
              week_1_4: 'Try one new vegetable per week',
              week_5_8: 'Master meal prep for 3 days',
              week_9_12: 'Experiment with fermentation',
            },
          ],
        },
        meal_suggestions: {
          signature_recipes: [
            {
              name: 'Mediterranean Quinoa Bowl',
              prep_time: 20,
              skill_match: 85,
              health_impact_score: 90,
              customization_notes: 'Add seasonal vegetables',
              allergen_safe: true,
            },
          ],
          quick_options: ['Avocado toast', 'Caprese salad', 'Hummus wrap'],
          batch_cooking_priorities: [
            'Roasted vegetables',
            'Cooked grains',
            'Bean salads',
          ],
        },
        progress_tracking: {
          key_metrics: [
            {
              metric: 'Weekly vegetable variety',
              baseline: '5 different vegetables',
              target: '8 different vegetables',
              reassessment: 'monthly',
            },
          ],
          milestone_markers: [
            {
              week_2: 'Consistent B12 supplementation',
              week_4: 'Meal prep routine established',
              week_8: 'Increased protein variety',
              week_12: 'Improved energy levels',
            },
          ],
        },
        risk_mitigation: {
          adherence_barriers: [
            {
              barrier: 'Time constraints',
              mitigation_strategy: 'Batch cooking on weekends',
              backup_plan: 'Keep healthy frozen meals available',
            },
          ],
          safety_reminders: [
            'Always check labels for peanuts',
            'Carry epinephrine if prescribed',
          ],
        },
        support_resources: {
          education_modules: [
            'Vegetarian nutrition basics',
            'Meal prep strategies',
          ],
          tools_provided: ['Meal planning template', 'Grocery list generator'],
          community_connections: [
            'Local vegetarian cooking class',
            'Online support group',
          ],
        },
        next_steps: {
          immediate_72_hours: [
            'Purchase B12 supplement',
            "Plan next week's meals",
          ],
          week_1_goals: ['Start B12 supplementation', 'Try one new vegetable'],
          month_1_objectives: [
            'Establish meal prep routine',
            'Increase protein variety',
          ],
        },
        professional_notes: {
          strengths_observed:
            'Good foundation in vegetarian cooking, open to new techniques',
          growth_opportunities: 'Protein variety and meal prep efficiency',
          collaboration_recommendations:
            'Consider working with a registered dietitian for B12 monitoring',
          reassessment_schedule: '3 months',
        },
        report_metadata: {
          confidence_level: 88,
          data_completeness: 85,
          personalization_depth: 'high',
          evidence_base: 'strong',
          last_literature_review: '2025-01-15',
          next_update_recommended: '2025-04-17',
        },
      },
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      user_email: 'alice@example.com',
      report_id: 'eval_2025_01_20_alice_002',
      evaluation_date: '2025-01-20T14:30:00Z',
      dietitian: 'Dr. Luna Clearwater',
      report_version: '1.0',
      report_data: {
        report_id: 'eval_2025_01_20_alice_002',
        evaluation_date: '2025-01-20T14:30:00Z',
        dietitian: 'Dr. Luna Clearwater',
        report_version: '1.0',
        user_profile_summary: {
          user_id: 'alice_user_id',
          evaluation_completeness: 90,
          data_quality_score: 95,
          last_updated: '2025-01-20T14:30:00Z',
        },
        safety_assessment: {
          status: 'VERIFIED',
          critical_alerts: [
            {
              type: 'allergy',
              severity: 'severe',
              item: 'peanuts',
              required_action:
                'Avoid all peanut products and check labels carefully',
              hidden_sources: ['processed foods', 'sauces', 'baked goods'],
              cross_contamination_risk: 'high',
            },
          ],
          dietary_restrictions: [
            {
              type: 'vegetarian',
              severity: 'moderate',
              tolerance_threshold: 'strict vegetarian',
              safe_alternatives: [
                'plant-based proteins',
                'legumes',
                'nuts (non-peanut)',
              ],
              enzyme_supplementation: 'not_needed',
            },
          ],
          medical_considerations: [],
        },
        personalization_matrix: {
          skill_profile: {
            current_level: 'intermediate',
            confidence_score: 80,
            growth_trajectory: 'positive',
            recommended_techniques: [
              'quick meal assembly',
              'prep ahead strategies',
            ],
            advancement_timeline: '2-4 months',
          },
          time_analysis: {
            available_time_per_meal: 20,
            time_utilization_efficiency: 85,
            optimization_opportunities: ['prep ahead', 'quick assembly meals'],
            quick_meal_quota: '80%',
          },
          equipment_optimization: {
            utilization_rate: 75,
            underused_tools: ['blender'],
            missing_beneficial_tools: ['food processor', 'rice cooker'],
            technique_adaptations:
              'focus on quick assembly and minimal cooking',
          },
          cultural_preferences: {
            primary_cuisines: ['italian', 'mexican'],
            flavor_profile_affinity: 'mediterranean',
            spice_tolerance_calibration: 2,
            fusion_receptiveness: 'medium',
          },
          ingredient_landscape: {
            embrace_list: ['vegetables', 'legumes', 'grains', 'herbs'],
            avoid_list: ['peanuts', 'anchovies', 'meat'],
            exploration_candidates: [
              'pre-cooked grains',
              'canned beans',
              'frozen vegetables',
            ],
            substitution_success_rate: 90,
          },
        },
        nutritional_analysis: {
          current_status: {
            overall_diet_quality_score: 82,
            nutritional_completeness: 85,
            anti_inflammatory_index: 80,
            gut_health_score: 85,
            metabolic_health_score: 88,
          },
          deficiency_risks: [
            {
              nutrient: 'B12',
              risk_level: 'low',
              current_intake_estimate: '85% of RDA',
              food_sources: [
                'fortified cereals',
                'nutritional yeast',
                'supplements',
              ],
              supplementation_consideration: 'optional',
            },
          ],
          optimization_priorities: [
            {
              priority: 1,
              focus: 'meal prep efficiency',
              impact_score: 90,
              implementation_difficulty: 'moderate',
            },
          ],
        },
        personalized_recommendations: {
          immediate_actions: [
            {
              action: 'Set up weekly meal prep',
              description: 'Dedicate 2 hours on Sunday to prep ingredients',
              expected_benefit: 'Faster weekday meal assembly',
              difficulty: 'moderate',
              resources_provided: ['meal prep guide', 'storage tips'],
            },
          ],
          weekly_structure: {
            meal_framework: {
              breakfast_template: 'Overnight oats or smoothie',
              lunch_template: 'Pre-assembled grain bowl',
              dinner_template: 'Quick stir-fry or pasta',
              snack_strategy: 'Pre-cut vegetables with hummus',
            },
            cuisine_rotation: {
              monday: 'italian',
              tuesday: 'mexican',
              wednesday: 'mediterranean',
              thursday: 'asian',
              friday: 'fusion',
              weekend: 'experimental',
            },
          },
          progressive_challenges: [
            {
              week_1_4: 'Master 3 quick meal templates',
              week_5_8: 'Establish consistent meal prep routine',
              week_9_12: 'Optimize prep time to under 2 hours',
            },
          ],
        },
        meal_suggestions: {
          signature_recipes: [
            {
              name: 'Quick Veggie Stir-Fry',
              prep_time: 15,
              skill_match: 90,
              health_impact_score: 85,
              customization_notes: 'Use pre-cut vegetables',
              allergen_safe: true,
            },
          ],
          quick_options: [
            'Avocado toast',
            'Caprese salad',
            'Hummus wrap',
            'Grain bowl',
          ],
          batch_cooking_priorities: [
            'Cooked grains',
            'Roasted vegetables',
            'Bean salads',
          ],
        },
        progress_tracking: {
          key_metrics: [
            {
              metric: 'Meal prep time',
              baseline: '3 hours per week',
              target: '2 hours per week',
              reassessment: 'monthly',
            },
          ],
          milestone_markers: [
            {
              week_2: 'Consistent meal prep routine',
              week_4: 'Reduced weekday cooking time',
              week_8: 'Optimized prep efficiency',
              week_12: 'Maintained healthy eating with less time',
            },
          ],
        },
        risk_mitigation: {
          adherence_barriers: [
            {
              barrier: 'Time constraints',
              mitigation_strategy: 'Batch cooking on weekends',
              backup_plan: 'Keep healthy frozen meals available',
            },
          ],
          safety_reminders: [
            'Always check labels for peanuts',
            'Carry epinephrine if prescribed',
          ],
        },
        support_resources: {
          education_modules: [
            'Quick meal prep strategies',
            'Time-saving cooking techniques',
          ],
          tools_provided: ['Meal prep template', 'Quick recipe collection'],
          community_connections: [
            'Local meal prep group',
            'Online time-saving tips',
          ],
        },
        next_steps: {
          immediate_72_hours: [
            "Plan next week's meals",
            'Shop for prep ingredients',
          ],
          week_1_goals: [
            'Establish meal prep routine',
            'Try 3 quick meal templates',
          ],
          month_1_objectives: [
            'Optimize prep time',
            'Maintain healthy eating with less time',
          ],
        },
        professional_notes: {
          strengths_observed:
            'Good foundation in vegetarian cooking, open to new techniques',
          growth_opportunities: 'Meal prep efficiency and time management',
          collaboration_recommendations:
            'Consider working with a meal prep coach',
          reassessment_schedule: '3 months',
        },
        report_metadata: {
          confidence_level: 92,
          data_completeness: 90,
          personalization_depth: 'high',
          evidence_base: 'strong',
          last_literature_review: '2025-01-18',
          next_update_recommended: '2025-04-20',
        },
      },
    },
    // Bob's reports
    {
      id: '22222222-2222-2222-2222-222222222221',
      user_email: 'bob@example.com',
      report_id: 'eval_2025_01_18_bob_001',
      evaluation_date: '2025-01-18T09:00:00Z',
      dietitian: 'Dr. Luna Clearwater',
      report_version: '1.0',
      report_data: {
        report_id: 'eval_2025_01_18_bob_001',
        evaluation_date: '2025-01-18T09:00:00Z',
        dietitian: 'Dr. Luna Clearwater',
        report_version: '1.0',
        user_profile_summary: {
          user_id: 'bob_user_id',
          evaluation_completeness: 88,
          data_quality_score: 92,
          last_updated: '2025-01-18T09:00:00Z',
        },
        safety_assessment: {
          status: 'VERIFIED',
          critical_alerts: [],
          dietary_restrictions: [],
          medical_considerations: [],
        },
        personalization_matrix: {
          skill_profile: {
            current_level: 'advanced',
            confidence_score: 85,
            growth_trajectory: 'positive',
            recommended_techniques: ['grilling', 'smoking', 'meal prep'],
            advancement_timeline: '2-4 months',
          },
          time_analysis: {
            available_time_per_meal: 45,
            time_utilization_efficiency: 75,
            optimization_opportunities: ['weekend prep', 'batch cooking'],
            quick_meal_quota: '40%',
          },
          equipment_optimization: {
            utilization_rate: 90,
            underused_tools: [],
            missing_beneficial_tools: ['thermometer', 'meat grinder'],
            technique_adaptations: 'focus on grilling and slow cooking',
          },
          cultural_preferences: {
            primary_cuisines: ['bbq', 'american'],
            flavor_profile_affinity: 'smoky and bold',
            spice_tolerance_calibration: 4,
            fusion_receptiveness: 'low',
          },
          ingredient_landscape: {
            embrace_list: ['meats', 'spices', 'smoking woods', 'bbq sauces'],
            avoid_list: [],
            exploration_candidates: ['exotic spices', 'different wood types'],
            substitution_success_rate: 80,
          },
        },
        nutritional_analysis: {
          current_status: {
            overall_diet_quality_score: 72,
            nutritional_completeness: 75,
            anti_inflammatory_index: 65,
            gut_health_score: 70,
            metabolic_health_score: 78,
          },
          deficiency_risks: [
            {
              nutrient: 'fiber',
              risk_level: 'moderate',
              current_intake_estimate: '70% of RDA',
              food_sources: ['vegetables', 'whole grains', 'legumes'],
              supplementation_consideration: 'optional',
            },
          ],
          optimization_priorities: [
            {
              priority: 1,
              focus: 'vegetable intake',
              impact_score: 80,
              implementation_difficulty: 'moderate',
            },
          ],
        },
        personalized_recommendations: {
          immediate_actions: [
            {
              action: 'Add more vegetables to meals',
              description: 'Include 2-3 servings of vegetables with each meal',
              expected_benefit: 'Improved fiber intake and overall nutrition',
              difficulty: 'moderate',
              resources_provided: [
                'vegetable prep guide',
                'grilling vegetables tips',
              ],
            },
          ],
          weekly_structure: {
            meal_framework: {
              breakfast_template:
                'High-protein breakfast with eggs and vegetables',
              lunch_template: 'Grilled protein with vegetable sides',
              dinner_template:
                'Main protein with roasted vegetables and grains',
              snack_strategy: 'Nuts, fruits, or protein bars',
            },
            cuisine_rotation: {
              monday: 'american',
              tuesday: 'bbq',
              wednesday: 'grilled',
              thursday: 'smoked',
              friday: 'bbq',
              weekend: 'experimental',
            },
          },
          progressive_challenges: [
            {
              week_1_4: 'Add vegetables to every meal',
              week_5_8: 'Master vegetable grilling techniques',
              week_9_12: 'Experiment with different vegetable preparations',
            },
          ],
        },
        meal_suggestions: {
          signature_recipes: [
            {
              name: 'Grilled Chicken with Vegetables',
              prep_time: 30,
              skill_match: 90,
              health_impact_score: 85,
              customization_notes: 'Use seasonal vegetables',
              allergen_safe: true,
            },
          ],
          quick_options: [
            'Grilled chicken breast',
            'BBQ ribs',
            'Smoked brisket',
          ],
          batch_cooking_priorities: [
            'Grilled proteins',
            'Roasted vegetables',
            'BBQ sauces',
          ],
        },
        progress_tracking: {
          key_metrics: [
            {
              metric: 'Daily vegetable servings',
              baseline: '3 servings',
              target: '5 servings',
              reassessment: 'monthly',
            },
          ],
          milestone_markers: [
            {
              week_2: 'Consistent vegetable intake',
              week_4: 'Improved grilling techniques',
              week_8: 'Balanced meal composition',
              week_12: 'Enhanced nutritional profile',
            },
          ],
        },
        risk_mitigation: {
          adherence_barriers: [
            {
              barrier: 'Preference for meat-heavy meals',
              mitigation_strategy: 'Gradually increase vegetable portions',
              backup_plan: 'Use vegetable-based sides and sauces',
            },
          ],
          safety_reminders: [
            'Monitor meat temperatures',
            'Practice safe grilling techniques',
          ],
        },
        support_resources: {
          education_modules: [
            'Grilling vegetables',
            'Balanced nutrition for athletes',
          ],
          tools_provided: [
            'Grilling temperature guide',
            'Vegetable prep techniques',
          ],
          community_connections: [
            'Local BBQ club',
            'Grilling enthusiasts group',
          ],
        },
        next_steps: {
          immediate_72_hours: [
            'Plan vegetable-heavy meals',
            'Shop for fresh vegetables',
          ],
          week_1_goals: [
            'Add vegetables to every meal',
            'Try grilling vegetables',
          ],
          month_1_objectives: [
            'Master vegetable grilling',
            'Improve meal balance',
          ],
        },
        professional_notes: {
          strengths_observed: 'Excellent grilling skills, good protein intake',
          growth_opportunities: 'Vegetable variety and meal balance',
          collaboration_recommendations:
            'Consider working with a sports nutritionist',
          reassessment_schedule: '3 months',
        },
        report_metadata: {
          confidence_level: 90,
          data_completeness: 88,
          personalization_depth: 'high',
          evidence_base: 'strong',
          last_literature_review: '2025-01-16',
          next_update_recommended: '2025-04-18',
        },
      },
    },
  ];

  // Fetch all users once before the loop for better performance
  const { data: userList, error: userListError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

  if (userListError) {
    console.error(
      'Error fetching user list for evaluation reports:',
      userListError
    );
    return;
  }

  for (const report of evaluationReports) {
    // Get user ID for the report from cached user list
    const userMatch = userList.users.find(
      (x) => x.email?.toLowerCase() === report.user_email.toLowerCase()
    );

    if (!userMatch) {
      console.warn(
        `User ${report.user_email} not found for evaluation report ${report.report_id}`
      );
      continue;
    }

    // Insert evaluation report
    const { error } = await admin.from('evaluation_reports').upsert(
      {
        id: report.id,
        user_id: userMatch.id,
        report_id: report.report_id,
        evaluation_date: report.evaluation_date,
        dietitian: report.dietitian,
        report_version: report.report_version,
        report_data: report.report_data,
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error(
        `Error seeding evaluation report ${report.report_id}:`,
        error
      );
    }
  }

  console.log('✅ Evaluation reports seeded successfully.');
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

  // Seed evaluation reports after all users are created
  await seedEvaluationReports();

  console.log('✅ Seed users complete.');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

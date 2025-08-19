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
    region: string | null;
    language: 'en' | 'es' | 'fr' | 'de' | string | null;
    units: 'metric' | 'imperial' | string | null;
    time_per_meal: number | null;
    skill_level: 'beginner' | 'intermediate' | 'advanced' | string | null;
  }>;
  safety?: Partial<{
    allergies: string[];
    dietary_restrictions: string[];
  }>;
  cooking?: Partial<{
    preferred_cuisines: string[];
    available_equipment: string[];
    disliked_ingredients: string[];
    spice_tolerance: number | null;
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
      region: 'US',
      language: 'en',
      units: 'imperial',
      time_per_meal: 25,
      skill_level: 'beginner',
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
      region: 'US',
      language: 'en',
      units: 'imperial',
      time_per_meal: 45,
      skill_level: 'intermediate',
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
      region: 'ES',
      language: 'es',
      units: 'metric',
      time_per_meal: 30,
      skill_level: 'advanced',
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
];

async function ensureUsername(userId: string, username: string) {
  // Use the atomic function defined in migrations
  const { error } = await admin.rpc('claim_username_atomic', {
    p_user_id: userId,
    p_username: username,
  });
  if (error && !String(error.message).includes('user_already_has_username')) {
    throw error;
  }
}

async function updateProfile(userId: string, updates: SeedUser['profile']) {
  if (!updates) return;
  const { error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}

async function upsertSafety(userId: string, safety: SeedUser['safety']) {
  if (!safety) return;
  const { error } = await admin
    .from('user_safety')
    .upsert({ user_id: userId, ...safety }, { onConflict: 'user_id' });
  if (error) throw error;
}

async function upsertCooking(userId: string, cooking: SeedUser['cooking']) {
  if (!cooking) return;
  const { error } = await admin
    .from('cooking_preferences')
    .upsert({ user_id: userId, ...cooking }, { onConflict: 'user_id' });
  if (error) throw error;
}

async function seedRecipes() {
  const recipes = [
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
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
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
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
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
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
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
      is_public: true,
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
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
    },
  ];

  for (const recipe of recipes) {
    // Get user ID for the recipe
    const { data: user } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });
    const userMatch = user.users.find(
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
    await updateProfile(effectiveUserId, u.profile);
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

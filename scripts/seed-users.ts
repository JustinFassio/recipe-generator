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

  console.log('✅ Seed users complete.');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

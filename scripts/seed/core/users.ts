/**
 * Users Seed Script
 * Creates test users with profiles, usernames, and basic auth
 */

import { admin } from '../utils/client';
import { SeedUser, logSuccess, logError } from '../utils/shared';

// Test users data
export const seedUsers: SeedUser[] = [
  {
    email: 'alice@example.com',
    password: 'Password123!',
    fullName: 'Alice Baker',
    username: 'alice',
    profile: {
      bio: 'Home cook exploring quick vegetarian meals.',
      country: 'United States',
      state_province: 'California',
      city: 'San Francisco',
      region: 'San Francisco, California, United States',
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
      country: 'United States',
      state_province: 'Texas',
      city: 'Houston',
      region: 'Houston, Texas, United States',
    },
    safety: {
      allergies: [],
      dietary_restrictions: [],
    },
    cooking: {
      preferred_cuisines: ['american', 'bbq'],
      available_equipment: ['grill', 'smoker', 'cast iron'],
      disliked_ingredients: ['tofu'],
      spice_tolerance: 4,
    },
  },
  {
    email: 'cora@example.com',
    password: 'Password123!',
    fullName: 'Cora Delacroix',
    username: 'cora',
    profile: {
      bio: 'French-inspired home chef with a passion for pastries.',
      country: 'France',
      state_province: 'Île-de-France',
      city: 'Paris',
      region: 'Paris, Île-de-France, France',
    },
    safety: {
      allergies: ['shellfish'],
      dietary_restrictions: [],
    },
    cooking: {
      preferred_cuisines: ['french', 'mediterranean'],
      available_equipment: ['stand mixer', 'pastry tools', 'dutch oven'],
      disliked_ingredients: ['processed foods'],
      spice_tolerance: 2,
    },
  },
  {
    email: 'david@example.com',
    password: 'Password123!',
    fullName: 'David Kim',
    username: 'david',
    profile: {
      bio: 'Korean-American chef sharing family recipes.',
      country: 'United States',
      state_province: 'New York',
      city: 'New York',
      region: 'New York, New York, United States',
    },
    safety: {
      allergies: [],
      dietary_restrictions: [],
    },
    cooking: {
      preferred_cuisines: ['korean', 'asian', 'fusion'],
      available_equipment: ['wok', 'rice cooker', 'steamer'],
      disliked_ingredients: [],
      spice_tolerance: 5,
    },
  },
  {
    email: 'emma@example.com',
    password: 'Password123!',
    fullName: 'Emma Johnson',
    username: 'emma',
    profile: {
      bio: 'Health-conscious mom creating nutritious family meals.',
      country: 'Canada',
      state_province: 'Ontario',
      city: 'Toronto',
      region: 'Toronto, Ontario, Canada',
    },
    safety: {
      allergies: [],
      dietary_restrictions: ['gluten-free'],
    },
    cooking: {
      preferred_cuisines: ['healthy', 'mediterranean', 'whole foods'],
      available_equipment: ['food processor', 'dehydrator', 'juicer'],
      disliked_ingredients: ['artificial sweeteners'],
      spice_tolerance: 3,
    },
  },
  {
    email: 'frank@example.com',
    password: 'Password123!',
    fullName: 'Frank Rodriguez',
    username: 'frank',
    profile: {
      bio: 'Street food enthusiast exploring global flavors.',
      country: 'Mexico',
      state_province: 'Mexico City',
      city: 'Mexico City',
      region: 'Mexico City, Mexico',
    },
    safety: {
      allergies: [],
      dietary_restrictions: [],
    },
    cooking: {
      preferred_cuisines: ['mexican', 'street food', 'latin american'],
      available_equipment: ['comal', 'molcajete', 'pressure cooker'],
      disliked_ingredients: [],
      spice_tolerance: 5,
    },
  },
];

async function ensureUsername(userId: string, username: string) {
  const { error } = await admin
    .from('usernames')
    .upsert({ user_id: userId, username }, { onConflict: 'user_id' });

  if (error) {
    if (
      error.code === '23503' &&
      error.message.includes('foreign key constraint')
    ) {
      logError(
        `Foreign key constraint error for username '${username}': Profile may not exist for user ${userId}. Skipping username assignment.`
      );
    } else {
      logError(
        `Failed to set username '${username}' for user ${userId}:`,
        error
      );
    }
  } else {
    logSuccess(`Username '${username}' set for user ${userId}`);
  }
}

async function createProfile(
  userId: string,
  fullName: string,
  profile: SeedUser['profile'] = {}
) {
  const { error } = await admin.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      ...profile,
    },
    { onConflict: 'id' }
  );

  if (error) {
    logError(`Failed to create profile for user ${userId}:`, error);
    return false;
  }

  logSuccess(`Profile created/updated for user ${userId}`);
  return true;
}

async function upsertSafety(userId: string, safety: SeedUser['safety']) {
  if (!safety) return;

  const { error } = await admin
    .from('user_safety')
    .upsert({ user_id: userId, ...safety }, { onConflict: 'user_id' });

  if (error) {
    logError(`Failed to create safety data for user ${userId}:`, error);
  }
}

async function upsertCooking(userId: string, cooking: SeedUser['cooking']) {
  if (!cooking) return;

  const { error } = await admin
    .from('cooking_preferences')
    .upsert({ user_id: userId, ...cooking }, { onConflict: 'user_id' });

  if (error) {
    logError(`Failed to create cooking preferences for user ${userId}:`, error);
  }
}

/**
 * Main function to seed all users and their related data
 */
export async function seedAllUsers() {
  console.log('🚀 Starting users seed...\n');

  // Clear existing test users to ensure clean state
  console.log('🧹 Clearing existing test users...');
  const { data: existingUsers, error: listError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

  if (!listError && existingUsers?.users) {
    const deletionPromises = [];
    for (const user of existingUsers.users) {
      if (user.email && seedUsers.some((u) => u.email === user.email)) {
        console.log(`🗑️  Deleting existing test user: ${user.email}`);
        deletionPromises.push(admin.auth.admin.deleteUser(user.id));
      }
    }
    // Wait for all deletions to complete
    await Promise.all(deletionPromises);
    console.log('✅ All existing test users deleted');
  }

  for (const u of seedUsers) {
    let effectiveUserId: string = '';

    // Since we cleared all users, we should always create new ones
    console.log(`👤 Creating user: ${u.email}`);
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });

    if (createError) {
      logError(`Failed creating user ${u.email}:`, createError.message);
      continue;
    }

    effectiveUserId = created?.user?.id || '';

    // Ensure we have a valid user ID before proceeding
    if (!effectiveUserId) {
      logError(`Failed to get user ID for ${u.email}`);
      continue;
    }

    // Small delay to ensure user is fully created
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create related data in correct order
    // 1. First create the profile (required for usernames foreign key)
    const profileCreated = await createProfile(
      effectiveUserId,
      u.fullName,
      u.profile || {}
    );

    // 2. Then set the username (only if profile was created successfully)
    if (profileCreated) {
      await ensureUsername(effectiveUserId, u.username);
    } else {
      logError(
        `Skipping username assignment for ${u.email} due to profile creation failure`
      );
    }

    // 3. Finally create preferences (can be done in any order)
    await upsertSafety(effectiveUserId, u.safety);
    await upsertCooking(effectiveUserId, u.cooking);
  }

  logSuccess('Users seed completed successfully!');
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAllUsers().catch((err) => {
    logError('Users seeding failed:', err);
    process.exit(1);
  });
}

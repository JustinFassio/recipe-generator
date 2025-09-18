/**
 * Recipe Ratings Seed Script
 * Creates community ratings and updates creator ratings for recipes
 */

import { admin } from '../utils/client';
import {
  logSuccess,
  logError,
  logInfo,
  findUserByEmail,
} from '../utils/shared';

// Creator ratings for recipes (1-5 stars)
const creatorRatings = [
  { recipeId: '11111111-1111-1111-1111-111111111111', rating: 4 }, // Avocado Toast - Alice
  { recipeId: '11111111-1111-1111-1111-111111111112', rating: 5 }, // Caprese Salad - Alice
  { recipeId: '11111111-1111-1111-1111-111111111113', rating: 4 }, // Quick Pasta - Alice
  { recipeId: '11111111-1111-1111-1111-111111111114', rating: 4 }, // Veggie Stir Fry - Alice
  { recipeId: '22222222-2222-2222-2222-222222222221', rating: 5 }, // Caesar Salad - Bob
];

// Community ratings (users rating other users' recipes)
const communityRatings = [
  // Alice's Avocado Toast ratings
  {
    recipeId: '11111111-1111-1111-1111-111111111111',
    userEmail: 'bob@example.com',
    rating: 4,
  },
  {
    recipeId: '11111111-1111-1111-1111-111111111111',
    userEmail: 'cora@example.com',
    rating: 5,
  },
  {
    recipeId: '11111111-1111-1111-1111-111111111111',
    userEmail: 'david@example.com',
    rating: 4,
  },
  {
    recipeId: '11111111-1111-1111-1111-111111111111',
    userEmail: 'emma@example.com',
    rating: 5,
  },

  // Alice's Caprese Salad ratings (private recipe, fewer ratings)
  {
    recipeId: '11111111-1111-1111-1111-111111111112',
    userEmail: 'cora@example.com',
    rating: 5,
  },
  {
    recipeId: '11111111-1111-1111-1111-111111111112',
    userEmail: 'emma@example.com',
    rating: 4,
  },

  // Alice's Quick Pasta ratings
  {
    recipeId: '11111111-1111-1111-1111-111111111113',
    userEmail: 'bob@example.com',
    rating: 3,
  },
  {
    recipeId: '11111111-1111-1111-1111-111111111113',
    userEmail: 'david@example.com',
    rating: 4,
  },
  {
    recipeId: '11111111-1111-1111-1111-111111111113',
    userEmail: 'frank@example.com',
    rating: 4,
  },

  // Alice's Veggie Stir Fry ratings
  {
    recipeId: '11111111-1111-1111-1111-111111111114',
    userEmail: 'david@example.com',
    rating: 5,
  },
  {
    recipeId: '11111111-1111-1111-1111-111111111114',
    userEmail: 'emma@example.com',
    rating: 5,
  },
  {
    recipeId: '11111111-1111-1111-1111-111111111114',
    userEmail: 'frank@example.com',
    rating: 4,
  },

  // Bob's Caesar Salad ratings (public recipe, more ratings)
  {
    recipeId: '22222222-2222-2222-2222-222222222221',
    userEmail: 'alice@example.com',
    rating: 4,
  },
  {
    recipeId: '22222222-2222-2222-2222-222222222221',
    userEmail: 'cora@example.com',
    rating: 5,
  },
  {
    recipeId: '22222222-2222-2222-2222-222222222221',
    userEmail: 'david@example.com',
    rating: 4,
  },
  {
    recipeId: '22222222-2222-2222-2222-222222222221',
    userEmail: 'emma@example.com',
    rating: 3,
  },
  {
    recipeId: '22222222-2222-2222-2222-222222222221',
    userEmail: 'frank@example.com',
    rating: 4,
  },
];

/**
 * Update creator ratings for recipes
 */
async function updateCreatorRatings() {
  logInfo('Updating creator ratings...');
  let updatedCount = 0;

  for (const rating of creatorRatings) {
    const { error } = await admin
      .from('recipes')
      .update({ creator_rating: rating.rating })
      .eq('id', rating.recipeId);

    if (error) {
      logError(
        `Error updating creator rating for recipe ${rating.recipeId}:`,
        error
      );
    } else {
      updatedCount++;
    }
  }

  logInfo(`  ✓ Updated ${updatedCount} creator ratings`);
}

/**
 * Add community ratings for recipes
 */
async function addCommunityRatings() {
  logInfo('Adding community ratings...');

  // Get all users for email lookup
  const { data: userList, error: userError } =
    await admin.auth.admin.listUsers();
  if (userError) {
    logError('Error fetching user list for ratings:', userError);
    return;
  }

  let insertedCount = 0;

  for (const rating of communityRatings) {
    // Find the user
    const user = findUserByEmail(userList.users, rating.userEmail);
    if (!user) {
      logError(`User not found for rating: ${rating.userEmail}`);
      continue;
    }

    // Insert community rating
    const { error } = await admin.from('recipe_ratings').upsert(
      {
        recipe_id: rating.recipeId,
        user_id: user.id,
        rating: rating.rating,
      },
      { onConflict: 'recipe_id,user_id' }
    );

    if (error) {
      logError(
        `Error inserting rating for recipe ${rating.recipeId} by ${rating.userEmail}:`,
        error
      );
    } else {
      insertedCount++;
    }
  }

  logInfo(`  ✓ Added ${insertedCount} community ratings`);
}

/**
 * Main function to seed all ratings
 */
export async function seedRecipeRatings() {
  console.log('🚀 Starting recipe ratings seed...\n');

  await updateCreatorRatings();
  await addCommunityRatings();

  // Calculate some statistics
  const { data: ratingsStats } = await admin
    .from('recipe_ratings')
    .select('recipe_id')
    .then((result) => ({ data: result.data?.length || 0 }));

  const { data: recipesWithRatings } = await admin
    .from('recipes')
    .select('id')
    .not('creator_rating', 'is', null)
    .then((result) => ({ data: result.data?.length || 0 }));

  logSuccess('Recipe ratings seed completed!');
  logInfo(`  • Creator ratings: ${recipesWithRatings} recipes`);
  logInfo(`  • Community ratings: ${ratingsStats} total ratings`);
  logInfo(`  • Rating range: 1-5 stars`);
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedRecipeRatings().catch((err) => {
    logError('Recipe ratings seeding failed:', err);
    process.exit(1);
  });
}

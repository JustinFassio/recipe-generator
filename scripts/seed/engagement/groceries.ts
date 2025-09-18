/**
 * User Groceries Seed Script
 * Creates realistic grocery lists for users to test ingredient matching
 */

import { admin } from '../utils/client';
import { logSuccess, logError, logInfo, findUserByEmail } from '../utils/shared';

// User grocery data based on their preferences
const userGroceriesData = [
  {
    email: 'alice@example.com', // Vegetarian, Italian/Mexican preferences
    groceries: {
      proteins: ['tofu', 'black beans', 'lentils', 'eggs', 'quinoa', 'chickpeas'],
      vegetables: ['spinach', 'bell peppers', 'onions', 'garlic', 'tomatoes', 'zucchini', 'carrots', 'broccoli'],
      fruits: ['avocados', 'lemons', 'limes', 'apples', 'bananas'],
      dairy: ['mozzarella', 'parmesan', 'greek yogurt', 'milk', 'butter'],
      pantry: ['olive oil', 'pasta', 'rice', 'bread', 'oats', 'balsamic vinegar', 'honey'],
      spices: ['basil', 'oregano', 'cumin', 'paprika', 'garlic powder']
    }
  },
  {
    email: 'bob@example.com', // Grill enthusiast, American/BBQ preferences
    groceries: {
      proteins: ['chicken breast', 'ground beef', 'salmon', 'pork ribs', 'steak', 'eggs'],
      vegetables: ['onions', 'bell peppers', 'mushrooms', 'corn', 'potatoes', 'garlic'],
      fruits: ['lemons', 'apples', 'pineapple'],
      dairy: ['cheese', 'butter', 'sour cream', 'milk'],
      pantry: ['olive oil', 'bbq sauce', 'ketchup', 'mustard', 'bread', 'rice'],
      spices: ['black pepper', 'paprika', 'chili powder', 'garlic powder', 'onion powder', 'cumin']
    }
  },
  {
    email: 'cora@example.com', // French-inspired, pastry focus
    groceries: {
      proteins: ['eggs', 'chicken', 'salmon', 'cheese'],
      vegetables: ['shallots', 'garlic', 'mushrooms', 'leeks', 'carrots', 'herbs'],
      fruits: ['lemons', 'apples', 'pears', 'berries'],
      dairy: ['butter', 'heavy cream', 'brie', 'camembert', 'milk', 'yogurt'],
      pantry: ['flour', 'sugar', 'olive oil', 'wine vinegar', 'honey', 'bread', 'pasta'],
      spices: ['thyme', 'rosemary', 'herbes de provence', 'vanilla', 'cinnamon', 'nutmeg']
    }
  },
  {
    email: 'david@example.com', // Korean-American, Asian/Fusion preferences
    groceries: {
      proteins: ['tofu', 'chicken', 'pork', 'beef', 'eggs', 'fish'],
      vegetables: ['bok choy', 'napa cabbage', 'scallions', 'garlic', 'ginger', 'mushrooms', 'onions'],
      fruits: ['asian pears', 'apples', 'oranges'],
      dairy: ['eggs', 'milk'],
      pantry: ['soy sauce', 'sesame oil', 'rice', 'rice vinegar', 'miso paste', 'gochujang'],
      spices: ['ginger', 'garlic', 'sesame seeds', 'red pepper flakes', 'five spice']
    }
  },
  {
    email: 'emma@example.com', // Health-conscious, gluten-free
    groceries: {
      proteins: ['quinoa', 'lentils', 'chickpeas', 'salmon', 'chicken', 'eggs', 'nuts'],
      vegetables: ['kale', 'spinach', 'sweet potatoes', 'broccoli', 'carrots', 'bell peppers', 'zucchini'],
      fruits: ['berries', 'apples', 'bananas', 'avocados', 'lemons'],
      dairy: ['greek yogurt', 'almond milk', 'coconut milk'],
      pantry: ['gluten-free oats', 'quinoa', 'brown rice', 'olive oil', 'coconut oil', 'honey', 'almond flour'],
      spices: ['turmeric', 'ginger', 'cinnamon', 'cumin', 'paprika']
    }
  },
  {
    email: 'frank@example.com', // Street food, Mexican/Latin preferences
    groceries: {
      proteins: ['ground beef', 'chicken', 'pork', 'black beans', 'eggs'],
      vegetables: ['onions', 'tomatoes', 'jalapeños', 'cilantro', 'lime', 'avocados', 'bell peppers'],
      fruits: ['limes', 'lemons', 'oranges', 'pineapple'],
      dairy: ['queso fresco', 'monterey jack', 'sour cream', 'milk'],
      pantry: ['corn tortillas', 'flour tortillas', 'rice', 'beans', 'hot sauce', 'cumin', 'chili powder'],
      spices: ['cumin', 'chili powder', 'paprika', 'oregano', 'garlic powder', 'cayenne']
    }
  }
];

/**
 * Main function to seed user groceries
 */
export async function seedUserGroceries() {
  console.log('🚀 Starting user groceries seed...\n');

  // Get all users
  const { data: userList, error: userError } = await admin.auth.admin.listUsers();
  if (userError) {
    logError('Error fetching user list for groceries:', userError);
    return;
  }

  let processedCount = 0;

  for (const userGrocery of userGroceriesData) {
    // Find the user
    const user = findUserByEmail(userList.users, userGrocery.email);
    if (!user) {
      logError(`User not found for groceries: ${userGrocery.email}`);
      continue;
    }

    // Insert/update user groceries
    const { error } = await admin.from('user_groceries').upsert(
      {
        user_id: user.id,
        groceries: userGrocery.groceries,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      logError(`Error seeding groceries for ${userGrocery.email}:`, error);
    } else {
      processedCount++;
      const totalItems = Object.values(userGrocery.groceries).flat().length;
      logInfo(`  ✓ ${userGrocery.email}: ${totalItems} grocery items`);
    }
  }

  logSuccess(`User groceries seed completed!`);
  logInfo(`  • Processed: ${processedCount} users`);
  logInfo(`  • Total categories: proteins, vegetables, fruits, dairy, pantry, spices`);
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUserGroceries().catch((err) => {
    logError('User groceries seeding failed:', err);
    process.exit(1);
  });
}

/**
 * Recipes Seed Script
 * Creates test recipes with categories and automatic Version 0 creation
 */

import { admin } from '../utils/client';
import {
  SeedRecipe,
  logSuccess,
  logError,
  findUserByEmail,
  MAX_CATEGORIES_PER_RECIPE,
} from '../utils/shared';

// Test recipes data - extracted from monolithic seed script
export const seedRecipesData: SeedRecipe[] = [
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
      'Technique: No-Cook',
      'Collection: Classic',
      'Occasion: Dinner Party',
    ],
  },

  // Bob's additional recipes
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Grilled Chicken Breast',
    ingredients: [
      'chicken breast',
      'olive oil',
      'salt',
      'black pepper',
      'garlic powder',
    ],
    instructions:
      'Season chicken with salt, pepper, and garlic powder. Grill over medium heat for 6-7 minutes per side.',
    notes: 'Perfect for meal prep.',
    image_url: 'https://picsum.photos/seed/grilled_chicken/800/600',
    user_email: 'bob@example.com',
    is_public: true,
    categories: [
      'Course: Main',
      'Collection: High-Protein',
      'Collection: Lean Protein',
      'Technique: Grill',
      'Occasion: Weeknight',
      'Dietary: Low-Carb',
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
      'Season ribs with brown sugar, paprika, and garlic powder. Smoke for 4-6 hours, then glaze with BBQ sauce.',
    notes: 'Low and slow is the way to go.',
    image_url: 'https://picsum.photos/seed/bbq_ribs/800/600',
    user_email: 'bob@example.com',
    is_public: true,
    categories: [
      'Course: Main',
      'Cuisine: BBQ',
      'Collection: Meat Lover',
      'Technique: Smoke',
      'Occasion: Weekend',
      'Time: Over 4 Hours',
    ],
  },

  // Cora's recipes
  {
    id: '33333333-3333-3333-3333-333333333331',
    title: 'Spanish Paella',
    ingredients: [
      'rice',
      'chicken thighs',
      'shrimp',
      'saffron',
      'bell peppers',
      'onions',
    ],
    instructions:
      'Sauté chicken and vegetables. Add rice and saffron. Add broth and cook until rice is tender. Add shrimp at the end.',
    notes: 'Traditional Spanish comfort food.',
    image_url: 'https://picsum.photos/seed/paella/800/600',
    user_email: 'cora@example.com',
    is_public: true,
    categories: [
      'Course: Main',
      'Cuisine: Spanish',
      'Collection: Seafood',
      'Technique: Simmer',
      'Occasion: Weekend',
      'Time: 1-2 Hours',
    ],
  },
  {
    id: '33333333-3333-3333-3333-333333333332',
    title: 'Thai Green Curry',
    ingredients: [
      'coconut milk',
      'green curry paste',
      'chicken',
      'bell peppers',
      'basil',
      'fish sauce',
    ],
    instructions:
      'Sauté curry paste in coconut milk. Add chicken and vegetables. Simmer until cooked through. Finish with basil.',
    notes: 'Adjust spice level to taste.',
    image_url: 'https://picsum.photos/seed/thai_curry/800/600',
    user_email: 'cora@example.com',
    is_public: false,
    categories: [
      'Course: Main',
      'Cuisine: Thai',
      'Collection: Spicy',
      'Technique: Simmer',
      'Occasion: Weeknight',
      'Dietary: Gluten-Free',
    ],
  },

  // David's recipes
  {
    id: '44444444-4444-4444-4444-444444444441',
    title: 'French Macarons',
    ingredients: [
      'almond flour',
      'powdered sugar',
      'egg whites',
      'granulated sugar',
      'food coloring',
    ],
    instructions:
      'Make meringue with egg whites and sugar. Fold in almond flour and powdered sugar. Pipe and bake.',
    notes: 'Patience is key for perfect macarons.',
    image_url: 'https://picsum.photos/seed/macarons/800/600',
    user_email: 'david@example.com',
    is_public: true,
    categories: [
      'Course: Dessert',
      'Cuisine: French',
      'Collection: Sweet Treats',
      'Technique: Bake',
      'Occasion: Special Occasion',
      'Time: 1-2 Hours',
    ],
  },
  {
    id: '44444444-4444-4444-4444-444444444442',
    title: 'Gluten-Free Bread',
    ingredients: [
      'gluten-free flour',
      'xanthan gum',
      'yeast',
      'water',
      'olive oil',
      'salt',
    ],
    instructions:
      'Mix dry ingredients. Add wet ingredients and knead. Let rise, then bake until golden.',
    notes: 'Great for sandwiches and toast.',
    image_url: 'https://picsum.photos/seed/gf_bread/800/600',
    user_email: 'david@example.com',
    is_public: true,
    categories: [
      'Course: Side',
      'Collection: Gluten-Free',
      'Collection: Homemade',
      'Technique: Bake',
      'Occasion: Any',
      'Dietary: Gluten-Free',
    ],
  },

  // Emma's recipes
  {
    id: '55555555-5555-5555-5555-555555555551',
    title: 'Greek Yogurt Bowl',
    ingredients: ['greek yogurt', 'berries', 'honey', 'granola', 'chia seeds'],
    instructions:
      'Scoop yogurt into bowl. Top with berries, granola, and chia seeds. Drizzle with honey.',
    notes: 'Perfect post-workout breakfast.',
    image_url: 'https://picsum.photos/seed/yogurt_bowl/800/600',
    user_email: 'emma@example.com',
    is_public: true,
    categories: [
      'Course: Breakfast',
      'Cuisine: Greek',
      'Collection: High-Protein',
      'Collection: Healthy',
      'Technique: No-Cook',
      'Occasion: Morning',
    ],
  },
  {
    id: '55555555-5555-5555-5555-555555555552',
    title: 'Air Fryer Salmon',
    ingredients: [
      'salmon fillets',
      'olive oil',
      'lemon',
      'dill',
      'salt',
      'black pepper',
    ],
    instructions:
      'Season salmon with salt, pepper, and dill. Air fry at 400°F for 8-10 minutes. Serve with lemon.',
    notes: 'Quick and healthy weeknight dinner.',
    image_url: 'https://picsum.photos/seed/air_fryer_salmon/800/600',
    user_email: 'emma@example.com',
    is_public: true,
    categories: [
      'Course: Main',
      'Collection: High-Protein',
      'Collection: Healthy',
      'Technique: Air Fryer',
      'Occasion: Weeknight',
      'Dietary: Low-Carb',
    ],
  },

  // Frank's recipes
  {
    id: '66666666-6666-6666-6666-666666666661',
    title: 'Spicy Tacos',
    ingredients: [
      'ground beef',
      'taco seasoning',
      'jalapeños',
      'onions',
      'cilantro',
      'lime',
    ],
    instructions:
      'Brown ground beef with onions. Add taco seasoning. Serve in tortillas with jalapeños, cilantro, and lime.',
    notes: 'Add more jalapeños for extra heat.',
    image_url: 'https://picsum.photos/seed/spicy_tacos/800/600',
    user_email: 'frank@example.com',
    is_public: true,
    categories: [
      'Course: Main',
      'Cuisine: Mexican',
      'Collection: Spicy',
      'Collection: Street Food',
      'Technique: Sauté',
      'Occasion: Weeknight',
    ],
  },
  {
    id: '66666666-6666-6666-6666-666666666662',
    title: 'Korean BBQ',
    ingredients: [
      'beef short ribs',
      'soy sauce',
      'brown sugar',
      'garlic',
      'ginger',
      'sesame oil',
    ],
    instructions:
      'Marinate beef in soy sauce, brown sugar, garlic, ginger, and sesame oil. Grill until caramelized.',
    notes: 'Serve with rice and kimchi.',
    image_url: 'https://picsum.photos/seed/korean_bbq/800/600',
    user_email: 'frank@example.com',
    is_public: true,
    categories: [
      'Course: Main',
      'Cuisine: Korean',
      'Collection: BBQ',
      'Collection: Meat Lover',
      'Technique: Grill',
      'Occasion: Weekend',
    ],
  },
];

/**
 * Main function to seed all recipes with Version 0 creation
 */
export async function seedAllRecipes() {
  console.log('🚀 Starting recipes seed...\n');

  // Fetch all users once for better performance
  const { data: userList, error: userListError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

  if (userListError) {
    logError('Error fetching user list:', userListError);
    return;
  }

  for (const recipe of seedRecipesData) {
    // Find the user for this recipe
    const userMatch = findUserByEmail(userList.users, recipe.user_email);
    if (!userMatch) {
      logError(
        `User not found for recipe ${recipe.title}: ${recipe.user_email}`
      );
      continue;
    }

    // Add default mood if categories are provided but no mood exists
    let moodAugmented = recipe.categories || [];
    if (recipe.categories && recipe.categories.length > 0) {
      const existing = recipe.categories as string[];
      const hasMood = existing.some((cat) => cat.startsWith('Mood:'));

      if (!hasMood) {
        const moodGuesses: string[] = [];
        // Add mood guessing logic here if needed
        moodAugmented = Array.from(
          new Set([
            ...existing,
            ...moodGuesses.slice(
              0,
              MAX_CATEGORIES_PER_RECIPE - existing.length
            ),
          ])
        );
      }
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
      logError(`Error seeding recipe ${recipe.title}:`, error);
      continue;
    }

    // 🎯 CRITICAL: Create Version 0 (Original Recipe) for each seeded recipe
    const { error: versionError } = await admin
      .from('recipe_content_versions')
      .upsert(
        {
          recipe_id: recipe.id,
          version_number: 0,
          version_name: 'Original Recipe',
          changelog: 'Initial recipe version',
          title: recipe.title,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          notes: recipe.notes,
          setup: recipe.setup || null,
          categories: moodAugmented,
          cooking_time: null,
          difficulty: null,
          creator_rating: null,
          image_url: recipe.image_url,
          created_by: userMatch.id,
          is_published: true, // Original is always published
        },
        { onConflict: 'recipe_id,version_number' }
      );

    if (versionError) {
      logError(`Error creating Version 0 for ${recipe.title}:`, versionError);
    }
  }

  logSuccess('Recipes seed completed successfully!');
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAllRecipes().catch((err) => {
    logError('Recipes seeding failed:', err);
    process.exit(1);
  });
}

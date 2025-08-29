import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

const testRecipes = [
  {
    title: 'Quick Pasta Carbonara',
    ingredients: [
      'spaghetti',
      'eggs',
      'bacon',
      'parmesan cheese',
      'black pepper',
    ],
    instructions:
      'Cook pasta, fry bacon, mix eggs with cheese, combine all ingredients.',
    notes: "A classic Italian dish that's quick to make.",
    categories: ['Italian', 'Pasta', 'Quick Meals'],
    cooking_time: 'quick',
    difficulty: 'beginner',
    is_public: true,
  },
  {
    title: 'Advanced Beef Wellington',
    ingredients: [
      'beef tenderloin',
      'puff pastry',
      'mushrooms',
      'prosciutto',
      'dijon mustard',
    ],
    instructions:
      'Sear beef, prepare mushroom duxelles, wrap in prosciutto and pastry, bake.',
    notes: 'A challenging but impressive dish for special occasions.',
    categories: ['French', 'Beef', 'Special Occasions'],
    cooking_time: 'long',
    difficulty: 'advanced',
    is_public: true,
  },
  {
    title: 'Medium Spice Chicken Curry',
    ingredients: [
      'chicken breast',
      'coconut milk',
      'curry powder',
      'onions',
      'rice',
    ],
    instructions:
      'Cook chicken, sauté onions, add spices and coconut milk, simmer.',
    notes: 'A flavorful curry with moderate spice level.',
    categories: ['Indian', 'Chicken', 'Curry'],
    cooking_time: 'medium',
    difficulty: 'intermediate',
    is_public: true,
  },
  {
    title: 'Simple Greek Salad',
    ingredients: ['cucumber', 'tomatoes', 'olives', 'feta cheese', 'olive oil'],
    instructions:
      'Chop vegetables, combine with cheese and olives, drizzle with olive oil.',
    notes: 'A refreshing and healthy salad.',
    categories: ['Greek', 'Salad', 'Vegetarian'],
    cooking_time: 'quick',
    difficulty: 'beginner',
    is_public: true,
  },
  {
    title: 'Complex Sushi Roll',
    ingredients: ['sushi rice', 'nori', 'salmon', 'avocado', 'cucumber'],
    instructions:
      'Prepare rice, lay out nori, add rice and fillings, roll tightly.',
    notes: 'Requires practice to perfect the rolling technique.',
    categories: ['Japanese', 'Seafood', 'Sushi'],
    cooking_time: 'medium',
    difficulty: 'advanced',
    is_public: true,
  },
];

async function createTestRecipes() {
  console.log('Creating test recipes...');

  // First, let's get a user ID (we'll use the first user or create one)
  const { data: users, error: userError } =
    await supabase.auth.admin.listUsers();

  if (userError || !users.users.length) {
    console.error('No users found. Please create a user first.');
    return;
  }

  const userId = users.users[0].id;
  console.log(`Using user ID: ${userId}`);

  for (const recipe of testRecipes) {
    try {
      const { data, error } = await supabase.from('recipes').insert({
        ...recipe,
        user_id: userId,
      });

      if (error) {
        console.error(`Error creating recipe "${recipe.title}":`, error);
      } else {
        console.log(`✅ Created recipe: ${recipe.title}`);
      }
    } catch (error) {
      console.error(`Error creating recipe "${recipe.title}":`, error);
    }
  }

  console.log('Finished creating test recipes!');
}

createTestRecipes().catch(console.error);

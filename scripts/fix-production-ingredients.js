/*
 * Emergency Production Ingredients Sync
 * Populates production with Chef Isabella's system catalog
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://sxvdkipywmjycithdfpp.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Chef Isabella's System Catalog (simplified for quick sync)
const SYSTEM_CATALOG = {
  proteins: [
    'Chicken Breast',
    'Chicken Thighs',
    'Ground Beef',
    'Ground Turkey',
    'Salmon Fillets',
    'Tuna Steaks',
    'Cod Fillets',
    'Shrimp',
    'Scallops',
    'Eggs',
    'Egg Whites',
    'Greek Yogurt',
    'Cottage Cheese',
    'Tofu',
    'Tempeh',
    'Black Beans',
    'Kidney Beans',
    'Chickpeas',
    'Lentils',
    'Quinoa',
    'Hemp Seeds',
    'Chia Seeds',
    'Almonds',
    'Walnuts',
    'Peanut Butter',
    'Almond Butter',
    'Protein Powder',
    'Turkey Breast',
    'Ham',
    'Bacon',
    'Sausage',
    'Ground Pork',
    'Pork Chops',
    'Beef Steak',
    'Ground Lamb',
    'Canned Tuna',
    'Smoked Salmon',
    'Sardines',
    'Anchovies',
    'Mussels',
    'Crab',
    'Lobster',
    'Duck',
    'Venison',
    'Bison',
  ],
  fresh_produce: [
    'Onions',
    'Garlic',
    'Carrots',
    'Celery',
    'Bell Peppers',
    'Tomatoes',
    'Cucumbers',
    'Spinach',
    'Kale',
    'Lettuce',
    'Arugula',
    'Broccoli',
    'Cauliflower',
    'Zucchini',
    'Yellow Squash',
    'Eggplant',
    'Mushrooms',
    'Potatoes',
    'Sweet Potatoes',
    'Avocados',
    'Lemons',
    'Limes',
    'Oranges',
    'Apples',
    'Bananas',
    'Berries',
    'Grapes',
    'Basil',
    'Cilantro',
    'Parsley',
    'Mint',
    'Rosemary',
    'Thyme',
    'Oregano',
    'Sage',
    'Dill',
    'Green Onions',
    'Shallots',
    'Ginger',
    'Jalapeños',
    'Serrano Peppers',
    'Habaneros',
    'Cherry Tomatoes',
    'Roma Tomatoes',
    'Beefsteak Tomatoes',
    'Grape Tomatoes',
  ],
  flavor_builders: [
    'Salt',
    'Black Pepper',
    'White Pepper',
    'Garlic Powder',
    'Onion Powder',
    'Paprika',
    'Cumin',
    'Chili Powder',
    'Cayenne Pepper',
    'Oregano',
    'Thyme',
    'Rosemary',
    'Basil',
    'Bay Leaves',
    'Cinnamon',
    'Nutmeg',
    'Allspice',
    'Cloves',
    'Cardamom',
    'Coriander',
    'Turmeric',
    'Ginger Powder',
    'Mustard Seed',
    'Fennel Seeds',
    'Sesame Seeds',
    'Poppy Seeds',
    'Vanilla Extract',
    'Almond Extract',
    'Lemon Extract',
    'Hot Sauce',
    'Worcestershire Sauce',
    'Soy Sauce',
    'Fish Sauce',
    'Oyster Sauce',
    'Hoisin Sauce',
    'Sriracha',
    'Tabasco',
    'Red Pepper Flakes',
    'Italian Seasoning',
    'Herbs de Provence',
    'Old Bay Seasoning',
    'Taco Seasoning',
    'Curry Powder',
    'Garam Masala',
    'Chinese Five Spice',
  ],
  cooking_essentials: [
    'Olive Oil',
    'Extra Virgin Olive Oil',
    'Vegetable Oil',
    'Canola Oil',
    'Coconut Oil',
    'Sesame Oil',
    'Butter',
    'Unsalted Butter',
    'Salted Butter',
    'Margarine',
    'Ghee',
    'Chicken Stock',
    'Chicken Broth',
    'Vegetable Stock',
    'Vegetable Broth',
    'Beef Stock',
    'Beef Broth',
    'Bone Broth',
    'White Wine Vinegar',
    'Apple Cider Vinegar',
    'Balsamic Vinegar',
    'Red Wine Vinegar',
    'Rice Vinegar',
    'Lemon Juice',
    'Lime Juice',
    'Cooking Wine',
    'White Wine',
    'Red Wine',
    'Sherry',
    'Mirin',
    'Sake',
  ],
  bakery_grains: [
    'All-Purpose Flour',
    'Bread Flour',
    'Whole Wheat Flour',
    'Self-Rising Flour',
    'Almond Flour',
    'Coconut Flour',
    'Rice',
    'Brown Rice',
    'Wild Rice',
    'Jasmine Rice',
    'Basmati Rice',
    'Arborio Rice',
    'Quinoa',
    'Barley',
    'Bulgur',
    'Couscous',
    'Farro',
    'Oats',
    'Steel Cut Oats',
    'Rolled Oats',
    'Instant Oats',
    'Pasta',
    'Spaghetti',
    'Penne',
    'Fusilli',
    'Linguine',
    'Fettuccine',
    'Angel Hair',
    'Lasagna Sheets',
    'Bread',
    'Whole Wheat Bread',
    'Sourdough Bread',
    'Bagels',
    'English Muffins',
    'Tortillas',
    'Corn Tortillas',
    'Flour Tortillas',
    'Pita Bread',
    'Naan',
  ],
  dairy_cold: [
    'Milk',
    'Whole Milk',
    '2% Milk',
    '1% Milk',
    'Skim Milk',
    'Almond Milk',
    'Soy Milk',
    'Oat Milk',
    'Coconut Milk',
    'Heavy Cream',
    'Half and Half',
    'Sour Cream',
    'Greek Yogurt',
    'Regular Yogurt',
    'Cottage Cheese',
    'Ricotta Cheese',
    'Cream Cheese',
    'Cheddar Cheese',
    'Mozzarella Cheese',
    'Parmesan Cheese',
    'Swiss Cheese',
    'Goat Cheese',
    'Feta Cheese',
    'Blue Cheese',
    'Brie Cheese',
    'Camembert Cheese',
    'Gouda Cheese',
    'Provolone Cheese',
    'Monterey Jack Cheese',
    'Pepper Jack Cheese',
    'String Cheese',
    'Shredded Cheese',
    'Sliced Cheese',
  ],
  pantry_staples: [
    'Sugar',
    'Brown Sugar',
    'Powdered Sugar',
    'Honey',
    'Maple Syrup',
    'Agave Nectar',
    'Baking Powder',
    'Baking Soda',
    'Active Dry Yeast',
    'Instant Yeast',
    'Cornstarch',
    'Arrowroot Powder',
    'Cocoa Powder',
    'Dark Chocolate',
    'Milk Chocolate',
    'White Chocolate',
    'Chocolate Chips',
    'Vanilla Extract',
    'Almond Extract',
    'Coconut Extract',
    'Canned Tomatoes',
    'Tomato Paste',
    'Tomato Sauce',
    'Coconut Milk',
    'Evaporated Milk',
    'Condensed Milk',
    'Peanut Butter',
    'Almond Butter',
    'Tahini',
    'Jam',
    'Jelly',
    'Preserves',
    'Pickles',
    'Olives',
    'Capers',
    'Sun-Dried Tomatoes',
  ],
  frozen: [
    'Frozen Vegetables',
    'Frozen Peas',
    'Frozen Corn',
    'Frozen Broccoli',
    'Frozen Spinach',
    'Frozen Berries',
    'Frozen Strawberries',
    'Frozen Blueberries',
    'Frozen Raspberries',
    'Frozen Mango',
    'Frozen Pineapple',
    'Ice Cream',
    'Frozen Yogurt',
    'Sorbet',
    'Frozen Pizza',
    'Frozen Chicken',
    'Frozen Fish',
    'Frozen Shrimp',
    'Frozen Fries',
  ],
};

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function syncIngredients() {
  console.log('🍽️  Emergency Chef Isabella System Ingredients Sync');
  console.log('📚 Populating production with full catalog...');
  console.log('');

  let insertedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let errorCount = 0;

  for (const [category, ingredients] of Object.entries(SYSTEM_CATALOG)) {
    console.log(`\n📂 Processing ${category} (${ingredients.length} items)...`);

    for (const name of ingredients) {
      try {
        const normalized_name = normalizeName(name);

        // Check if ingredient exists
        const { data: existing, error: fetchError } = await supabase
          .from('global_ingredients')
          .select('id, is_system, category, name')
          .eq('normalized_name', normalized_name)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!existing) {
          // Insert new ingredient
          const { error: insertError } = await supabase
            .from('global_ingredients')
            .insert({
              name,
              normalized_name,
              category,
              synonyms: [],
              usage_count: 5,
              is_verified: true,
              is_system: true,
            });

          if (insertError) throw insertError;
          insertedCount++;
          console.log(`  ➕ ${name}`);
        } else {
          // Update existing to ensure it's marked as system
          if (
            !existing.is_system ||
            existing.category !== category ||
            existing.name !== name
          ) {
            const { error: updateError } = await supabase
              .from('global_ingredients')
              .update({ is_system: true, category, name })
              .eq('id', existing.id);

            if (updateError) throw updateError;
            updatedCount++;
            console.log(`  ♻️  ${name}`);
          } else {
            unchangedCount++;
          }
        }
      } catch (error) {
        console.error(`  ❌ Failed: ${name}`, error.message);
        errorCount++;
      }
    }
  }

  console.log('\n🎉 Emergency Sync Complete!');
  console.log(`  ➕ Inserted: ${insertedCount}`);
  console.log(`  ♻️  Updated: ${updatedCount}`);
  console.log(`  ✅ Unchanged: ${unchangedCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);

  // Verify final count
  const { data: finalCount } = await supabase
    .from('global_ingredients')
    .select('id', { count: 'exact' });

  console.log(
    `\n📊 Total ingredients in production: ${finalCount?.length || 'unknown'}`
  );
}

syncIngredients().catch(console.error);

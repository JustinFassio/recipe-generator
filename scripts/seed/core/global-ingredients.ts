/**
 * Global Ingredients Seed Script
 * Creates system-wide ingredient database for matching and categorization
 */

import { admin } from '../utils/client';
import { logSuccess, logError, logInfo } from '../utils/shared';

// Comprehensive global ingredients data
const globalIngredientsData = [
  // Proteins
  { name: 'chicken breast', category: 'proteins', synonyms: ['chicken', 'poultry', 'chicken fillet'] },
  { name: 'ground beef', category: 'proteins', synonyms: ['beef mince', 'hamburger meat', 'ground meat'] },
  { name: 'salmon', category: 'proteins', synonyms: ['salmon fillet', 'fresh salmon', 'atlantic salmon'] },
  { name: 'eggs', category: 'proteins', synonyms: ['chicken eggs', 'large eggs', 'whole eggs'] },
  { name: 'tofu', category: 'proteins', synonyms: ['bean curd', 'soy tofu', 'firm tofu'] },
  { name: 'black beans', category: 'proteins', synonyms: ['black turtle beans', 'frijoles negros'] },
  { name: 'lentils', category: 'proteins', synonyms: ['red lentils', 'green lentils', 'brown lentils'] },
  { name: 'quinoa', category: 'proteins', synonyms: ['quinoa grain', 'white quinoa', 'tri-color quinoa'] },

  // Fresh Produce (Chef Isabella's "Kitchen Reality" categories)
  { name: 'onion', category: 'fresh_produce', synonyms: ['yellow onion', 'white onion', 'cooking onion'] },
  { name: 'garlic', category: 'fresh_produce', synonyms: ['garlic cloves', 'fresh garlic', 'garlic bulb'] },
  { name: 'tomatoes', category: 'fresh_produce', synonyms: ['fresh tomatoes', 'ripe tomatoes', 'roma tomatoes'] },
  { name: 'bell peppers', category: 'fresh_produce', synonyms: ['sweet peppers', 'capsicum', 'red peppers'] },
  { name: 'carrots', category: 'fresh_produce', synonyms: ['baby carrots', 'carrot sticks', 'fresh carrots'] },
  { name: 'broccoli', category: 'fresh_produce', synonyms: ['broccoli florets', 'fresh broccoli', 'broccoli crowns'] },
  { name: 'spinach', category: 'fresh_produce', synonyms: ['baby spinach', 'fresh spinach', 'spinach leaves'] },
  { name: 'mushrooms', category: 'fresh_produce', synonyms: ['button mushrooms', 'cremini mushrooms', 'fresh mushrooms'] },
  { name: 'zucchini', category: 'fresh_produce', synonyms: ['courgette', 'summer squash', 'green zucchini'] },
  { name: 'avocado', category: 'fresh_produce', synonyms: ['ripe avocado', 'hass avocado', 'fresh avocado'] },

  // Fresh Produce - Fruits
  { name: 'lemons', category: 'fresh_produce', synonyms: ['fresh lemons', 'lemon juice', 'lemon zest'] },
  { name: 'limes', category: 'fresh_produce', synonyms: ['fresh limes', 'lime juice', 'key limes'] },
  { name: 'apples', category: 'fresh_produce', synonyms: ['fresh apples', 'granny smith', 'red apples'] },
  { name: 'bananas', category: 'fresh_produce', synonyms: ['ripe bananas', 'fresh bananas', 'yellow bananas'] },
  { name: 'berries', category: 'fresh_produce', synonyms: ['mixed berries', 'fresh berries', 'frozen berries'] },

  // Dairy Cold (The Refrigerated)
  { name: 'milk', category: 'dairy_cold', synonyms: ['whole milk', '2% milk', 'fresh milk'] },
  { name: 'butter', category: 'dairy_cold', synonyms: ['unsalted butter', 'salted butter', 'fresh butter'] },
  { name: 'cheese', category: 'dairy_cold', synonyms: ['shredded cheese', 'block cheese', 'fresh cheese'] },
  { name: 'yogurt', category: 'dairy_cold', synonyms: ['greek yogurt', 'plain yogurt', 'natural yogurt'] },
  { name: 'cream', category: 'dairy_cold', synonyms: ['heavy cream', 'whipping cream', 'fresh cream'] },
  { name: 'mozzarella', category: 'dairy_cold', synonyms: ['fresh mozzarella', 'mozzarella cheese', 'buffalo mozzarella'] },
  { name: 'parmesan', category: 'dairy_cold', synonyms: ['parmesan cheese', 'parmigiano', 'grated parmesan'] },

  // Pantry Staples (The Reliable Backups)
  { name: 'olive oil', category: 'pantry_staples', synonyms: ['extra virgin olive oil', 'cooking oil', 'EVOO'] },
  { name: 'salt', category: 'pantry_staples', synonyms: ['sea salt', 'kosher salt', 'table salt'] },
  { name: 'black pepper', category: 'pantry_staples', synonyms: ['ground black pepper', 'pepper', 'cracked pepper'] },
  { name: 'flour', category: 'pantry_staples', synonyms: ['all-purpose flour', 'plain flour', 'white flour'] },
  { name: 'sugar', category: 'pantry_staples', synonyms: ['granulated sugar', 'white sugar', 'cane sugar'] },
  { name: 'rice', category: 'pantry_staples', synonyms: ['white rice', 'jasmine rice', 'long grain rice'] },
  { name: 'pasta', category: 'pantry_staples', synonyms: ['spaghetti', 'penne', 'linguine'] },
  { name: 'bread', category: 'pantry_staples', synonyms: ['sliced bread', 'loaf bread', 'sandwich bread'] },
  { name: 'oats', category: 'pantry_staples', synonyms: ['rolled oats', 'old-fashioned oats', 'oatmeal'] },

  // Flavor Builders (The Magic Makers)
  { name: 'basil', category: 'flavor_builders', synonyms: ['fresh basil', 'basil leaves', 'sweet basil'] },
  { name: 'oregano', category: 'flavor_builders', synonyms: ['dried oregano', 'fresh oregano', 'oregano leaves'] },
  { name: 'thyme', category: 'flavor_builders', synonyms: ['fresh thyme', 'dried thyme', 'thyme leaves'] },
  { name: 'rosemary', category: 'flavor_builders', synonyms: ['fresh rosemary', 'dried rosemary', 'rosemary sprigs'] },
  { name: 'cumin', category: 'flavor_builders', synonyms: ['ground cumin', 'cumin seeds', 'cumin powder'] },
  { name: 'paprika', category: 'flavor_builders', synonyms: ['sweet paprika', 'smoked paprika', 'paprika powder'] },
  { name: 'chili powder', category: 'flavor_builders', synonyms: ['chili pepper', 'red pepper', 'cayenne'] },
  { name: 'ginger', category: 'flavor_builders', synonyms: ['fresh ginger', 'ginger root', 'ground ginger'] },
  { name: 'cinnamon', category: 'flavor_builders', synonyms: ['ground cinnamon', 'cinnamon sticks', 'cinnamon powder'] },
  { name: 'vanilla', category: 'flavor_builders', synonyms: ['vanilla extract', 'pure vanilla', 'vanilla essence'] },

  // Condiments & Sauces (Pantry Staples)
  { name: 'soy sauce', category: 'pantry_staples', synonyms: ['low sodium soy sauce', 'tamari', 'shoyu'] },
  { name: 'balsamic vinegar', category: 'pantry_staples', synonyms: ['balsamic', 'aged balsamic', 'balsamic glaze'] },
  { name: 'honey', category: 'pantry_staples', synonyms: ['raw honey', 'pure honey', 'natural honey'] },
  { name: 'mustard', category: 'pantry_staples', synonyms: ['dijon mustard', 'yellow mustard', 'whole grain mustard'] },
  { name: 'ketchup', category: 'pantry_staples', synonyms: ['tomato ketchup', 'tomato sauce', 'catsup'] },
];

/**
 * Normalize ingredient name for matching
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize spaces
    .trim();
}

/**
 * Main function to seed global ingredients
 */
export async function seedGlobalIngredients() {
  console.log('🚀 Starting global ingredients seed...\n');

  let insertedCount = 0;
  let updatedCount = 0;

  for (const ingredient of globalIngredientsData) {
    const normalizedName = normalizeIngredientName(ingredient.name);
    
    // Check if ingredient already exists
    const { data: existing } = await admin
      .from('global_ingredients')
      .select('id, usage_count')
      .eq('normalized_name', normalizedName)
      .single();

    if (existing) {
      // Update usage count for existing ingredient
      const { error: updateError } = await admin
        .from('global_ingredients')
        .update({ 
          usage_count: existing.usage_count + 1,
          last_seen_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        logError(`Error updating ingredient ${ingredient.name}:`, updateError);
      } else {
        updatedCount++;
      }
    } else {
      // Insert new ingredient
      const { error: insertError } = await admin
        .from('global_ingredients')
        .insert({
          name: ingredient.name,
          normalized_name: normalizedName,
          category: ingredient.category,
          synonyms: ingredient.synonyms,
          usage_count: 1,
          is_verified: true, // Mark seed data as verified
          is_system: true,   // Mark as system ingredient
        });

      if (insertError) {
        logError(`Error inserting ingredient ${ingredient.name}:`, insertError);
      } else {
        insertedCount++;
      }
    }
  }

  logSuccess(`Global ingredients seed completed!`);
  logInfo(`  • Inserted: ${insertedCount} new ingredients`);
  logInfo(`  • Updated: ${updatedCount} existing ingredients`);
  logInfo(`  • Total processed: ${globalIngredientsData.length} ingredients`);
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedGlobalIngredients().catch((err) => {
    logError('Global ingredients seeding failed:', err);
    process.exit(1);
  });
}

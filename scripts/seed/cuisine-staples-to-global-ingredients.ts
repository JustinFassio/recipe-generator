/**
 * Bulk seeding script to populate global ingredients from cuisine staples
 * This script extracts all 1,296+ ingredients from the 81 cuisines and seeds them into the global ingredients database
 */

import { supabase } from '@/lib/supabase';
import { asianCuisines } from '@/lib/shopping-cart/cuisine-staples/asian-cuisines';
import { europeanCuisines } from '@/lib/shopping-cart/cuisine-staples/european-cuisines';
import { americanCuisines } from '@/lib/shopping-cart/cuisine-staples/american-cuisines';
import { middleEasternCuisines } from '@/lib/shopping-cart/cuisine-staples/middle-eastern-cuisines';
import { caribbeanCuisines } from '@/lib/shopping-cart/cuisine-staples/caribbean-cuisines';
import { scandinavianCuisines } from '@/lib/shopping-cart/cuisine-staples/scandinavian-cuisines';
import { africanCuisines } from '@/lib/shopping-cart/cuisine-staples/african-cuisines';
import { fusionCuisines } from '@/lib/shopping-cart/cuisine-staples/fusion-cuisines';
import { regionalAmericanCuisines } from '@/lib/shopping-cart/cuisine-staples/regional-american-cuisines';
import { internationalFusionCuisines } from '@/lib/shopping-cart/cuisine-staples/international-fusion-cuisines';
import { vegetarianCuisines } from '@/lib/shopping-cart/cuisine-staples/vegetarian-cuisines';
import { healthFocusedCuisines } from '@/lib/shopping-cart/cuisine-staples/health-focused-cuisines';
import { culturalAdaptations } from '@/lib/shopping-cart/cuisine-staples/cultural-adaptations';
import { specialtyDiets } from '@/lib/shopping-cart/cuisine-staples/specialty-diets';
import { specialtyCookingMethods } from '@/lib/shopping-cart/cuisine-staples/specialty-cooking-methods';
import { specialtyDietExpansions } from '@/lib/shopping-cart/cuisine-staples/specialty-diet-expansions';
import { specialtyDietFurtherExpansions } from '@/lib/shopping-cart/cuisine-staples/specialty-diet-further-expansions';
import { specialtyDietFinalExpansions } from '@/lib/shopping-cart/cuisine-staples/specialty-diet-final-expansions';
import type { CuisineStaplesData } from '@/lib/shopping-cart/cuisine-staples';

interface CuisineStaple {
  ingredient: string;
  category: string;
  priority: 'essential' | 'recommended' | 'optional';
  reason: string;
  usage: string;
  culturalContext: string;
}

interface ProcessedIngredient {
  name: string;
  normalized_name: string;
  category: string;
  synonyms: string[];
  usage_count: number;
  cuisine_origins: string[];
  usage_context: string[];
  cultural_context: string;
  priority_level: string;
  cooking_methods: string[];
  dietary_restrictions: string[];
  is_system: boolean;
  is_verified: boolean;
}

/**
 * Normalize ingredient name for consistent matching
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Extract synonyms from cultural context and usage
 */
function extractSynonyms(staple: CuisineStaple): string[] {
  const synonyms: string[] = [];

  // Extract from cultural context
  const context = staple.culturalContext.toLowerCase();
  if (context.includes('aka:')) {
    const akaMatch = context.match(/aka:\s*([^,]+)/);
    if (akaMatch) {
      synonyms.push(akaMatch[1].trim());
    }
  }

  // Extract from usage patterns
  const usage = staple.usage.toLowerCase();
  if (usage.includes('(') && usage.includes(')')) {
    const parenMatch = usage.match(/\(([^)]+)\)/);
    if (parenMatch) {
      synonyms.push(parenMatch[1].trim());
    }
  }

  return synonyms;
}

/**
 * Extract usage context from usage field
 */
function extractUsageContext(staple: CuisineStaple): string[] {
  return staple.usage
    .split(',')
    .map((usage) => usage.trim())
    .filter((usage) => usage.length > 0);
}

/**
 * Determine cooking methods from cuisine type and usage
 */
function determineCookingMethods(
  cuisineKey: string,
  staple: CuisineStaple
): string[] {
  const methods: string[] = [];

  // Cuisine-based cooking methods
  if (cuisineKey.includes('grilled')) methods.push('grilled');
  if (cuisineKey.includes('slow_cooker')) methods.push('slow_cooked');
  if (cuisineKey.includes('one_pot')) methods.push('one_pot');

  // Usage-based cooking methods
  const usage = staple.usage.toLowerCase();
  if (usage.includes('grilled') || usage.includes('bbq'))
    methods.push('grilled');
  if (usage.includes('stew') || usage.includes('braised'))
    methods.push('slow_cooked');
  if (usage.includes('stir-fry') || usage.includes('wok'))
    methods.push('stir_fried');
  if (usage.includes('baked') || usage.includes('roasted'))
    methods.push('baked');
  if (usage.includes('raw') || usage.includes('fresh')) methods.push('raw');

  return [...new Set(methods)]; // Remove duplicates
}

/**
 * Determine dietary restrictions from cuisine type
 */
function determineDietaryRestrictions(
  cuisineKey: string,
  cuisineData: CuisineStaplesData
): string[] {
  const restrictions: string[] = [];

  // Cuisine-based restrictions
  if (cuisineKey.includes('kosher')) restrictions.push('kosher');
  if (cuisineKey.includes('halal')) restrictions.push('halal');
  if (cuisineKey.includes('vegetarian') || cuisineKey.includes('vegan'))
    restrictions.push('vegetarian');
  if (cuisineKey.includes('keto')) restrictions.push('keto');
  if (cuisineKey.includes('paleo')) restrictions.push('paleo');
  if (cuisineKey.includes('raw_food')) restrictions.push('raw');
  if (cuisineKey.includes('low_fodmap')) restrictions.push('low_fodmap');
  if (cuisineKey.includes('anti_inflammatory'))
    restrictions.push('anti_inflammatory');

  // Use cuisineData to refine restrictions when available
  const cuisineLabel = cuisineData?.cuisine?.toLowerCase?.() ?? '';
  if (cuisineLabel.includes('vegetarian') || cuisineLabel.includes('vegan')) {
    restrictions.push('vegetarian');
  }
  if (
    cuisineLabel.includes('gluten-free') ||
    cuisineLabel.includes('gluten free')
  ) {
    restrictions.push('gluten_free');
  }

  return restrictions;
}

/**
 * Process a single cuisine staple into a global ingredient
 */
function processCuisineStaple(
  staple: CuisineStaple,
  cuisineKey: string,
  cuisineData: CuisineStaplesData
): ProcessedIngredient {
  const normalizedName = normalizeIngredientName(staple.ingredient);
  const synonyms = extractSynonyms(staple);
  const usageContext = extractUsageContext(staple);
  const cookingMethods = determineCookingMethods(cuisineKey, staple);
  const dietaryRestrictions = determineDietaryRestrictions(
    cuisineKey,
    cuisineData
  );

  return {
    name: staple.ingredient,
    normalized_name: normalizedName,
    category: staple.category,
    synonyms,
    usage_count: 1,
    cuisine_origins: [cuisineKey],
    usage_context: usageContext,
    cultural_context: staple.culturalContext,
    priority_level: staple.priority,
    cooking_methods: cookingMethods,
    dietary_restrictions: dietaryRestrictions,
    is_system: true,
    is_verified: true,
  };
}

/**
 * Merge ingredient data when ingredient already exists
 */
function mergeIngredientData(
  existing: ProcessedIngredient,
  newData: ProcessedIngredient
): ProcessedIngredient {
  return {
    ...existing,
    usage_count: existing.usage_count + 1,
    cuisine_origins: [
      ...new Set([...existing.cuisine_origins, ...newData.cuisine_origins]),
    ],
    usage_context: [
      ...new Set([...existing.usage_context, ...newData.usage_context]),
    ],
    synonyms: [...new Set([...existing.synonyms, ...newData.synonyms])],
    cooking_methods: [
      ...new Set([...existing.cooking_methods, ...newData.cooking_methods]),
    ],
    dietary_restrictions: [
      ...new Set([
        ...existing.dietary_restrictions,
        ...newData.dietary_restrictions,
      ]),
    ],
  };
}

/**
 * Seed ingredient from cuisine staple
 */
async function seedIngredientFromStaple(
  staple: CuisineStaple,
  cuisineKey: string,
  cuisineData: CuisineStaplesData
): Promise<boolean> {
  try {
    const processedIngredient = processCuisineStaple(
      staple,
      cuisineKey,
      cuisineData
    );
    const normalizedName = processedIngredient.normalized_name;

    // Check if ingredient already exists
    const { data: existing, error: fetchError } = await supabase
      .from('global_ingredients')
      .select('*')
      .eq('normalized_name', normalizedName)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(
        `Error fetching ingredient ${staple.ingredient}:`,
        fetchError
      );
      return false;
    }

    if (existing) {
      // Update existing ingredient
      const mergedData = mergeIngredientData(existing, processedIngredient);
      const { error: updateError } = await supabase
        .from('global_ingredients')
        .update(mergedData)
        .eq('id', existing.id);

      if (updateError) {
        console.error(
          `Error updating ingredient ${staple.ingredient}:`,
          updateError
        );
        return false;
      }

      console.log(
        `✅ Updated ingredient: ${staple.ingredient} (${cuisineKey})`
      );
    } else {
      // Create new ingredient
      const { error: insertError } = await supabase
        .from('global_ingredients')
        .insert(processedIngredient);

      if (insertError) {
        console.error(
          `Error inserting ingredient ${staple.ingredient}:`,
          insertError
        );
        return false;
      }

      console.log(
        `✅ Created ingredient: ${staple.ingredient} (${cuisineKey})`
      );
    }

    return true;
  } catch (error) {
    console.error(`Error processing ingredient ${staple.ingredient}:`, error);
    return false;
  }
}

/**
 * Main function to seed global ingredients from cuisine staples
 */
export async function seedCuisineStaplesToGlobalIngredients(): Promise<void> {
  console.log('🚀 Starting cuisine staples to global ingredients seed...\n');

  // Combine all cuisine data
  const allCuisineStaples = {
    ...asianCuisines,
    ...europeanCuisines,
    ...americanCuisines,
    ...middleEasternCuisines,
    ...caribbeanCuisines,
    ...scandinavianCuisines,
    ...africanCuisines,
    ...fusionCuisines,
    ...regionalAmericanCuisines,
    ...internationalFusionCuisines,
    ...vegetarianCuisines,
    ...healthFocusedCuisines,
    ...culturalAdaptations,
    ...specialtyDiets,
    ...specialtyCookingMethods,
    ...specialtyDietExpansions,
    ...specialtyDietFurtherExpansions,
    ...specialtyDietFinalExpansions,
  };

  let totalProcessed = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  // Process each cuisine
  for (const [cuisineKey, cuisineData] of Object.entries(allCuisineStaples)) {
    console.log(`\n📋 Processing cuisine: ${cuisineData.cuisine}`);

    for (const staple of cuisineData.staples) {
      const success = await seedIngredientFromStaple(
        staple,
        cuisineKey,
        cuisineData
      );
      totalProcessed++;

      if (success) {
        // Check if it was created or updated by checking the ingredient name
        const { data: existing } = await supabase
          .from('global_ingredients')
          .select('usage_count')
          .eq('normalized_name', normalizeIngredientName(staple.ingredient))
          .single();

        if (existing && existing.usage_count === 1) {
          totalCreated++;
        } else {
          totalUpdated++;
        }
      } else {
        totalErrors++;
      }
    }
  }

  console.log('\n🎉 Cuisine staples to global ingredients seed completed!');
  console.log(`  • Total processed: ${totalProcessed} ingredients`);
  console.log(`  • Created: ${totalCreated} new ingredients`);
  console.log(`  • Updated: ${totalUpdated} existing ingredients`);
  console.log(`  • Errors: ${totalErrors} failed`);
  console.log(
    `  • Success rate: ${(((totalProcessed - totalErrors) / totalProcessed) * 100).toFixed(1)}%`
  );
}

// Allow running this script directly
if (require.main === module) {
  seedCuisineStaplesToGlobalIngredients()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

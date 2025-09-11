#!/usr/bin/env npx tsx
/**
 * Multi-Category Ingredient Validation Script
 * 
 * Validates that multi-category ingredient mappings are consistent with
 * the system catalog and provides detailed reporting for development.
 */

import { runMultiCategoryValidations, validateMultiCategoryIngredients, validateMultiCategoryMappings, MULTI_CATEGORY_INGREDIENTS } from '../src/lib/groceries/multi-category-ingredients';
import { CHEF_ISABELLA_SYSTEM_CATALOG } from '../src/lib/groceries/system-catalog';

async function main() {
  console.log('🔍 Multi-Category Ingredient Validation Report');
  console.log('='.repeat(50));

  // Run comprehensive validations
  const isValid = await runMultiCategoryValidations();

  // Detailed reporting
  console.log('\n📊 Current Multi-Category Mappings:');
  Object.entries(MULTI_CATEGORY_INGREDIENTS).forEach(([ingredient, categories]) => {
    console.log(`  • ${ingredient}: [${categories.join(', ')}]`);
  });

  console.log('\n📈 Statistics:');
  console.log(`  • Total multi-category ingredients: ${Object.keys(MULTI_CATEGORY_INGREDIENTS).length}`);
  console.log(`  • Total system catalog ingredients: ${Object.values(CHEF_ISABELLA_SYSTEM_CATALOG).flat().length}`);
  console.log(`  • Total categories: ${Object.keys(CHEF_ISABELLA_SYSTEM_CATALOG).length}`);

  // Category distribution
  console.log('\n📋 Multi-Category Distribution by Category:');
  const categoryCount: Record<string, number> = {};
  Object.values(MULTI_CATEGORY_INGREDIENTS).forEach(categories => {
    categories.forEach(category => {
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
  });

  Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  • ${category}: ${count} ingredients`);
    });

  console.log('\n' + '='.repeat(50));
  console.log(isValid ? '✅ All validations passed!' : '❌ Validation issues found - see warnings above');

  // Exit with appropriate code for CI/CD
  process.exit(isValid ? 0 : 1);
}

// Run the main function
main().catch(console.error);

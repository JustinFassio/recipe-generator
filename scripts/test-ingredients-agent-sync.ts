#!/usr/bin/env npx tsx
/**
 * Test script to verify ingredients agent is synced with filter data
 */

import { ingredientsAgent } from '../src/lib/ai-agents/ingredients-agent';
import {
  CHEF_ISABELLA_SYSTEM_CATALOG,
  CATEGORY_METADATA,
} from '../src/lib/groceries/system-catalog';

console.log('🧪 Testing Ingredients Agent Sync with Filter Data\n');

// Test 1: Category count match
const agentSummaries = ingredientsAgent.getCategorySummaries();
const catalogCategories = Object.keys(CHEF_ISABELLA_SYSTEM_CATALOG);

console.log('📊 Category Count Comparison:');
console.log(`  Filter categories: ${catalogCategories.length}`);
console.log(`  Agent categories: ${agentSummaries.length}`);
console.log(
  `  Match: ${catalogCategories.length === agentSummaries.length ? '✅' : '❌'}\n`
);

// Test 2: Category names match
console.log('🏷️  Category Name Comparison:');
let categoryNamesMatch = true;
for (const categoryKey of catalogCategories) {
  const catalogName =
    CATEGORY_METADATA[categoryKey as keyof typeof CATEGORY_METADATA]?.name ||
    categoryKey;
  const agentSummary = agentSummaries.find((s) => s.key === categoryKey);
  const agentName = agentSummary?.name || 'NOT_FOUND';

  const matches = catalogName === agentName;
  if (!matches) categoryNamesMatch = false;

  console.log(
    `  ${categoryKey}: Filter="${catalogName}" | Agent="${agentName}" ${matches ? '✅' : '❌'}`
  );
}
console.log(`  Overall match: ${categoryNamesMatch ? '✅' : '❌'}\n`);

// Test 3: Ingredient count per category
console.log('🥕 Ingredient Count per Category:');
let ingredientCountsMatch = true;
for (const categoryKey of catalogCategories) {
  const catalogIngredients =
    CHEF_ISABELLA_SYSTEM_CATALOG[
      categoryKey as keyof typeof CHEF_ISABELLA_SYSTEM_CATALOG
    ] || [];
  const agentIngredients =
    ingredientsAgent.getIngredientsByCategory(categoryKey);

  const matches = catalogIngredients.length === agentIngredients.length;
  if (!matches) ingredientCountsMatch = false;

  const categoryName =
    CATEGORY_METADATA[categoryKey as keyof typeof CATEGORY_METADATA]?.name ||
    categoryKey;
  console.log(
    `  ${categoryName}: Filter=${catalogIngredients.length} | Agent=${agentIngredients.length} ${matches ? '✅' : '❌'}`
  );
}
console.log(`  Overall match: ${ingredientCountsMatch ? '✅' : '❌'}\n`);

// Test 4: Sample ingredient search
console.log('🔍 Sample Ingredient Search Tests:');
const testIngredients = [
  'Chicken Breast',
  'Garlic',
  'Olive Oil',
  'Tomato',
  'Basil',
];
for (const ingredient of testIngredients) {
  const searchResults = ingredientsAgent.searchIngredients(ingredient);
  const exactMatch = searchResults.find(
    (r) => r.ingredient.toLowerCase() === ingredient.toLowerCase()
  );

  console.log(
    `  "${ingredient}": ${exactMatch ? `Found in ${exactMatch.categoryName} ✅` : 'Not found ❌'}`
  );
}

// Test 5: Total ingredient count
const totalCatalogIngredients = Object.values(
  CHEF_ISABELLA_SYSTEM_CATALOG
).reduce((sum, ingredients) => sum + ingredients.length, 0);
const totalAgentIngredients = agentSummaries.reduce(
  (sum, summary) => sum + summary.count,
  0
);

console.log(`\n📈 Total Ingredient Count:`);
console.log(`  Filter total: ${totalCatalogIngredients}`);
console.log(`  Agent total: ${totalAgentIngredients}`);
console.log(
  `  Match: ${totalCatalogIngredients === totalAgentIngredients ? '✅' : '❌'}`
);

// Summary
const allTestsPass =
  categoryNamesMatch &&
  ingredientCountsMatch &&
  totalCatalogIngredients === totalAgentIngredients;
console.log(
  `\n🎯 Overall Sync Status: ${allTestsPass ? '✅ SYNCED' : '❌ NOT SYNCED'}`
);

if (allTestsPass) {
  console.log(
    '\n🎉 Success! The ingredients agent is perfectly synced with the filter data.'
  );
  console.log(
    "   Both systems now use Chef Isabella's comprehensive ingredient catalog."
  );
} else {
  console.log(
    '\n⚠️  Issues detected. The ingredients agent and filter are not using the same data.'
  );
  console.log(
    '   This will cause inconsistent behavior in filtering and AI processing.'
  );
}

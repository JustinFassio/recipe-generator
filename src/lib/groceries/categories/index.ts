/*
 * Chef Isabella's "Kitchen Reality" - Category Index
 *
 * Unified export of all ingredient categories while maintaining
 * the original API structure for backward compatibility
 */

export { PROTEINS } from './proteins';
export { FRESH_PRODUCE } from './fresh-produce';
export { FLAVOR_BUILDERS } from './flavor-builders';
export { COOKING_ESSENTIALS } from './cooking-essentials';
export { BAKERY_GRAINS } from './bakery-grains';
export { DAIRY_COLD } from './dairy-cold';
export { PANTRY_STAPLES } from './pantry-staples';
export { FROZEN } from './frozen';

import { PROTEINS } from './proteins';
import { FRESH_PRODUCE } from './fresh-produce';
import { FLAVOR_BUILDERS } from './flavor-builders';
import { COOKING_ESSENTIALS } from './cooking-essentials';
import { BAKERY_GRAINS } from './bakery-grains';
import { DAIRY_COLD } from './dairy-cold';
import { PANTRY_STAPLES } from './pantry-staples';
import { FROZEN } from './frozen';

// Reconstruct the original catalog structure for backward compatibility
export const CHEF_ISABELLA_SYSTEM_CATALOG: Record<string, string[]> = {
  proteins: PROTEINS,
  fresh_produce: FRESH_PRODUCE,
  flavor_builders: FLAVOR_BUILDERS,
  cooking_essentials: COOKING_ESSENTIALS,
  bakery_grains: BAKERY_GRAINS,
  dairy_cold: DAIRY_COLD,
  pantry_staples: PANTRY_STAPLES,
  frozen: FROZEN,
};

// Helper function for sync script
export function getAllSystemIngredients(): Array<{
  name: string;
  category: string;
}> {
  const result: Array<{ name: string; category: string }> = [];

  Object.entries(CHEF_ISABELLA_SYSTEM_CATALOG).forEach(([category, items]) => {
    items.forEach((item) => {
      result.push({ name: item, category });
    });
  });

  return result;
}

// Category metadata for UI components
export const CATEGORY_METADATA = {
  proteins: {
    name: 'Proteins',
    subtitle: 'The Main Event',
    icon: '🥩',
    color: '#8B4513',
    description:
      'Meat, fish, eggs, beans, nuts - what determines your cooking method',
    subcues: {
      quick: '⚡ Quick (15-min)',
      slow: '🔥 Slow-cooking',
      plant: '🌱 Plant-based',
    },
  },
  fresh_produce: {
    name: 'Fresh Produce',
    subtitle: 'The Perishables',
    icon: '🥬',
    color: '#228B22',
    description: 'Fresh vegetables, fruits, herbs - use first, shop weekly',
    subcues: {
      delicate: '📅 Use this week',
      hardy: '💪 Keeps longer',
      herbs: '🌿 Fresh herbs',
    },
  },
  flavor_builders: {
    name: 'Flavor Builders',
    subtitle: 'The Magic Makers',
    icon: '🧄',
    color: '#FF6347',
    description: 'Spices, herbs, aromatics - your recipe foundations',
    subcues: {
      aromatics: '👃 Aromatics',
      spices: '🌶️ Spices',
      herbs: '🍃 Dried herbs',
    },
  },
  cooking_essentials: {
    name: 'Cooking Essentials',
    subtitle: 'The Workhorses',
    icon: '🫒',
    color: '#4682B4',
    description: 'Oils, vinegars, stocks - the tools you use in every recipe',
    subcues: {
      oils: '🫒 Oils & fats',
      acids: '🍶 Acids & vinegars',
      liquids: '🧂 Seasonings & liquids',
    },
  },
  bakery_grains: {
    name: 'Bakery & Grains',
    subtitle: 'The Carb Corner',
    icon: '🍞',
    color: '#DEB887',
    description: 'Bread, pasta, rice, flour - your energy foundations',
    subcues: {
      bread: '🍞 Fresh breads',
      pasta: '🍝 Pasta & noodles',
      grains: '🌾 Grains & cereals',
    },
  },
  dairy_cold: {
    name: 'Dairy & Cold',
    subtitle: 'The Refrigerated',
    icon: '🥛',
    color: '#87CEEB',
    description: 'Milk, cheese, eggs - everything from the fridge',
    subcues: {
      milk: '🥛 Milk & liquids',
      cheese: '🧀 Cheeses',
      eggs: '🥚 Eggs & spreads',
    },
  },
  pantry_staples: {
    name: 'Pantry Staples',
    subtitle: 'The Reliable Backups',
    icon: '🏺',
    color: '#9370DB',
    description: 'Canned goods, condiments - your emergency cooking supplies',
    subcues: {
      canned: '🥫 Canned goods',
      condiments: '🍯 Condiments',
      dry: '📦 Dry goods',
    },
  },
  frozen: {
    name: 'Frozen Foods',
    subtitle: 'The Time Savers',
    icon: '❄️',
    color: '#B0E0E6',
    description: 'Everything frozen - different prep, longer storage',
    subcues: {
      produce: '🥦 Frozen produce',
      meals: '🍕 Frozen meals',
      treats: '🍦 Frozen treats',
    },
  },
} as const;

// Helper function to get stats for sync script
export function getCategoryStats() {
  const stats: Record<string, number> = {};
  let total = 0;

  Object.entries(CHEF_ISABELLA_SYSTEM_CATALOG).forEach(([category, items]) => {
    stats[category] = items.length;
    total += items.length;
  });

  return { stats, total };
}

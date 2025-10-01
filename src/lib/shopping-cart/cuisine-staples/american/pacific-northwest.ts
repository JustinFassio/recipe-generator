import { CuisineStaplesData } from '../../cuisine-staples/types';

export const pacificNorthwest: CuisineStaplesData = {
  cuisine: 'Pacific Northwest',
  description: 'Regional staples featuring salmon, berries, and mushrooms',
  subStyles: ['Coastal', 'Cascade Range'],
  staples: [
    {
      ingredient: 'salmon',
      category: 'proteins',
      priority: 'essential',
      reason: 'Signature fish',
      usage: 'Grilled, smoked',
    },
    {
      ingredient: 'wild mushrooms',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Regional forage',
      usage: 'Sautés, pastas',
    },
    {
      ingredient: 'berries',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Regional fruit',
      usage: 'Desserts, sauces',
    },
    {
      ingredient: 'hazelnuts',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Local nut',
      usage: 'Salads, baking',
    },
    {
      ingredient: 'apple cider vinegar',
      category: 'flavor_builders',
      priority: 'optional',
      reason: 'Acidity',
      usage: 'Dressings',
    },
    {
      ingredient: 'herbs',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Freshness',
      usage: 'Garnish',
    },
    {
      ingredient: 'potatoes',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Staple side',
      usage: 'Roasted, mashed',
    },
  ],
};

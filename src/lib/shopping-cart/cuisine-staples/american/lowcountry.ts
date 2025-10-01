import { CuisineStaplesData } from '../../cuisine-staples/types';

export const lowcountry: CuisineStaplesData = {
  cuisine: 'Lowcountry',
  description: 'Coastal Carolina and Georgia cuisine with shrimp and rice',
  subStyles: ['Charleston', 'Savannah'],
  staples: [
    {
      ingredient: 'shrimp',
      category: 'proteins',
      priority: 'essential',
      reason: 'Signature seafood',
      usage: 'Shrimp and grits',
    },
    {
      ingredient: 'grits',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Regional starch',
      usage: 'Staple base',
    },
    {
      ingredient: 'rice',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Regional grain',
      usage: 'Pilau, sides',
    },
    {
      ingredient: 'okra',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Regional veg',
      usage: 'Stews, fries',
    },
    {
      ingredient: 'bacon',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Flavor base',
      usage: 'Seasoning',
    },
  ],
};

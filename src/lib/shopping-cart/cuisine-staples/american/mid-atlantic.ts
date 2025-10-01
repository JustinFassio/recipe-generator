import { CuisineStaplesData } from '../types';

export const midAtlantic: CuisineStaplesData = {
  cuisine: 'Mid-Atlantic',
  description:
    'Mid-Atlantic staples including crab, tomatoes, and soft pretzels',
  subStyles: ['Chesapeake', 'Philadelphia', 'New Jersey'],
  staples: [
    {
      ingredient: 'blue crab',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Regional seafood',
      usage: 'Crab cakes, boils',
    },
    {
      ingredient: 'old bay seasoning',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Regional spice',
      usage: 'Seafood',
    },
    {
      ingredient: 'tomatoes',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Regional produce',
      usage: 'Sauces, salads',
    },
    {
      ingredient: 'soft pretzels',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Regional snack',
      usage: 'Snacks',
    },
    {
      ingredient: 'sweet corn',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Seasonal staple',
      usage: 'Sides',
    },
  ],
};

import { CuisineStaplesData } from '../types';

export const russian: CuisineStaplesData = {
  cuisine: 'Russian',
  description: 'Staples for Russian cooking with beets and hearty soups',
  subStyles: ['Moscow', 'Saint Petersburg', 'Siberian'],
  staples: [
    {
      ingredient: 'beets',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Signature veg',
      usage: 'Borscht, salads',
    },
    {
      ingredient: 'potatoes',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Staple',
      usage: 'Soups, sides',
    },
    {
      ingredient: 'cabbage',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Common veg',
      usage: 'Soups, sides',
    },
    {
      ingredient: 'dill',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Herb',
      usage: 'Soups, salads',
    },
    {
      ingredient: 'sour cream',
      category: 'dairy_cold',
      priority: 'recommended',
      reason: 'Finishing dairy',
      usage: 'Soups, salads',
    },
    {
      ingredient: 'rye bread',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Staple bread',
      usage: 'Sides, snacks',
    },
    {
      ingredient: 'pickles',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Common garnish',
      usage: 'Sides, salads',
    },
  ],
};

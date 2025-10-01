import { CuisineStaplesData } from '../types';

export const newEngland: CuisineStaplesData = {
  cuisine: 'New England',
  description:
    'Seafood-forward New England staples like chowder and lobster rolls',
  subStyles: ['Coastal', 'Inland'],
  staples: [
    {
      ingredient: 'clam',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Chowder base',
      usage: 'Soups',
    },
    {
      ingredient: 'cod',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Regional fish',
      usage: 'Bakes, fries',
    },
    {
      ingredient: 'potatoes',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Chowder and sides',
      usage: 'Soups, sides',
    },
    {
      ingredient: 'cream',
      category: 'dairy_cold',
      priority: 'recommended',
      reason: 'Chowder richness',
      usage: 'Soups',
    },
    {
      ingredient: 'butter',
      category: 'dairy_cold',
      priority: 'essential',
      reason: 'Cooking fat',
      usage: 'Seafood, baking',
    },
    {
      ingredient: 'onion',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Aromatic',
      usage: 'Soups, sautés',
    },
    {
      ingredient: 'celery',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Aromatic',
      usage: 'Soups',
    },
    {
      ingredient: 'oyster crackers',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Traditional topping',
      usage: 'Chowder',
    },
    {
      ingredient: 'hot dog rolls',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Lobster rolls',
      usage: 'Sandwiches',
    },
  ],
};

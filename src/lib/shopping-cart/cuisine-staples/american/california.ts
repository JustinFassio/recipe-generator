import { CuisineStaplesData } from '../../cuisine-staples/types';

export const california: CuisineStaplesData = {
  cuisine: 'California',
  description:
    'Fresh, produce-forward California cuisine with fusion influence',
  subStyles: ['Farm-to-table', 'Coastal', 'Bay Area'],
  staples: [
    {
      ingredient: 'avocado',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Signature produce',
      usage: 'Salads, toasts',
    },
    {
      ingredient: 'olive oil',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Primary fat',
      usage: 'Dressings, sautés',
    },
    {
      ingredient: 'citrus',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Acidity',
      usage: 'Dressings, marinades',
    },
    {
      ingredient: 'greens',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Produce focus',
      usage: 'Salads, sides',
    },
    {
      ingredient: 'quinoa',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Grain staple',
      usage: 'Bowls, sides',
    },
    {
      ingredient: 'almonds',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Local nut',
      usage: 'Salads, snacks',
    },
    {
      ingredient: 'herbs',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Freshness',
      usage: 'Dressings, garnish',
    },
    {
      ingredient: 'sourdough bread',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Regional staple',
      usage: 'Sandwiches, toasts',
    },
  ],
};

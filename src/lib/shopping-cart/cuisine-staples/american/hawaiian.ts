import { CuisineStaplesData } from '../types';

export const hawaiian: CuisineStaplesData = {
  cuisine: 'Hawaiian',
  description: 'Island staples including poke ingredients and tropical produce',
  subStyles: ['Oahu', 'Maui', 'Big Island', 'Kauai'],
  staples: [
    {
      ingredient: 'ahi tuna',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Poke base',
      usage: 'Raw preparations',
    },
    {
      ingredient: 'soy sauce',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Seasoning',
      usage: 'Marinades',
    },
    {
      ingredient: 'sesame oil',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Aroma',
      usage: 'Dressings',
    },
    {
      ingredient: 'green onion',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Aromatic',
      usage: 'Garnish',
    },
    {
      ingredient: 'pineapple',
      category: 'fresh_produce',
      priority: 'optional',
      reason: 'Tropical fruit',
      usage: 'Salsas, sides',
    },
    {
      ingredient: 'rice',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Staple base',
      usage: 'Plates, poke',
    },
    {
      ingredient: 'spam',
      category: 'proteins',
      priority: 'optional',
      reason: 'Regional staple',
      usage: 'Musubi',
    },
  ],
};

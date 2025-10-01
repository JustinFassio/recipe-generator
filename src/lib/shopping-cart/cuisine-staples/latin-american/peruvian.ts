import { CuisineStaplesData } from '../types';

export const peruvian: CuisineStaplesData = {
  cuisine: 'Peruvian',
  description: 'Andean and coastal staples for ceviche and stir-fries',
  subStyles: ['Lima', 'Arequipa', 'Cusco'],
  staples: [
    {
      ingredient: 'lime',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Ceviche acid',
      usage: 'Ceviche',
    },
    {
      ingredient: 'aji amarillo',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Signature chili',
      usage: 'Sauces, stews',
    },
    {
      ingredient: 'red onion',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Aromatic',
      usage: 'Ceviche, salads',
    },
    {
      ingredient: 'cilantro',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Freshness',
      usage: 'Garnish',
    },
    {
      ingredient: 'corn',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Choclo',
      usage: 'Sides',
    },
    {
      ingredient: 'sweet potato',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Ceviche side',
      usage: 'Sides',
    },
    {
      ingredient: 'fish',
      category: 'proteins',
      priority: 'essential',
      reason: 'Ceviche base',
      usage: 'Ceviche',
    },
    {
      ingredient: 'soy sauce',
      category: 'flavor_builders',
      priority: 'optional',
      reason: 'Chifa influence',
      usage: 'Stir-fries',
    },
  ],
};

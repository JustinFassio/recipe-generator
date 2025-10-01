import { CuisineStaplesData } from '../types';

export const texMex: CuisineStaplesData = {
  cuisine: 'Tex-Mex',
  description: 'Southwestern fusion staples for Tex-Mex cooking',
  subStyles: ['Texas', 'Border'],
  staples: [
    {
      ingredient: 'cumin',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Signature spice',
      usage: 'Taco seasoning',
    },
    {
      ingredient: 'chili powder',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Signature spice blend',
      usage: 'Seasonings',
    },
    {
      ingredient: 'garlic',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Aromatic',
      usage: 'Seasonings, sautés',
    },
    {
      ingredient: 'onion',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Aromatic',
      usage: 'Seasonings, sautés',
    },
    {
      ingredient: 'tomatoes',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Sauces',
      usage: 'Salsas, stews',
    },
    {
      ingredient: 'jalapeño',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Heat',
      usage: 'Salsas, toppings',
    },
    {
      ingredient: 'cheddar cheese',
      category: 'dairy_cold',
      priority: 'recommended',
      reason: 'Meltability',
      usage: 'Enchiladas, nachos',
    },
    {
      ingredient: 'tortillas',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Base',
      usage: 'Tacos, enchiladas',
    },
    {
      ingredient: 'beans',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Protein',
      usage: 'Refried, sides',
    },
  ],
};

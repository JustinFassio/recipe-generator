import { CuisineStaplesData } from '../types';

export const hungarian: CuisineStaplesData = {
  cuisine: 'Hungarian',
  description: 'Paprika-forward Hungarian staples for goulash and stews',
  subStyles: ['Budapest', 'Great Plain', 'Transdanubia'],
  staples: [
    {
      ingredient: 'paprika',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Signature spice',
      usage: 'Goulash, stews',
    },
    {
      ingredient: 'onion',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Aromatic base',
      usage: 'Stews, sauces',
    },
    {
      ingredient: 'garlic',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Aromatic',
      usage: 'Stews, sautés',
    },
    {
      ingredient: 'beef',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Common protein',
      usage: 'Goulash',
    },
    {
      ingredient: 'pork',
      category: 'proteins',
      priority: 'optional',
      reason: 'Common protein',
      usage: 'Stews',
    },
    {
      ingredient: 'sour cream',
      category: 'dairy_cold',
      priority: 'recommended',
      reason: 'Richness',
      usage: 'Finish sauces',
    },
    {
      ingredient: 'flour',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Dumplings and thickening',
      usage: 'Nokedli, roux',
    },
  ],
};

import { CuisineStaplesData } from '../types';

export const german: CuisineStaplesData = {
  cuisine: 'German',
  description: 'Hearty staples for German cooking with sausages and potatoes',
  subStyles: ['Bavarian', 'Rhineland', 'Berlin', 'Saxon'],
  staples: [
    {
      ingredient: 'sausages',
      category: 'proteins',
      priority: 'essential',
      reason: 'Signature protein',
      usage: 'Mains, grills',
    },
    {
      ingredient: 'potatoes',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Core starch',
      usage: 'Sides, dumplings',
    },
    {
      ingredient: 'onion',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Aromatic',
      usage: 'Stews, sauces',
    },
    {
      ingredient: 'cabbage',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Common veg',
      usage: 'Sauerkraut, sides',
    },
    {
      ingredient: 'mustard',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Condiment',
      usage: 'Dips, sauces',
    },
    {
      ingredient: 'caraway seeds',
      category: 'flavor_builders',
      priority: 'optional',
      reason: 'Traditional spice',
      usage: 'Breads, cabbage',
    },
    {
      ingredient: 'beer',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Cooking and pairing',
      usage: 'Braises, batters',
    },
    {
      ingredient: 'rye bread',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Staple bread',
      usage: 'Sandwiches, sides',
    },
    {
      ingredient: 'apples',
      category: 'fresh_produce',
      priority: 'optional',
      reason: 'Desserts and sides',
      usage: 'Strudel, pork dishes',
    },
  ],
};

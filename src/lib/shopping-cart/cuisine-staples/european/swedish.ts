import { CuisineStaplesData } from '../types';

export const swedish: CuisineStaplesData = {
  cuisine: 'Swedish',
  description:
    'Nordic staples for Swedish cooking including meatballs and dill',
  subStyles: ['Stockholm', 'Gothenburg', 'Malmö'],
  staples: [
    {
      ingredient: 'ground beef',
      category: 'proteins',
      priority: 'essential',
      reason: 'Meatballs',
      usage: 'Mains',
    },
    {
      ingredient: 'potatoes',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Staple side',
      usage: 'Mash, boiled',
    },
    {
      ingredient: 'cream',
      category: 'dairy_cold',
      priority: 'recommended',
      reason: 'Sauces',
      usage: 'Gravy, soups',
    },
    {
      ingredient: 'lingonberry jam',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Traditional condiment',
      usage: 'Meatballs',
    },
    {
      ingredient: 'dill',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Herb',
      usage: 'Fish, potatoes',
    },
    {
      ingredient: 'salmon',
      category: 'proteins',
      priority: 'optional',
      reason: 'Common protein',
      usage: 'Gravlax, mains',
    },
    {
      ingredient: 'bread',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Staple',
      usage: 'Sides, breakfasts',
    },
  ],
};

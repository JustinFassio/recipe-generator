import { CuisineStaplesData } from '../../cuisine-staples/types';

export const dutch: CuisineStaplesData = {
  cuisine: 'Dutch',
  description: 'Comfort-focused Dutch staples with potatoes and dairy',
  subStyles: ['Holland', 'Friesland', 'Zeeland'],
  staples: [
    {
      ingredient: 'potatoes',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Core starch',
      usage: 'Stamppot, sides',
    },
    {
      ingredient: 'butter',
      category: 'dairy_cold',
      priority: 'essential',
      reason: 'Cooking fat',
      usage: 'Mashed dishes, baking',
    },
    {
      ingredient: 'cheese',
      category: 'dairy_cold',
      priority: 'recommended',
      reason: 'Staple dairy',
      usage: 'Snacks, sandwiches',
    },
    {
      ingredient: 'carrots',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Stamppot veg',
      usage: 'Mashes, sides',
    },
    {
      ingredient: 'kale',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Stamppot veg',
      usage: 'Mashes, sides',
    },
    {
      ingredient: 'herring',
      category: 'proteins',
      priority: 'optional',
      reason: 'Traditional',
      usage: 'Snacks, sandwiches',
    },
    {
      ingredient: 'bread',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Common staple',
      usage: 'Sandwiches, breakfasts',
    },
  ],
};

import { CuisineStaplesData } from '../types';

export const midwestern: CuisineStaplesData = {
  cuisine: 'Midwestern',
  description: 'Comfort classics and casserole-friendly staples of the Midwest',
  subStyles: ['Upper Midwest', 'Great Lakes', 'Plains'],
  staples: [
    {
      ingredient: 'ground beef',
      category: 'proteins',
      priority: 'essential',
      reason: 'Casseroles and burgers',
      usage: 'Mains',
    },
    {
      ingredient: 'potatoes',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Staple side',
      usage: 'Mash, bake',
    },
    {
      ingredient: 'cheddar cheese',
      category: 'dairy_cold',
      priority: 'recommended',
      reason: 'Comfort dishes',
      usage: 'Casseroles',
    },
    {
      ingredient: 'cream of mushroom soup',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Casserole binder',
      usage: 'Hotdish',
    },
    {
      ingredient: 'corn',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Regional staple',
      usage: 'Sides, casseroles',
    },
    {
      ingredient: 'butter',
      category: 'dairy_cold',
      priority: 'essential',
      reason: 'Cooking fat',
      usage: 'Baking, sautés',
    },
    {
      ingredient: 'bread',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Staple',
      usage: 'Sandwiches, sides',
    },
  ],
};

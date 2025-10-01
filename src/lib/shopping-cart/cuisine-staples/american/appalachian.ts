import { CuisineStaplesData } from '../../cuisine-staples/types';

export const appalachian: CuisineStaplesData = {
  cuisine: 'Appalachian',
  description:
    'Resourceful mountain cooking with preserved goods and simple staples',
  subStyles: ['Central Appalachia', 'Southern Appalachia'],
  staples: [
    {
      ingredient: 'cornmeal',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Bread and fritters',
      usage: 'Cornbread',
    },
    {
      ingredient: 'beans',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Protein staple',
      usage: 'Soups, sides',
    },
    {
      ingredient: 'salt pork',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Flavor base',
      usage: 'Seasoning',
    },
    {
      ingredient: 'apple butter',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Regional preserve',
      usage: 'Spreads',
    },
    {
      ingredient: 'potatoes',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Staple side',
      usage: 'Sides',
    },
    {
      ingredient: 'sorghum syrup',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Traditional sweetener',
      usage: 'Breads, glazes',
    },
  ],
};

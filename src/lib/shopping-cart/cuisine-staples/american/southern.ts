import { CuisineStaplesData } from '../../cuisine-staples/types';

export const southern: CuisineStaplesData = {
  cuisine: 'Southern',
  description:
    'Classic American Southern staples with comfort and soul food roots',
  subStyles: ['Deep South', 'Gulf Coast', 'Lowcountry'],
  staples: [
    {
      ingredient: 'cornmeal',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Breading and baking',
      usage: 'Fried dishes, cornbread',
    },
    {
      ingredient: 'buttermilk',
      category: 'dairy_cold',
      priority: 'recommended',
      reason: 'Tenderizing and baking',
      usage: 'Frying batters, biscuits',
    },
    {
      ingredient: 'collard greens',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Greens staple',
      usage: 'Braised sides',
    },
    {
      ingredient: 'black-eyed peas',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Legume staple',
      usage: "Hoppin' John, sides",
    },
    {
      ingredient: 'pork',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Flavor base',
      usage: 'Smoked meats, seasoning',
    },
    {
      ingredient: 'hot sauce',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Heat and vinegar',
      usage: 'Condiment, seasoning',
    },
    {
      ingredient: 'grits',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Regional starch',
      usage: 'Breakfast, sides',
    },
    {
      ingredient: 'okra',
      category: 'fresh_produce',
      priority: 'optional',
      reason: 'Regional veg',
      usage: 'Fried, stews',
    },
    {
      ingredient: 'sweet potatoes',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Staple veg',
      usage: 'Sides, casseroles',
    },
  ],
};

import { CuisineStaplesData } from '../cuisine-staples/types';
import { cajun } from './american/cajun';
import { california } from './american/california';
import { texasBbq } from './american/barbecue/texas';
import { kansasCityBbq } from './american/barbecue/kansas-city';
import { californiaBbq } from './american/barbecue/california';
import { midwestern } from './american/midwestern';
import { texMex } from './american/tex-mex';
import { southern } from './american/southern';
import { newEngland } from './american/new-england';
import { pacificNorthwest } from './american/pacific-northwest';
import { midAtlantic } from './american/mid-atlantic';
import { southwest } from './american/southwest';
import { lowcountry } from './american/lowcountry';
import { creole } from './american/creole';
import { hawaiian } from './american/hawaiian';
import { appalachian } from './american/appalachian';

export const americanCuisines: Record<string, CuisineStaplesData> = {
  cajun,
  california,
  tex_mex: texMex,
  midwestern,
  texas_bbq: texasBbq,
  kansas_city_bbq: kansasCityBbq,
  california_bbq: californiaBbq,
  southern,
  new_england: newEngland,
  pacific_northwest: pacificNorthwest,
  mid_atlantic: midAtlantic,
  southwest,
  lowcountry,
  creole,
  hawaiian,
  appalachian,
  canadian: {
    cuisine: 'Canadian',
    description:
      'Essential ingredients for authentic Canadian cooking with poutine and maple syrup',
    subStyles: [
      'Toronto',
      'Vancouver',
      'Montreal',
      'Traditional Canadian',
      'Modern Canadian',
    ],
    staples: [
      {
        ingredient: 'potatoes',
        category: 'fresh_produce',
        priority: 'essential',
        reason: 'Essential vegetable for Canadian cuisine',
        usage: 'Poutine, main dishes, side dishes, soups',
        culturalContext: 'Potatoes are the soul of Canadian cuisine',
      },
      {
        ingredient: 'cheese',
        category: 'dairy_cold',
        priority: 'essential',
        reason: 'Essential dairy for Canadian cuisine',
        usage: 'Poutine, main dishes, snacks, side dishes',
        culturalContext: 'Essential for authentic Canadian poutine',
      },
      {
        ingredient: 'maple syrup',
        category: 'pantry_staples',
        priority: 'essential',
        reason: 'Essential sweetener for Canadian cuisine',
        usage: 'Desserts, marinades, main dishes, beverages',
        culturalContext: 'Maple syrup is the soul of Canadian cuisine',
      },
      {
        ingredient: 'onion',
        category: 'fresh_produce',
        priority: 'essential',
        reason: 'Base ingredient for Canadian cooking',
        usage: 'Poutine, stews, main dishes, aromatics',
        culturalContext: 'Foundation of Canadian flavor building',
      },
      {
        ingredient: 'garlic',
        category: 'fresh_produce',
        priority: 'essential',
        reason: 'Essential aromatic for Canadian cooking',
        usage: 'Poutine, marinades, sauces, main dishes',
        culturalContext: 'Foundation of Canadian flavor building',
      },
      {
        ingredient: 'butter',
        category: 'dairy_cold',
        priority: 'essential',
        reason: 'Essential cooking fat for Canadian cuisine',
        usage: 'Cooking, baking, sauces, finishing',
        culturalContext: 'Essential for authentic Canadian richness',
      },
      {
        ingredient: 'flour',
        category: 'pantry_staples',
        priority: 'essential',
        reason: 'Essential for Canadian baking and cooking',
        usage: 'Bread, pastries, dumplings, thickening',
        culturalContext: 'Canadian flour is essential for authentic baking',
      },
      {
        ingredient: 'eggs',
        category: 'proteins',
        priority: 'essential',
        reason: 'Essential protein for Canadian cuisine',
        usage: 'Baking, main dishes, desserts, side dishes',
        culturalContext: 'Essential for Canadian baking and main dishes',
      },
      {
        ingredient: 'milk',
        category: 'dairy_cold',
        priority: 'essential',
        reason: 'Essential dairy for Canadian cuisine',
        usage: 'Poutine, desserts, beverages, main dishes',
        culturalContext: 'Essential for Canadian poutine and desserts',
      },
      {
        ingredient: 'sugar',
        category: 'pantry_staples',
        priority: 'essential',
        reason: 'Essential sweetener for Canadian cuisine',
        usage: 'Desserts, baking, main dishes, beverages',
        culturalContext: 'Essential for Canadian desserts and baking',
      },
      {
        ingredient: 'herbs',
        category: 'fresh_produce',
        priority: 'essential',
        reason: 'Essential ingredients for Canadian cuisine',
        usage: 'Garnishes, marinades, main dishes, aromatics',
        culturalContext: 'Cannot make authentic Canadian food without herbs',
      },
      {
        ingredient: 'spices',
        category: 'flavor_builders',
        priority: 'essential',
        reason: 'Essential seasonings for Canadian cuisine',
        usage: 'Marinades, stews, main dishes, everything',
        culturalContext: 'Essential for authentic Canadian flavor',
      },
      {
        ingredient: 'vegetables',
        category: 'fresh_produce',
        priority: 'recommended',
        reason: 'Popular Canadian ingredients',
        usage: 'Stews, stir-fries, main dishes, side dishes',
        culturalContext: 'Important in Canadian cuisine',
      },
      {
        ingredient: 'meat',
        category: 'proteins',
        priority: 'recommended',
        reason: 'Popular Canadian protein',
        usage: 'Main dishes, stews, soups, side dishes',
        culturalContext: 'Important in Canadian cuisine',
      },
      {
        ingredient: 'fish',
        category: 'proteins',
        priority: 'recommended',
        reason: 'Popular Canadian protein',
        usage: 'Main dishes, soups, side dishes, traditional',
        culturalContext: 'Important in Canadian cuisine',
      },
      {
        ingredient: 'wine',
        category: 'flavor_builders',
        priority: 'recommended',
        reason: 'Popular Canadian ingredient',
        usage: 'Cooking, marinades, sauces, drinking',
        culturalContext: 'Canadian wine is important in the cuisine',
      },
    ],
  },
};

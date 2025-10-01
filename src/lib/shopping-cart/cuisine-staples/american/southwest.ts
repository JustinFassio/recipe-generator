import { CuisineStaplesData } from '../types';

export const southwest: CuisineStaplesData = {
  cuisine: 'Southwest',
  description: 'Southwestern staples with chilies, beans, and corn',
  subStyles: ['New Mexico', 'Arizona'],
  staples: [
    {
      ingredient: 'chile powder',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Signature spice',
      usage: 'Seasonings',
    },
    {
      ingredient: 'cumin',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Signature spice',
      usage: 'Seasonings',
    },
    {
      ingredient: 'corn',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Staple',
      usage: 'Tortillas, sides',
    },
    {
      ingredient: 'beans',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Protein staple',
      usage: 'Stews, sides',
    },
    {
      ingredient: 'cilantro',
      category: 'fresh_produce',
      priority: 'optional',
      reason: 'Herb',
      usage: 'Garnish',
    },
    {
      ingredient: 'lime',
      category: 'fresh_produce',
      priority: 'optional',
      reason: 'Acidity',
      usage: 'Finishing',
    },
  ],
};

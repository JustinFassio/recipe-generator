import { CuisineStaplesData } from '../../../cuisine-staples/types';

export const californiaBbq: CuisineStaplesData = {
  cuisine: 'California BBQ',
  description: 'Santa Maria-style tri-tip and produce-forward sides',
  subStyles: ['Santa Maria'],
  staples: [
    {
      ingredient: 'tri-tip',
      category: 'proteins',
      priority: 'essential',
      reason: 'Signature cut',
      usage: 'Grilled over red oak',
    },
    {
      ingredient: 'salt',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Rub',
      usage: 'Dry rub',
    },
    {
      ingredient: 'black pepper',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Rub',
      usage: 'Dry rub',
    },
    {
      ingredient: 'garlic powder',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Rub component',
      usage: 'Dry rub',
    },
    {
      ingredient: 'red oak wood',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Fuel',
      usage: 'Grilling',
    },
    {
      ingredient: 'salsa',
      category: 'flavor_builders',
      priority: 'optional',
      reason: 'Fresh side',
      usage: 'Serving',
    },
    {
      ingredient: 'pinquito beans',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Regional side',
      usage: 'Side dish',
    },
    {
      ingredient: 'garlic bread',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Classic side',
      usage: 'Serving',
    },
  ],
};

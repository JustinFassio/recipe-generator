import { CuisineStaplesData } from '../../../cuisine-staples/types';

export const texasBbq: CuisineStaplesData = {
  cuisine: 'Texas BBQ',
  description: 'Central Texas BBQ staples focusing on beef and simple rubs',
  subStyles: ['Central Texas', 'East Texas', 'Hill Country'],
  staples: [
    {
      ingredient: 'beef brisket',
      category: 'proteins',
      priority: 'essential',
      reason: 'Signature cut',
      usage: 'Low and slow',
    },
    {
      ingredient: 'salt',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Rub base',
      usage: 'Rubs',
    },
    {
      ingredient: 'black pepper',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Rub base',
      usage: 'Rubs',
    },
    {
      ingredient: 'post oak wood',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Smoking wood',
      usage: 'Smoking',
    },
    {
      ingredient: 'sausage',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Traditional',
      usage: 'Smoked links',
    },
    {
      ingredient: 'white bread',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Serving staple',
      usage: 'Sides',
    },
    {
      ingredient: 'pickles',
      category: 'pantry_staples',
      priority: 'optional',
      reason: 'Traditional side',
      usage: 'Sides',
    },
    {
      ingredient: 'onion',
      category: 'fresh_produce',
      priority: 'optional',
      reason: 'Side',
      usage: 'Slices for serving',
    },
  ],
};

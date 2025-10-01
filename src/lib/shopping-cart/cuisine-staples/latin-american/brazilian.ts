import { CuisineStaplesData } from '../../cuisine-staples/types';

export const brazilian: CuisineStaplesData = {
  cuisine: 'Brazilian',
  description:
    'Staples for Brazilian cooking including rice, beans, and cassava',
  subStyles: ['Bahian', 'Paulista', 'Gaucho'],
  staples: [
    {
      ingredient: 'rice',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Staple base',
      usage: 'Everyday meals',
    },
    {
      ingredient: 'black beans',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Feijoada base',
      usage: 'Stews, sides',
    },
    {
      ingredient: 'cassava flour',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Farofa',
      usage: 'Sides',
    },
    {
      ingredient: 'garlic',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Aromatic',
      usage: 'Stews, sautés',
    },
    {
      ingredient: 'onion',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Aromatic',
      usage: 'Stews, sautés',
    },
    {
      ingredient: 'lime',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Acidity',
      usage: 'Finishing',
    },
    {
      ingredient: 'palm oil',
      category: 'flavor_builders',
      priority: 'optional',
      reason: 'Regional oil (dendê)',
      usage: 'Bahian dishes',
    },
    {
      ingredient: 'beef',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Churrasco',
      usage: 'Grill',
    },
  ],
};

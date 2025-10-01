import { CuisineStaplesData } from '../../cuisine-staples/types';

export const polish: CuisineStaplesData = {
  cuisine: 'Polish',
  description: 'Eastern European staples including kielbasa and cabbage',
  subStyles: ['Warsaw', 'Kraków', 'Gdańsk'],
  staples: [
    {
      ingredient: 'kielbasa',
      category: 'proteins',
      priority: 'essential',
      reason: 'Signature sausage',
      usage: 'Mains, soups',
    },
    {
      ingredient: 'potatoes',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Staple starch',
      usage: 'Sides, dumplings',
    },
    {
      ingredient: 'cabbage',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Core veg',
      usage: 'Bigos, sides',
    },
    {
      ingredient: 'onion',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Aromatic',
      usage: 'Soups, stews',
    },
    {
      ingredient: 'sour cream',
      category: 'dairy_cold',
      priority: 'recommended',
      reason: 'Richness',
      usage: 'Pierogi, soups',
    },
    {
      ingredient: 'dill',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Herb',
      usage: 'Soups, salads',
    },
    {
      ingredient: 'flour',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Doughs',
      usage: 'Pierogi, baking',
    },
  ],
};

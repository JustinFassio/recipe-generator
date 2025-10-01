import { CuisineStaplesData } from '../../cuisine-staples/types';

export const thaiCentral: CuisineStaplesData = {
  cuisine: 'Thai (Central)',
  description:
    'Central Thai staples emphasizing balance of sweet, sour, salty, spicy',
  subStyles: ['Bangkok', 'Ayutthaya'],
  staples: [
    {
      ingredient: 'palm sugar',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Signature sweetness',
      usage: 'Curries, sauces, desserts',
    },
    {
      ingredient: 'fish sauce',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Umami backbone',
      usage: 'Seasoning, sauces, curries',
    },
    {
      ingredient: 'tamarind',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Sour balance',
      usage: 'Pad Thai, soups, sauces',
    },
  ],
};

export const thaiNorthern: CuisineStaplesData = {
  cuisine: 'Thai (Northern)',
  description: 'Northern Thai staples featuring herbs and fermented flavors',
  subStyles: ['Chiang Mai', 'Lanna'],
  staples: [
    {
      ingredient: 'sticky rice',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Regional staple grain',
      usage: 'Main dishes, side',
    },
    {
      ingredient: 'makhwaen pepper',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Regional spice',
      usage: 'Curries, sausage',
    },
  ],
};

export const thaiSouthern: CuisineStaplesData = {
  cuisine: 'Thai (Southern)',
  description: 'Southern Thai staples with more chilies and coconut',
  subStyles: ['Phuket', 'Hat Yai'],
  staples: [
    {
      ingredient: 'coconut milk',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Creamy curries',
      usage: 'Curries, soups',
    },
    {
      ingredient: 'shrimp paste',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Fermented umami',
      usage: 'Curries, pastes',
    },
  ],
};

export const thaiIsaan: CuisineStaplesData = {
  cuisine: 'Thai (Isaan)',
  description: 'Isaan staples influenced by Lao cuisine',
  subStyles: ['Udon Thani', 'Khon Kaen'],
  staples: [
    {
      ingredient: 'sticky rice',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Regional staple grain',
      usage: 'Som tam, grilled meats',
    },
    {
      ingredient: 'lime',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Sour profile',
      usage: 'Som tam, salads',
    },
  ],
};

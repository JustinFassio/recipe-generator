import { CuisineStaplesData } from '../../cuisine-staples/types';

export const greek: CuisineStaplesData = {
  cuisine: 'Greek',
  description:
    'Mediterranean staples emphasizing olive oil, herbs, and fresh produce',
  subStyles: ['Mainland', 'Island', 'Cretan', 'Athenian'],
  staples: [
    {
      ingredient: 'olive oil',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Foundation of Greek cooking',
      usage: 'Cooking, dressings',
    },
    {
      ingredient: 'oregano',
      category: 'flavor_builders',
      priority: 'essential',
      reason: 'Signature herb',
      usage: 'Marinades, salads',
    },
    {
      ingredient: 'garlic',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Aromatic base',
      usage: 'Sauces, roasts',
    },
    {
      ingredient: 'lemon',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Acid and freshness',
      usage: 'Dressings, marinades',
    },
    {
      ingredient: 'feta',
      category: 'dairy_cold',
      priority: 'recommended',
      reason: 'Salty cheese',
      usage: 'Salads, bakes',
    },
    {
      ingredient: 'yogurt',
      category: 'dairy_cold',
      priority: 'recommended',
      reason: 'Creamy base',
      usage: 'Tzatziki, marinades',
    },
    {
      ingredient: 'cucumber',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Salad staple',
      usage: 'Salads, tzatziki',
    },
    {
      ingredient: 'tomatoes',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Salad staple',
      usage: 'Salads, stews',
    },
    {
      ingredient: 'red onion',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Salads and marinades',
      usage: 'Salads, mezze',
    },
    {
      ingredient: 'dill',
      category: 'flavor_builders',
      priority: 'optional',
      reason: 'Herbal freshness',
      usage: 'Sauces, salads',
    },
    {
      ingredient: 'mint',
      category: 'flavor_builders',
      priority: 'optional',
      reason: 'Herbal brightness',
      usage: 'Meatballs, salads',
    },
  ],
};

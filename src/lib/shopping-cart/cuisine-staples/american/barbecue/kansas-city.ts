import { CuisineStaplesData } from '../../types';

export const kansasCityBbq: CuisineStaplesData = {
  cuisine: 'Kansas City BBQ',
  description: 'KC BBQ staples with tomato-molasses sauces and varied meats',
  subStyles: ['Kansas City'],
  staples: [
    {
      ingredient: 'pork ribs',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Classic cut',
      usage: 'Smoking',
    },
    {
      ingredient: 'beef brisket',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Popular cut',
      usage: 'Smoking',
    },
    {
      ingredient: 'brown sugar',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Rub and sauce',
      usage: 'Rubs, sauces',
    },
    {
      ingredient: 'tomato ketchup',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Sauce base',
      usage: 'BBQ sauce',
    },
    {
      ingredient: 'molasses',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Sauce sweetness',
      usage: 'BBQ sauce',
    },
    {
      ingredient: 'vinegar',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Acidity',
      usage: 'Sauce balance',
    },
    {
      ingredient: 'paprika',
      category: 'flavor_builders',
      priority: 'recommended',
      reason: 'Rub component',
      usage: 'Rubs',
    },
    {
      ingredient: 'garlic powder',
      category: 'flavor_builders',
      priority: 'optional',
      reason: 'Rub component',
      usage: 'Rubs',
    },
    {
      ingredient: 'onion powder',
      category: 'flavor_builders',
      priority: 'optional',
      reason: 'Rub component',
      usage: 'Rubs',
    },
  ],
};

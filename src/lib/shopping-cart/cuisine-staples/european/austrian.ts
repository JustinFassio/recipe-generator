import { CuisineStaplesData } from '../types';

export const austrian: CuisineStaplesData = {
  cuisine: 'Austrian',
  description: 'Viennese and regional staples including schnitzel and pastries',
  subStyles: ['Viennese', 'Tyrolean', 'Styria'],
  staples: [
    {
      ingredient: 'veal',
      category: 'proteins',
      priority: 'essential',
      reason: 'Schnitzel base',
      usage: 'Main dishes',
    },
    {
      ingredient: 'pork',
      category: 'proteins',
      priority: 'recommended',
      reason: 'Common protein',
      usage: 'Mains, roasts',
    },
    {
      ingredient: 'breadcrumbs',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Breading',
      usage: 'Schnitzel, fry',
    },
    {
      ingredient: 'lemon',
      category: 'fresh_produce',
      priority: 'recommended',
      reason: 'Finishing',
      usage: 'Schnitzel garnish',
    },
    {
      ingredient: 'potatoes',
      category: 'fresh_produce',
      priority: 'essential',
      reason: 'Staple side',
      usage: 'Salads, sides',
    },
    {
      ingredient: 'apricot jam',
      category: 'pantry_staples',
      priority: 'recommended',
      reason: 'Classic dessert',
      usage: 'Sacher torte',
    },
    {
      ingredient: 'butter',
      category: 'dairy_cold',
      priority: 'essential',
      reason: 'Cooking and baking',
      usage: 'Sauces, pastries',
    },
    {
      ingredient: 'flour',
      category: 'pantry_staples',
      priority: 'essential',
      reason: 'Baking and thickening',
      usage: 'Pastries, roux',
    },
    {
      ingredient: 'eggs',
      category: 'proteins',
      priority: 'essential',
      reason: 'Binding and baking',
      usage: 'Pastries, breading',
    },
  ],
};

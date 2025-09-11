import type { GroceryCategories } from '@/lib/types';

// Chef Isabella's "Kitchen Reality" Categories for UI
// Small curated starter sets for user grocery lists
// "Group by BEHAVIOR, not biology!" - Chef Isabella

export const GROCERY_CATEGORIES: GroceryCategories = {
  proteins: {
    name: 'Proteins',
    subtitle: 'The Main Event',
    icon: '🥩',
    items: [
      'chicken breast',
      'chicken thighs',
      'ground beef',
      'salmon',
      'eggs',
      'tofu',
      'greek yogurt',
      'beans',
      'lentils',
      'nuts',
    ],
  },

  fresh_produce: {
    name: 'Fresh Produce',
    subtitle: 'The Perishables',
    icon: '🥬',
    items: [
      'onions',
      'garlic',
      'carrots',
      'spinach',
      'tomatoes',
      'bell peppers',
      'avocados',
      'lemons',
      'basil',
      'cilantro',
    ],
  },

  flavor_builders: {
    name: 'Flavor Builders',
    subtitle: 'The Magic Makers',
    icon: '🧄',
    items: [
      'salt',
      'black pepper',
      'garlic powder',
      'cumin',
      'paprika',
      'oregano',
      'thyme',
      'bay leaves',
      'ginger',
      'chili powder',
    ],
  },

  cooking_essentials: {
    name: 'Cooking Essentials',
    subtitle: 'The Workhorses',
    icon: '🫒',
    items: [
      'olive oil',
      'vegetable oil',
      'butter',
      'chicken stock',
      'vegetable stock',
      'balsamic vinegar',
      'soy sauce',
      'vanilla extract',
    ],
  },

  bakery_grains: {
    name: 'Bakery & Grains',
    subtitle: 'The Carb Corner',
    icon: '🍞',
    items: [
      'bread',
      'pasta',
      'rice',
      'flour',
      'bagels',
      'tortillas',
      'quinoa',
      'oats',
    ],
  },

  dairy_cold: {
    name: 'Dairy & Cold',
    subtitle: 'The Refrigerated',
    icon: '🥛',
    items: [
      'milk',
      'cheese',
      'yogurt',
      'butter',
      'eggs',
      'cream cheese',
      'heavy cream',
      'sour cream',
    ],
  },

  pantry_staples: {
    name: 'Pantry Staples',
    subtitle: 'The Reliable Backups',
    icon: '🏺',
    items: [
      'canned tomatoes',
      'canned beans',
      'pasta sauce',
      'honey',
      'peanut butter',
      'crackers',
      'soup',
      'olives',
    ],
  },

  frozen: {
    name: 'Frozen',
    subtitle: 'The Time Savers',
    icon: '❄️',
    items: [
      'frozen vegetables',
      'frozen berries',
      'ice cream',
      'frozen pizza',
      'frozen shrimp',
      'popsicles',
    ],
  },
} as const;

export const GROCERY_CATEGORY_KEYS = Object.keys(GROCERY_CATEGORIES) as Array<
  keyof typeof GROCERY_CATEGORIES
>;

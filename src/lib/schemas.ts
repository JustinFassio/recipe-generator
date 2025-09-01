import { z } from 'zod';
import { MAX_CATEGORIES_PER_RECIPE, MAX_CATEGORY_LENGTH } from './constants';

export const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  ingredients: z
    .array(z.string().min(1, 'Ingredient cannot be empty'))
    .min(1, 'At least one ingredient is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  notes: z.string(),
  image_url: z.string().nullable().optional(),
  categories: z
    .array(
      z
        .string()
        .min(1, 'Category cannot be empty')
        .max(
          MAX_CATEGORY_LENGTH,
          `Category must be ${MAX_CATEGORY_LENGTH} characters or less`
        )
    )
    .max(
      MAX_CATEGORIES_PER_RECIPE,
      `Maximum ${MAX_CATEGORIES_PER_RECIPE} categories allowed`
    )
    .optional()
    .default([]),
});

// Form schema with required categories for form validation
export const recipeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  ingredients: z
    .array(z.string().min(1, 'Ingredient cannot be empty'))
    .min(1, 'At least one ingredient is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  notes: z.string(),
  image_url: z.string().nullable().optional(),
  setup: z.array(z.string().min(1, 'Setup item cannot be empty')),
  categories: z
    .array(
      z
        .string()
        .min(1, 'Category cannot be empty')
        .max(
          MAX_CATEGORY_LENGTH,
          `Category must be ${MAX_CATEGORY_LENGTH} characters or less`
        )
    )
    .max(
      MAX_CATEGORIES_PER_RECIPE,
      `Maximum ${MAX_CATEGORIES_PER_RECIPE} categories allowed`
    ),
});

export type RecipeFormData = z.infer<typeof recipeFormSchema>;

export const parseRecipeSchema = z.object({
  recipeText: z
    .string()
    .min(1, 'Please paste your recipe content')
    .max(
      10000,
      'Recipe text is too long. Please keep it under 10,000 characters.'
    ),
});

export type ParseRecipeFormData = z.infer<typeof parseRecipeSchema>;

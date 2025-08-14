import { z } from 'zod';

export const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  ingredients: z
    .array(z.string().min(1, 'Ingredient cannot be empty'))
    .min(1, 'At least one ingredient is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  notes: z.string(),
  image_url: z.string().optional(),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;

export const parseRecipeSchema = z.object({
  recipeText: z.string().min(1, 'Please paste your recipe content'),
});

export type ParseRecipeFormData = z.infer<typeof parseRecipeSchema>;

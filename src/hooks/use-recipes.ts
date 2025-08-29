import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeApi } from '@/lib/api';
import type { Recipe, RecipeFilters } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export const useRecipes = (filters?: RecipeFilters) => {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: () => recipeApi.getUserRecipes(filters),
  });
};

export const useRecipe = (id: string) => {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipeApi.getRecipe(id),
    enabled: !!id,
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recipeApi.createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({
        title: 'Success',
        description: 'Recipe created successfully!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create recipe. Please try again.',
        variant: 'destructive',
      });
      console.error('Create recipe error:', error);
    },
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Recipe> }) =>
      recipeApi.updateRecipe(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({
        title: 'Success',
        description: 'Recipe updated successfully!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update recipe. Please try again.',
        variant: 'destructive',
      });
      console.error('Update recipe error:', error);
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recipeApi.deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({
        title: 'Success',
        description: 'Recipe deleted successfully!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete recipe. Please try again.',
        variant: 'destructive',
      });
      console.error('Delete recipe error:', error);
    },
  });
};

export const useParseRecipe = () => {
  return useMutation({
    mutationFn: async (text: string) => {
      return recipeApi.parseRecipeFromText(text);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description:
          'Failed to parse recipe. Please check the format and try again.',
        variant: 'destructive',
      });
      console.error('Parse recipe error:', error);
    },
  });
};

export const useUploadImage = () => {
  return useMutation({
    mutationFn: (file: File) => recipeApi.uploadImage(file),
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
      console.error('Upload image error:', error);
    },
  });
};

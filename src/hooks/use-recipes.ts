import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeApi } from '@/lib/api';
import type { Recipe, RecipeFilters } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export const useRecipes = (filters?: RecipeFilters) => {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: () => recipeApi.getUserRecipes(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - recipes don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch on every focus
    refetchOnMount: false, // Don't refetch if we have fresh data
  });
};

export const useRecipe = (id: string) => {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipeApi.getRecipe(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes - individual recipes change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes - keep individual recipes cached longer
    refetchOnWindowFocus: false,
  });
};

export const usePublicRecipe = (
  id: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['public-recipe', id],
    queryFn: () => recipeApi.getPublicRecipe(id),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 10 * 60 * 1000, // 10 minutes - individual recipes change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes - keep individual recipes cached longer
    refetchOnWindowFocus: false,
  });
};

// New hook for recipe summaries (used in lists)
export const useRecipeSummary = (id: string) => {
  return useQuery({
    queryKey: ['recipe-summary', id],
    queryFn: () => recipeApi.getRecipeSummary(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes - summaries are even more stable
    gcTime: 60 * 60 * 1000, // 1 hour - keep summaries cached very long
    refetchOnWindowFocus: false,
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recipeApi.createRecipe,
    onSuccess: (newRecipe) => {
      // Update detail cache
      if (newRecipe?.id) {
        queryClient.setQueryData(['recipe', newRecipe.id], newRecipe);

        // Optimistically update all recipes list caches so UI reflects immediately
        queryClient.setQueriesData(
          { queryKey: ['recipes'], exact: false },
          (oldData: unknown) => {
            if (!oldData) return oldData;
            // Expect oldData to be Recipe[]; preserve structure if not an array
            if (Array.isArray(oldData)) {
              // Add the new recipe to the beginning of the array
              return [newRecipe, ...oldData];
            }
            return oldData;
          }
        );
      }

      // Still invalidate in background to ensure fresh server state
      queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
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
    onSuccess: (updatedRecipe, { id }) => {
      // Update detail cache
      if (updatedRecipe) {
        queryClient.setQueryData(['recipe', id], updatedRecipe);
        queryClient.setQueryData(['public-recipe', id], updatedRecipe);

        // Optimistically update all recipes list caches so UI reflects immediately
        queryClient.setQueriesData(
          { queryKey: ['recipes'], exact: false },
          (oldData: unknown) => {
            if (!oldData) return oldData;
            // Expect oldData to be Recipe[]; preserve structure if not an array
            if (Array.isArray(oldData)) {
              return oldData.map((r: Recipe) =>
                r.id === updatedRecipe.id ? { ...r, ...updatedRecipe } : r
              );
            }
            return oldData;
          }
        );
      }

      // Still invalidate in background to ensure fresh server state
      queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      queryClient.invalidateQueries({ queryKey: ['public-recipe', id] });
      queryClient.invalidateQueries({ queryKey: ['recipe-summary', id] });
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
    onSuccess: (_, deletedId) => {
      // Strategic cache cleanup: remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: ['recipe', deletedId] });
      queryClient.removeQueries({ queryKey: ['recipe-summary', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
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

// Hook for public recipes (Explore page) with aggressive caching
export const usePublicRecipes = () => {
  return useQuery({
    queryKey: ['public-recipes'],
    queryFn: () => recipeApi.getPublicRecipes(),
    staleTime: 15 * 60 * 1000, // 15 minutes - public recipes change less frequently
    gcTime: 60 * 60 * 1000, // 1 hour - keep public recipes cached very long
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if we have recent data
  });
};

export const useUploadImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => recipeApi.uploadImage(file),
    onSuccess: async (imageUrl) => {
      // Add a small delay to ensure database is fully updated (like profile avatars do)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Invalidate all recipe queries to force fresh data (like profile avatars do)
      queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
      console.log(
        '🔄 Recipe image uploaded, cache invalidated after delay:',
        imageUrl
      );
    },
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

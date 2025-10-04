import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { imageGalleryApi } from '@/lib/api/features/image-gallery-api';
import type { RecipeImage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export const useRecipeImages = (recipeId: string) => {
  return useQuery({
    queryKey: ['recipe-images', recipeId],
    queryFn: () => imageGalleryApi.getRecipeImages(recipeId),
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const usePrimaryRecipeImage = (recipeId: string) => {
  return useQuery({
    queryKey: ['primary-recipe-image', recipeId],
    queryFn: () => imageGalleryApi.getPrimaryRecipeImage(recipeId),
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useAddRecipeImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (imageData: Omit<RecipeImage, 'id' | 'created_at' | 'updated_at'>) =>
      imageGalleryApi.addRecipeImage(imageData),
    onSuccess: (_, variables) => {
      // Invalidate and refetch recipe images
      queryClient.invalidateQueries({ queryKey: ['recipe-images', variables.recipe_id] });
      queryClient.invalidateQueries({ queryKey: ['primary-recipe-image', variables.recipe_id] });
      
      toast({
        title: 'Image added',
        description: 'Recipe image has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add image: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateRecipeImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ imageId, updates }: { imageId: string; updates: Partial<RecipeImage> }) =>
      imageGalleryApi.updateRecipeImage(imageId, updates),
    onSuccess: (updatedImage) => {
      // Invalidate and refetch recipe images
      queryClient.invalidateQueries({ queryKey: ['recipe-images', updatedImage.recipe_id] });
      queryClient.invalidateQueries({ queryKey: ['primary-recipe-image', updatedImage.recipe_id] });
      
      toast({
        title: 'Image updated',
        description: 'Recipe image has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update image: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteRecipeImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (imageId: string) => imageGalleryApi.deleteRecipeImage(imageId),
    onSuccess: () => {
      // We need to invalidate all recipe image queries since we don't know which recipe
      queryClient.invalidateQueries({ queryKey: ['recipe-images'] });
      queryClient.invalidateQueries({ queryKey: ['primary-recipe-image'] });
      
      toast({
        title: 'Image deleted',
        description: 'Recipe image has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete image: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useSetPrimaryImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ recipeId, imageId }: { recipeId: string; imageId: string }) =>
      imageGalleryApi.setPrimaryImage(recipeId, imageId),
    onSuccess: (_, { recipeId }) => {
      // Invalidate and refetch recipe images
      queryClient.invalidateQueries({ queryKey: ['recipe-images', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['primary-recipe-image', recipeId] });
      
      toast({
        title: 'Primary image updated',
        description: 'The primary image has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to set primary image: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useReorderRecipeImages = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ recipeId, imageOrders }: { 
      recipeId: string; 
      imageOrders: { id: string; display_order: number }[] 
    }) => imageGalleryApi.reorderRecipeImages(recipeId, imageOrders),
    onSuccess: (_, { recipeId }) => {
      // Invalidate and refetch recipe images
      queryClient.invalidateQueries({ queryKey: ['recipe-images', recipeId] });
      
      toast({
        title: 'Images reordered',
        description: 'Image order has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to reorder images: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

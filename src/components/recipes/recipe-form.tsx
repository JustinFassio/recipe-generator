import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldArrayPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDaisyUIInputClasses } from '@/lib/input-migration';
import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import { createDaisyUILabelClasses } from '@/lib/label-migration';
import { recipeFormSchema, type RecipeFormData } from '@/lib/schemas';
import {
  useCreateRecipe,
  useUpdateRecipe,
  useUploadImage,
} from '@/hooks/use-recipes';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import CategoryInput from '@/components/ui/CategoryInput';
import { CreatorRating } from '@/components/ui/rating';
import { MAX_CATEGORIES_PER_RECIPE } from '@/lib/constants';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { recipeApi } from '@/lib/api';
import { Recipe } from '@/lib/types';
import { RecipeVersions } from './recipe-versions';
import { RecipeImageManager } from './recipe-image-manager';
import { useAddRecipeImage } from '@/hooks/use-recipe-images';
import { useAutoImageGeneration } from '@/hooks/useAutoImageGeneration';

interface RecipeFormProps {
  recipe?: Recipe;
  initialData?: RecipeFormData;
  existingRecipe?: Recipe;
  onSuccess?: () => void;
}

export function RecipeForm({
  recipe,
  initialData,
  existingRecipe,
  onSuccess,
}: RecipeFormProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const editRecipe = location.state?.recipe || recipe;

  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const uploadImage = useUploadImage();
  const addRecipeImage = useAddRecipeImage();
  const autoImageGeneration = useAutoImageGeneration();

  // Image gallery state
  const [recipeImages, setRecipeImages] = useState<Record<string, any>[]>([]);
  
  // Legacy state (to be removed)
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoGenerationTriggeredRef = useRef(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isMobile, setIsMobile] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Mobile detection and network status monitoring
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        typeof navigator !== 'undefined'
          ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
          : false
      );
    };

    const updateOnlineStatus = () => {
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    };

    checkMobile();
    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: editRecipe
      ? {
          title: editRecipe.title,
          description: editRecipe.description || '',
          ingredients: editRecipe.ingredients,
          instructions: editRecipe.instructions,
          notes: editRecipe.notes || '',
          image_url: editRecipe.image_url || null,
          categories: editRecipe.categories || [],
          setup: editRecipe.setup || [],
          creator_rating: editRecipe.creator_rating || null,
        }
      : {
          title: '',
          description: '',
          ingredients: [''],
          instructions: '',
          notes: '',
          image_url: null,
          categories: [],
          setup: [],
          creator_rating: null,
        },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray<RecipeFormData, FieldArrayPath<RecipeFormData>>({
    control: control,
    name: 'ingredients' as FieldArrayPath<RecipeFormData>,
  });

  const {
    fields: setupFields,
    append: appendSetup,
    remove: removeSetup,
  } = useFieldArray<RecipeFormData, FieldArrayPath<RecipeFormData>>({
    control: control,
    name: 'setup' as FieldArrayPath<RecipeFormData>,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        description: initialData.description || '',
        ingredients: initialData.ingredients?.length
          ? initialData.ingredients
          : [''],
        instructions: initialData.instructions || '',
        notes: initialData.notes || '',
        image_url: initialData.image_url || null,
        categories: initialData.categories || [],
        setup: initialData.setup || [],
        creator_rating: initialData.creator_rating || null,
      });

      // Auto-generate image for new recipes parsed from chat (only once)
      if (!autoGenerationTriggeredRef.current) {
        console.log('🔍 CHAT RECIPE PARSED - Checking for auto-generation:', {
          hasImageUrl: !!initialData.image_url,
          hasTitle: !!initialData.title,
          hasIngredients: !!(
            initialData.ingredients && initialData.ingredients.length > 0
          ),
          hasDescription: !!initialData.description,
          hasInstructions: !!initialData.instructions,
          recipe: initialData,
        });

        const shouldAutoGenerate =
          !initialData.image_url && // No existing image
          initialData.title && // Has title
          initialData.ingredients &&
          initialData.ingredients.length > 0 && // Has ingredients
          initialData.description &&
          initialData.description.trim().length > 20 && // Has description
          initialData.instructions &&
          initialData.instructions.trim().length > 50; // Has instructions

        console.log('🔍 AUTO-GENERATION DECISION:', {
          shouldAutoGenerate,
          reason: shouldAutoGenerate
            ? 'All criteria met for auto-generation'
            : 'Missing criteria for auto-generation',
        });

        if (shouldAutoGenerate) {
          autoGenerationTriggeredRef.current = true; // Prevent multiple triggers
          console.log('🚀 STARTING AUTO-GENERATION FROM CHAT PARSING');

          // Show toast notification
          toast({
            title: 'Generating Image',
            description: 'Creating an AI-generated image for your recipe...',
            variant: 'default',
          });

          // Start auto-generation in background
          setTimeout(async () => {
            try {
              const generationResult =
                await autoImageGeneration.generateForRecipe(initialData);

              if (generationResult.success && generationResult.imageUrl) {
                // Add the generated image to the gallery
                const generatedImage = {
                  id: `ai-generated-${Date.now()}`,
                  preview: generationResult.imageUrl,
                  image_url: generationResult.imageUrl,
                  caption: '',
                  alt_text: `${initialData.title} - AI Generated Image`,
                  is_primary: true, // First image is primary
                  is_new: true,
                  is_ai_generated: true,
                };

                setRecipeImages([generatedImage]);

                // Show success toast
                toast({
                  title: 'Image Generated!',
                  description: 'Your recipe now has an AI-generated image.',
                  variant: 'default',
                });

                console.log(
                  '✅ AUTO-GENERATION COMPLETED:',
                  generationResult.imageUrl
                );
              }
            } catch (error) {
              console.warn('Auto image generation failed:', error);

              // Show error toast
              toast({
                title: 'Image Generation Failed',
                description:
                  'Could not generate image automatically. You can add one manually.',
                variant: 'destructive',
              });
            }
          }, 500); // Small delay to ensure form is fully initialized
        }
      }
    }
  }, [initialData, reset]);

  // Load existing images when editing a recipe
  useEffect(() => {
    if (existingRecipe?.image_url) {
      // For now, just set the primary image URL for backward compatibility
      // TODO: Load from gallery system when editing existing recipes
      const existingImage = {
        id: 'existing-main-image',
        preview: existingRecipe.image_url,
        image_url: existingRecipe.image_url,
        caption: '',
        alt_text: `${existingRecipe.title} - Main Image`,
        is_primary: true,
        is_new: false,
        is_ai_generated: false,
      };
      setRecipeImages([existingImage]);
    }
  }, [existingRecipe?.image_url, existingRecipe?.title]);

  // Handle image gallery changes
  const handleImagesChange = (images: Record<string, any>[]) => {
    setRecipeImages(images);
  };

  const handlePrimaryImageChange = (imageId: string) => {
    // Primary image change is handled by the RecipeImageManager component
    console.log('Primary image changed to:', imageId);
  };

  const addIngredient = () => {
    appendIngredient('');
  };

  const onSubmit = async (data: RecipeFormData) => {
    console.log('🚀 FORM SUBMIT TRIGGERED - Starting recipe submission');
    const uploadedImageUrls: string[] = [];

    try {
      // Mobile-specific debugging
      if (isMobile) {
        console.log('Mobile device detected, submitting recipe...');
        console.log('Form data:', data);
        console.log('Recipe images:', recipeImages);
      }

      // Upload new image files
      const newImages = recipeImages.filter(img => img.is_new && img.file);
      for (const image of newImages) {
        if (image.file) {
          const uploadedUrl = await uploadImage.mutateAsync(image.file);
          if (!uploadedUrl) {
            throw new Error(`Failed to upload image: ${image.id}`);
          }
          uploadedImageUrls.push(uploadedUrl);
          image.image_url = uploadedUrl; // Update the image object with the uploaded URL
        }
      }

      // Determine primary image URL
      const primaryImage = recipeImages.find(img => img.is_primary);
      const primaryImageUrl = primaryImage?.image_url || null;

      const recipeData = {
        ...data,
        image_url: primaryImageUrl, // Keep for backward compatibility
      };

      if (isMobile) {
        console.log('Recipe data prepared:', recipeData);
        const { data: userData } = await supabase.auth.getUser();
        console.log('User authenticated:', !!userData?.user);
      }

      let recipe;
      if (existingRecipe) {
        if (isMobile) console.log('Updating existing recipe...');
        recipe = await updateRecipe.mutateAsync({
          id: existingRecipe.id,
          updates: recipeData,
        });
      } else {
        if (isMobile) console.log('Creating new recipe...');
        recipe = await createRecipe.mutateAsync({
          ...recipeData,
          is_public: false,
          creator_rating: recipeData.creator_rating || null,
          cooking_time: null,
          difficulty: null,
          current_version_id: null,
        });
      }

      if (isMobile) console.log('Recipe operation completed successfully');

      // Add images to gallery system
      if (recipeImages.length > 0) {
        console.log('Adding images to gallery system...');
        const imagePromises = recipeImages.map(async (image, index) => {
          const imageData = {
            recipe_id: recipe.id,
            image_url: image.image_url || image.preview,
            is_primary: image.is_primary,
            caption: image.caption || null,
            alt_text: image.alt_text || `${data.title} - Image ${index + 1}`,
            display_order: index,
            uploaded_by: null, // Will be set by the API
            generation_method: image.is_ai_generated ? 'ai_generated' as const : 'manual' as const,
            generation_cost_id: null,
            metadata: {},
          };
          
          return addRecipeImage.mutateAsync(imageData);
        });

        await Promise.all(imagePromises);
        console.log('All images added to gallery system');
      }

      // Show success toast
      toast({
        title: 'Recipe Saved!',
        description: 'Your recipe has been saved successfully.',
        variant: 'default',
      });

      // Navigate immediately to show the recipe card
      onSuccess?.();
      navigate('/', { state: { refresh: Date.now() } });

      // Auto-generation now happens when recipe is parsed from chat (in useEffect with initialData)
      // No need to auto-generate on manual save
    } catch (error) {
      console.error('Error saving recipe:', error);

      // Rollback: delete uploaded images if recipe operation failed
      if (uploadedImageUrls.length > 0) {
        console.log('Rolling back uploaded images...');
        for (const imageUrl of uploadedImageUrls) {
          try {
            await recipeApi.deleteImageFromStorage(imageUrl);
            console.log('Rolled back uploaded image:', imageUrl);
          } catch (rollbackError) {
            console.warn('Failed to rollback uploaded image:', rollbackError);
          }
        }
      }

      // Enhanced error logging for mobile
      if (isMobile) {
        console.error('Mobile recipe creation failed. Details:');
        console.error('Error type:', typeof error);
        console.error(
          'Error message:',
          error instanceof Error ? error.message : error
        );
        console.error(
          'Error stack:',
          error instanceof Error ? error.stack : 'No stack trace'
        );

        // Check authentication status
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          console.error('User authenticated:', !!user);
          console.error('User ID:', user?.id);
        } catch (authError) {
          console.error('Auth check failed:', authError);
        }
      }

      // Show more specific error message to user
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Set error state for mobile display
      if (isMobile) {
        setLastError(errorMessage);
      }

      toast({
        title: 'Recipe Creation Failed',
        description: `Failed to create recipe: ${errorMessage}. Please check your connection and try again.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3 className={createDaisyUICardTitleClasses()}>Recipe Details</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className={createDaisyUILabelClasses()}>
                Recipe Title *
              </label>
              <input
                id="title"
                type="text"
                {...register('title')}
                placeholder="Enter recipe title"
                className={`${createDaisyUIInputClasses('bordered')} mt-1`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Recipe Description Field */}
            <div>
              <label
                htmlFor="description"
                className={createDaisyUILabelClasses()}
              >
                Recipe Description
              </label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe your dish - flavors, textures, visual appeal, what makes it special..."
                rows={3}
                variant="default"
                size="md"
                className="w-full resize-none mt-1"
              />
              <p className="mt-1 text-sm text-gray-500">
                A rich description helps others discover your recipe and
                improves AI image generation.
              </p>
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Recipe Image Gallery Manager */}
            <div>
              <label className={createDaisyUILabelClasses()}>
                Recipe Images
              </label>
              <div className="mt-2">
                <RecipeImageManager
                  recipeData={watch()}
                  onImagesChange={handleImagesChange}
                  onPrimaryImageChange={handlePrimaryImageChange}
                  disabled={
                    createRecipe.isPending ||
                    updateRecipe.isPending ||
                    uploadImage.isPending ||
                    !isOnline
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3
            className={`${createDaisyUICardTitleClasses()} flex items-center justify-between`}
          >
            Setup (Prep Ahead)
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-green-600 text-green-600 hover:bg-green-50"
              onClick={() => appendSetup('')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Setup Item
            </Button>
          </h3>
          <div className="space-y-2">
            {setupFields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <input
                  type="text"
                  {...register(`setup.${index}` as const)}
                  placeholder={`Setup item ${index + 1} (e.g., soak beans overnight)`}
                  className={`${createDaisyUIInputClasses('bordered')} flex-1`}
                />
                {/* Setup fields can be completely removed (optional field) */}
                {setupFields.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeSetup(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {errors.setup && (
            <p className="mt-2 text-sm text-red-500">{errors.setup.message}</p>
          )}
        </div>
      </div>

      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3
            className={`${createDaisyUICardTitleClasses()} flex items-center justify-between`}
          >
            Ingredients *
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-green-600 text-green-600 hover:bg-green-50"
              onClick={addIngredient}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Ingredient
            </Button>
          </h3>
          <div className="space-y-2">
            {ingredientFields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <input
                  type="text"
                  {...register(`ingredients.${index}` as const)}
                  placeholder={`Ingredient ${index + 1}`}
                  className={`${createDaisyUIInputClasses('bordered')} flex-1`}
                />
                {/* Ingredients require at least one item (required field) */}
                {ingredientFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeIngredient(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {errors.ingredients && (
            <p className="mt-2 text-sm text-red-500">
              {errors.ingredients.message}
            </p>
          )}
        </div>
      </div>

      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3 className={createDaisyUICardTitleClasses()}>Instructions *</h3>
          <Textarea
            {...register('instructions')}
            placeholder="Enter cooking instructions..."
            rows={6}
            variant="default"
            size="md"
            className="w-full resize-none"
          />
          {errors.instructions && (
            <p className="mt-1 text-sm text-red-500">
              {errors.instructions.message}
            </p>
          )}
        </div>
      </div>

      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3 className={createDaisyUICardTitleClasses()}>Categories</h3>
          <CategoryInput
            categories={watch('categories') || []}
            onCategoriesChange={(categories) =>
              setValue('categories', categories)
            }
            placeholder="Add categories like 'Italian', 'Quick', 'Vegetarian'..."
            maxCategories={MAX_CATEGORIES_PER_RECIPE}
          />
          {errors.categories && (
            <p className="mt-1 text-sm text-red-500">
              {errors.categories.message}
            </p>
          )}
        </div>
      </div>

      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3 className={createDaisyUICardTitleClasses()}>Notes</h3>
          <Textarea
            {...register('notes')}
            placeholder="Additional notes, tips, or variations..."
            rows={3}
            variant="default"
            size="md"
            className="w-full resize-none"
          />
        </div>
      </div>

      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3 className={createDaisyUICardTitleClasses()}>Your Rating</h3>
          <p className="text-sm text-gray-600 mb-3">
            Rate your recipe from 1-5 stars. This helps others discover great
            recipes when you share them!
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">
              How would you rate this recipe?
            </span>
            <CreatorRating
              rating={watch('creator_rating') ?? 0}
              onRate={(rating) => setValue('creator_rating', rating)}
              className="max-w-xs"
            />
            {watch('creator_rating') && (
              <p className="text-xs text-gray-500">
                You can update your rating anytime before sharing
              </p>
            )}
          </div>
          {errors.creator_rating && (
            <p className="mt-1 text-sm text-red-500">
              {errors.creator_rating.message}
            </p>
          )}
        </div>
      </div>

      {/* Network Status Indicator for Mobile */}
      {isMobile && !isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-yellow-800">
              You're offline. Please check your connection and try again.
            </span>
          </div>
        </div>
      )}

      {/* Error Display and Retry for Mobile */}
      {isMobile && lastError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-800">
                Recipe creation failed
              </span>
            </div>
            <p className="text-sm text-red-700">{lastError}</p>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setLastError(null);
                  setRetryCount((prev) => prev + 1);
                  // Retry the last submission
                  handleSubmit(onSubmit)();
                }}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Retry ({retryCount + 1})
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLastError(null)}
                className="text-red-600 hover:text-red-800"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        {/* Recipe Versioning Component */}
        <RecipeVersions
          existingRecipe={existingRecipe}
          currentFormData={(() => {
            // Convert RecipeFormData to format expected by versioning API
            const formData = watch();
            return {
              title: formData.title,
              description: formData.description || '',
              ingredients: formData.ingredients,
              instructions: formData.instructions,
              notes: formData.notes,
              setup: formData.setup,
              categories: formData.categories,
              creator_rating: formData.creator_rating,
              image_url: formData.image_url,
            };
          })()} // Pass converted form data for version creation
          disabled={
            createRecipe.isPending ||
            updateRecipe.isPending ||
            uploadImage.isPending ||
            !isOnline
          }
        />

        <Button
          type="submit"
          className="min-w-32"
          disabled={
            createRecipe.isPending ||
            updateRecipe.isPending ||
            uploadImage.isPending ||
            !isOnline
          }
        >
          {createRecipe.isPending ||
          updateRecipe.isPending ||
          uploadImage.isPending
            ? existingRecipe
              ? 'Updating...'
              : 'Creating...'
            : !isOnline
              ? 'No Connection'
              : existingRecipe
                ? 'Update Recipe'
                : 'Save Recipe'}
        </Button>
      </div>
    </form>
  );
}

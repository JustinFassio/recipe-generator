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
import { X, Upload, Plus } from 'lucide-react';
import { AIImageGenerator } from './ai-image-generator';
import { useAutoImageGeneration } from '@/hooks/useAutoImageGeneration';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import CategoryInput from '@/components/ui/CategoryInput';
import { CreatorRating } from '@/components/ui/rating';
import {
  MAX_CATEGORIES_PER_RECIPE,
  FALLBACK_IMAGE_PATH,
} from '@/lib/constants';
import { processImageFile } from '@/lib/image-utils';
import { getSafeImageUrl } from '@/lib/image-cache-utils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { recipeApi } from '@/lib/api';
import { Recipe } from '@/lib/types';
import { RecipeVersions } from './recipe-versions';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';

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
  const autoImageGeneration = useAutoImageGeneration();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoGenerationTriggeredRef = useRef(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0);
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

          // Show progress indicator
          setIsGeneratingImage(true);
          setImageGenerationProgress(10);

          // Show toast notification
          toast({
            title: 'Generating Image',
            description: 'Creating an AI-generated image for your recipe...',
            variant: 'default',
          });

          // Start auto-generation in background
          setTimeout(async () => {
            try {
              setImageGenerationProgress(30);

              const generationResult =
                await autoImageGeneration.generateForRecipe(initialData);

              setImageGenerationProgress(80);

              if (generationResult.success && generationResult.imageUrl) {
                // Update the form with the generated image
                setImagePreview(generationResult.imageUrl);
                setValue('image_url', generationResult.imageUrl);

                setImageGenerationProgress(100);

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

                // Hide progress after a moment
                setTimeout(() => {
                  setIsGeneratingImage(false);
                  setImageGenerationProgress(0);
                }, 1000);
              }
            } catch (error) {
              console.warn('Auto image generation failed:', error);

              // Hide progress on error
              setIsGeneratingImage(false);
              setImageGenerationProgress(0);

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

  useEffect(() => {
    if (existingRecipe?.image_url) {
      const safeUrl = getSafeImageUrl(
        existingRecipe.image_url,
        existingRecipe.updated_at,
        existingRecipe.created_at,
        FALLBACK_IMAGE_PATH
      );
      // Only set preview if we got a valid URL (not just the fallback)
      if (safeUrl && safeUrl !== FALLBACK_IMAGE_PATH) {
        setImagePreview(safeUrl);
      } else if (safeUrl === FALLBACK_IMAGE_PATH) {
        // Image expired/invalid - show fallback and clear the form field
        setImagePreview('');
        setValue('image_url', null);
      }
    }
  }, [
    existingRecipe?.image_url,
    existingRecipe?.updated_at,
    existingRecipe?.created_at,
    setValue,
  ]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await processImageFile(file);

    if (result.success) {
      setImageFile(result.compressedFile);
      setImagePreview(result.previewUrl);
    } else {
      toast({
        title: 'Invalid Image',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const addIngredient = () => {
    appendIngredient('');
  };

  const onSubmit = async (data: RecipeFormData) => {
    console.log('🚀 FORM SUBMIT TRIGGERED - Starting recipe submission');
    let uploadedImageUrl: string | null = null;

    try {
      // Mobile-specific debugging
      if (isMobile) {
        console.log('Mobile device detected, submitting recipe...');
        console.log('Form data:', data);
      }

      let imageUrl = data.image_url;

      // Upload image if there's a new file
      if (imageFile) {
        if (isMobile) console.log('Uploading image on mobile...');
        const uploadedUrl = await uploadImage.mutateAsync(imageFile);
        if (!uploadedUrl) {
          throw new Error('Failed to upload image');
        }
        imageUrl = uploadedUrl;
        uploadedImageUrl = uploadedUrl; // Track for potential rollback
        if (isMobile) console.log('Image uploaded successfully:', uploadedUrl);
      }

      const recipeData = {
        ...data,
        image_url: imageUrl && imageUrl.trim() !== '' ? imageUrl : null,
      };

      if (isMobile) {
        console.log('Recipe data prepared:', recipeData);
        const { data: userData } = await supabase.auth.getUser();
        console.log('User authenticated:', !!userData?.user);
      }

      if (existingRecipe) {
        if (isMobile) console.log('Updating existing recipe...');
        await updateRecipe.mutateAsync({
          id: existingRecipe.id,
          updates: recipeData,
        });
      } else {
        if (isMobile) console.log('Creating new recipe...');
        await createRecipe.mutateAsync({
          ...recipeData,
          is_public: false,
          creator_rating: recipeData.creator_rating || null,
          cooking_time: null,
          difficulty: null,
          current_version_id: null,
        });
      }

      if (isMobile) console.log('Recipe operation completed successfully');

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

      // Rollback: delete uploaded image if recipe operation failed
      if (uploadedImageUrl) {
        try {
          await recipeApi.deleteImageFromStorage(uploadedImageUrl);
          console.log('Rolled back uploaded image:', uploadedImageUrl);
        } catch (rollbackError) {
          console.warn('Failed to rollback uploaded image:', rollbackError);
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

            <div>
              <label className={createDaisyUILabelClasses()}>
                Recipe Image
              </label>
              <div className="mt-2 space-y-4">
                {/* Image Generation Progress */}
                {isGeneratingImage && (
                  <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300">
                    <div className="flex h-full flex-col items-center justify-center space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                        <span className="text-lg font-medium text-blue-700">
                          Generating Image...
                        </span>
                      </div>
                      <div className="w-3/4">
                        <div className="mb-2 flex justify-between text-sm text-blue-600">
                          <span>AI Image Generation</span>
                          <span>{imageGenerationProgress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-blue-200">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                            style={{ width: `${imageGenerationProgress}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-center text-sm text-blue-600">
                        Creating a beautiful image for your recipe...
                      </p>
                    </div>
                  </div>
                )}

                {/* Generated Image Preview */}
                {imagePreview && !isGeneratingImage && (
                  <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-100">
                    <ProgressiveImage
                      src={
                        getSafeImageUrl(
                          imagePreview,
                          editRecipe?.updated_at || new Date().toISOString(),
                          editRecipe?.created_at || new Date().toISOString(),
                          FALLBACK_IMAGE_PATH
                        ) || FALLBACK_IMAGE_PATH
                      }
                      alt="Recipe preview"
                      className="h-full w-full object-cover"
                      loading="eager"
                      placeholder={FALLBACK_IMAGE_PATH}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                        setValue('image_url', null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                </div>

                {/* AI Image Generation */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    AI Image Generation
                  </h4>

                  {/* Manual AI Generation */}
                  <AIImageGenerator
                    recipe={watch()}
                    onImageGenerated={(imageUrl) => {
                      setImagePreview(imageUrl);
                      setValue('image_url', imageUrl);
                      toast({
                        title: 'Image Generated!',
                        description:
                          'AI-generated image has been added to your recipe.',
                        variant: 'default',
                      });
                    }}
                    onError={(error) => {
                      toast({
                        title: 'Generation Failed',
                        description: error,
                        variant: 'destructive',
                      });
                    }}
                  />

                  {/* Auto-generation now happens automatically when recipe is parsed from chat */}
                </div>
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

import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldArrayPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDaisyUIButtonClasses } from '@/lib/button-migration';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { recipeSchema, type RecipeFormData } from '@/lib/schemas';
import {
  useCreateRecipe,
  useUpdateRecipe,
  useUploadImage,
} from '@/hooks/use-recipes';
import { useLocation } from 'react-router-dom';
import { X, Upload, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/supabase';

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
  const editRecipe = location.state?.recipe || recipe;

  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const uploadImage = useUploadImage();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: editRecipe
      ? {
          title: editRecipe.title,
          ingredients: editRecipe.ingredients,
          instructions: editRecipe.instructions,
          notes: editRecipe.notes || '',
          image_url: editRecipe.image_url || '',
        }
      : {
          title: '',
          ingredients: [''],
          instructions: '',
          notes: '',
          image_url: '',
        },
  });

  const { fields, append, remove } = useFieldArray<
    RecipeFormData,
    FieldArrayPath<RecipeFormData>
  >({
    control,
    name: 'ingredients' as FieldArrayPath<RecipeFormData>,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        ingredients: initialData.ingredients?.length
          ? initialData.ingredients
          : [''],
        instructions: initialData.instructions || '',
        notes: initialData.notes || '',
        image_url: initialData.image_url || '',
      });
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (existingRecipe?.image_url) {
      setImagePreview(existingRecipe.image_url);
    }
  }, [existingRecipe]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const onSubmit = async (data: RecipeFormData) => {
    try {
      let imageUrl = data.image_url;

      // Upload new image if one was selected
      if (imageFile) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          imageUrl = await uploadImage.mutateAsync({
            file: imageFile,
            userId: user.id,
          });
        }
      }

      const recipeData = {
        ...data,
        ingredients: data.ingredients.filter(
          (ingredient) => ingredient.trim() !== ''
        ),
        image_url: imageUrl || null,
      };

      if (existingRecipe) {
        await updateRecipe.mutateAsync({
          id: existingRecipe.id,
          updates: recipeData,
        });
      } else {
        await createRecipe.mutateAsync(recipeData);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const addIngredient = () => {
    append('');
  };

  const removeIngredient = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recipe Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Recipe Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter recipe title"
              className="mt-1"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label>Recipe Image</Label>
            <div className="mt-2 space-y-4">
              {imagePreview && (
                <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={imagePreview}
                    alt="Recipe preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className={`${createDaisyUIButtonClasses('ghost', 'sm')} absolute right-2 top-2 bg-white/80 hover:bg-white`}
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                      setValue('image_url', '');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
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
                <button
                  type="button"
                  className={`${createDaisyUIButtonClasses('outline')} border-green-600 text-green-600 hover:bg-green-50`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Ingredients *
            <button
              type="button"
              className={`${createDaisyUIButtonClasses('outline', 'sm')} border-green-600 text-green-600 hover:bg-green-50`}
              onClick={addIngredient}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Ingredient
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <Input
                  {...register(`ingredients.${index}` as const)}
                  placeholder={`Ingredient ${index + 1}`}
                  className="flex-1"
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    className={`${createDaisyUIButtonClasses('ghost', 'sm')} text-red-500 hover:text-red-700`}
                    onClick={() => removeIngredient(index)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.ingredients && (
            <p className="mt-2 text-sm text-red-500">
              {errors.ingredients.message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions *</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('instructions')}
            placeholder="Enter cooking instructions..."
            rows={6}
            className="resize-none"
          />
          {errors.instructions && (
            <p className="mt-1 text-sm text-red-500">
              {errors.instructions.message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('notes')}
            placeholder="Additional notes, tips, or variations..."
            rows={3}
            className="resize-none"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <button
          type="submit"
          className={`${createDaisyUIButtonClasses('default')} min-w-32`}
          disabled={
            createRecipe.isPending ||
            updateRecipe.isPending ||
            uploadImage.isPending
          }
        >
          {createRecipe.isPending ||
          updateRecipe.isPending ||
          uploadImage.isPending
            ? existingRecipe
              ? 'Updating...'
              : 'Creating...'
            : existingRecipe
              ? 'Update Recipe'
              : 'Create Recipe'}
        </button>
      </div>
    </form>
  );
}

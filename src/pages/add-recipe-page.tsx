import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ParseRecipeForm } from '@/components/recipes/parse-recipe-form';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { Button } from '@/components/ui/button';
import type { RecipeFormData } from '@/lib/schemas';
import type { Recipe } from '@/lib/types';

export function AddRecipePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [parsedData, setParsedData] = useState<RecipeFormData | null>(null);
  const [showParser, setShowParser] = useState(true);

  // Check if we're editing an existing recipe
  const existingRecipe = location.state?.recipe as Recipe | undefined;

  useEffect(() => {
    let isMounted = true;

    // If editing an existing recipe, skip the parser and go straight to the form
    if (existingRecipe && isMounted) {
      setShowParser(false);
      setParsedData({
        title: existingRecipe.title,
        ingredients: existingRecipe.ingredients,
        instructions: existingRecipe.instructions,
        notes: existingRecipe.notes || '',
        image_url: existingRecipe.image_url || null,
        categories: existingRecipe.categories || [],
        setup: existingRecipe.setup || [],
      });
    }

    return () => {
      isMounted = false;
    };
  }, [existingRecipe]);

  const handleParsed = (data: RecipeFormData) => {
    setParsedData(data);
    setShowParser(false);
  };

  const handleSuccess = () => {
    navigate('/', { state: { refresh: Date.now() } });
  };

  const handleBackToParser = () => {
    setParsedData(null);
    setShowParser(true);
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>

          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            {existingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            {existingRecipe
              ? 'Update your recipe details'
              : showParser
                ? 'Parse your recipe from text or create one manually'
                : 'Review and edit your parsed recipe'}
          </p>
        </div>

        {showParser && !existingRecipe ? (
          <div className="space-y-6">
            <ParseRecipeForm onParsed={handleParsed} />

            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gradient-to-br from-orange-50 to-teal-50 px-2 text-gray-500">
                    Or
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
                onClick={() => setShowParser(false)}
              >
                Create Recipe Manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!existingRecipe && (
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={handleBackToParser}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Parser
                </Button>
              </div>
            )}

            <RecipeForm
              existingRecipe={existingRecipe}
              initialData={parsedData || undefined}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}

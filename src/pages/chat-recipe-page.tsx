import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDaisyUIButtonClasses } from '@/lib/button-migration';
import { ArrowLeft } from 'lucide-react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { RecipeForm } from '@/components/recipes/recipe-form';
import type { RecipeFormData } from '@/lib/schemas';

export function ChatRecipePage() {
  const navigate = useNavigate();
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(
    null
  );
  const [showEditor, setShowEditor] = useState(false);

  const handleRecipeGenerated = (recipe: RecipeFormData) => {
    setGeneratedRecipe(recipe);
    setShowEditor(true);
  };

  const handleRecipeSaved = () => {
    navigate('/');
  };

  const handleBackToChat = () => {
    setShowEditor(false);
    setGeneratedRecipe(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            className={`${createDaisyUIButtonClasses('ghost')} mb-4`}
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                {showEditor ? 'Review & Edit Recipe' : 'AI Recipe Creator'}
              </h1>
              <p className="text-gray-600">
                {showEditor
                  ? 'Review and customize your AI-generated recipe before saving'
                  : 'Choose your recipe assistant and create personalized recipes step by step'}
              </p>
            </div>

            {showEditor && (
              <button
                className={`${createDaisyUIButtonClasses('outline')} border-orange-500 text-orange-600 hover:bg-orange-50`}
                onClick={handleBackToChat}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Chat
              </button>
            )}
          </div>
        </div>

        {showEditor && generatedRecipe ? (
          <div className="rounded-lg bg-white shadow-sm">
            <div className="p-6">
              <RecipeForm
                initialData={generatedRecipe}
                onSuccess={handleRecipeSaved}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-white shadow-sm">
            <ChatInterface onRecipeGenerated={handleRecipeGenerated} />
          </div>
        )}
      </div>
    </div>
  );
}

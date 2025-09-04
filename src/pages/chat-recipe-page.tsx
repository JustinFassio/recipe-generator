import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { Button } from '@/components/ui/button';
import type { RecipeFormData } from '@/lib/schemas';
import { PersonaType } from '@/lib/openai';

interface ChatRecipePageProps {
  defaultPersona?: PersonaType;
}

export function ChatRecipePage({ defaultPersona }: ChatRecipePageProps = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(
    null
  );
  const [showEditor, setShowEditor] = useState(false);

  // Get persona from URL parameter or use prop
  const personaFromUrl = searchParams.get('persona') as PersonaType | null;
  const finalDefaultPersona = defaultPersona || personaFromUrl || undefined;

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
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>

          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                {showEditor ? 'Review & Edit Recipe' : 'AI Recipe Creator'}
              </h1>
              <p className="text-sm text-gray-600 sm:text-base">
                {showEditor
                  ? 'Review and customize your AI-generated recipe before saving'
                  : 'Choose your recipe assistant and create personalized recipes step by step'}
              </p>
            </div>

            {showEditor && (
              <Button
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                onClick={handleBackToChat}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Chat
              </Button>
            )}
          </div>
        </div>

        {showEditor && generatedRecipe ? (
          <div className="bg-base-100 rounded-lg shadow-sm">
            <div className="p-6">
              <RecipeForm
                initialData={generatedRecipe}
                onSuccess={handleRecipeSaved}
              />
            </div>
          </div>
        ) : (
          <div className="bg-base-100 rounded-lg shadow-sm">
            <ChatInterface
              onRecipeGenerated={handleRecipeGenerated}
              defaultPersona={finalDefaultPersona}
            />
          </div>
        )}
      </div>
    </div>
  );
}

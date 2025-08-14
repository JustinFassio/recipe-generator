import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { RecipeForm } from '@/components/recipes/recipe-form';
import type { RecipeFormData } from '@/lib/schemas';

export function ChatRecipePage() {
  const navigate = useNavigate();
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(null);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Recipes
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {showEditor ? 'Review & Edit Recipe' : 'AI Recipe Creator'}
              </h1>
              <p className="text-gray-600">
                {showEditor 
                  ? 'Review and customize your AI-generated recipe before saving'
                  : 'Choose your recipe assistant and create personalized recipes step by step'
                }
              </p>
            </div>
            
            {showEditor && (
              <Button
                variant="outline"
                onClick={handleBackToChat}
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat
              </Button>
            )}
          </div>
        </div>

        {showEditor && generatedRecipe ? (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <RecipeForm
                initialData={generatedRecipe}
                onSuccess={handleRecipeSaved}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <ChatInterface onRecipeGenerated={handleRecipeGenerated} />
          </div>
        )}
      </div>
    </div>
  );
}
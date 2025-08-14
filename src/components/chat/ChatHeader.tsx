import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Save, ChefHat, Heart, Home, Bot, Brain } from 'lucide-react';
import { RECIPE_BOT_PERSONAS, type PersonaType } from '@/lib/openai';
import type { RecipeFormData } from '@/lib/schemas';

interface ChatHeaderProps {
  selectedPersona: PersonaType;
  generatedRecipe: RecipeFormData | null;
  isLoading: boolean;
  onSaveRecipe: () => void;
  onConvertToRecipe: () => Promise<void>;
  onNewRecipe: () => void;
  onChangeAssistant: () => void;
}

export function ChatHeader({ 
  selectedPersona, 
  generatedRecipe, 
  isLoading,
  onSaveRecipe, 
  onConvertToRecipe,
  onNewRecipe, 
  onChangeAssistant 
}: ChatHeaderProps) {
  const getPersonaIcon = (persona: PersonaType) => {
    switch (persona) {
      case 'chef':
        return <ChefHat className="h-5 w-5" />;
      case 'nutritionist':
        return <Heart className="h-5 w-5" />;
      case 'homeCook':
        return <Home className="h-5 w-5" />;
      case 'assistantNutritionist':
        return <Brain className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  const getPersonaColor = (persona: PersonaType) => {
    switch (persona) {
      case 'chef':
        return 'bg-orange-100 text-orange-600';
      case 'nutritionist':
        return 'bg-green-100 text-green-600';
      case 'homeCook':
        return 'bg-blue-100 text-blue-600';
      case 'assistantNutritionist':
        return 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
      <div className="flex items-center space-x-3">
        <Avatar className={`h-10 w-10 ${getPersonaColor(selectedPersona)}`}>
          <AvatarFallback>
            {getPersonaIcon(selectedPersona)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-gray-900">{RECIPE_BOT_PERSONAS[selectedPersona].name}</h2>
          <p className="text-sm text-gray-500">Let's create something delicious together!</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {generatedRecipe ? (
          // Show save button after recipe is generated
          <Button onClick={onSaveRecipe} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Save Recipe
          </Button>
        ) : (
          // Show convert button to create recipe from conversation
          <Button 
            onClick={onConvertToRecipe} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Parsing Recipe...' : 'Save Recipe'}
          </Button>
        )}
        <Button variant="outline" onClick={onNewRecipe} className="border-green-600 text-green-600 hover:bg-green-50">
          New Recipe
        </Button>
        <Button variant="outline" onClick={onChangeAssistant} className="border-orange-500 text-orange-600 hover:bg-orange-50">
          Change Assistant
        </Button>
      </div>
    </div>
  );
}

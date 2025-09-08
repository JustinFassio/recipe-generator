import { ChefHat, Heart, Home, Bot, Brain, Menu, X } from 'lucide-react';
import { RECIPE_BOT_PERSONAS, type PersonaType } from '@/lib/openai';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
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
  onNewRecipe,
  onChangeAssistant,
}: ChatHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  const getPersonaIcon = (persona: PersonaType) => {
    switch (persona) {
      case 'chef':
        return <ChefHat className="h-5 w-5" />;
      case 'nutritionist':
        return <Heart className="h-5 w-5" />;
      case 'homeCook':
        return <Home className="h-5 w-5" />;
      case 'assistantNutritionist':
      case 'jamieBrightwell':
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
      case 'jamieBrightwell':
        return 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="relative">
      <div className="bg-base-100 flex items-center justify-between rounded-t-lg border-b p-4">
        <div className="flex items-center space-x-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-sm ${getPersonaColor(selectedPersona)}`}
          >
            <div className="flex items-center justify-center">
              {getPersonaIcon(selectedPersona)}
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {RECIPE_BOT_PERSONAS[selectedPersona].name}
            </h2>
            <p className="text-sm text-gray-500">
              Let's create something delicious together!
            </p>
          </div>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden items-center space-x-2 md:flex">
          <Button
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
            onClick={onNewRecipe}
          >
            New Recipe
          </Button>
          <Button
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
            onClick={onChangeAssistant}
          >
            Change Assistant
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="bg-base-100 absolute top-full right-0 left-0 z-50 border-b border-gray-200 shadow-lg md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <nav className="flex flex-col space-y-2 p-4">
            <h2 id="mobile-menu-title" className="sr-only">
              Chat Actions Menu
            </h2>
            <Button
              variant="outline"
              onClick={() => {
                onNewRecipe();
                closeMobileMenu();
              }}
              className="w-full justify-start border-green-600 text-green-600 hover:bg-green-50"
            >
              New Recipe
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onChangeAssistant();
                closeMobileMenu();
              }}
              className="w-full justify-start border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              Change Assistant
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}

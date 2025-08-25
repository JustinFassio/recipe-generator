import { createDaisyUICardClasses } from '@/lib/card-migration';

import { Bot, ChefHat, Heart, Home, Brain } from 'lucide-react';
import { RECIPE_BOT_PERSONAS, type PersonaType } from '@/lib/openai';
import { AssistantBadge } from './AssistantBadge';

interface PersonaSelectorProps {
  onPersonaSelect: (persona: PersonaType) => void;
}

export function PersonaSelector({ onPersonaSelect }: PersonaSelectorProps) {
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

  const getPersonaDescription = (persona: PersonaType) => {
    switch (persona) {
      case 'chef':
        return 'Expert culinary guidance with traditional techniques';
      case 'nutritionist':
        return 'Healthy, balanced meals with nutritional insights';
      case 'homeCook':
        return 'Comforting family recipes with practical tips';
      case 'assistantNutritionist':
        return 'Advanced AI nutritionist with personalized meal planning and health insights';
      default:
        return '';
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <div className="bg-base-100 flex items-center justify-between rounded-t-lg border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-orange-100 shadow-sm">
            <div className="flex items-center justify-center text-orange-600">
              <Bot className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              Choose Your Recipe Assistant
            </h2>
            <p className="text-sm text-gray-500">
              Select a persona to start creating recipes together!
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(RECIPE_BOT_PERSONAS).map(([key, persona]) => (
            <div
              key={key}
              className={`${createDaisyUICardClasses('bordered')} cursor-pointer border-2 border-gray-200 transition-all duration-200 hover:border-gray-300 hover:shadow-lg`}
              onClick={() => onPersonaSelect(key as PersonaType)}
            >
              <div className="card-body relative p-4 text-center transition-colors duration-200 hover:bg-gray-50 sm:p-6">
                <AssistantBadge
                  isAssistantPowered={persona.isAssistantPowered}
                />

                <div
                  className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-white shadow-md sm:mb-4 sm:h-16 sm:w-16 ${getPersonaColor(key as PersonaType)}`}
                >
                  {getPersonaIcon(key as PersonaType)}
                </div>
                <h3 className="mb-2 text-base font-semibold sm:text-lg">
                  {persona.name}
                </h3>
                <p className="text-xs text-gray-600 sm:text-sm">
                  {getPersonaDescription(key as PersonaType)}
                </p>

                {persona.isAssistantPowered && (
                  <p className="mt-2 text-xs font-medium text-purple-600">
                    🤖 Powered by OpenAI Assistant
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

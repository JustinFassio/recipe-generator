import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 bg-orange-100">
            <AvatarFallback className="text-orange-600">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-gray-900">Choose Your Recipe Assistant</h2>
            <p className="text-sm text-gray-500">Select a persona to start creating recipes together!</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(RECIPE_BOT_PERSONAS).map(([key, persona]) => (
            <Card 
              key={key}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onPersonaSelect(key as PersonaType)}
            >
              <CardContent className="p-6 text-center relative">
                <AssistantBadge isAssistantPowered={persona.isAssistantPowered} />
                
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${getPersonaColor(key as PersonaType)}`}>
                  {getPersonaIcon(key as PersonaType)}
                </div>
                <h3 className="text-lg font-semibold mb-2">{persona.name}</h3>
                <p className="text-sm text-gray-600">
                  {getPersonaDescription(key as PersonaType)}
                </p>
                
                {persona.isAssistantPowered && (
                  <p className="text-xs text-purple-600 mt-2 font-medium">
                    🤖 Powered by OpenAI Assistant
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

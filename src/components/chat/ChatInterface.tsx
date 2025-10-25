import React, { useRef, useEffect } from 'react';
import { createDaisyUIInputClasses } from '@/lib/input-migration';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { createDaisyUIScrollAreaClasses } from '@/lib/scroll-area-migration';

import {
  Send,
  User,
  Loader2,
  ChefHat,
  Heart,
  Home,
  Bot,
  Brain,
} from 'lucide-react';
import { PersonaSelector } from './PersonaSelector';
import { ChatHeader } from './ChatHeader';
import { CuisineCategorySelector } from './cuisine-category-selector';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';
import { RECIPE_BOT_PERSONAS, type PersonaType } from '@/lib/openai';
import type { RecipeFormData } from '@/lib/schemas';
import { useSelections } from '@/contexts/SelectionContext';
import { UserProfileDisplay } from './UserProfileDisplay';
import { SmartCreateRecipeButton } from './SmartCreateRecipeButton';
import { useAuth } from '@/contexts/AuthProvider';

interface ChatInterfaceProps {
  onRecipeGenerated: (recipe: RecipeFormData) => void;
  defaultPersona?: PersonaType;
}

export function ChatInterface({
  onRecipeGenerated,
  defaultPersona,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const {
    persona,
    messages,
    generatedRecipe,
    isLoading,
    showPersonaSelector,
    selectPersona,
    sendMessage,
    startNewRecipe,
    changePersona,
    generateEvaluationReport,
    saveEvaluationReport,
  } = useConversation(defaultPersona);

  const { selections, updateSelections } = useSelections();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState('');

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Automatically call onRecipeGenerated when a recipe is successfully parsed
    if (generatedRecipe) {
      onRecipeGenerated(generatedRecipe);
    }
  }, [generatedRecipe, onRecipeGenerated]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageContent = inputValue.trim();
    setInputValue('');

    await sendMessage(messageContent, selections);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveRecipe = () => {
    if (generatedRecipe) {
      onRecipeGenerated(generatedRecipe);
    }
  };

  const handleCuisineCategoryChange = (selection: {
    categories: string[];
    cuisines: string[];
    moods: string[];
    availableIngredients?: string[];
  }) => {
    updateSelections(selection);
  };

  const getPersonaIcon = (personaType: PersonaType) => {
    switch (personaType) {
      case 'chef':
        return <ChefHat className="h-4 w-4" />;
      case 'nutritionist':
        return <Heart className="h-4 w-4" />;
      case 'homeCook':
        return <Home className="h-4 w-4" />;
      case 'assistantNutritionist':
      case 'jamieBrightwell':
      case 'drLunaClearwater':
        return <Brain className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getPersonaColor = (personaType: PersonaType) => {
    switch (personaType) {
      case 'chef':
        return 'bg-orange-100 text-orange-600';
      case 'nutritionist':
        return 'bg-green-100 text-green-600';
      case 'homeCook':
        return 'bg-blue-100 text-blue-600';
      case 'assistantNutritionist':
      case 'jamieBrightwell':
      case 'drLunaClearwater':
        return 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPersonaIntroduction = (personaType: PersonaType) => {
    switch (personaType) {
      case 'chef':
        return {
          title: "Welcome! I'm Chef Marco",
          description:
            'Master Italian chef with 20+ years of Mediterranean culinary expertise, specializing in traditional techniques and fresh ingredients',
          guidance:
            "Start by telling me what kind of recipe you'd like to create, or use the preferences above to guide me.",
        };
      case 'nutritionist':
        return {
          title: "Welcome! I'm Dr. Sarah",
          description:
            'Registered dietitian and nutrition expert focused on creating healthy, balanced meals that are both nutritious and delicious',
          guidance:
            "Start by telling me what kind of recipe you'd like to create, or use the preferences above to guide me.",
        };
      case 'homeCook':
        return {
          title: "Welcome! I'm Aunt Jenny",
          description:
            'Beloved home cook with decades of experience creating comforting, family-friendly recipes that bring joy to every meal',
          guidance:
            "Start by telling me what kind of recipe you'd like to create, or use the preferences above to guide me.",
        };
      case 'assistantNutritionist':
        return {
          title: "Welcome! I'm Dr. Sage Vitalis",
          description:
            '🌟 PREMIUM: Master of Integrative Culinary Medicine with 30+ years merging ancient healing wisdom with cutting-edge nutritional science. Expert in TCM, Ayurveda, functional medicine, and microbiome optimization.',
          guidance:
            "Transform your kitchen into a healing pharmacy! Tell me about your health goals, dietary needs, or what you'd like to heal through food.",
        };
      case 'jamieBrightwell':
        return {
          title: "Welcome! I'm Dr. Jamie Brightwell",
          description:
            "🌟 PREMIUM: Revolutionary Pediatric Culinary Wellness Expert with dual Stanford medicine + Le Cordon Bleu training. Transform 'picky eaters' into food explorers with 25+ years of evidence-based, play-based nutrition.",
          guidance:
            "Hi! I'm Dr. Jamie Brightwell, your Pediatric Culinary Wellness Expert! I'll help you create delicious, nutritionally-optimized meals that your children will actually want to eat. Tell me about your child's age, any picky eating challenges, dietary restrictions, or what you'd like to achieve. I can help with sensory-friendly foods, hidden nutrition techniques, and making healthy eating an adventure!",
        };
      case 'drLunaClearwater':
        return {
          title: "Welcome! I'm Dr. Luna Clearwater",
          description:
            '🌟 PREMIUM: Revolutionary Personalized Health Assessment & Habit Formation Expert with dual Stanford Medicine + Harvard Public Health training. Transform health uncertainty into confident, personalized action plans.',
          guidance:
            "Hi! I'm Dr. Luna Clearwater, your Personalized Health Assessment & Habit Formation Expert! I'll guide you through a comprehensive health evaluation to create a personalized action plan. Tell me about your health goals, current habits, dietary preferences, or any health concerns. I'll assess your needs and provide a detailed, structured report with actionable recommendations for sustainable lifestyle transformation!",
        };
      default:
        return {
          title: `Welcome! I'm ${RECIPE_BOT_PERSONAS[personaType].name}`,
          description: RECIPE_BOT_PERSONAS[personaType].description,
          guidance:
            "Start by telling me what kind of recipe you'd like to create, or use the preferences above to guide me.",
        };
    }
  };

  // Show persona selector if no conversation has started
  if (showPersonaSelector) {
    return <PersonaSelector onPersonaSelect={selectPersona} />;
  }

  // Ensure we have a persona before rendering chat
  if (!persona) {
    return <PersonaSelector onPersonaSelect={selectPersona} />;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      {/* Chat Header */}
      <ChatHeader
        selectedPersona={persona}
        generatedRecipe={generatedRecipe}
        isLoading={isLoading}
        onSaveRecipe={handleSaveRecipe}
        onConvertToRecipe={async () => {
          // Clear live filter selections when user explicitly chooses to create a recipe
          // (Back to Chat should preserve selections; only this action resets.)
          updateSelections({
            categories: [],
            cuisines: [],
            moods: [],
            availableIngredients: [],
          });
          handleSaveRecipe();
        }}
        onNewRecipe={startNewRecipe}
        onChangeAssistant={changePersona}
      />

      {/* Cuisine & Category Selector */}
      <div className="bg-base-100 border-t border-b p-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            🎯 Recipe Preferences (Optional)
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Select categories, cuisines, and moods to help guide your AI
            assistant in creating the perfect recipe
          </p>
          <CuisineCategorySelector
            onSelectionChange={handleCuisineCategoryChange}
            className=""
          />
        </div>
      </div>

      {/* User Profile Display - Phase 4 Integration */}
      {user?.id && persona && (
        <div className="bg-base-100 border-b p-4">
          <div className="max-w-4xl mx-auto">
            <UserProfileDisplay userId={user.id} liveSelections={selections} />
          </div>
        </div>
      )}

      {/* Chat Messages - Responsive height */}
      <div
        ref={scrollAreaRef}
        className={`${createDaisyUIScrollAreaClasses(
          'default',
          'bg-gray-50 p-4'
        )} ${
          messages.length === 0
            ? 'min-h-[150px] max-h-[250px] sm:min-h-[200px] sm:max-h-[300px]' // Compact when empty
            : 'min-h-[250px] max-h-[50vh] sm:min-h-[300px] sm:max-h-[60vh]' // Expand based on content
        } overflow-y-auto`}
      >
        {/* Welcome Message - Always visible when no conversation */}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-white shadow-sm ${getPersonaColor(persona)}`}
                >
                  {getPersonaIcon(persona)}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {getPersonaIntroduction(persona).title}
                </h3>
                <p className="text-sm text-gray-600 max-w-md">
                  {getPersonaIntroduction(persona).description}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {getPersonaIntroduction(persona).guidance}
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user'
                  ? 'flex-row-reverse space-x-reverse'
                  : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                  message.role === 'user'
                    ? 'bg-green-100'
                    : getPersonaColor(persona)
                }`}
              >
                <div
                  className={`flex items-center justify-center ${
                    message.role === 'user' ? 'text-green-600' : ''
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    getPersonaIcon(persona)
                  )}
                </div>
              </div>

              <div
                className={`${createDaisyUICardClasses('bordered')} max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-green-500 text-white'
                    : 'bg-base-100'
                }`}
              >
                <div className="card-body p-3">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div
                    className={`mt-2 text-xs ${
                      message.role === 'user'
                        ? 'text-green-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm ${getPersonaColor(persona)}`}
              >
                <div className="flex items-center justify-center">
                  {getPersonaIcon(persona)}
                </div>
              </div>
              <div
                className={`${createDaisyUICardClasses('bordered')} bg-base-100`}
              >
                <div className="card-body p-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    <span className="text-sm text-gray-600">
                      {RECIPE_BOT_PERSONAS[persona].name} is thinking...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Smart Save Recipe Button - Shows when there's conversation content */}
      {persona && messages.length > 2 && (
        <SmartCreateRecipeButton
          conversationContent={messages
            .map((m) => `${m.role}: ${m.content}`)
            .join('\n\n')}
          onRecipeParsed={onRecipeGenerated}
          className="bg-gradient-to-r from-green-50 to-blue-50 border-t"
          persona={persona}
          onGenerateReport={generateEvaluationReport}
          onSaveReport={saveEvaluationReport}
        />
      )}

      {/* Chat Input - Always visible and accessible */}
      <div className="bg-base-100 rounded-b-lg border-t p-4 sticky bottom-0 shadow-lg">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInputValue(e.target.value)
            }
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            disabled={isLoading}
            className={`${createDaisyUIInputClasses('bordered')} flex-1 min-h-[44px]`}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="bg-green-600 hover:bg-green-700 min-h-[44px] px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Press Enter to send, or Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}

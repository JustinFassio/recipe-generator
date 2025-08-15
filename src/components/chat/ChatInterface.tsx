import React, { useRef, useEffect } from 'react';
import { createDaisyUIButtonClasses } from '@/lib/button-migration';
import { createDaisyUIInputClasses } from '@/lib/input-migration';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { createDaisyUIScrollAreaClasses } from '@/lib/scroll-area-migration';
import {
  createDaisyUIAvatarClasses,
  createDaisyUIAvatarPlaceholderClasses,
} from '@/lib/avatar-migration';
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
import { useConversation } from '@/hooks/useConversation';
import { RECIPE_BOT_PERSONAS, type PersonaType } from '@/lib/openai';
import type { RecipeFormData } from '@/lib/schemas';

interface ChatInterfaceProps {
  onRecipeGenerated: (recipe: RecipeFormData) => void;
}

export function ChatInterface({ onRecipeGenerated }: ChatInterfaceProps) {
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
    convertToRecipe,
  } = useConversation();

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

    await sendMessage(messageContent);
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

  const getPersonaIcon = (personaType: PersonaType) => {
    switch (personaType) {
      case 'chef':
        return <ChefHat className="h-4 w-4" />;
      case 'nutritionist':
        return <Heart className="h-4 w-4" />;
      case 'homeCook':
        return <Home className="h-4 w-4" />;
      case 'assistantNutritionist':
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
        return 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
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
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
      {/* Chat Header */}
      <ChatHeader
        selectedPersona={persona}
        generatedRecipe={generatedRecipe}
        isLoading={isLoading}
        onSaveRecipe={handleSaveRecipe}
        onConvertToRecipe={convertToRecipe}
        onNewRecipe={startNewRecipe}
        onChangeAssistant={changePersona}
      />

      {/* Chat Messages */}
      <div
        ref={scrollAreaRef}
        className={createDaisyUIScrollAreaClasses(
          'default',
          'flex-1 bg-gray-50 p-4'
        )}
      >
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
                className={createDaisyUIAvatarClasses(
                  'sm',
                  `h-8 w-8 ${
                    message.role === 'user'
                      ? 'bg-green-100'
                      : getPersonaColor(persona)
                  }`
                )}
              >
                <div
                  className={createDaisyUIAvatarPlaceholderClasses(
                    message.role === 'user' ? 'text-green-600' : ''
                  )}
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
                    : 'bg-white'
                }`}
              >
                <div className="card-body p-3">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
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
                className={createDaisyUIAvatarClasses(
                  'sm',
                  `h-8 w-8 ${getPersonaColor(persona)}`
                )}
              >
                <div className={createDaisyUIAvatarPlaceholderClasses()}>
                  {getPersonaIcon(persona)}
                </div>
              </div>
              <div
                className={`${createDaisyUICardClasses('bordered')} bg-white`}
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

      {/* Chat Input */}
      <div className="rounded-b-lg border-t bg-white p-4">
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
            className={`${createDaisyUIInputClasses('bordered')} flex-1`}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`${createDaisyUIButtonClasses('default', 'sm')} bg-green-600 hover:bg-green-700`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Press Enter to send, or Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}

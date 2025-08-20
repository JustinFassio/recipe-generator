import { useState, useCallback } from 'react';
import { openaiAPI, RECIPE_BOT_PERSONAS, type PersonaType } from '@/lib/openai';
import type { RecipeFormData } from '@/lib/schemas';
import { toast } from '@/hooks/use-toast';
import { parseRecipeFromText } from '@/lib/recipe-parser';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationState {
  persona: PersonaType | null;
  messages: Message[];
  generatedRecipe: RecipeFormData | null;
  isLoading: boolean;
  showPersonaSelector: boolean;
  threadId: string | null;
  isUsingAssistant: boolean;
}

export interface ConversationActions {
  selectPersona: (persona: PersonaType) => void;
  sendMessage: (content: string) => Promise<void>;
  startNewRecipe: () => void;
  changePersona: () => void;
  saveRecipe: (recipe: RecipeFormData) => void;
  setGeneratedRecipe: (recipe: RecipeFormData | null) => void;
  convertToRecipe: () => Promise<void>;
  requestCompleteRecipe: () => Promise<void>;
}

export function useConversation(): ConversationState & ConversationActions {
  const [persona, setPersona] = useState<PersonaType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPersonaSelector, setShowPersonaSelector] = useState(true);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isUsingAssistant, setIsUsingAssistant] = useState(false);

  const selectPersona = useCallback((selectedPersona: PersonaType) => {
    setPersona(selectedPersona);
    setShowPersonaSelector(false);

    const personaConfig = RECIPE_BOT_PERSONAS[selectedPersona];

    // Check if this persona uses Assistant API
    const usingAssistant = !!(
      personaConfig.assistantId && personaConfig.isAssistantPowered
    );
    setIsUsingAssistant(usingAssistant);

    // Reset thread ID when switching personas
    setThreadId(null);

    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm ${personaConfig.name}, your AI Recipe Creator. I'll help you create a delicious recipe step by step. What kind of dish would you like to make today? You can tell me about a main ingredient, cuisine type, dietary preferences, or just describe what you're craving!`,
      timestamp: new Date(),
    };

    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || !persona) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Use smart routing to handle both Assistant API and Chat Completions
        const response = await openaiAPI.sendMessageWithPersona(
          [...messages, userMessage],
          persona,
          threadId
        );

        // Update thread ID if using Assistant API
        if (response.threadId) {
          setThreadId(response.threadId);
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // No automatic recipe detection - recipes will be created when user clicks "Save Recipe"
      } catch (error) {
        console.error('AI API error:', error);

        let errorDescription = 'Failed to get AI response. Please try again.';
        let errorContent =
          "I'm sorry, I'm having trouble connecting right now. Could you please try sending your message again?";

        if (error instanceof Error) {
          if (
            error.message.includes('Rate limit') ||
            error.message.includes('Too many requests')
          ) {
            errorDescription =
              'Rate limit reached. Please wait 30 seconds before trying again.';
            errorContent =
              "I'm getting too many requests right now. Please wait about 30 seconds and then try your message again. Thanks for your patience!";
          } else if (error.message.includes('API key')) {
            errorDescription =
              'API configuration issue. Please check your OpenAI settings.';
            errorContent =
              'There seems to be an issue with my configuration. Please contact support if this continues.';
          } else if (error.message.includes('Access denied')) {
            errorDescription =
              'Access denied. Please check your OpenAI account permissions.';
            errorContent =
              "I don't have permission to access the AI service right now. Please contact support.";
          } else if (
            error.message.includes('Assistant') ||
            error.message.includes('thread') ||
            error.message.includes('timeout')
          ) {
            errorDescription =
              'Assistant service temporarily unavailable. Using standard chat instead.';
            errorContent =
              "I'm having trouble with my advanced features right now, but I can still help you with recipes using my standard capabilities!";
          }
        }

        toast({
          title: 'Error',
          description: errorDescription,
          variant: 'destructive',
        });

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, persona, isLoading, threadId]
  );

  const startNewRecipe = useCallback(() => {
    const shouldConfirm = messages.length > 1 || !!generatedRecipe;
    if (shouldConfirm) {
      const ok = window.confirm(
        'Start a new recipe? This will clear the current conversation.'
      );
      if (!ok) return;
    }

    if (persona) {
      const personaConfig = RECIPE_BOT_PERSONAS[persona];
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Great! Let's start fresh. I'm ${personaConfig.name}. What would you like to make today?`,
        timestamp: new Date(),
      };

      setGeneratedRecipe(null);
      setMessages([welcomeMessage]);
      setShowPersonaSelector(false); // stay in chat with same persona
    }
  }, [messages.length, generatedRecipe, persona]);

  const changePersona = useCallback(() => {
    setShowPersonaSelector(true);
    setMessages([]);
    setGeneratedRecipe(null);
    setPersona(null);
    setThreadId(null); // Clear thread when changing personas
    setIsUsingAssistant(false);
  }, []);

  const saveRecipe = useCallback((recipe: RecipeFormData) => {
    // This will be handled by the parent component
    // The hook just manages the conversation state
    console.log('Recipe saved:', recipe);
  }, []);

  const convertToRecipe = useCallback(async () => {
    if (!persona || messages.length < 2) {
      toast({
        title: 'Not enough conversation',
        description:
          'Please have a conversation about a recipe before trying to save.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Extract recipe text from the most recent assistant messages
      // Look for the last few assistant messages that likely contain the recipe
      const assistantMessages = messages
        .filter((msg) => msg.role === 'assistant')
        .slice(-5); // Get last 5 assistant messages to have more context

      if (assistantMessages.length === 0) {
        throw new Error('No recipe content found in conversation');
      }

      // Combine the assistant messages to get the full recipe text
      const recipeText = assistantMessages
        .map((msg) => msg.content)
        .join('\n\n');

      // Debug logs for troubleshooting
      console.log(
        'Raw recipe text to parse:',
        recipeText.substring(0, 200) + '...'
      );
      console.log('Number of assistant messages:', assistantMessages.length);
      console.log(
        'Full conversation context:',
        messages.map((m) => `${m.role}: ${m.content.substring(0, 100)}...`)
      );

      // Check if the text actually contains recipe-like content
      const hasRecipeContent =
        /ingredient|instruction|recipe|cook|bake|mix|add|cup|tablespoon|teaspoon|oz|lb/i.test(
          recipeText
        );
      const hasJsonRecipe = /{\s*"title"|"ingredients"|"instructions"/i.test(
        recipeText
      );

      // Only block if it's clearly advice content AND doesn't have recipe structure
      const isPureAdviceContent =
        /meal plan|integration|implementation|outcome|strategy|approach/i.test(
          recipeText
        ) &&
        !/ingredient|instruction|recipe|cook|bake/i.test(recipeText) &&
        !hasJsonRecipe;

      if (!hasRecipeContent && !hasJsonRecipe) {
        toast({
          title: 'No Recipe Found',
          description:
            "The conversation doesn't contain a complete recipe yet. Try asking the AI to provide a full recipe with ingredients and instructions.",
          variant: 'destructive',
        });
        return;
      }

      if (isPureAdviceContent) {
        toast({
          title: 'No Recipe Found',
          description:
            'The AI is providing meal planning advice instead of a recipe. Ask for a complete recipe with specific ingredients and cooking instructions.',
          variant: 'destructive',
        });
        return;
      }

      // Use the existing parsing infrastructure (same as parse-recipe-form)
      const recipe = await parseRecipeFromText(recipeText);

      console.log('Parsed recipe result:', recipe);

      setGeneratedRecipe(recipe);

      toast({
        title: 'Recipe Parsed!',
        description:
          'Your recipe has been parsed and is ready to review and save.',
      });
    } catch (error) {
      console.error('Recipe parsing error:', error);

      let errorDescription =
        'Failed to parse recipe from conversation. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('format')) {
          errorDescription =
            'Could not parse the recipe format. The AI response may not contain a complete recipe.';
        } else if (error.message.includes('No recipe content')) {
          errorDescription =
            'No recipe found in the conversation. Try asking the AI to provide a complete recipe.';
        }
      }

      toast({
        title: 'Parsing Failed',
        description: errorDescription,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [persona, messages]);

  const requestCompleteRecipe = useCallback(async () => {
    if (!persona) return;

    const recipeRequest =
      "Can you please provide a complete recipe with a clear title, list of ingredients with measurements, and step-by-step cooking instructions? I'd like to save this as a recipe card.";
    await sendMessage(recipeRequest);
  }, [persona, sendMessage]);

  return {
    // State
    persona,
    messages,
    generatedRecipe,
    isLoading,
    showPersonaSelector,
    threadId,
    isUsingAssistant,
    // Actions
    selectPersona,
    sendMessage,
    startNewRecipe,
    changePersona,
    saveRecipe,
    setGeneratedRecipe,
    convertToRecipe,
    requestCompleteRecipe,
  };
}

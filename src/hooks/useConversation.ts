import { useState, useCallback, useEffect } from 'react';
import { openaiAPI, RECIPE_BOT_PERSONAS, type PersonaType } from '@/lib/openai';
import type { RecipeFormData } from '@/lib/schemas';
import { toast } from '@/hooks/use-toast';
import { parseRecipeFromText } from '@/lib/recipe-parser';
import { useAuth } from '@/contexts/AuthProvider';

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
  showSaveRecipeButton: boolean;
  hasEvaluationReport: boolean;
  generatedEvaluationReport: string | null;
}

export interface ConversationActions {
  selectPersona: (persona: PersonaType) => void;
  sendMessage: (
    content: string,
    preferences?: { categories: string[]; cuisines: string[]; moods: string[] }
  ) => Promise<void>;
  startNewRecipe: () => void;
  changePersona: () => void;
  saveRecipe: (recipe: RecipeFormData) => void;
  setGeneratedRecipe: (recipe: RecipeFormData | null) => void;
  convertToRecipe: () => Promise<void>;
  requestCompleteRecipe: () => Promise<void>;
  saveCurrentRecipe: () => Promise<void>;
  generateEvaluationReport: () => Promise<void>;
  saveEvaluationReport: () => Promise<void>;
}

export function useConversation(
  defaultPersona?: PersonaType
): ConversationState & ConversationActions {
  const { user } = useAuth();
  const [persona, setPersona] = useState<PersonaType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPersonaSelector, setShowPersonaSelector] =
    useState(!defaultPersona);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isUsingAssistant, setIsUsingAssistant] = useState(false);
  const [showSaveRecipeButton, setShowSaveRecipeButton] = useState(false);
  const [hasEvaluationReport, setHasEvaluationReport] = useState(false);
  const [generatedEvaluationReport, setGeneratedEvaluationReport] = useState<
    string | null
  >(null);

  const selectPersona = useCallback(
    async (selectedPersona: PersonaType) => {
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

      // Phase 4: Get user profile data and enhance the welcome message
      let welcomeContent = `Hi! I'm ${personaConfig.name}, your AI Recipe Creator. I'll help you create a delicious recipe step by step. What kind of dish would you like to make today? You can tell me about a main ingredient, cuisine type, dietary preferences, or just describe what you're craving!`;

      if (user?.id) {
        try {
          // Dynamic import to avoid SSR issues
          const { getUserDataForAI, buildEnhancedAIPrompt } = await import(
            '@/lib/ai'
          );
          const userData = await getUserDataForAI(user.id);

          // Create a personalized welcome message with user context
          // Note: enhancedPrompt is used internally by buildEnhancedAIPrompt
          buildEnhancedAIPrompt(
            personaConfig.systemPrompt,
            'User is starting a conversation with this AI assistant',
            userData
          );

          // Generate a personalized, actionable welcome message
          welcomeContent = `Hi! I'm ${personaConfig.name}, your AI Recipe Creator. 

**Your Profile Summary:**
• **Skill Level**: ${userData.profile.skill_level || 'Beginner'} cook
• **Available Time**: ${userData.profile.time_per_meal || '45'} minutes per meal
• **Preferred Cuisines**: ${userData.cooking.preferred_cuisines.join(', ')}
• **Equipment**: ${userData.cooking.available_equipment.join(', ')}
• **Safety**: ${userData.safety.allergies.length > 0 ? `Allergies to ${userData.safety.allergies.join(', ')}` : 'No allergies reported'}

**Ready to Begin?** 

I'm here to create the perfect recipe for you! To get started, I need to know:

**What's your main ingredient or craving today?** 
(You can tell me about a specific ingredient, cuisine type, or just describe what you're in the mood for!)

I'll ensure all recommendations are safe for your dietary needs and tailored to your skill level and time constraints.`;

          // SILENT CONTEXT INJECTION: Send user profile data to OpenAI Assistant immediately
          if (usingAssistant && personaConfig.assistantId) {
            try {
              // Use the comprehensive context builder for better structure
              const { getComprehensiveUserContext } = await import('@/lib/ai');
              const contextData = await getComprehensiveUserContext(user.id);

              // Convert context data to a string format for the message
              const contextMessage = `User Profile Context:
- Skill Level: ${contextData.userData.profile.skill_level}
- Time per Meal: ${contextData.userData.profile.time_per_meal} minutes
- Allergies: ${contextData.userData.safety.allergies.join(', ') || 'None'}
- Dietary Restrictions: ${contextData.userData.safety.dietary_restrictions.join(', ') || 'None'}
- Preferred Cuisines: ${contextData.userData.cooking.preferred_cuisines.join(', ')}
- Disliked Ingredients: ${contextData.userData.cooking.disliked_ingredients.join(', ') || 'None'}
- Spice Tolerance: ${contextData.userData.cooking.spice_tolerance}/5
- Household Members: ${contextData.household.length} (${contextData.household.map((m) => m.name).join(', ')})
- Available Equipment: ${contextData.userData.cooking.available_equipment.join(', ')}`;

              // Send this context message silently to the OpenAI Assistant
              // This will make the assistant "think" about the user's profile
              const silentResponse = await openaiAPI.sendMessageWithPersona(
                [
                  {
                    id: 'context-injection',
                    role: 'user',
                    content: contextMessage,
                    timestamp: new Date(),
                  },
                ],
                selectedPersona,
                null, // No thread ID yet
                user.id
              );

              // Store the thread ID for future messages
              if (silentResponse.threadId) {
                setThreadId(silentResponse.threadId);
              }

              // Use the Assistant API response as the welcome message instead of hardcoded content
              if (silentResponse.message) {
                welcomeContent = silentResponse.message;
              }

              console.log(
                'Silent context injection completed for OpenAI Assistant:',
                selectedPersona
              );
            } catch (contextError) {
              console.warn(
                'Silent context injection failed, continuing with normal flow:',
                contextError
              );
            }
          }

          console.log(
            'Phase 4: Enhanced persona selection with user data for',
            selectedPersona
          );
        } catch (error) {
          console.warn(
            'Phase 4: Failed to load user data during persona selection:',
            error
          );
          // Continue with default welcome message if user data loading fails
        }
      }

      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date(),
      };

      setMessages([welcomeMessage]);
    },
    [user?.id]
  );

  // Auto-select default persona if provided
  useEffect(() => {
    if (defaultPersona && !persona) {
      selectPersona(defaultPersona);
    }
  }, [defaultPersona, persona, selectPersona]);

  const sendMessage = useCallback(
    async (
      content: string,
      preferences?: {
        categories: string[];
        cuisines: string[];
        moods: string[];
      }
    ) => {
      if (!content.trim() || isLoading || !persona) return;

      // Enhance message with preferences if provided
      let enhancedContent = content.trim();
      if (
        preferences &&
        (preferences.categories.length > 0 ||
          preferences.cuisines.length > 0 ||
          preferences.moods.length > 0)
      ) {
        let preferenceText = '\n\n**Recipe Preferences:**\n';
        if (preferences.cuisines.length > 0) {
          preferenceText += `• **Cuisines:** ${preferences.cuisines.join(', ')}\n`;
        }
        if (preferences.categories.length > 0) {
          preferenceText += `• **Categories:** ${preferences.categories.join(', ')}\n`;
        }
        if (preferences.moods.length > 0) {
          preferenceText += `• **Moods:** ${preferences.moods.join(', ')}\n`;
        }
        enhancedContent += preferenceText;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: enhancedContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Use smart routing to handle both Assistant API and Chat Completions
        const response = await openaiAPI.sendMessageWithPersona(
          [...messages, userMessage],
          persona,
          threadId,
          user?.id,
          preferences // Pass live selections as overrides
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

        // Check if AI is asking if user is ready to save the recipe
        // Regex pattern to detect if the AI is prompting the user to save or finalize a recipe.
        // Matches phrases like "ready to save recipe", "create and save recipe", "finalize recipe", etc.
        const SAVE_INTENTION_REGEX =
          /ready.*create.*save.*recipe|ready.*save.*recipe|create.*save.*recipe|ready.*save|want.*save.*recipe|save.*this.*recipe|create.*recipe|finalize.*recipe|ready.*finalize/i;
        const isReadyToSave = SAVE_INTENTION_REGEX.test(response.message);
        setShowSaveRecipeButton(isReadyToSave);

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
      const parsedRecipe = await parseRecipeFromText(recipeText);

      console.log('Parsed recipe result:', parsedRecipe);

      // Convert ParsedRecipe to the expected format
      const recipe = {
        title: parsedRecipe.title,
        ingredients: parsedRecipe.ingredients,
        instructions: parsedRecipe.instructions,
        notes: parsedRecipe.notes || '',
        image_url: null,
      };

      setGeneratedRecipe({
        ...recipe,
        categories: parsedRecipe.categories || [],
        setup: parsedRecipe.setup || [],
      });

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

  const saveCurrentRecipe = useCallback(async () => {
    if (!persona) return;

    setIsLoading(true);
    try {
      // Find the last assistant message that contains a recipe
      const lastAssistantMessage = messages
        .slice()
        .reverse()
        .find((msg) => msg.role === 'assistant' && msg.content);

      if (!lastAssistantMessage) {
        throw new Error('No assistant message found to extract recipe from');
      }

      console.log(
        '🔍 Extracting recipe from last assistant message:',
        lastAssistantMessage.content
      );

      // Try to parse the JSON from the last assistant message
      try {
        console.log('🔍 Full response message:', lastAssistantMessage.content);

        // Extract JSON from the response (might be wrapped in markdown or text)
        let jsonText = null;

        // First, try to find JSON in markdown code blocks
        const jsonBlockMatch = lastAssistantMessage.content.match(
          /```json\s*([\s\S]*?)\s*```/
        );
        if (jsonBlockMatch) {
          jsonText = jsonBlockMatch[1].trim();
          console.log('📄 Found JSON in markdown block:', jsonText);
        } else {
          // Try to find JSON object in the text - look for complete JSON objects
          const jsonMatches = lastAssistantMessage.content.match(
            /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
          );
          if (jsonMatches && jsonMatches.length > 0) {
            // Try each match until we find valid JSON
            for (const match of jsonMatches) {
              try {
                JSON.parse(match);
                jsonText = match;
                console.log('📄 Found valid JSON in text:', jsonText);
                break;
              } catch {
                // Continue to next match
              }
            }
          }
        }

        if (jsonText) {
          console.log('🧪 Attempting to parse JSON:', jsonText);
          const recipeData = JSON.parse(jsonText);

          // Convert to RecipeFormData format
          const recipe: RecipeFormData = {
            title: recipeData.title || 'Untitled Recipe',
            ingredients: recipeData.ingredients || [],
            instructions: recipeData.instructions || '',
            notes: recipeData.notes || '',
            setup: recipeData.setup || [],
            categories: recipeData.categories || [],
            image_url: null,
          };

          // Set the generated recipe and trigger form opening
          console.log('Setting generated recipe:', recipe);
          setGeneratedRecipe(recipe);
          setShowSaveRecipeButton(false);

          toast({
            title: 'Recipe Generated!',
            description: `"${recipe.title}" is ready to save. Please review and save it to your collection.`,
          });
        } else {
          console.log('No JSON found in last message, trying AI extraction...');

          // Fallback: Use AI to extract recipe from the last message
          const extractRequest = `Please extract the recipe from this conversation and format it as JSON:
          
${lastAssistantMessage.content}

Format as: {"title": "Recipe Name", "ingredients": ["ingredient 1", "ingredient 2"], "instructions": "Step-by-step instructions", "notes": "Additional notes", "setup": ["prep step 1"], "categories": ["category 1"]}`;

          const response = await openaiAPI.sendMessageWithPersona(
            [
              {
                id: Date.now().toString(),
                role: 'user',
                content: extractRequest,
                timestamp: new Date(),
              },
            ],
            persona,
            threadId,
            user?.id
          );

          // Try to parse the AI-extracted JSON
          const jsonBlockMatch = response.message.match(
            /```json\s*([\s\S]*?)\s*```/
          );
          if (jsonBlockMatch) {
            const recipeData = JSON.parse(jsonBlockMatch[1]);
            const recipe: RecipeFormData = {
              title: recipeData.title || 'Untitled Recipe',
              ingredients: recipeData.ingredients || [],
              instructions: recipeData.instructions || '',
              notes: recipeData.notes || '',
              setup: recipeData.setup || [],
              categories: recipeData.categories || [],
              image_url: null,
            };

            setGeneratedRecipe(recipe);
            setShowSaveRecipeButton(false);

            toast({
              title: 'Recipe Generated!',
              description: `"${recipe.title}" is ready to save. Please review and save it to your collection.`,
            });
          } else {
            throw new Error('No valid JSON found in response');
          }
        }
      } catch (parseError) {
        console.error('Failed to parse recipe JSON:', parseError);
        console.error(
          'Response that failed to parse:',
          lastAssistantMessage.content
        );
        toast({
          title: 'Save Failed',
          description: 'Could not parse the recipe format. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to save recipe:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save the recipe. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [persona, messages, threadId, user?.id, setGeneratedRecipe]);

  const generateEvaluationReport = useCallback(async () => {
    if (!persona || persona !== 'drLunaClearwater') return;

    setIsLoading(true);
    try {
      // Generate report in 3 parts to avoid truncation and tool requirements
      const reportParts = [
        {
          part: 1,
          request: `Please generate PART 1 of the user evaluation report. Focus on the foundational sections:

\`\`\`json
{
  "user_evaluation_report": {
    "report_id": "eval_2025_01_17_usr_[unique_id]",
    "evaluation_date": "[current_date_time]",
    "dietitian": "Dr. Luna Clearwater",
    "report_version": "1.0",
    "user_profile_summary": {
      "user_id": "[generated_unique_id]",
      "evaluation_completeness": [percentage],
      "data_quality_score": [percentage],
      "last_updated": "[current_date_time]"
    },
    "safety_assessment": {
      "status": "[VERIFIED/REVIEW_NEEDED]",
      "critical_alerts": [...],
      "dietary_restrictions": [...],
      "medical_considerations": [...]
    },
    "personalization_matrix": {
      "skill_profile": {...},
      "time_analysis": {...},
      "equipment_optimization": {...},
      "cultural_preferences": {...},
      "ingredient_landscape": {...}
    }
  }
}
\`\`\`

Generate realistic data based on our conversation. Use current dates and appropriate percentages.`,
        },
        {
          part: 2,
          request: `Please generate PART 2 of the user evaluation report. Focus on analysis and recommendations:

\`\`\`json
{
  "nutritional_analysis": {
    "current_status": {
      "overall_diet_quality_score": [percentage],
      "nutritional_completeness": [percentage],
      "anti_inflammatory_index": [percentage],
      "gut_health_score": [percentage],
      "metabolic_health_score": [percentage]
    },
    "deficiency_risks": [...],
    "optimization_priorities": [...]
  },
  "personalized_recommendations": {
    "immediate_actions": [...],
    "weekly_structure": {
      "meal_framework": {...},
      "cuisine_rotation": {...}
    },
    "progressive_challenges": [...]
  },
  "meal_suggestions": {
    "signature_recipes": [...],
    "quick_options": [...],
    "batch_cooking_priorities": [...]
  }
}
\`\`\`

Generate realistic data based on our conversation.`,
        },
        {
          part: 3,
          request: `Please generate PART 3 of the user evaluation report. Focus on tracking and support:

\`\`\`json
{
  "progress_tracking": {
    "key_metrics": [...],
    "milestone_markers": [...]
  },
  "risk_mitigation": {
    "adherence_barriers": [...],
    "safety_reminders": [...]
  },
  "support_resources": {
    "education_modules": [...],
    "tools_provided": [...],
    "community_connections": [...]
  },
  "next_steps": {
    "immediate_72_hours": [...],
    "week_1_goals": [...],
    "month_1_objectives": [...]
  },
  "professional_notes": {
    "strengths_observed": "[specific_strengths]",
    "growth_opportunities": "[specific_opportunities]",
    "collaboration_recommendations": "[specific_recommendations]",
    "reassessment_schedule": "[specific_schedule]"
  },
  "report_metadata": {
    "confidence_level": [percentage],
    "data_completeness": [percentage],
    "personalization_depth": "[high/medium/low]",
    "evidence_base": "[strong/moderate/developing]",
    "last_literature_review": "[date]",
    "next_update_recommended": "[date]"
  }
}
\`\`\`

Generate realistic data based on our conversation.`,
        },
      ];

      let fullReport = '';
      let reportData = {};

      // Generate each part
      for (const partInfo of reportParts) {
        const response = await openaiAPI.sendMessageWithPersona(
          [
            ...messages,
            {
              id: Date.now().toString(),
              role: 'user',
              content: partInfo.request,
              timestamp: new Date(),
            },
          ],
          persona,
          threadId,
          user?.id
        );

        // Add the part request and response to messages
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: partInfo.request,
          timestamp: new Date(),
        };

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);

        // Extract JSON from this part
        const codeBlockMatch = response.message.match(
          /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
        );
        if (codeBlockMatch) {
          try {
            const partData = JSON.parse(codeBlockMatch[1]);
            reportData = { ...reportData, ...partData };
            fullReport += response.message + '\n\n';
          } catch (parseError) {
            console.warn(`Failed to parse part ${partInfo.part}:`, parseError);
            fullReport += response.message + '\n\n';
          }
        } else {
          fullReport += response.message + '\n\n';
        }

        // Small delay between parts to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Store the complete report
      setGeneratedEvaluationReport(fullReport);
      setHasEvaluationReport(true);

      toast({
        title: 'Evaluation Report Generated!',
        description:
          'Your comprehensive health evaluation report is ready to save.',
      });
    } catch (error) {
      console.error('Failed to generate evaluation report:', error);
      toast({
        title: 'Generation Failed',
        description:
          'Could not generate the evaluation report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [persona, messages, threadId, user?.id]);

  const saveEvaluationReport = useCallback(async () => {
    if (!user?.id || !generatedEvaluationReport) return;

    setIsLoading(true);
    try {
      // Import the evaluation report storage functions
      const { saveEvaluationReport: saveReport } = await import(
        '@/lib/evaluation-report-storage'
      );

      // Try to parse the multi-part JSON response from Dr. Luna
      let reportData: Record<string, unknown> = {};
      let hasValidData = false;

      try {
        // Find all JSON code blocks in the multi-part response
        const codeBlockMatches = generatedEvaluationReport.match(
          /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g
        );

        if (codeBlockMatches) {
          // Parse each JSON block and merge them
          for (const match of codeBlockMatches) {
            const jsonMatch = match.match(
              /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
            );
            if (jsonMatch) {
              try {
                const partData = JSON.parse(jsonMatch[1]);
                reportData = { ...reportData, ...partData };
                hasValidData = true;
              } catch (partParseError) {
                console.warn(
                  'Failed to parse part of evaluation report:',
                  partParseError
                );
              }
            }
          }
        }

        // If we couldn't parse JSON blocks, try to save the raw text as a report
        if (!hasValidData) {
          // Create a basic report structure with the raw content
          reportData = {
            user_evaluation_report: {
              report_id: `eval_${new Date().toISOString().split('T')[0]}_usr_${user.id.slice(-8)}`,
              evaluation_date: new Date().toISOString(),
              dietitian: 'Dr. Luna Clearwater',
              report_version: '1.0',
              raw_content: generatedEvaluationReport,
              report_type: 'multi_part_text',
              user_profile_summary: {
                user_id: user.id,
                evaluation_completeness: 100,
                data_quality_score: 85,
                last_updated: new Date().toISOString(),
              },
              report_metadata: {
                confidence_level: 85,
                data_completeness: 100,
                personalization_depth: 'high',
                evidence_base: 'strong',
                last_literature_review: new Date().toISOString().split('T')[0],
                next_update_recommended: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                )
                  .toISOString()
                  .split('T')[0],
              },
            },
          };
          hasValidData = true;
        }
      } catch (parseError) {
        console.error('Failed to parse evaluation report:', parseError);
        console.error('Raw response:', generatedEvaluationReport);

        // Create a fallback report with the raw content
        reportData = {
          user_evaluation_report: {
            report_id: `eval_${new Date().toISOString().split('T')[0]}_usr_${user.id.slice(-8)}`,
            evaluation_date: new Date().toISOString(),
            dietitian: 'Dr. Luna Clearwater',
            report_version: '1.0',
            raw_content: generatedEvaluationReport,
            report_type: 'fallback_text',
            user_profile_summary: {
              user_id: user.id,
              evaluation_completeness: 100,
              data_quality_score: 75,
              last_updated: new Date().toISOString(),
            },
            report_metadata: {
              confidence_level: 75,
              data_completeness: 100,
              personalization_depth: 'medium',
              evidence_base: 'moderate',
              last_literature_review: new Date().toISOString().split('T')[0],
              next_update_recommended: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              )
                .toISOString()
                .split('T')[0],
            },
          },
        };
        hasValidData = true;
      }

      if (!hasValidData) {
        throw new Error('No valid report data could be extracted');
      }

      // Save the evaluation report
      saveReport(
        user.id,
        reportData as unknown as Parameters<typeof saveReport>[1]
      );

      toast({
        title: 'Evaluation Report Saved!',
        description:
          'Your health evaluation report has been saved to your health reports.',
      });

      // Reset the report state
      setHasEvaluationReport(false);
      setGeneratedEvaluationReport(null);
    } catch (error) {
      console.error('Failed to save evaluation report:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save the evaluation report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, generatedEvaluationReport]);

  return {
    // State
    persona,
    messages,
    generatedRecipe,
    isLoading,
    showPersonaSelector,
    threadId,
    isUsingAssistant,
    showSaveRecipeButton,
    hasEvaluationReport,
    generatedEvaluationReport,
    // Actions
    selectPersona,
    sendMessage,
    startNewRecipe,
    changePersona,
    saveRecipe,
    setGeneratedRecipe,
    convertToRecipe,
    requestCompleteRecipe,
    saveCurrentRecipe,
    generateEvaluationReport,
    saveEvaluationReport,
  };
}

import type { RecipeFormData } from './schemas';
import { AssistantAPI } from './assistantAPI';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  message: string;
  recipe?: RecipeFormData;
}

// Define the persona configuration interface
interface PersonaConfig {
  name: string;
  systemPrompt: string;
  assistantId?: string;
  isAssistantPowered?: boolean;
  description?: string;
}

// Persona configurations
export const RECIPE_BOT_PERSONAS: Record<string, PersonaConfig> = {
  chef: {
    name: "Chef Marco",
    systemPrompt: `You are Chef Marco, an experienced Italian chef with 20+ years of culinary expertise. You specialize in Mediterranean cuisine and love teaching cooking techniques.

Your personality:
- Warm, enthusiastic, and encouraging
- Loves sharing cooking tips and techniques
- Emphasizes fresh ingredients and traditional methods
- Speaks with culinary authority but remains approachable
- Uses Italian cooking terms and explains them

Your role:
- Help users create delicious recipes step by step
- Ask thoughtful questions about preferences and skill level
- Provide cooking tips and technique explanations
- Suggest ingredient substitutions and variations
- Guide users through the entire recipe creation process

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step-by-step cooking instructions",
  "notes": "Tips, variations, and additional notes"
}`,
  },
  
  nutritionist: {
    name: "Dr. Sarah",
    systemPrompt: `You are Dr. Sarah, a registered dietitian and nutrition expert. You focus on healthy, balanced meals that are both nutritious and delicious.

Your personality:
- Knowledgeable about nutrition and health
- Encouraging and supportive of healthy eating
- Practical and realistic about cooking time and ingredients
- Explains the nutritional benefits of ingredients
- Suggests healthy alternatives and substitutions

Your role:
- Help users create nutritious, balanced recipes
- Consider dietary restrictions and health goals
- Explain nutritional benefits of ingredients
- Suggest healthy cooking methods
- Provide portion and serving size guidance

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step-by-step cooking instructions",
  "notes": "Nutritional info, tips, and healthy variations"
}`,
  },
  
  homeCook: {
    name: "Aunt Jenny",
    systemPrompt: `You are Aunt Jenny, a beloved home cook who has been cooking for family and friends for decades. You specialize in comfort food and family-friendly recipes.

Your personality:
- Warm, nurturing, and family-oriented
- Loves sharing family recipes and traditions
- Practical about time and budget constraints
- Encouraging for cooks of all skill levels
- Uses simple, accessible ingredients

Your role:
- Help users create comforting, family-friendly recipes
- Focus on practical cooking for busy families
- Suggest budget-friendly ingredient options
- Share cooking tips learned from experience
- Emphasize the joy of cooking and sharing meals

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step-by-step cooking instructions",
  "notes": "Family tips, variations, and serving suggestions"
}`,
  },
  
  assistantNutritionist: {
    name: "Dr. Sage Vitalis",
    systemPrompt: `You are Dr. Sage Vitalis, an advanced AI nutritionist with deep expertise in personalized nutrition, metabolic health, and evidence-based dietary interventions.

Your capabilities:
- Personalized meal planning based on individual health profiles
- Advanced nutritional analysis and optimization
- Integration of latest nutritional research
- Consideration of genetic factors, lifestyle, and health conditions

Your personality:
- Scientifically rigorous yet approachable
- Focuses on sustainable, evidence-based recommendations
- Considers individual bio-individuality
- Emphasizes long-term health optimization

Your role:
- Help users create optimized, personalized recipes
- Provide detailed nutritional analysis and recommendations
- Consider individual health goals and dietary restrictions
- Suggest evidence-based ingredient modifications
- Guide users through personalized nutrition strategies

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step-by-step cooking instructions",
  "notes": "Nutritional analysis, health benefits, and personalization tips"
}

Note: This is fallback mode - use this prompt if Assistant API is unavailable.`,
    assistantId: "asst_o3VGUZBpdYTdKEyKYoKua8ys",
    isAssistantPowered: true,
    description: "Advanced AI nutritionist with personalized meal planning and health insights"
  }
};

export type PersonaType = keyof typeof RECIPE_BOT_PERSONAS;

class OpenAIAPI {
  private apiKey: string;
  private model: string;
  private baseURL = 'https://api.openai.com/v1';
  private maxRetries = 3;
  private maxConversationTurns = 10;
  private assistantAPI: AssistantAPI;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment variables.');
    }
    
    // Initialize Assistant API
    this.assistantAPI = new AssistantAPI(this.apiKey);
  }

  private async requestWithRetry(url: string, init: RequestInit, retries = this.maxRetries): Promise<Response> {
    let delay = 500;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, init);
        
        // Success - return response
        if (response.ok) {
          return response;
        }
        
        // Rate limit or server error - retry with backoff
        if (response.status === 429 || response.status >= 500) {
          if (attempt === retries) {
            return response; // Return the failed response on final attempt
          }
          
          // Add jitter to prevent thundering herd
          const jitter = Math.random() * 200;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
          delay *= 2; // Exponential backoff
          continue;
        }
        
        // Other errors (4xx) - don't retry
        return response;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        // Network error - retry with backoff
        const jitter = Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
        delay *= 2;
      }
    }
    throw new Error('Unreachable');
  }

  async chatWithPersona(
    messages: Message[],
    persona: PersonaType
  ): Promise<ChatResponse> {
    const personaConfig = RECIPE_BOT_PERSONAS[persona];
    
    // Limit conversation history to save tokens and reduce 429 risk
    const recentMessages = messages.slice(-this.maxConversationTurns);
    
    // Prepare messages for OpenAI API
    const openAIMessages = [
      {
        role: 'system' as const,
        content: personaConfig.systemPrompt
      },
      ...recentMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    try {
      // Use retry logic for the API call
      const response = await this.requestWithRetry(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: openAIMessages,
          temperature: 0.8, // Natural and creative for conversation
          max_tokens: 800,
          top_p: 1.0,
          // No response_format - let it respond naturally
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenAI configuration.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Please check your OpenAI account permissions.');
        }
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('No response from OpenAI API');
      }

      // Simple natural text response - no JSON parsing during chat
      // Recipe detection will happen when user clicks "Save Recipe"
      return {
        message: assistantMessage
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Rate limit')) {
          throw new Error('Too many requests. Please wait 30 seconds and try again.');
        }
        if (error.message.includes('API key')) {
          throw new Error('OpenAI API key issue. Please check your configuration.');
        }
        throw error;
      }
      
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  // Method to generate structured recipe when user explicitly requests it
  async generateStructuredRecipe(
    messages: Message[],
    persona: PersonaType
  ): Promise<ChatResponse> {
    const personaConfig = RECIPE_BOT_PERSONAS[persona];
    
    // Limit conversation history
    const recentMessages = messages.slice(-this.maxConversationTurns);
    
    const openAIMessages = [
      {
        role: 'system' as const,
        content: personaConfig.systemPrompt + '\n\nPlease respond with a valid JSON object containing the complete recipe in this exact format: {"title": "Recipe Name", "ingredients": ["ingredient 1", "ingredient 2"], "instructions": "Step-by-step instructions", "notes": "Additional notes"}'
      },
      ...recentMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: 'Please create a complete, structured recipe based on our conversation.'
      }
    ];

    try {
      const response = await this.requestWithRetry(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: openAIMessages,
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" } // Only use JSON format when explicitly requesting structured recipe
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('No response from OpenAI API');
      }

      try {
        const parsed = JSON.parse(assistantMessage);
        if (parsed.title && parsed.ingredients && parsed.instructions) {
          return {
            message: `Perfect! I've created a complete recipe for you:`,
            recipe: {
              title: parsed.title,
              ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
              instructions: parsed.instructions,
              notes: parsed.notes || ''
            }
          };
        }
      } catch {
        // JSON parsing failed
        throw new Error('Failed to generate structured recipe. Please try again.');
      }

      return {
        message: assistantMessage
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate recipe. Please try again.');
    }
  }

  // Removed: convertConversationToRecipe() - now using parseRecipeFromText() instead

  /**
   * Send message using Assistant API
   */
  async chatWithAssistant(
    threadId: string | null,
    assistantId: string,
    message: string
  ): Promise<{ response: ChatResponse; threadId: string }> {
    try {
      const result = await this.assistantAPI.sendMessage(threadId, assistantId, message);
      
      return {
        response: {
          message: result.response.message,
          recipe: result.response.recipe
        },
        threadId: result.threadId
      };
    } catch (error) {
      console.error('Assistant API error:', error);
      throw error; // Re-throw to be handled by fallback logic
    }
  }

  /**
   * Smart message routing - uses Assistant API if persona supports it, otherwise falls back to Chat Completions
   */
  async sendMessageWithPersona(
    messages: Message[],
    persona: PersonaType,
    threadId?: string | null
  ): Promise<ChatResponse & { threadId?: string }> {
    const personaConfig = RECIPE_BOT_PERSONAS[persona];
    
    // Check if persona supports Assistant API
    if (personaConfig.assistantId && personaConfig.isAssistantPowered) {
      try {
        const userMessage = messages[messages.length - 1];
        
        // Add a timeout to prevent hanging
        const assistantPromise = this.chatWithAssistant(
          threadId || null,
          personaConfig.assistantId,
          userMessage.content
        );
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Assistant API request timed out after 60 seconds'));
          }, 60000); // 60 second timeout
        });
        
        const result = await Promise.race([assistantPromise, timeoutPromise]);
        
        return {
          message: result.response.message,
          recipe: result.response.recipe,
          threadId: result.threadId
        };
      } catch (assistantError) {
        console.warn('Assistant API failed, falling back to Chat Completions:', assistantError);
        
        // Show user that we're falling back
        if (assistantError instanceof Error && assistantError.message.includes('timeout')) {
          console.log('Assistant API timed out, using Chat Completions instead');
        }
        
        // Fall through to Chat Completions fallback
      }
    }
    
    // Fallback to Chat Completions API
    const chatResponse = await this.chatWithPersona(messages, persona);
    return chatResponse;
  }

  // Note: Recipe conversion is now handled by the existing parsing infrastructure
  // in parseRecipeFromText() instead of additional AI calls
}

export const openaiAPI = new OpenAIAPI();

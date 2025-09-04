import type { RecipeFormData } from './schemas';
import { AssistantAPI } from './assistantAPI';

// Constants for common prompts
const SAVE_RECIPE_PROMPT = `IMPORTANT: After providing a complete recipe or when the user seems satisfied with a recipe discussion, always ask: "Ready to Create and Save the Recipe?" This will allow the user to save the recipe to their collection.`;

const CONTEXT_USAGE_DIRECTIVE = `CRITICAL: You will receive comprehensive user profile data including allergies, dietary restrictions, cooking skills, time constraints, equipment, and preferences. ALWAYS use this information to:

1. Prioritize safety - NEVER suggest ingredients that could cause allergic reactions
2. Tailor complexity to their skill level and time availability
3. Use only equipment they have available
4. Incorporate their preferred cuisines and cultural preferences
5. Respect their spice tolerance and dietary restrictions
6. Provide personalized cooking tips appropriate for their experience level

When the user first engages with you, acknowledge their profile and show you understand their specific needs before proceeding with recipe creation.`;

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
    name: 'Chef Marco',
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

${CONTEXT_USAGE_DIRECTIVE}

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity needed",
      "prep": "preparation instructions"
    }
  ],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "setup": ["Prep time: X minutes", "Cook time: X minutes", "Equipment needed"],
  "categories": ["Course: Main", "Cuisine: Type", "Technique: Method"],
  "notes": "Tips, variations, and additional notes"
}

${SAVE_RECIPE_PROMPT}`,
    description:
      'Master Italian chef with 20+ years of Mediterranean culinary expertise, specializing in traditional techniques and fresh ingredients',
  },

  nutritionist: {
    name: 'Dr. Sarah',
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

${CONTEXT_USAGE_DIRECTIVE}

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity needed",
      "prep": "preparation instructions"
    }
  ],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "setup": ["Prep time: X minutes", "Cook time: X minutes", "Equipment needed"],
  "categories": ["Course: Main", "Cuisine: Type", "Technique: Method"],
  "notes": "Nutritional info, tips, and healthy variations"
}

${SAVE_RECIPE_PROMPT}`,
    description:
      'Registered dietitian and nutrition expert focused on creating healthy, balanced meals that are both nutritious and delicious',
  },

  homeCook: {
    name: 'Aunt Jenny',
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

${CONTEXT_USAGE_DIRECTIVE}

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity needed",
      "prep": "preparation instructions"
    }
  ],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "setup": ["Prep time: X minutes", "Cook time: X minutes", "Equipment needed"],
  "categories": ["Course: Main", "Cuisine: Type", "Technique: Method"],
  "notes": "Family tips, variations, and serving suggestions"
}

${SAVE_RECIPE_PROMPT}`,
    description:
      'Beloved home cook with decades of experience creating comforting, family-friendly recipes that bring joy to every meal',
  },

  assistantNutritionist: {
    name: 'Dr. Sage Vitalis',
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

${CONTEXT_USAGE_DIRECTIVE}

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity needed",
      "prep": "preparation instructions"
    }
  ],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "setup": ["Prep time: X minutes", "Cook time: X minutes", "Equipment needed"],
  "categories": ["Course: Main", "Cuisine: Type", "Technique: Method"],
  "notes": "Nutritional analysis, health benefits, and personalization tips"
}

${SAVE_RECIPE_PROMPT}

Note: This is fallback mode - use this prompt if Assistant API is unavailable.`,
    assistantId: 'asst_o3VGUZBpdYTdKEyKYoKua8ys',
    isAssistantPowered: true,
    description:
      '🌟 PREMIUM: Master of Integrative Culinary Medicine with 30+ years merging ancient healing wisdom with cutting-edge nutritional science. Expert in TCM, Ayurveda, functional medicine, and microbiome optimization. Transform your kitchen into a healing pharmacy with personalized protocols targeting root health imbalances.',
  },

  jamieBrightwell: {
    name: 'Dr. Jamie Brightwell',
    systemPrompt: `You are Dr. Jamie Brightwell, a pioneering pediatric nutritionist and culinary medicine specialist with 25+ years dedicated to transforming children's health through joyful, science-based nutrition. With dual training in pediatric medicine from Stanford and culinary arts from Le Cordon Bleu, plus certifications in child psychology, sensory food education, and integrative pediatric nutrition, you've revolutionized how families approach children's nutrition.

Your superpower lies in making healthy eating an adventure that kids genuinely embrace while ensuring optimal growth and development. You transform "picky eaters" into food explorers, support children with special dietary needs, and teach families how nutrition directly impacts mood, behavior, learning, and long-term health outcomes.

Your personality:
- Warm, playful, and child-focused
- Evidence-based yet approachable
- Family-centered and culturally sensitive
- Encouraging and supportive of all skill levels
- Expert in pediatric nutrition and culinary medicine

Your role:
- Help families create kid-approved, nutritionally optimized recipes
- Provide age-appropriate cooking guidance and nutrition education
- Suggest creative ways to incorporate healthy ingredients
- Guide families through picky eating challenges
- Support children with special dietary needs
- Create fun, interactive cooking experiences

${CONTEXT_USAGE_DIRECTIVE}

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity needed",
      "prep": "preparation instructions"
    }
  ],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "setup": ["Prep time: X minutes", "Cook time: X minutes", "Equipment needed"],
  "categories": ["Course: Main", "Cuisine: Type", "Technique: Method"],
  "notes": "Nutritional benefits, kid-friendly tips, and family cooking guidance"
}

${SAVE_RECIPE_PROMPT}`,
    assistantId: 'asst_IdO6vmnUW6tDOKu7rraLPCWJ',
    isAssistantPowered: true,
    description:
      '🌟 PREMIUM: Revolutionary Pediatric Culinary Wellness Expert with dual Stanford medicine + Le Cordon Bleu training. Transform "picky eaters" into food explorers with 25+ years of evidence-based, play-based nutrition. Master of sensory food education, behavioral psychology, and family-centered approaches that make healthy eating an adventure kids genuinely embrace.',
  },

  drLunaClearwater: {
    name: 'Dr. Luna Clearwater',
    systemPrompt: `You are Dr. Luna Clearwater, a revolutionary Personalized Health Assessment & Habit Formation Expert with dual Stanford Medicine + Harvard Public Health training. You specialize in comprehensive health evaluation, personalized habit recommendations, and structured progress tracking for sustainable lifestyle transformation.

${CONTEXT_USAGE_DIRECTIVE}

**MISSION:** Transform users from health uncertainty to confident, informed action through systematic assessment, personalized insights, and actionable habit formation strategies.

**INITIAL GREETING PROTOCOL:**
When a user first interacts with you, greet them professionally and acknowledge their profile data:

"Hello! I'm Dr. Luna Clearwater, your Personalized Health Assessment & Habit Formation Expert. I've received your comprehensive profile data and I'm ready to conduct a thorough health evaluation tailored specifically to your needs.

**Your Profile Summary:**
• **Skill Level**: [their skill level] cook
• **Available Time**: [their time] minutes per meal  
• **Preferred Cuisines**: [their cuisines]
• **Equipment**: [their equipment]
• **Safety**: [allergies/restrictions summary]

**Ready to Begin Your Health Assessment?**

I'm here to conduct a comprehensive evaluation of your current dietary patterns, health goals, and lifestyle factors. This assessment will help us create a personalized action plan for sustainable health transformation.

To get started, I need to understand your current health goals and challenges. **What are your primary health objectives, and what specific areas of your diet or lifestyle would you like to focus on improving?**"

**ASSESSMENT FRAMEWORK - 8 Critical Areas:**
1. **Safety Assessment**: Evaluate allergies, dietary restrictions, and medical considerations
2. **Personalization Matrix**: Assess skills, time availability, equipment, cultural preferences, and ingredient preferences
3. **Nutritional Analysis**: Analyze current diet quality, identify deficiency risks, and prioritize optimization areas
4. **Personalized Recommendations**: Provide immediate actions, weekly structure, and progressive challenges
5. **Meal Suggestions**: Offer signature recipes, quick options, and batch cooking priorities
6. **Progress Tracking**: Establish key metrics and milestone markers
7. **Risk Mitigation**: Address adherence barriers and provide safety reminders
8. **Support Resources**: Offer education modules, tools, and community connections

**CONVERSATIONAL ASSESSMENT PROCESS:**

**Phase 1: Initial Context & Safety (First 2-3 exchanges)**
- Acknowledge the user's profile data you've received
- Confirm critical safety information (allergies, restrictions, medical conditions)
- Ask clarifying questions about any missing safety data
- Establish trust and explain the assessment process

**Phase 2: Comprehensive Data Collection (Next 5-8 exchanges)**
- Systematically gather information for each of the 8 assessment areas
- Ask targeted, open-ended questions to understand:
  * Current eating patterns and preferences
  * Health goals and challenges
  * Lifestyle constraints and opportunities
  * Previous dietary experiences and outcomes
- Provide immediate insights and mini-recommendations during the conversation

**Phase 3: Report Generation & Next Steps (Final exchange)**
- Synthesize all collected information
- Generate the comprehensive JSON evaluation report
- Provide immediate actionable next steps
- Explain how to access and use the report

**CRITICAL REQUIREMENTS:**

1. **ALWAYS prioritize safety first** - Never suggest anything that could harm the user
2. **Use the injected user context** to personalize every question and recommendation
3. **Be conversational and engaging** while maintaining professional medical authority
4. **Ask follow-up questions** to gather comprehensive data
5. **Provide immediate value** with mini-insights during the conversation
6. **Generate the complete JSON report** in the exact format specified below

**JSON REPORT STRUCTURE - MUST FOLLOW EXACTLY:**

When the assessment is complete, generate a comprehensive JSON evaluation report with this exact structure. The report should include all sections: user_profile_summary, safety_assessment, personalization_matrix, nutritional_analysis, personalized_recommendations, meal_suggestions, progress_tracking, risk_mitigation, support_resources, next_steps, professional_notes, and report_metadata.

Use the user's context data to populate fields like skill_level, time_per_meal, available_equipment, preferred_cuisines, allergies, and dietary_restrictions. Generate realistic percentages (65-95), appropriate dates, and personalized recommendations based on their specific situation.

The JSON structure should match the format provided in the user's prompt, with all sections from user_evaluation_report through report_metadata included.

**CONVERSATION STYLE:**
- **Warm & Professional**: Combine medical expertise with approachable guidance
- **Systematic & Thorough**: Ensure no health aspect is overlooked
- **Evidence-Based**: Ground recommendations in current research
- **Action-Oriented**: Always provide clear next steps
- **Supportive**: Encourage progress while maintaining safety standards

**REMEMBER:** You're not just assessing health - you're empowering users to make sustainable, positive changes through personalized guidance and structured support. Use the injected user context to make every interaction deeply personal and relevant.`,
    assistantId: 'asst_panwYLoPVfb6BVj9fO6zm2Dp',
    isAssistantPowered: true,
    description:
      '🌟 PREMIUM: Revolutionary Personalized Health Assessment & Habit Formation Expert with dual Stanford Medicine + Harvard Public Health training. Transform health uncertainty into confident, personalized action plans through systematic assessment and habit formation strategies.',
  },
};

export type PersonaType = keyof typeof RECIPE_BOT_PERSONAS;

class OpenAIAPI {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseURL = 'https://api.openai.com/v1';
  private readonly maxRetries = 3;
  private readonly maxConversationTurns = 10;
  private assistantAPI: AssistantAPI | null = null;

  constructor() {
    // Validate API key at construction time to fail fast
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment variables.'
      );
    }

    // Validate API key format (should start with 'sk-')
    if (!apiKey.startsWith('sk-')) {
      throw new Error(
        'Invalid OpenAI API key format. API key should start with "sk-".'
      );
    }

    this.apiKey = apiKey;
    this.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
  }

  private getAssistantAPI(): AssistantAPI {
    if (!this.assistantAPI) {
      this.assistantAPI = new AssistantAPI(this.apiKey);
    }
    return this.assistantAPI;
  }

  private async requestWithRetry(
    url: string,
    init: RequestInit,
    retries = this.maxRetries
  ): Promise<Response> {
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
          await new Promise((resolve) => setTimeout(resolve, delay + jitter));
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
        await new Promise((resolve) => setTimeout(resolve, delay + jitter));
        delay *= 2;
      }
    }
    throw new Error('Unreachable');
  }

  async chatWithPersona(
    messages: Message[],
    persona: PersonaType,
    userId?: string,
    liveSelections?: {
      categories: string[];
      cuisines: string[];
      moods: string[];
    }
  ): Promise<ChatResponse> {
    const personaConfig = RECIPE_BOT_PERSONAS[persona];

    // Limit conversation history to save tokens and reduce 429 risk
    const recentMessages = messages.slice(-this.maxConversationTurns);

    let systemPrompt = personaConfig.systemPrompt;

    // Phase 4 Integration: Enhance system prompt with user data if available
    if (userId) {
      try {
        // Dynamic import to avoid SSR issues
        const {
          getUserDataForAI,
          buildEnhancedAIPrompt,
          buildEnhancedAIPromptWithOverrides,
        } = await import('./ai');
        const userData = await getUserDataForAI(userId);

        // Use enhanced prompt with live selection overrides if available
        if (
          liveSelections &&
          (liveSelections.categories.length > 0 ||
            liveSelections.cuisines.length > 0 ||
            liveSelections.moods.length > 0)
        ) {
          systemPrompt = buildEnhancedAIPromptWithOverrides(
            personaConfig.systemPrompt,
            'User is chatting with AI assistant',
            userData,
            liveSelections
          );
          console.log(
            'Phase 4: Enhanced prompt with live selection overrides for',
            persona
          );
        } else {
          systemPrompt = buildEnhancedAIPrompt(
            personaConfig.systemPrompt,
            'User is chatting with AI assistant',
            userData
          );
          console.log('Phase 4: Enhanced prompt with user data for', persona);
        }
      } catch (error) {
        console.warn(
          'Phase 4: Failed to load user data, using default prompt:',
          error
        );
        // Continue with default prompt if user data loading fails
      }
    }

    // Prepare messages for OpenAI API
    const openAIMessages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      ...recentMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    try {
      // Use retry logic for the API call
      const response = await this.requestWithRetry(
        `${this.baseURL}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
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
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error(
            'Rate limit exceeded. Please wait a moment and try again.'
          );
        }
        if (response.status === 401) {
          throw new Error(
            'Invalid API key. Please check your OpenAI configuration.'
          );
        }
        if (response.status === 403) {
          throw new Error(
            'Access denied. Please check your OpenAI account permissions.'
          );
        }
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
        );
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('No response from OpenAI API');
      }

      // Simple natural text response - no JSON parsing during chat
      // Recipe detection will happen when user clicks "Save Recipe"
      return {
        message: assistantMessage,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Rate limit')) {
          throw new Error(
            'Too many requests. Please wait 30 seconds and try again.'
          );
        }
        if (error.message.includes('API key')) {
          throw new Error(
            'OpenAI API key issue. Please check your configuration.'
          );
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
        content:
          personaConfig.systemPrompt +
          '\n\nPlease respond with a valid JSON object containing the complete recipe in this exact format: {"title": "Recipe Name", "ingredients": ["ingredient 1", "ingredient 2"], "instructions": "Step-by-step instructions", "notes": "Additional notes"}',
      },
      ...recentMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content:
          'Please create a complete, structured recipe based on our conversation.',
      },
    ];

    try {
      const response = await this.requestWithRetry(
        `${this.baseURL}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages: openAIMessages,
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' }, // Only use JSON format when explicitly requesting structured recipe
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error(
            'Rate limit exceeded. Please wait a moment and try again.'
          );
        }
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
        );
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
              ingredients: Array.isArray(parsed.ingredients)
                ? parsed.ingredients
                : [],
              instructions: parsed.instructions,
              notes: parsed.notes || '',
              categories: parsed.categories || [],
              setup: parsed.setup || [],
            },
          };
        }
      } catch {
        // JSON parsing failed
        throw new Error(
          'Failed to generate structured recipe. Please try again.'
        );
      }

      return {
        message: assistantMessage,
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
   * Send message using Assistant API with context injection support
   */
  async chatWithAssistant(
    threadId: string | null,
    assistantId: string,
    message: string,
    userId?: string
  ): Promise<{ response: ChatResponse; threadId: string }> {
    try {
      // For Dr. Luna Clearwater, inject user context as the first message
      if (assistantId === 'asst_panwYLoPVfb6BVj9fO6zm2Dp' && userId) {
        try {
          // Dynamic import to avoid SSR issues
          const { buildComprehensiveUserContext } = await import('./ai');
          const userContext = await buildComprehensiveUserContext(userId);

          // Create thread if not provided
          const actualThreadId =
            threadId || (await this.getAssistantAPI().createThread());

          // Add user context as the first message (silent injection)
          await this.getAssistantAPI().addMessageToThread(
            actualThreadId,
            userContext
          );

          // Create and start run to process the context
          const contextRunId = await this.getAssistantAPI().createRun(
            actualThreadId,
            assistantId
          );
          await this.getAssistantAPI().pollRunCompletion(
            actualThreadId,
            contextRunId
          );

          // Now add the user's actual message
          await this.getAssistantAPI().addMessageToThread(
            actualThreadId,
            message
          );

          // Create and start run for the user's message
          const userRunId = await this.getAssistantAPI().createRun(
            actualThreadId,
            assistantId
          );
          await this.getAssistantAPI().pollRunCompletion(
            actualThreadId,
            userRunId
          );

          // Get the assistant's response
          const assistantMessage =
            await this.getAssistantAPI().getLatestMessage(actualThreadId);

          return {
            response: {
              message: assistantMessage,
            },
            threadId: actualThreadId,
          };
        } catch (contextError) {
          console.warn(
            'Context injection failed, using standard Assistant API:',
            contextError
          );
          // Fall through to standard Assistant API
        }
      }

      // Standard Assistant API flow (for other assistants or when context injection fails)
      const result = await this.getAssistantAPI().sendMessage(
        threadId,
        assistantId,
        message
      );

      return {
        response: {
          message: result.response.message,
          recipe: result.response.recipe,
        },
        threadId: result.threadId,
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
    threadId?: string | null,
    userId?: string,
    liveSelections?: {
      categories: string[];
      cuisines: string[];
      moods: string[];
    }
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
          userMessage.content,
          userId
        );

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error('Assistant API request timed out after 60 seconds')
            );
          }, 60000); // 60 second timeout
        });

        const result = await Promise.race([assistantPromise, timeoutPromise]);

        return {
          message: result.response.message,
          recipe: result.response.recipe,
          threadId: result.threadId,
        };
      } catch (assistantError) {
        console.warn(
          'Assistant API failed, falling back to Chat Completions:',
          assistantError
        );

        // Show user that we're falling back
        if (
          assistantError instanceof Error &&
          assistantError.message.includes('timeout')
        ) {
          console.log(
            'Assistant API timed out, using Chat Completions instead'
          );
        }

        // Fall through to Chat Completions fallback
      }
    }

    // Fallback to Chat Completions API with Phase 4 integration
    const chatResponse = await this.chatWithPersona(
      messages,
      persona,
      userId,
      liveSelections
    );
    return chatResponse;
  }

  // Note: Recipe conversion is now handled by the existing parsing infrastructure
  // in parseRecipeFromText() instead of additional AI calls
}

export const openaiAPI = new OpenAIAPI();

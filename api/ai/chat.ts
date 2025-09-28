import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  persona?: string;
  userId?: string;
  liveSelections?: {
    categories: string[];
    cuisines: string[];
    moods: string[];
    availableIngredients?: string[];
  };
}

// ChatResponse interface moved to shared types

// Persona configurations (moved from client)
const RECIPE_BOT_PERSONAS = {
  chef: {
    name: 'Professional Chef',
    description: 'Expert culinary guidance with professional techniques',
    systemPrompt: `You are a professional chef with decades of experience. Provide expert culinary guidance, professional cooking techniques, and restaurant-quality recipes. Focus on precision, flavor development, and presentation.`,
  },
  nutritionist: {
    name: 'Nutritionist',
    description: 'Health-focused recipes and nutritional guidance',
    systemPrompt: `You are a certified nutritionist. Focus on healthy, balanced recipes with nutritional information. Consider dietary restrictions, allergies, and health goals. Emphasize whole foods and balanced macronutrients.`,
  },
  homecook: {
    name: 'Home Cook',
    description: 'Friendly, practical cooking advice for everyday meals',
    systemPrompt: `You are an experienced home cook who loves sharing practical, approachable recipes. Focus on simple techniques, common ingredients, and family-friendly meals. Be encouraging and helpful.`,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      messages,
      model = 'gpt-4o-mini',
      temperature = 0.8,
      max_tokens = 800,
      persona = 'homecook',
      userId,
      liveSelections,
    }: ChatRequest = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Get server-side API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured on server');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Build system prompt with persona and user context
    const systemPrompt = await buildSystemPrompt(
      persona,
      userId,
      liveSelections
    );

    const openAIMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    console.log(
      `[AI Chat] Processing ${messages.length} messages for persona: ${persona}`
    );

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: openAIMessages,
        temperature,
        max_tokens,
        top_p: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);

      if (response.status === 401) {
        return res.status(500).json({ error: 'Invalid OpenAI API key' });
      }
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait a moment and try again.',
        });
      }
      if (response.status === 403) {
        return res.status(500).json({
          error: 'Access denied. Please check your OpenAI account permissions.',
        });
      }

      return res.status(500).json({
        error: `OpenAI API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      return res.status(500).json({ error: 'No response from OpenAI API' });
    }

    console.log(
      `[AI Chat] Successfully processed request for persona: ${persona}`
    );

    return res.status(200).json({
      message: assistantMessage,
      usage: data.usage,
      model: data.model,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function buildSystemPrompt(
  persona: string,
  userId?: string,
  liveSelections?: {
    categories: string[];
    cuisines: string[];
    moods: string[];
    availableIngredients?: string[];
  }
): Promise<string> {
  // Get base persona prompt
  const personaConfig =
    RECIPE_BOT_PERSONAS[persona as keyof typeof RECIPE_BOT_PERSONAS] ||
    RECIPE_BOT_PERSONAS.homecook;
  let systemPrompt = personaConfig.systemPrompt;

  // Add context usage directive
  systemPrompt += `\n\nCRITICAL: You will receive comprehensive user profile data including allergies, dietary restrictions, cooking skills, time constraints, equipment, and preferences. ALWAYS use this information to:

1. Prioritize safety - NEVER suggest ingredients that could cause allergic reactions
2. Tailor complexity to their skill level and time availability
3. Use only equipment they have available
4. Incorporate their preferred cuisines and cultural preferences
5. Respect their spice tolerance and dietary restrictions
6. Provide personalized cooking tips appropriate for their experience level

When the user first engages with you, acknowledge their profile and show you understand their specific needs before proceeding with recipe creation.`;

  // Add save recipe prompt
  systemPrompt += `\n\nIMPORTANT: After providing a complete recipe or when the user seems satisfied with a recipe discussion, always ask: "Ready to Create and Save the Recipe?" This will allow the user to save the recipe to their collection.

CRITICAL: When providing a complete recipe, ALWAYS format it as structured JSON in a markdown code block for easy parsing:

\`\`\`json
{
  "title": "Recipe Name",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity needed",
      "prep": "preparation instructions"
    }
  ],
  "instructions": "Step-by-step cooking instructions",
  "setup": ["Prep time: X minutes", "Cook time: X minutes", "Equipment needed"],
  "categories": ["Course: Main", "Cuisine: Type", "Technique: Method"],
  "notes": "Tips, variations, and additional notes"
}
\`\`\`

This structured format ensures the recipe can be easily saved to the user's collection.`;

  // Add live selections context if provided
  if (liveSelections) {
    systemPrompt += `\n\nCurrent user selections:
- Categories: ${liveSelections.categories?.join(', ') || 'None selected'}
- Cuisines: ${liveSelections.cuisines?.join(', ') || 'None selected'}
- Moods: ${liveSelections.moods?.join(', ') || 'None selected'}
- Available Ingredients: ${liveSelections.availableIngredients?.join(', ') || 'All ingredients available'}

Use these selections to tailor your recommendations and suggestions.`;

    console.log(
      `[AI Chat] Enhanced prompt with live selection overrides for ${persona}`
    );
  }

  // TODO: Add user profile data loading from Supabase
  // This would replace the client-side user data loading
  if (userId) {
    console.log(
      `[AI Chat] User ID provided: ${userId} - user profile integration pending`
    );
    // Future: Load user profile from Supabase and enhance prompt
  }

  return systemPrompt;
}

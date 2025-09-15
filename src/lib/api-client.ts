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

interface ChatResponse {
  message: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
}

interface AssistantThreadResponse {
  id: string;
}

// Removed unused interfaces - using inline types instead

export class APIClient {
  private baseURL = '/api';

  async chatWithPersona(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseURL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Chat request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  }

  async createAssistantThread(): Promise<AssistantThreadResponse> {
    try {
      const response = await fetch(`${this.baseURL}/ai/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create_thread' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create thread');
      }

      return await response.json();
    } catch (error) {
      console.error('Assistant thread creation error:', error);
      throw error;
    }
  }

  async sendAssistantMessage(
    threadId: string,
    assistantId: string,
    message: string
  ): Promise<ChatResponse & { threadId?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/ai/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_message',
          threadId,
          assistantId,
          message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Assistant message failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Assistant message error:', error);
      throw error;
    }
  }
}

export const apiClient = new APIClient();

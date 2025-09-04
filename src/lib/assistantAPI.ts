import type { RecipeFormData } from './schemas';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AssistantResponse {
  message: string;
  recipe?: RecipeFormData;
}

export class AssistantAPI {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create a new thread for Assistant conversation
   */
  async createThread(): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/threads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create thread: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw new Error('Failed to create conversation thread');
    }
  }

  /**
   * Add a message to a thread
   */
  async addMessageToThread(threadId: string, content: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseURL}/threads/${threadId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            role: 'user',
            content: content,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to add message: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error('Error adding message to thread:', error);
      throw new Error('Failed to add message to conversation');
    }
  }

  /**
   * Create and run an assistant on a thread
   */
  async createRun(threadId: string, assistantId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          assistant_id: assistantId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create run: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating run:', error);
      throw new Error('Failed to start assistant processing');
    }
  }

  /**
   * Poll run status until completion
   */
  async pollRunCompletion(
    threadId: string,
    runId: string,
    maxAttempts = 30
  ): Promise<void> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(
          `${this.baseURL}/threads/${threadId}/runs/${runId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'OpenAI-Beta': 'assistants=v2',
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to check run status: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log(
          `Run ${runId} status: ${data.status} (attempt ${attempts + 1}/${maxAttempts})`
        );

        // Handle all possible run statuses
        switch (data.status) {
          case 'completed':
            console.log(`Run ${runId} completed successfully`);
            return;

          case 'failed':
            throw new Error(
              `Assistant run failed: ${data.last_error?.message || 'Unknown error'}`
            );

          case 'cancelled':
            throw new Error(`Assistant run was cancelled`);

          case 'expired':
            throw new Error(`Assistant run expired`);

          case 'requires_action':
            // Handle function calls or other required actions
            if (data.required_action?.type === 'submit_tool_outputs') {
              throw new Error(
                'Assistant requires tool outputs (not supported in this implementation)'
              );
            } else {
              throw new Error(
                `Assistant requires unknown action: ${data.required_action?.type || 'unknown'}`
              );
            }

          case 'queued':
          case 'in_progress':
            // These are expected statuses - continue polling
            console.log(`Run ${runId} is ${data.status}, waiting...`);
            break;

          default:
            console.warn(`Unknown run status: ${data.status}`);
            // Continue polling for unknown statuses
            break;
        }

        // Wait before next poll (exponential backoff)
        const delay = Math.min(1000 * Math.pow(1.5, attempts), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempts++;
      } catch (error) {
        console.error('Error polling run completion:', error);

        // If it's one of our custom errors, re-throw it
        if (error instanceof Error && error.message.includes('Assistant run')) {
          throw error;
        }

        // For network/API errors, continue polling unless we've exhausted attempts
        if (attempts >= maxAttempts - 1) {
          throw new Error(
            'Failed to complete assistant processing due to network errors'
          );
        }

        attempts++;
      }
    }

    throw new Error(
      `Assistant processing timed out after ${maxAttempts} attempts`
    );
  }

  /**
   * Get the latest assistant message from a thread
   */
  async getLatestMessage(threadId: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseURL}/threads/${threadId}/messages?limit=1&order=desc`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get messages: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const messages = data.data;

      if (!messages || messages.length === 0) {
        throw new Error('No messages found in thread');
      }

      // Debug: Log all messages to see what we're getting
      console.log(`Thread ${threadId} has ${messages.length} messages:`);
      messages.forEach(
        (
          msg: {
            role: string;
            content: Array<{ type: string; text?: { value: string } }>;
          },
          index: number
        ) => {
          console.log(
            `Message ${index}: Role=${msg.role}, Content=${msg.content[0]?.text?.value?.substring(0, 100)}...`
          );
        }
      );

      const latestMessage = messages[0];
      if (latestMessage.role !== 'assistant') {
        throw new Error('Latest message is not from assistant');
      }

      // Extract text content from the message
      const textContent = latestMessage.content.find(
        (c: { type: string }) => c.type === 'text'
      );
      if (!textContent) {
        throw new Error('No text content found in assistant message');
      }

      console.log(
        `Returning message: ${textContent.text.value.substring(0, 100)}...`
      );
      return textContent.text.value;
    } catch (error) {
      console.error('Error getting latest message:', error);
      throw new Error('Failed to retrieve assistant response');
    }
  }

  /**
   * Send a message to an assistant and get the response
   */
  async sendMessage(
    threadId: string | null,
    assistantId: string,
    message: string
  ): Promise<{ response: AssistantResponse; threadId: string }> {
    try {
      // Create thread if not provided
      const actualThreadId = threadId || (await this.createThread());

      // Add user message to thread
      await this.addMessageToThread(actualThreadId, message);

      // Create and start run
      const runId = await this.createRun(actualThreadId, assistantId);

      // Wait for completion
      await this.pollRunCompletion(actualThreadId, runId);

      // Get the assistant's response
      const assistantMessage = await this.getLatestMessage(actualThreadId);

      // Return natural text response - no JSON parsing during chat
      // Recipe conversion will happen when user clicks "Save Recipe"
      const response: AssistantResponse = {
        message: assistantMessage,
      };

      return {
        response,
        threadId: actualThreadId,
      };
    } catch (error) {
      console.error('Assistant API error:', error);
      throw error; // Re-throw to be handled by fallback logic
    }
  }

  // Removed: convertToRecipe() - now using parseRecipeFromText() instead
}

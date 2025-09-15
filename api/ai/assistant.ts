import type { VercelRequest, VercelResponse } from '@vercel/node';

interface AssistantRequest {
  action: 'create_thread' | 'send_message';
  threadId?: string;
  assistantId?: string;
  message?: string;
}

interface AssistantResponse {
  id?: string;
  message?: string;
  threadId?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// Assistant configurations (for future use)
// const ASSISTANT_CONFIGS = {
//   chef: {
//     assistantId: 'asst_chef_assistant_id',
//     name: 'Professional Chef Assistant',
//   },
//   nutritionist: {
//     assistantId: 'asst_nutritionist_assistant_id',
//     name: 'Nutritionist Assistant',
//   },
//   homecook: {
//     assistantId: 'asst_homecook_assistant_id',
//     name: 'Home Cook Assistant',
//   },
// };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, threadId, assistantId, message }: AssistantRequest =
      req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('OpenAI API key not configured on server');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    let response: AssistantResponse;

    switch (action) {
      case 'create_thread':
        response = await createThread(apiKey);
        break;
      case 'send_message':
        if (!threadId || !assistantId || !message) {
          return res.status(400).json({
            error:
              'threadId, assistantId, and message are required for send_message action',
          });
        }
        response = await sendMessage(apiKey, threadId, assistantId, message);
        break;
      default:
        return res.status(400).json({
          error: 'Invalid action. Use "create_thread" or "send_message"',
        });
    }

    console.log(`[Assistant API] Successfully processed ${action} action`);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Assistant API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createThread(apiKey: string): Promise<AssistantResponse> {
  try {
    const response = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create thread:', response.status, errorText);
      throw new Error(
        `Failed to create thread: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(`[Assistant API] Created new thread: ${data.id}`);

    return { id: data.id };
  } catch (error) {
    console.error('Error creating thread:', error);
    throw new Error('Failed to create conversation thread');
  }
}

async function sendMessage(
  apiKey: string,
  threadId: string,
  assistantId: string,
  message: string
): Promise<AssistantResponse> {
  try {
    // Add message to thread
    const messageResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          role: 'user',
          content: message,
        }),
      }
    );

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error(
        'Failed to add message to thread:',
        messageResponse.status,
        errorText
      );
      throw new Error(
        `Failed to add message: ${messageResponse.status} ${messageResponse.statusText}`
      );
    }

    // Run the assistant
    const runResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          assistant_id: assistantId,
        }),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Failed to run assistant:', runResponse.status, errorText);
      throw new Error(
        `Failed to run assistant: ${runResponse.status} ${runResponse.statusText}`
      );
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      attempts++;

      const statusResponse = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();

      if (statusData.status === 'completed') {
        completed = true;
      } else if (statusData.status === 'failed') {
        throw new Error(
          `Assistant run failed: ${statusData.last_error?.message || 'Unknown error'}`
        );
      } else if (statusData.status === 'cancelled') {
        throw new Error('Assistant run was cancelled');
      }
    }

    if (!completed) {
      throw new Error('Assistant run timed out');
    }

    // Get the assistant's response
    const messagesResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      }
    );

    if (!messagesResponse.ok) {
      throw new Error(`Failed to get messages: ${messagesResponse.status}`);
    }

    const messagesData = await messagesResponse.json();
    const assistantMessage = messagesData.data
      .filter((msg: { role: string }) => msg.role === 'assistant')
      .sort(
        (a: { created_at: number }, b: { created_at: number }) =>
          b.created_at - a.created_at
      )[0];

    if (!assistantMessage) {
      throw new Error('No response from assistant');
    }

    console.log(
      `[Assistant API] Successfully processed message in thread: ${threadId}`
    );

    return {
      message:
        assistantMessage.content[0]?.text?.value || 'No response content',
      threadId,
      usage: assistantMessage.usage,
    };
  } catch (error) {
    console.error('Error sending message to assistant:', error);
    throw error;
  }
}

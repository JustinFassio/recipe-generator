import express from 'express';
const app = express();
const port = 3000;

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  });
});

// Recipe standardize endpoint
app.post('/api/recipe-standardize', express.json(), (req, res) => {
  const { recipeText } = req.body;

  if (!recipeText) {
    return res.status(400).json({ error: 'recipeText is required' });
  }

  // Simple response for now
  res.json({
    standardized: recipeText,
    message: 'Recipe standardized successfully',
  });
});

// AI Chat endpoint
app.post('/api/ai/chat', express.json(), (req, res) => {
  const { messages, persona, userId, liveSelections } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Get the last user message
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    return res.status(400).json({ error: 'Last message must be from user' });
  }

  // Simple mock response for testing
  const mockResponse = {
    message: `I understand you're looking for help with: "${lastMessage.content}". As your AI cooking assistant, I'm here to help you create amazing recipes!`,
    usage: {
      prompt_tokens: 50,
      completion_tokens: 25,
      total_tokens: 75,
    },
    model: 'gpt-3.5-turbo',
  };

  res.json(mockResponse);
});

// AI Assistant endpoint
app.post('/api/ai/assistant', express.json(), (req, res) => {
  const { action, threadId, assistantId, message } = req.body;

  if (action === 'create_thread') {
    res.json({
      id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  } else if (action === 'send_message') {
    if (!threadId || !assistantId || !message) {
      return res
        .status(400)
        .json({ error: 'threadId, assistantId, and message are required' });
    }

    res.json({
      message: `Assistant response to: "${message}"`,
      threadId,
      usage: {
        prompt_tokens: 30,
        completion_tokens: 20,
        total_tokens: 50,
      },
    });
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});

# OpenAI Integration Flow

**Technical documentation of AI chat system architecture**

---

## 🎯 **Overview**

The Recipe Generator integrates with OpenAI through two different APIs to provide diverse AI personas with varying capabilities. This document details the technical implementation of the smart routing system that seamlessly handles both Chat Completions API and Assistants API.

## 🏗️ **Architecture Diagram**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Message  │───▶│  Smart Routing  │───▶│   Chat API      │
│                 │    │   (OpenAI.ts)   │    │  (3 Personas)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Assistant API  │    │   AI Response   │
                       │  (1 Persona)    │    │   Processing    │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Thread Management│───▶│  Return to UI   │
                       │ & Polling       │    │   Component     │
                       └─────────────────┘    └─────────────────┘
```

## 🤖 **Persona Configuration**

### **Chat Completions API Personas**

#### **1. Chef Marco (Italian Chef)**

```typescript
{
  name: "Chef Marco",
  systemPrompt: `You are Chef Marco, an experienced Italian chef with 20+ years of culinary expertise...`,
  // Uses Chat Completions API
}
```

#### **2. Dr. Sarah (Nutritionist)**

```typescript
{
  name: "Dr. Sarah",
  systemPrompt: `You are Dr. Sarah, a registered dietitian and nutritionist...`,
  // Uses Chat Completions API
}
```

#### **3. Aunt Jenny (Home Cook)**

```typescript
{
  name: "Aunt Jenny",
  systemPrompt: `You are Aunt Jenny, a warm and experienced home cook...`,
  // Uses Chat Completions API
}
```

### **Assistants API Persona**

#### **4. Dr. Sage Vitalis (Assistant Nutritionist)**

```typescript
{
  name: "Dr. Sage Vitalis",
  assistantId: "asst_o3VGUZBpdYTdKEyKYoKua8ys",
  isAssistantPowered: true,
  systemPrompt: `Advanced nutritionist with specialized knowledge...`,
  description: `AI-powered nutritionist with access to comprehensive dietary databases...`
}
```

## 🔀 **Smart Routing Implementation**

### **Route Decision Logic**

**Location**: `src/lib/openai.ts:sendMessageWithPersona()`

```typescript
async sendMessageWithPersona(
  messages: Message[],
  persona: PersonaType,
  threadId?: string | null
): Promise<{ message: string; threadId?: string }> {

  const personaConfig = RECIPE_BOT_PERSONAS[persona];

  // Smart routing: Check if persona uses Assistant API
  if (personaConfig.assistantId && personaConfig.isAssistantPowered) {
    return this.chatWithAssistant(messages, persona, threadId);
  } else {
    const response = await this.chatWithPersona(messages, persona);
    return { message: response };
  }
}
```

### **Chat Completions API Flow**

#### **Configuration**

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${this.apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: this.model,
    messages: formattedMessages,
    temperature: 0.8, // Creative but focused
    max_tokens: 800, // Reasonable response length
    top_p: 1.0, // Full vocabulary access
  }),
});
```

#### **Message Formatting**

```typescript
const formattedMessages = [
  { role: 'system', content: personaConfig.systemPrompt },
  ...messages.slice(-10).map((msg) => ({
    role: msg.role,
    content: msg.content,
  })),
];
```

**Key Features**:

- ✅ **System Prompt Injection**: Each persona gets unique personality
- ✅ **Message History Limiting**: Last 10 messages for context
- ✅ **Optimized Parameters**: Balanced creativity and coherence
- ✅ **Immediate Response**: Direct API response handling

### **Assistants API Flow**

#### **Thread Management**

```typescript
// Create new thread if none exists
if (!threadId) {
  const thread = await this.assistantAPI.createThread();
  threadId = thread.id;
}

// Add user message to thread
await this.assistantAPI.addMessageToThread(threadId, userMessage.content);
```

#### **Run Creation & Polling**

```typescript
// Create run with assistant
const run = await this.assistantAPI.createRun(
  threadId,
  personaConfig.assistantId!
);

// Poll for completion with timeout
const completedRun = await this.assistantAPI.pollRunCompletion(
  threadId,
  run.id
);
```

#### **Response Extraction**

```typescript
// Get latest assistant message
const latestMessage = await this.assistantAPI.getLatestMessage(threadId);

return {
  message: latestMessage,
  threadId,
};
```

**Key Features**:

- ✅ **Persistent Threads**: Maintains conversation context across sessions
- ✅ **Advanced AI Capabilities**: Leverages OpenAI's most sophisticated models
- ✅ **Automatic Polling**: Handles asynchronous processing
- ✅ **Timeout Protection**: 60-second timeout with fallback

## ⚡ **Performance Optimizations**

### **Request Optimization**

#### **Exponential Backoff**

```typescript
private async requestWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

#### **Connection Pooling**

- ✅ **Reused Connections**: HTTP keep-alive for multiple requests
- ✅ **Request Batching**: Minimize API calls where possible
- ✅ **Caching**: Persona configurations cached in memory

### **Response Optimization**

#### **Streaming Responses** (Future Enhancement)

```typescript
// Potential streaming implementation
const stream = await fetch('/api/chat/stream', {
  method: 'POST',
  body: JSON.stringify({ messages, persona }),
  headers: { Accept: 'text/event-stream' },
});
```

#### **Response Compression**

- ✅ **Gzip Compression**: Automatic HTTP compression
- ✅ **Minimal Payloads**: Only send necessary message data
- ✅ **Efficient Parsing**: Fast JSON processing

## 🔒 **Security Implementation**

### **API Key Management**

```typescript
// Environment variable validation
if (!import.meta.env.VITE_OPENAI_API_KEY) {
  throw new Error('OpenAI API key not configured');
}

// Secure key storage
private readonly apiKey = import.meta.env.VITE_OPENAI_API_KEY;
```

### **Request Sanitization**

```typescript
// Input validation and sanitization
const sanitizedContent = userMessage.content.trim().slice(0, 4000); // Limit message length

// Prevent prompt injection
const safeSystemPrompt = personaConfig.systemPrompt
  .replace(/\n\n/g, '\n')
  .trim();
```

### **Error Information Filtering**

```typescript
// Don't expose internal errors to users
catch (error) {
  console.error('OpenAI API error:', error);

  // Generic user-facing error
  throw new Error('Failed to get AI response. Please try again.');
}
```

## 🚨 **Error Handling Strategy**

### **API Error Types**

#### **Rate Limiting (429)**

```typescript
if (error.status === 429) {
  toast({
    title: 'Rate Limit Reached',
    description: 'Please wait a moment before sending another message.',
    variant: 'destructive',
  });

  // Implement exponential backoff
  await this.requestWithRetry(() => apiCall());
}
```

#### **Authentication (401)**

```typescript
if (error.status === 401) {
  toast({
    title: 'Authentication Error',
    description: 'API key is invalid. Please check configuration.',
    variant: 'destructive',
  });
}
```

#### **Assistant Timeout**

```typescript
// 60-second timeout for Assistant API
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Assistant timeout')), 60000)
);

try {
  const response = await Promise.race([
    this.assistantAPI.sendMessage(threadId, message),
    timeoutPromise,
  ]);
} catch (error) {
  // Fallback to Chat Completions API
  return this.chatWithPersona(messages, persona);
}
```

### **Fallback Mechanisms**

#### **Assistant to Chat Completions Fallback**

```typescript
async chatWithAssistant(messages: Message[], persona: PersonaType, threadId?: string | null) {
  try {
    // Try Assistant API first
    return await this.assistantAPI.sendMessage(threadId, userMessage);
  } catch (error) {
    console.warn('Assistant API failed, falling back to Chat Completions:', error);

    // Fallback to Chat Completions
    const response = await this.chatWithPersona(messages, persona);
    return { message: response };
  }
}
```

## 📊 **Monitoring & Analytics**

### **Performance Metrics**

```typescript
// Track API performance
const startTime = performance.now();
const response = await apiCall();
const duration = performance.now() - startTime;

console.log(`API call completed in ${duration}ms`, {
  persona,
  messageCount: messages.length,
  responseLength: response.length,
});
```

### **Error Tracking**

```typescript
// Structured error logging
console.error('API Error Details', {
  error: error.message,
  status: error.status,
  persona,
  timestamp: new Date().toISOString(),
  messageCount: messages.length,
});
```

### **Usage Analytics**

- **Persona Popularity**: Track which AI assistants are used most
- **Conversation Length**: Average messages per session
- **Success Rates**: API call success/failure ratios
- **Response Times**: Performance monitoring across different APIs

## 🔧 **Configuration Management**

### **Environment Variables**

```bash
# Required for Chat Completions API
VITE_OPENAI_API_KEY=sk-proj-...
VITE_OPENAI_MODEL=gpt-4o-mini

# Optional for enhanced features
VITE_OPENAI_ORGANIZATION=org-...
VITE_OPENAI_PROJECT=proj-...
```

### **Model Configuration**

```typescript
// Model selection strategy
const modelConfig = {
  'gpt-4o-mini': {
    maxTokens: 800,
    temperature: 0.8,
    costPerToken: 0.0001,
  },
  'gpt-4': {
    maxTokens: 1000,
    temperature: 0.7,
    costPerToken: 0.003,
  },
};
```

## 🚀 **Future Enhancements**

### **Planned Features**

- **Streaming Responses**: Real-time message delivery
- **Function Calling**: Structured recipe generation
- **Image Analysis**: Recipe photo interpretation
- **Voice Integration**: Speech-to-text recipe creation

### **Scalability Improvements**

- **Response Caching**: Cache common recipe patterns
- **Load Balancing**: Multiple API key rotation
- **Regional APIs**: Geo-distributed API endpoints
- **CDN Integration**: Static asset optimization

---

**Related Documentation**:

- [AI Recipe Creation Workflow](ai-recipe-creation-workflow.md)
- [Recipe Save Flow](recipe-save-flow.md)
- [Troubleshooting Guide](troubleshooting.md)

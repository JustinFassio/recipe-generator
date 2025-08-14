# State Management Flow

**Component architecture and data flow patterns**

---

## 🎯 **Overview**

The Recipe Generator uses a modern React state management architecture combining custom hooks, atomic components, and efficient data flow patterns. This document details the complete state management strategy and component communication patterns.

## 🏗️ **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                        ChatRecipePage                          │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   Chat View     │◀──▶│  Editor View    │                   │
│  │                 │    │                 │                   │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │                   │
│  │ │ChatInterface│ │    │ │ RecipeForm  │ │                   │
│  │ └─────────────┘ │    │ └─────────────┘ │                   │
│  └─────────────────┘    └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useConversation Hook                        │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │ Conversation    │    │ Conversation    │                   │
│  │     State       │◀──▶│    Actions      │                   │
│  │                 │    │                 │                   │
│  │ • persona       │    │ • selectPersona │                   │
│  │ • messages      │    │ • sendMessage   │                   │
│  │ • generatedRecipe│   │ • convertToRecipe│                 │
│  │ • isLoading     │    │ • startNewRecipe│                   │
│  │ • showPersonaSelector│ • changePersona │                   │
│  │ • threadId      │    │ • saveRecipe    │                   │
│  │ • isUsingAssistant│  │                 │                   │
│  └─────────────────┘    └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                           │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   OpenAI API    │    │   Supabase      │                   │
│  │                 │    │                 │                   │
│  │ • Chat Completions│  │ • Recipe Storage│                   │
│  │ • Assistants API│    │ • User Auth     │                   │
│  │ • Smart Routing │    │ • File Upload   │                   │
│  └─────────────────┘    └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 **State Flow Architecture**

### **1. Page-Level State Management**

#### **ChatRecipePage** (`src/pages/chat-recipe-page.tsx`)

```typescript
export function ChatRecipePage() {
  const navigate = useNavigate();
  const [showEditor, setShowEditor] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(
    null
  );

  // Callback when recipe is generated from chat
  const handleRecipeGenerated = (recipe: RecipeFormData) => {
    setGeneratedRecipe(recipe);
    setShowEditor(true);
  };

  // Callback when recipe is successfully saved
  const handleRecipeSaved = () => {
    navigate('/');
  };

  // Navigation between chat and editor views
  const handleBackToChat = () => {
    setShowEditor(false);
    setGeneratedRecipe(null);
  };
}
```

**State Responsibilities**:

- ✅ **View Management**: Controls chat vs editor display
- ✅ **Recipe Data**: Manages generated recipe between components
- ✅ **Navigation**: Handles routing after save completion
- ✅ **State Cleanup**: Resets state when switching views

### **2. Conversation State Management**

#### **useConversation Hook** (`src/hooks/useConversation.ts`)

```typescript
interface ConversationState {
  persona: PersonaType | null; // Selected AI assistant
  messages: Message[]; // Chat history
  generatedRecipe: RecipeFormData | null; // Parsed recipe data
  isLoading: boolean; // API call status
  showPersonaSelector: boolean; // UI state
  threadId: string | null; // Assistant API thread
  isUsingAssistant: boolean; // API routing flag
}

interface ConversationActions {
  selectPersona: (persona: PersonaType) => void;
  sendMessage: (content: string) => Promise<void>;
  startNewRecipe: () => void;
  changePersona: () => void;
  saveRecipe: (recipe: RecipeFormData) => void;
  setGeneratedRecipe: (recipe: RecipeFormData | null) => void;
  convertToRecipe: () => Promise<void>;
}
```

**State Flow Patterns**:

#### **Persona Selection Flow**

```typescript
const selectPersona = useCallback((selectedPersona: PersonaType) => {
  setPersona(selectedPersona);
  setShowPersonaSelector(false);

  // Determine API routing
  const personaConfig = RECIPE_BOT_PERSONAS[selectedPersona];
  const usingAssistant = !!(
    personaConfig.assistantId && personaConfig.isAssistantPowered
  );
  setIsUsingAssistant(usingAssistant);

  // Reset thread for new persona
  setThreadId(null);

  // Initialize conversation
  const welcomeMessage: Message = {
    id: '1',
    role: 'assistant',
    content: `Hello! I'm ${personaConfig.name}. ${personaConfig.description || 'Let me help you create amazing recipes!'}`,
    timestamp: new Date(),
  };

  setMessages([welcomeMessage]);
}, []);
```

#### **Message Sending Flow**

```typescript
const sendMessage = useCallback(
  async (content: string) => {
    if (!content.trim() || isLoading || !persona) return;

    // Add user message immediately (optimistic update)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Smart API routing
      const response = await openaiAPI.sendMessageWithPersona(
        [...messages, userMessage],
        persona,
        threadId
      );

      // Update thread ID for Assistant API
      if (response.threadId) {
        setThreadId(response.threadId);
      }

      // Add AI response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Error handling with user feedback
      handleSendMessageError(error);
    } finally {
      setIsLoading(false);
    }
  },
  [messages, persona, threadId, isLoading]
);
```

#### **Recipe Conversion Flow**

```typescript
const convertToRecipe = useCallback(async () => {
  try {
    setIsLoading(true);

    // Extract recipe content from conversation
    const assistantMessages = messages
      .filter((msg) => msg.role === 'assistant')
      .slice(-3);

    if (assistantMessages.length === 0) {
      throw new Error('No recipe content found in conversation');
    }

    const recipeText = assistantMessages.map((msg) => msg.content).join('\n\n');

    // Parse using existing infrastructure
    const recipe = await parseRecipeFromText(recipeText);

    setGeneratedRecipe(recipe);

    toast({
      title: 'Recipe Parsed!',
      description:
        'Your recipe has been parsed and is ready to review and save.',
    });
  } catch (error) {
    handleConversionError(error);
  } finally {
    setIsLoading(false);
  }
}, [messages, parseRecipeFromText, toast]);
```

### **3. Component Communication Patterns**

#### **Parent-Child Communication**

```typescript
// ChatRecipePage → ChatInterface
<ChatInterface onRecipeGenerated={handleRecipeGenerated} />

// ChatInterface → useConversation
const {
  persona,
  messages,
  generatedRecipe,
  isLoading,
  showPersonaSelector,
  selectPersona,
  sendMessage,
  startNewRecipe,
  changePersona,
  convertToRecipe,
} = useConversation();
```

#### **Sibling Component Communication**

```typescript
// PersonaSelector → ChatHeader (via useConversation)
// PersonaSelector calls selectPersona()
// ChatHeader receives persona via hook state

// ChatHeader → ChatInterface (via useConversation)
// ChatHeader calls convertToRecipe()
// ChatInterface receives generatedRecipe via hook state
```

#### **Auto-trigger Pattern**

```typescript
// ChatInterface automatically triggers parent callback
useEffect(() => {
  if (generatedRecipe) {
    onRecipeGenerated(generatedRecipe);
  }
}, [generatedRecipe, onRecipeGenerated]);
```

## 🧩 **Atomic Component Architecture**

### **Component Hierarchy**

```
ChatInterface (Container)
├── PersonaSelector (when showPersonaSelector = true)
│   └── AssistantBadge (for Assistant-powered personas)
├── ChatHeader (when persona selected)
│   ├── Avatar with persona icon
│   ├── Save Recipe button
│   ├── New Recipe button
│   └── Change Assistant button
├── ScrollArea (message display)
│   └── Message components
└── Input area
    ├── Textarea
    └── Send button
```

### **Component Responsibilities**

#### **PersonaSelector** (`src/components/chat/PersonaSelector.tsx`)

```typescript
interface PersonaSelectorProps {
  onPersonaSelect: (persona: PersonaType) => void;
}

// Responsibilities:
// ✅ Display available AI personas
// ✅ Show persona capabilities and descriptions
// ✅ Handle persona selection events
// ✅ Render AssistantBadge for advanced personas
```

#### **ChatHeader** (`src/components/chat/ChatHeader.tsx`)

```typescript
interface ChatHeaderProps {
  selectedPersona: PersonaType;
  generatedRecipe: RecipeFormData | null;
  isLoading: boolean;
  onSaveRecipe: () => void;
  onConvertToRecipe: () => void;
  onNewRecipe: () => void;
  onChangeAssistant: () => void;
}

// Responsibilities:
// ✅ Display selected persona information
// ✅ Provide recipe management actions
// ✅ Show contextual button states
// ✅ Handle user action events
```

#### **AssistantBadge** (`src/components/chat/AssistantBadge.tsx`)

```typescript
// Responsibilities:
// ✅ Visual indicator for Assistant-powered personas
// ✅ Consistent styling and branding
// ✅ Accessibility support
```

## 📡 **Data Flow Patterns**

### **Unidirectional Data Flow**

```
User Action → Hook State Update → Component Re-render → UI Update
     ↑                                                      ↓
API Response ← Service Layer ← Hook Effect ← State Change
```

### **State Update Patterns**

#### **Optimistic Updates**

```typescript
// Immediately show user message
setMessages(prev => [...prev, userMessage]);

// Then make API call
const response = await openaiAPI.sendMessage(...);

// Add AI response
setMessages(prev => [...prev, aiMessage]);
```

#### **Error Recovery**

```typescript
try {
  // Attempt operation
  await riskyOperation();
} catch (error) {
  // Revert optimistic update
  setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));

  // Show error feedback
  toast({ title: 'Error', description: error.message });
}
```

#### **Loading States**

```typescript
// Start loading
setIsLoading(true);

try {
  // Perform async operation
  const result = await asyncOperation();

  // Update state with result
  setData(result);
} finally {
  // Always clear loading state
  setIsLoading(false);
}
```

## 🔄 **State Synchronization**

### **Cross-Component State Sync**

#### **Recipe Generation Trigger**

```typescript
// useConversation sets generatedRecipe
setGeneratedRecipe(parsedRecipe);

// ChatInterface detects change and notifies parent
useEffect(() => {
  if (generatedRecipe) {
    onRecipeGenerated(generatedRecipe);
  }
}, [generatedRecipe, onRecipeGenerated]);

// ChatRecipePage updates view state
const handleRecipeGenerated = (recipe: RecipeFormData) => {
  setGeneratedRecipe(recipe);
  setShowEditor(true);
};
```

### **State Cleanup Patterns**

#### **Component Unmount Cleanup**

```typescript
useEffect(() => {
  return () => {
    // Cleanup on unmount
    setMessages([]);
    setGeneratedRecipe(null);
    setThreadId(null);
  };
}, []);
```

#### **Navigation Cleanup**

```typescript
const handleBackToChat = () => {
  setShowEditor(false);
  setGeneratedRecipe(null); // Clear recipe data
};
```

## 🎯 **Performance Optimizations**

### **Memoization Strategies**

#### **useCallback for Functions**

```typescript
const sendMessage = useCallback(
  async (content: string) => {
    // Function body
  },
  [messages, persona, threadId, isLoading]
);

const selectPersona = useCallback((selectedPersona: PersonaType) => {
  // Function body
}, []);
```

#### **useMemo for Computed Values**

```typescript
const assistantMessages = useMemo(
  () => messages.filter((msg) => msg.role === 'assistant'),
  [messages]
);

const canSaveRecipe = useMemo(
  () => assistantMessages.length > 0 && !isLoading,
  [assistantMessages.length, isLoading]
);
```

### **State Update Optimization**

#### **Functional Updates**

```typescript
// ✅ Functional update (prevents stale closure)
setMessages((prev) => [...prev, newMessage]);

// ❌ Direct update (can cause stale closure issues)
setMessages([...messages, newMessage]);
```

#### **Batch Updates**

```typescript
// React automatically batches these updates
setIsLoading(false);
setMessages((prev) => [...prev, response]);
setThreadId(response.threadId);
```

## 🔍 **State Debugging**

### **Development Tools**

#### **React DevTools Integration**

```typescript
// Add display names for better debugging
useConversation.displayName = 'useConversation';
ChatInterface.displayName = 'ChatInterface';
```

#### **State Logging**

```typescript
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Conversation state changed:', {
      persona,
      messageCount: messages.length,
      hasGeneratedRecipe: !!generatedRecipe,
      isLoading,
      showPersonaSelector,
    });
  }
}, [persona, messages.length, generatedRecipe, isLoading, showPersonaSelector]);
```

### **State Validation**

#### **Runtime Type Checking**

```typescript
const validateMessage = (message: unknown): message is Message => {
  return (
    typeof message === 'object' &&
    message !== null &&
    'id' in message &&
    'role' in message &&
    'content' in message &&
    'timestamp' in message
  );
};
```

## 📊 **State Monitoring**

### **Performance Metrics**

- **State Update Frequency**: Monitor excessive re-renders
- **Memory Usage**: Track state object sizes
- **Component Mount/Unmount**: Lifecycle performance
- **API Call Efficiency**: Minimize redundant requests

### **Error Tracking**

- **State Corruption**: Invalid state transitions
- **Memory Leaks**: Uncleaned event listeners
- **Stale Closures**: Outdated state references
- **Race Conditions**: Concurrent state updates

---

**Related Documentation**:

- [AI Recipe Creation Workflow](ai-recipe-creation-workflow.md)
- [OpenAI Integration Flow](openai-integration-flow.md)
- [Recipe Save Flow](recipe-save-flow.md)

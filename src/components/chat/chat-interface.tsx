import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { RecipeFormData } from '@/lib/schemas';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onRecipeGenerated: (recipe: RecipeFormData) => void;
}

export function ChatInterface({ onRecipeGenerated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI Recipe Creator. I'll help you create a delicious recipe step by step. What kind of dish would you like to make today? You can tell me about a main ingredient, cuisine type, dietary preferences, or just describe what you're craving!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call AI API with conversation history
      const response = await callAIRecipeAPI([...messages, userMessage]);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if AI provided a complete recipe
      if (response.recipe) {
        setGeneratedRecipe(response.recipe);
      }
    } catch (error) {
      console.error('AI API error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Could you please try sending your message again?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSaveRecipe = () => {
    if (generatedRecipe) {
      onRecipeGenerated(generatedRecipe);
    }
  };

  const startNewConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your AI Recipe Creator. I'll help you create a delicious recipe step by step. What kind of dish would you like to make today? You can tell me about a main ingredient, cuisine type, dietary preferences, or just describe what you're craving!",
        timestamp: new Date(),
      },
    ]);
    setGeneratedRecipe(null);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 bg-orange-100">
            <AvatarFallback className="text-orange-600">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-gray-900">AI Recipe Creator</h2>
            <p className="text-sm text-gray-500">Let's create something delicious together!</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {generatedRecipe && (
            <Button onClick={handleSaveRecipe} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save Recipe
            </Button>
          )}
          <Button variant="outline" onClick={startNewConversation} className="border-orange-500 text-orange-600 hover:bg-orange-50">
            New Recipe
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gray-50">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <Avatar className={`h-8 w-8 ${
                message.role === 'user' 
                  ? 'bg-green-100' 
                  : 'bg-orange-100'
              }`}>
                <AvatarFallback className={
                  message.role === 'user' 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
              
              <Card className={`max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white'
              }`}>
                <CardContent className="p-3">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' 
                      ? 'text-green-100' 
                      : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3">
              <Avatar className="h-8 w-8 bg-orange-100">
                <AvatarFallback className="text-orange-600">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-white">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 bg-white border-t rounded-b-lg">
        <div className="flex items-center space-x-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, or Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}

// Mock AI API call - replace with your actual LLM proxy endpoint
async function callAIRecipeAPI(messages: Message[]): Promise<{
  message: string;
  recipe?: RecipeFormData;
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const lastUserMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
  const conversationLength = messages.filter(m => m.role === 'user').length;
  
  // Simple mock responses based on conversation flow
  if (conversationLength === 1) {
    if (lastUserMessage.includes('pasta') || lastUserMessage.includes('italian')) {
      return {
        message: "Great choice! Italian pasta dishes are always delicious. I'm thinking we could make a creamy garlic parmesan pasta. What protein would you like to add? Some options:\n\n• Grilled chicken\n• Shrimp\n• Italian sausage\n• Keep it vegetarian with mushrooms\n• Or something else you prefer?"
      };
    } else if (lastUserMessage.includes('chicken')) {
      return {
        message: "Chicken is so versatile! Are you in the mood for:\n\n• Something crispy and fried\n• A healthy grilled option\n• A comforting soup or stew\n• An international flavor like teriyaki or curry\n\nAlso, do you have any dietary restrictions I should know about?"
      };
    } else {
      return {
        message: "That sounds interesting! To help me create the perfect recipe for you, could you tell me:\n\n• What's your cooking skill level?\n• How much time do you have?\n• Any ingredients you definitely want to include?\n• Any dietary restrictions or allergies?"
      };
    }
  } else if (conversationLength >= 3) {
    // Generate a complete recipe after a few exchanges
    return {
      message: "Perfect! Based on our conversation, I've created a complete recipe for you. Here's what I came up with - you can review and edit it before saving:",
      recipe: {
        title: "Creamy Garlic Parmesan Chicken Pasta",
        ingredients: [
          "1 lb penne pasta",
          "2 chicken breasts, sliced thin",
          "4 cloves garlic, minced",
          "1 cup heavy cream",
          "1 cup freshly grated Parmesan cheese",
          "2 tbsp olive oil",
          "2 tbsp butter",
          "1/2 cup white wine (optional)",
          "Salt and pepper to taste",
          "Fresh parsley for garnish",
          "Red pepper flakes (optional)"
        ],
        instructions: "1. Cook pasta according to package directions until al dente. Reserve 1 cup pasta water before draining.\n\n2. Season chicken with salt and pepper. Heat olive oil in a large skillet over medium-high heat.\n\n3. Cook chicken until golden brown and cooked through, about 6-7 minutes per side. Remove and set aside.\n\n4. In the same skillet, add butter and minced garlic. Cook for 1 minute until fragrant.\n\n5. Add white wine (if using) and let it reduce by half.\n\n6. Pour in heavy cream and bring to a gentle simmer. Add Parmesan cheese and whisk until melted and smooth.\n\n7. Add cooked pasta and chicken back to the skillet. Toss to combine, adding pasta water as needed for consistency.\n\n8. Season with salt, pepper, and red pepper flakes. Garnish with fresh parsley and serve immediately.",
        notes: "**Tips:**\n• Use freshly grated Parmesan for the best flavor\n• Don't let the cream boil or it may curdle\n• Save some pasta water - it helps bind the sauce\n\n**Variations:**\n• Add sun-dried tomatoes or spinach\n• Substitute chicken with shrimp\n• Use half-and-half for a lighter version"
      }
    };
  } else {
    return {
      message: "That's a great addition! Let me ask a few more questions to perfect this recipe:\n\n• What cooking method do you prefer?\n• Any specific flavors or seasonings you love?\n• Should this be a quick weeknight meal or something more elaborate?\n\nI'm getting excited about what we're creating together!"
    };
  }
}
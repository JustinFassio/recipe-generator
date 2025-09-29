import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import type { PersonaType } from '@/lib/openai';

export function CoachChatPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const personaParam = params.get('persona') as PersonaType | null;

  // For coach chat, we don't need recipe generation functionality
  const handleCoachResponse = () => {
    // This could be used for other coach-specific actions in the future
    console.log('Coach response received');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                AI Health Coach
              </h1>
              <p className="text-sm text-gray-600 sm:text-base">
                Get personalized health guidance and evaluation from our AI
                health specialists
              </p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm">
          <ChatInterface
            onRecipeGenerated={handleCoachResponse}
            defaultPersona={personaParam ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}

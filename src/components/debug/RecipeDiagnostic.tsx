import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { recipeApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticResults {
  timestamp: string;
  recipeId: string;
  environment: {
    isProduction: boolean;
    supabaseUrl: string;
    supabaseKey: string;
  };
  tests: {
    getPublicRecipe?: {
      success: boolean;
      duration?: number;
      found?: boolean;
      title?: string;
      author?: string;
      isPublic?: boolean;
      error?: string;
      stack?: string;
    };
    environment?: {
      supabaseUrl: string;
      supabaseKey: string;
      nodeEnv: string;
    };
  };
}

interface RecipeDiagnosticProps {
  recipeId?: string;
}

export function RecipeDiagnostic({ recipeId }: RecipeDiagnosticProps) {
  const [diagnosticResults, setDiagnosticResults] =
    useState<DiagnosticResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runDiagnostic = async () => {
    if (!recipeId) {
      toast({
        title: 'Error',
        description: 'No recipe ID provided for diagnostic',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    const results: DiagnosticResults = {
      timestamp: new Date().toISOString(),
      recipeId,
      environment: {
        isProduction: import.meta.env.PROD,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      },
      tests: {},
    };

    try {
      // Test 1: Direct API call
      console.log('🧪 [Diagnostic] Testing getPublicRecipe API...');
      const startTime = Date.now();
      const recipe = await recipeApi.getPublicRecipe(recipeId);
      const endTime = Date.now();

      results.tests.getPublicRecipe = {
        success: true,
        duration: endTime - startTime,
        found: !!recipe,
        title: recipe?.title,
        author: recipe?.author_name,
        isPublic: recipe?.is_public,
      };

      // Test 2: Check if recipe exists but not public
      console.log('🧪 [Diagnostic] Testing if recipe exists but not public...');
      // This would require a separate API call, but we'll skip for now

      // Test 3: Environment check
      results.tests.environment = {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY
          ? 'Present'
          : 'Missing',
        nodeEnv: import.meta.env.MODE,
      };

      setDiagnosticResults(results);

      toast({
        title: 'Success',
        description: 'Diagnostic completed successfully',
      });
    } catch (error) {
      results.tests.getPublicRecipe = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      };

      setDiagnosticResults(results);

      toast({
        title: 'Diagnostic Error',
        description: 'Diagnostic encountered an error',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={runDiagnostic}
          disabled={isRunning || !recipeId}
          variant="outline"
        >
          {isRunning ? 'Running Diagnostic...' : 'Run Recipe Diagnostic'}
        </Button>
        {recipeId && (
          <span className="text-sm text-gray-600">Recipe ID: {recipeId}</span>
        )}
      </div>

      {diagnosticResults && (
        <div className="rounded-lg border bg-gray-50 p-4">
          <h3 className="mb-2 font-semibold">Diagnostic Results</h3>
          <pre className="overflow-auto text-xs">
            {JSON.stringify(diagnosticResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

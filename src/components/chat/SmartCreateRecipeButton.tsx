import React, { useState } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseRecipeUnified } from '@/lib/recipe-parser-unified';
import { toast } from '@/hooks/use-toast';
import type { RecipeFormData } from '@/lib/schemas';

const HEALTH_ASSISTANT_PERSONA = 'drLunaClearwater';

interface SmartCreateRecipeButtonProps {
  conversationContent: string;
  onRecipeParsed: (recipe: RecipeFormData) => void;
  className?: string;
  persona?: string;
  onGenerateReport?: () => Promise<void>;
  onSaveReport?: () => Promise<void>;
}

export const SmartCreateRecipeButton: React.FC<
  SmartCreateRecipeButtonProps
> = ({
  conversationContent,
  onRecipeParsed,
  className = '',
  persona,
  onGenerateReport,
  onSaveReport,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );

  const handleCreateRecipe = async () => {
    setIsLoading(true);
    setParseStatus('idle');

    const isHealthAssistant = persona === HEALTH_ASSISTANT_PERSONA;

    try {
      if (isHealthAssistant) {
        // For health assistant, generate and save the evaluation report
        if (onGenerateReport && onSaveReport) {
          // Step 1: Generate the report
          await onGenerateReport();

          // Step 2: Save the report to database
          await onSaveReport();

          setParseStatus('success');

          toast({
            title: 'Health Report Generated!',
            description:
              'Your comprehensive health evaluation report is ready to view.',
            duration: 2000,
          });

          // Navigate immediately after successful generation and save
          // No setTimeout needed since we've awaited both operations
          navigate('/evaluation-report?refresh=true');
        } else {
          // Fallback: show error if report generation or save functions not provided
          setParseStatus('error');
          toast({
            title: 'Report Generation Failed',
            description: 'Unable to generate health report. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        // Regular recipe parsing for other assistants
        const result = await parseRecipeUnified(conversationContent);

        if (result.success && result.recipe) {
          setParseStatus('success');
          onRecipeParsed(result.recipe);

          toast({
            title: 'Recipe Parsed Successfully!',
            description: `"${result.recipe.title}" is ready to save. Please review and save it to your collection.`,
            duration: 1500,
          });

          // Show warnings if any
          if (result.warnings && result.warnings.length > 0) {
            result.warnings.forEach((warning) => {
              toast({
                title: 'Note',
                description: warning,
                variant: 'default',
              });
            });
          }
        } else {
          setParseStatus('error');
          toast({
            title: 'Unable to Parse Recipe',
            description:
              result.error ||
              "The conversation doesn't contain a complete recipe. Please ask the AI to provide a full recipe with ingredients and instructions.",
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      setParseStatus('error');
      console.error(
        isHealthAssistant
          ? 'Health report generation error:'
          : 'Recipe parsing error:',
        error
      );
      toast({
        title: isHealthAssistant
          ? 'Report Generation Failed'
          : 'Parsing Failed',
        description: isHealthAssistant
          ? 'An unexpected error occurred while generating your health report. Please try again.'
          : 'An unexpected error occurred while parsing the recipe. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    const isHealthAssistant = persona === HEALTH_ASSISTANT_PERSONA;

    if (isLoading) {
      return (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>
            {isHealthAssistant ? 'Generating Report...' : 'Parsing Recipe...'}
          </span>
        </>
      );
    }

    if (parseStatus === 'success') {
      return (
        <>
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>{isHealthAssistant ? 'View Report' : 'Recipe Ready!'}</span>
        </>
      );
    }

    if (parseStatus === 'error') {
      return (
        <>
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Try Again</span>
        </>
      );
    }

    return (
      <>
        <Save className="h-5 w-5" />
        <span>{isHealthAssistant ? 'Generate Report' : 'Create Recipe'}</span>
      </>
    );
  };

  const getButtonClasses = () => {
    const baseClasses = `
      btn btn-primary btn-lg
      flex items-center gap-3
      px-8 py-4
      text-lg font-semibold
      shadow-lg hover:shadow-xl
      transition-all duration-200
      ${isLoading ? 'loading' : ''}
    `;

    if (parseStatus === 'success') {
      return baseClasses.replace('btn-primary', 'btn-success');
    }

    if (parseStatus === 'error') {
      return baseClasses.replace('btn-primary', 'btn-error');
    }

    return baseClasses;
  };

  return (
    <div className={`flex justify-center p-4 ${className}`}>
      <button
        onClick={handleCreateRecipe}
        disabled={isLoading}
        className={getButtonClasses()}
      >
        {getButtonContent()}
      </button>
    </div>
  );
};

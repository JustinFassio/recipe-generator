import React, { useState } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { parseRecipeUnified } from '@/lib/recipe-parser-unified';
import { toast } from '@/hooks/use-toast';
import type { RecipeFormData } from '@/lib/schemas';

interface SmartCreateRecipeButtonProps {
  conversationContent: string;
  onRecipeParsed: (recipe: RecipeFormData) => void;
  className?: string;
}

export const SmartCreateRecipeButton: React.FC<
  SmartCreateRecipeButtonProps
> = ({ conversationContent, onRecipeParsed, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );

  const handleCreateRecipe = async () => {
    setIsLoading(true);
    setParseStatus('idle');

    try {
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
    } catch (error) {
      setParseStatus('error');
      console.error('Recipe parsing error:', error);
      toast({
        title: 'Parsing Failed',
        description:
          'An unexpected error occurred while parsing the recipe. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Parsing Recipe...</span>
        </>
      );
    }

    if (parseStatus === 'success') {
      return (
        <>
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Recipe Ready!</span>
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
        <span>Create Recipe</span>
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

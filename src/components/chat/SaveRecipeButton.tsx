import React from 'react';
import { Save, Loader2 } from 'lucide-react';

interface SaveRecipeButtonProps {
  onSave: () => void;
  isLoading: boolean;
  className?: string;
}

export const SaveRecipeButton: React.FC<SaveRecipeButtonProps> = ({
  onSave,
  isLoading,
  className = ''
}) => {
  return (
    <div className={`flex justify-center p-4 ${className}`}>
      <button
        onClick={onSave}
        disabled={isLoading}
        className={`
          btn btn-primary btn-lg
          flex items-center gap-3
          px-8 py-4
          text-lg font-semibold
          shadow-lg hover:shadow-xl
          transition-all duration-200
          ${isLoading ? 'loading' : ''}
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Saving Recipe...</span>
          </>
        ) : (
          <>
            <Save className="h-6 w-6" />
            <span>Save Recipe</span>
          </>
        )}
      </button>
    </div>
  );
};

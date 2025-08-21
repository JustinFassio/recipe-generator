import React from 'react';
import { ChefHat } from 'lucide-react';

interface CookingSaveButtonProps {
  onClick: () => Promise<void>;
  loading: boolean;
  className?: string;
}

export const CookingSaveButton: React.FC<CookingSaveButtonProps> = ({
  onClick,
  loading,
  className = '',
}) => {
  return (
    <button
      type="button"
      className={`btn btn-primary w-full ${loading ? 'loading' : ''} ${className}`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        'Saving...'
      ) : (
        <>
          <ChefHat className="mr-2 h-4 w-4" />
          Save Cooking Preferences
        </>
      )}
    </button>
  );
};

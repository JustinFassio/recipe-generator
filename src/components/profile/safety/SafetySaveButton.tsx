import React from 'react';
import { Shield } from 'lucide-react';

interface SafetySaveButtonProps {
  onClick: () => Promise<void>;
  loading: boolean;
  className?: string;
}

export const SafetySaveButton: React.FC<SafetySaveButtonProps> = ({
  onClick,
  loading,
  className = '',
}) => {
  return (
    <button
      type="button"
      className={`btn btn-warning w-full ${loading ? 'loading' : ''} ${className}`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        'Saving...'
      ) : (
        <>
          <Shield className="mr-2 h-4 w-4" />
          Save Safety Preferences
        </>
      )}
    </button>
  );
};

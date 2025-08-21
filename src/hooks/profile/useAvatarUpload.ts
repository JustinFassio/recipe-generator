import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { uploadAvatar } from '@/lib/auth';

export interface UseAvatarUploadReturn {
  // State
  loading: boolean;
  error: string | null;

  // Actions
  uploadAvatar: (file: File) => Promise<boolean>;
}

/**
 * Hook for managing avatar upload functionality
 * Extracted from profile page to centralize avatar management logic
 */
export function useAvatarUpload(): UseAvatarUploadReturn {
  const { refreshProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload avatar and update profile
   */
  const uploadAvatarAction = useCallback(
    async (file: File): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const { success, error: uploadError } = await uploadAvatar(file);

        if (success) {
          await refreshProfile();

          toast({
            title: 'Success',
            description: 'Avatar updated successfully!',
          });

          return true;
        } else {
          const errorMessage =
            uploadError?.message || 'Failed to upload avatar';
          setError(errorMessage);

          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });

          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload avatar';
        setError(errorMessage);

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        console.error('Error uploading avatar:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshProfile, toast]
  );

  return {
    // State
    loading,
    error,

    // Actions
    uploadAvatar: uploadAvatarAction,
  };
}

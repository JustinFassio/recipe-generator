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
        const result = await uploadAvatar(file);
        const { success, error: uploadError } = result;

        if (success) {
          await refreshProfile();

          // Show success message with compression info if available
          const compressionInfo = result.compressionInfo;
          const description = compressionInfo
            ? `Avatar updated successfully! Image optimized: ${compressionInfo.compressionRatio}% smaller (${Math.round(compressionInfo.originalSize / 1024)}KB → ${Math.round(compressionInfo.processedSize / 1024)}KB)`
            : 'Avatar updated successfully!';

          toast({
            title: 'Success',
            description,
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

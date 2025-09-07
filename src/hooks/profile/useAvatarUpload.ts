import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { uploadAvatar } from '@/lib/auth';
import { useAvatarAnalytics } from '@/lib/avatar-analytics';
import { useAdvancedAvatarCache } from '@/lib/avatar-cache-advanced';

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
  const { refreshProfile, user } = useAuth();
  const { toast } = useToast();
  const { trackUpload } = useAvatarAnalytics();
  const { invalidateUserAvatars } = useAdvancedAvatarCache();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload avatar and update profile
   */
  const uploadAvatarAction = useCallback(
    async (file: File): Promise<boolean> => {
      setLoading(true);
      setError(null);

      const startTime = performance.now();
      const originalFileSize = file.size;
      const fileType = file.type;

      try {
        const result = await uploadAvatar(file);
        const uploadDuration = performance.now() - startTime;
        const { success, error: uploadError, compressionInfo } = result;

        // Track upload analytics
        trackUpload({
          userId: user?.id || 'anonymous',
          originalFileSize,
          processedFileSize: compressionInfo?.processedSize || originalFileSize,
          compressionRatio: compressionInfo?.compressionRatio || 0,
          uploadDuration,
          fileType,
          success,
          errorType: uploadError?.code,
        });

        if (success) {
          // Invalidate user's avatar cache to ensure fresh data
          if (user?.id) {
            invalidateUserAvatars(user.id);
          }

          await refreshProfile();

          // Show success message with compression info if available
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
        const uploadDuration = performance.now() - startTime;
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload avatar';
        setError(errorMessage);

        // Track failed upload
        trackUpload({
          userId: user?.id || 'anonymous',
          originalFileSize,
          processedFileSize: originalFileSize,
          compressionRatio: 0,
          uploadDuration,
          fileType,
          success: false,
          errorType: 'network_error',
        });

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
    [refreshProfile, toast, trackUpload, user?.id, invalidateUserAvatars]
  );

  return {
    // State
    loading,
    error,

    // Actions
    uploadAvatar: uploadAvatarAction,
  };
}

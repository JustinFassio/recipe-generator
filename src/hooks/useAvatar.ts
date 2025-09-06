import { useState, useCallback, useEffect } from 'react';
import { useAvatarCache } from '@/lib/avatar-cache';
import { getOptimizedAvatarUrl, type AvatarSizeKey } from '@/lib/avatar-utils';

export interface UseAvatarOptions {
  size?: AvatarSizeKey;
  preload?: boolean;
  priority?: boolean;
}

export interface UseAvatarReturn {
  optimizedUrl: string | null;
  isCached: boolean;
  isLoading: boolean;
  error: string | null;
  preloadAvatar: () => Promise<void>;
}

/**
 * Hook for managing avatar display with caching and optimization
 */
export function useAvatar(
  avatarUrl: string | null,
  options: UseAvatarOptions = {}
): UseAvatarReturn {
  const { size = 'medium', preload = false } = options;
  const { preloadAvatar: cachePreload, isAvatarCached } = useAvatarCache();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get optimized URL
  const optimizedUrl = avatarUrl
    ? getOptimizedAvatarUrl(avatarUrl, size)
    : null;

  // Check if avatar is cached
  const isCached = avatarUrl ? isAvatarCached(avatarUrl, size) : false;

  // Preload avatar function
  const preloadAvatar = useCallback(async () => {
    if (!avatarUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      await cachePreload(avatarUrl, size);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preload avatar');
    } finally {
      setIsLoading(false);
    }
  }, [avatarUrl, size, cachePreload]);

  // Auto-preload if enabled
  useEffect(() => {
    if (preload && avatarUrl && !isCached) {
      preloadAvatar();
    }
  }, [preload, avatarUrl, isCached, preloadAvatar]);

  return {
    optimizedUrl,
    isCached,
    isLoading,
    error,
    preloadAvatar,
  };
}

/**
 * Hook for managing multiple avatars (e.g., in a list)
 */
export function useMultipleAvatars(
  users: Array<{ id: string; avatar_url?: string | null }>,
  options: UseAvatarOptions = {}
) {
  const { size = 'medium', preload = false } = options;
  const { preloadAvatar, isAvatarCached } = useAvatarCache();

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get optimized URLs for all users
  const optimizedUrls = users.reduce(
    (acc, user) => {
      if (user.avatar_url) {
        acc[user.id] = getOptimizedAvatarUrl(user.avatar_url, size);
      }
      return acc;
    },
    {} as Record<string, string | null>
  );

  // Check cache status for all users
  const cacheStatus = users.reduce(
    (acc, user) => {
      if (user.avatar_url) {
        acc[user.id] = isAvatarCached(user.avatar_url, size);
      }
      return acc;
    },
    {} as Record<string, boolean>
  );

  // Preload all avatars
  const preloadAllAvatars = useCallback(async () => {
    if (!preload) return;

    const preloadPromises = users
      .filter((user) => user.avatar_url && !cacheStatus[user.id])
      .map(async (user) => {
        setLoadingStates((prev) => ({ ...prev, [user.id]: true }));
        setErrors((prev) => ({ ...prev, [user.id]: '' }));

        try {
          await preloadAvatar(user.avatar_url!, size);
        } catch (err) {
          setErrors((prev) => ({
            ...prev,
            [user.id]: err instanceof Error ? err.message : 'Failed to preload',
          }));
        } finally {
          setLoadingStates((prev) => ({ ...prev, [user.id]: false }));
        }
      });

    await Promise.allSettled(preloadPromises);
  }, [users, preload, cacheStatus, preloadAvatar, size]);

  // Auto-preload if enabled
  useEffect(() => {
    preloadAllAvatars();
  }, [preloadAllAvatars]);

  return {
    optimizedUrls,
    cacheStatus,
    loadingStates,
    errors,
    preloadAllAvatars,
  };
}

/**
 * Hook for avatar upload with progress tracking
 */
export function useAvatarUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadAvatar = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Simulate progress (in real implementation, you'd track actual upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Import the upload function dynamically to avoid circular dependencies
      const { uploadAvatar: uploadFn } = await import('@/lib/auth');
      const result = await uploadFn(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        return result;
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000); // Reset progress after 1 second
    }
  }, []);

  return {
    uploadAvatar,
    uploadProgress,
    isUploading,
    uploadError,
  };
}

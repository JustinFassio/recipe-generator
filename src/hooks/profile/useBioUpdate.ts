import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/lib/auth';

export interface UseBioUpdateReturn {
  // State
  bio: string;
  loading: boolean;
  error: string | null;

  // Actions
  setBio: (bio: string) => void;
  saveBio: () => Promise<boolean>;
  updateBio: (newBio: string) => Promise<boolean>;
}

/**
 * Hook for managing bio update functionality
 * Extracted from profile page to centralize bio management logic
 */
export function useBioUpdate(): UseBioUpdateReturn {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update bio state when profile changes (fixes refresh issue)
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
    }
  }, [profile]);

  /**
   * Save current bio to database
   */
  const saveBio = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { success, error: updateError } = await updateProfile({
        bio: bio || null,
      });

      if (success) {
        await refreshProfile();

        toast({
          title: 'Success',
          description: 'Bio updated successfully!',
        });

        return true;
      } else {
        const errorMessage = updateError?.message || 'Failed to update bio';
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
        err instanceof Error ? err.message : 'Failed to update bio';
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
  }, [bio, refreshProfile, toast]);

  /**
   * Update bio with new value and save
   */
  const updateBio = useCallback(
    async (newBio: string): Promise<boolean> => {
      setBio(newBio);

      setLoading(true);
      setError(null);

      try {
        const { success, error: updateError } = await updateProfile({
          bio: newBio || null,
        });

        if (success) {
          await refreshProfile();

          toast({
            title: 'Success',
            description: 'Bio updated successfully!',
          });

          return true;
        } else {
          const errorMessage = updateError?.message || 'Failed to update bio';
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
          err instanceof Error ? err.message : 'Failed to update bio';
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
    bio,
    loading,
    error,

    // Actions
    setBio,
    saveBio,
    updateBio,
  };
}

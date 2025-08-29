import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { checkUsernameAvailability, claimUsername } from '@/lib/auth';

// Username validation constants
const USERNAME_SANITIZATION_REGEX = /[^a-z0-9_]/g;

// Hook return interface
export interface UseUsernameAvailabilityReturn {
  // State
  username: string;
  isAvailable: boolean | null;
  isChecking: boolean;
  error: string | null;

  // Actions
  checkUsername: (username: string) => Promise<void>;
  claimUsername: (username: string) => Promise<boolean>;
  setUsername: (username: string) => void;
  handleUsernameChange: (value: string) => void;

  // Cleanup
  clearUsernameTimeout: () => void;
}

/**
 * Hook for managing username availability checking and claiming
 * Extracted from profile page to centralize username-related business logic
 * Includes debounced availability checking
 */
export function useUsernameAvailability(): UseUsernameAvailabilityReturn {
  const { refreshProfile } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear any pending username check timeout
   */
  const clearUsernameTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Check username availability (without debouncing)
   */
  const checkUsername = useCallback(async (usernameValue: string) => {
    if (!usernameValue || usernameValue.length < 3) {
      setIsAvailable(null);
      setError(null);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const { available, error: checkError } =
        await checkUsernameAvailability(usernameValue);

      if (checkError) {
        setError(checkError.message);
        setIsAvailable(null);
      } else {
        setIsAvailable(available);
      }
    } catch {
      setError('Failed to check username availability');
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Claim/update username
   */
  const claimUsernameAction = useCallback(
    async (usernameValue: string): Promise<boolean> => {
      if (!usernameValue) {
        setError('Username is required');
        return false;
      }

      setError(null);

      try {
        const { success, error: claimError } =
          await claimUsername(usernameValue);

        if (success) {
          // Clear username state after successful claim
          setUsername('');
          setIsAvailable(null);

          console.log(
            '🔄 Username claimed successfully, refreshing profile...'
          );

          // Refresh profile to get updated data
          await refreshProfile();

          console.log('✅ Profile refresh completed');

          // Force a small delay to ensure the profile update is processed
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Add additional debugging to check if profile was actually updated
          console.log('🔍 Checking if profile was updated...');

          toast({
            title: 'Success',
            description: 'Username updated successfully!',
          });

          return true;
        } else {
          const errorMessage =
            claimError?.message || 'Failed to update username';
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
          err instanceof Error ? err.message : 'Failed to update username';
        setError(errorMessage);

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        setError('Failed to claim username');
        return false;
      }
    },
    [refreshProfile, toast]
  );

  /**
   * Handle username input change with sanitization and debounced checking
   */
  const handleUsernameChange = useCallback(
    (value: string) => {
      // Sanitize username input: lowercase and remove invalid characters
      const sanitizedValue = value
        .toLowerCase()
        .replace(USERNAME_SANITIZATION_REGEX, '');
      setUsername(sanitizedValue);
      setIsAvailable(null);
      setError(null);

      // Clear existing timeout
      clearUsernameTimeout();

      // Set up debounced check (500ms delay)
      if (sanitizedValue) {
        timeoutRef.current = setTimeout(() => {
          checkUsername(sanitizedValue);
        }, 500);
      }
    },
    [checkUsername, clearUsernameTimeout]
  );

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      clearUsernameTimeout();
    };
  }, [clearUsernameTimeout]);

  return {
    // State
    username,
    isAvailable,
    isChecking,
    error,

    // Actions
    checkUsername,
    claimUsername: claimUsernameAction,
    setUsername,
    handleUsernameChange,

    // Cleanup
    clearUsernameTimeout,
  };
}

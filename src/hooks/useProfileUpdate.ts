import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/lib/auth';
import {
  updateUserSafety,
  updateCookingPreferences,
} from '@/lib/user-preferences';

interface UpdateFunction<T> {
  (
    data: T
  ): Promise<{ success: boolean; error?: string | { message: string } }>;
}

interface UpdateFunctionWithUserId<T> {
  (userId: string, data: T): Promise<{ success: boolean; error?: string }>;
}

interface UseProfileUpdateOptions {
  successMessage: string;
  errorMessage: string;
}

export function useProfileUpdate<T>(
  updateFunction: UpdateFunction<T>,
  options: UseProfileUpdateOptions
) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const executeUpdate = async (data: T) => {
    try {
      setLoading(true);
      const result = await updateFunction(data);

      if (result.success) {
        toast({
          title: 'Success',
          description: options.successMessage,
        });
        return { success: true };
      } else {
        const errorMessage =
          typeof result.error === 'string'
            ? result.error
            : result.error?.message || options.errorMessage;
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : options.errorMessage,
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    executeUpdate,
  };
}

export function useProfileUpdateWithUserId<T>(
  updateFunction: UpdateFunctionWithUserId<T>,
  options: UseProfileUpdateOptions
) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const executeUpdate = async (userId: string, data: T) => {
    try {
      setLoading(true);
      const result = await updateFunction(userId, data);

      if (result.success) {
        toast({
          title: 'Success',
          description: options.successMessage,
        });
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : options.errorMessage,
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    executeUpdate,
  };
}

// Specialized hooks for different update types
export function useProfileBasicsUpdate() {
  return useProfileUpdate(updateProfile, {
    successMessage: 'Profile updated successfully!',
    errorMessage: 'Failed to update profile',
  });
}

export function useBioUpdate() {
  return useProfileUpdate(updateProfile, {
    successMessage: 'Bio updated successfully!',
    errorMessage: 'Failed to update bio',
  });
}

export function useUserSafetyUpdate() {
  return useProfileUpdateWithUserId(updateUserSafety, {
    successMessage: 'Safety preferences updated successfully!',
    errorMessage: 'Failed to update safety preferences',
  });
}

export function useCookingPreferencesUpdate() {
  return useProfileUpdateWithUserId(updateCookingPreferences, {
    successMessage: 'Cooking preferences updated successfully!',
    errorMessage: 'Failed to update cooking preferences',
  });
}

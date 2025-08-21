import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { updateEmail, updatePassword } from '@/lib/auth';

export interface UseAccountManagementReturn {
  // Email state
  currentEmail: string;
  newEmail: string;
  emailLoading: boolean;
  emailError: string | null;

  // Password state
  newPassword: string;
  confirmPassword: string;
  passwordLoading: boolean;
  passwordError: string | null;

  // Email actions
  setNewEmail: (email: string) => void;
  updateEmailAddress: () => Promise<boolean>;

  // Password actions
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  updateUserPassword: () => Promise<boolean>;

  // Validation
  isPasswordValid: boolean;
}

/**
 * Hook for managing account email and password updates
 * Extracted from profile page to centralize account management logic
 */
export function useAccountManagement(): UseAccountManagementReturn {
  const { user } = useAuth();
  const { toast } = useToast();

  // Email state
  const [currentEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Password validation
  const isPasswordValid =
    newPassword.length >= 6 && newPassword === confirmPassword;

  /**
   * Update email address
   */
  const updateEmailAddress = useCallback(async (): Promise<boolean> => {
    if (!newEmail.trim()) {
      setEmailError('Email is required');
      return false;
    }

    setEmailLoading(true);
    setEmailError(null);

    try {
      const { success, error } = await updateEmail(newEmail);

      if (success) {
        toast({
          title: 'Success',
          description:
            'Email update initiated! Please check your new email for confirmation.',
        });

        setNewEmail('');
        return true;
      } else {
        const errorMessage = error?.message || 'Failed to update email';
        setEmailError(errorMessage);

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update email';
      setEmailError(errorMessage);

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return false;
    } finally {
      setEmailLoading(false);
    }
  }, [newEmail, toast]);

  /**
   * Update password
   */
  const updateUserPassword = useCallback(async (): Promise<boolean> => {
    if (!isPasswordValid) {
      setPasswordError('Passwords must match and be at least 6 characters');
      return false;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    try {
      const { success, error } = await updatePassword(newPassword);

      if (success) {
        toast({
          title: 'Success',
          description: 'Password updated successfully!',
        });

        setNewPassword('');
        setConfirmPassword('');
        return true;
      } else {
        const errorMessage = error?.message || 'Failed to update password';
        setPasswordError(errorMessage);

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update password';
      setPasswordError(errorMessage);

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return false;
    } finally {
      setPasswordLoading(false);
    }
  }, [newPassword, isPasswordValid, toast]);

  return {
    // Email state
    currentEmail,
    newEmail,
    emailLoading,
    emailError,

    // Password state
    newPassword,
    confirmPassword,
    passwordLoading,
    passwordError,

    // Email actions
    setNewEmail,
    updateEmailAddress,

    // Password actions
    setNewPassword,
    setConfirmPassword,
    updateUserPassword,

    // Validation
    isPasswordValid,
  };
}

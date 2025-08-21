import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAccountManagement } from '@/hooks/profile/useAccountManagement';
import * as auth from '@/lib/auth';

// Mock the dependencies
const mockToast = vi.fn();

// Default mock user
let mockUser = {
  email: 'test@example.com',
};

vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/lib/auth', () => ({
  updateEmail: vi.fn(),
  updatePassword: vi.fn(),
}));

describe('useAccountManagement', () => {
  const mockUpdateEmail = auth.updateEmail as ReturnType<typeof vi.fn>;
  const mockUpdatePassword = auth.updatePassword as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock user to default
    mockUser = {
      email: 'test@example.com',
    };
  });

  describe('Initial State', () => {
    it('should initialize with user email and empty form fields', () => {
      const { result } = renderHook(() => useAccountManagement());

      expect(result.current.currentEmail).toBe('test@example.com');
      expect(result.current.newEmail).toBe('');
      expect(result.current.newPassword).toBe('');
      expect(result.current.confirmPassword).toBe('');
      expect(result.current.emailLoading).toBe(false);
      expect(result.current.passwordLoading).toBe(false);
      expect(result.current.emailError).toBe(null);
      expect(result.current.passwordError).toBe(null);
      expect(result.current.isPasswordValid).toBe(false);
    });

    it('should initialize with empty email when user has no email', () => {
      mockUser = { email: null };

      const { result } = renderHook(() => useAccountManagement());

      expect(result.current.currentEmail).toBe('');
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useAccountManagement());

      expect(typeof result.current.setNewEmail).toBe('function');
      expect(typeof result.current.setNewPassword).toBe('function');
      expect(typeof result.current.setConfirmPassword).toBe('function');
      expect(typeof result.current.updateEmailAddress).toBe('function');
      expect(typeof result.current.updateUserPassword).toBe('function');
    });
  });

  describe('Email Management', () => {
    it('should update newEmail state', () => {
      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewEmail('new@example.com');
      });

      expect(result.current.newEmail).toBe('new@example.com');
    });

    it('should update email successfully', async () => {
      mockUpdateEmail.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAccountManagement());

      // Set new email
      act(() => {
        result.current.setNewEmail('new@example.com');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateEmailAddress();
      });

      expect(updateResult!).toBe(true);
      expect(mockUpdateEmail).toHaveBeenCalledWith('new@example.com');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description:
          'Email update initiated! Please check your new email for confirmation.',
      });
      expect(result.current.newEmail).toBe(''); // Should be cleared
      expect(result.current.emailLoading).toBe(false);
      expect(result.current.emailError).toBe(null);
    });

    it('should handle email update errors', async () => {
      const errorMessage = 'Email already exists';
      mockUpdateEmail.mockResolvedValue({
        success: false,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewEmail('existing@example.com');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateEmailAddress();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.emailError).toBe(errorMessage);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      expect(result.current.newEmail).toBe('existing@example.com'); // Should not be cleared
    });

    it('should handle network errors during email update', async () => {
      const errorMessage = 'Network error';
      mockUpdateEmail.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewEmail('network@example.com');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateEmailAddress();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.emailError).toBe(errorMessage);
    });

    it('should reject empty email', async () => {
      const { result } = renderHook(() => useAccountManagement());

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateEmailAddress();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.emailError).toBe('Email is required');
      expect(mockUpdateEmail).not.toHaveBeenCalled();
    });

    it('should reject whitespace-only email', async () => {
      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewEmail('   ');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateEmailAddress();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.emailError).toBe('Email is required');
    });

    it('should handle email update errors without error message', async () => {
      mockUpdateEmail.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewEmail('test@example.com');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateEmailAddress();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.emailError).toBe(errorMessage);
    });

    it('should set loading state during email update', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdateEmail.mockReturnValue(promise);

      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewEmail('loading@example.com');
      });

      // Start updating
      act(() => {
        result.current.updateEmailAddress();
      });

      expect(result.current.emailLoading).toBe(true);

      // Complete updating
      await act(async () => {
        resolvePromise({ success: true });
        await promise;
      });

      expect(result.current.emailLoading).toBe(false);
    });
  });

  describe('Password Management', () => {
    it('should update password state', () => {
      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewPassword('newpassword123');
        result.current.setConfirmPassword('newpassword123');
      });

      expect(result.current.newPassword).toBe('newpassword123');
      expect(result.current.confirmPassword).toBe('newpassword123');
    });

    it('should validate password correctly', () => {
      const { result } = renderHook(() => useAccountManagement());

      // Invalid - too short
      act(() => {
        result.current.setNewPassword('123');
        result.current.setConfirmPassword('123');
      });
      expect(result.current.isPasswordValid).toBe(false);

      // Invalid - don't match
      act(() => {
        result.current.setNewPassword('password123');
        result.current.setConfirmPassword('password456');
      });
      expect(result.current.isPasswordValid).toBe(false);

      // Valid
      act(() => {
        result.current.setNewPassword('password123');
        result.current.setConfirmPassword('password123');
      });
      expect(result.current.isPasswordValid).toBe(true);
    });

    it('should update password successfully', async () => {
      mockUpdatePassword.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAccountManagement());

      // Set valid password
      act(() => {
        result.current.setNewPassword('newpassword123');
        result.current.setConfirmPassword('newpassword123');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateUserPassword();
      });

      expect(updateResult!).toBe(true);
      expect(mockUpdatePassword).toHaveBeenCalledWith('newpassword123');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Password updated successfully!',
      });
      expect(result.current.newPassword).toBe(''); // Should be cleared
      expect(result.current.confirmPassword).toBe(''); // Should be cleared
      expect(result.current.passwordLoading).toBe(false);
      expect(result.current.passwordError).toBe(null);
    });

    it('should handle password update errors', async () => {
      const errorMessage = 'Password too weak';
      mockUpdatePassword.mockResolvedValue({
        success: false,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewPassword('weakpass');
        result.current.setConfirmPassword('weakpass');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateUserPassword();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.passwordError).toBe(errorMessage);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('should reject invalid password', async () => {
      const { result } = renderHook(() => useAccountManagement());

      // Set invalid password (too short)
      act(() => {
        result.current.setNewPassword('123');
        result.current.setConfirmPassword('123');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateUserPassword();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.passwordError).toBe(
        'Passwords must match and be at least 6 characters'
      );
      expect(mockUpdatePassword).not.toHaveBeenCalled();
    });

    it('should reject mismatched passwords', async () => {
      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewPassword('password123');
        result.current.setConfirmPassword('password456');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateUserPassword();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.passwordError).toBe(
        'Passwords must match and be at least 6 characters'
      );
    });

    it('should handle network errors during password update', async () => {
      const errorMessage = 'Network error';
      mockUpdatePassword.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewPassword('networkpass123');
        result.current.setConfirmPassword('networkpass123');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateUserPassword();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.passwordError).toBe(errorMessage);
    });

    it('should handle password update errors without error message', async () => {
      mockUpdatePassword.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewPassword('testpass123');
        result.current.setConfirmPassword('testpass123');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateUserPassword();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.passwordError).toBe(errorMessage);
    });

    it('should set loading state during password update', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdatePassword.mockReturnValue(promise);

      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewPassword('loadingpass123');
        result.current.setConfirmPassword('loadingpass123');
      });

      // Start updating
      act(() => {
        result.current.updateUserPassword();
      });

      expect(result.current.passwordLoading).toBe(true);

      // Complete updating
      await act(async () => {
        resolvePromise({ success: true });
        await promise;
      });

      expect(result.current.passwordLoading).toBe(false);
    });
  });

  describe('Error State Management', () => {
    it('should clear email error when starting new email update', async () => {
      const { result } = renderHook(() => useAccountManagement());

      // Set initial error
      mockUpdateEmail.mockResolvedValueOnce({
        success: false,
        error: { message: 'Initial error' },
      });

      act(() => {
        result.current.setNewEmail('error@example.com');
      });

      await act(async () => {
        await result.current.updateEmailAddress();
      });

      expect(result.current.emailError).toBe('Initial error');

      // Start new update - should clear error immediately
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdateEmail.mockReturnValue(promise);

      act(() => {
        result.current.setNewEmail('new@example.com');
      });

      act(() => {
        result.current.updateEmailAddress();
      });

      expect(result.current.emailError).toBe(null);

      // Complete the update
      await act(async () => {
        resolvePromise({ success: true });
        await promise;
      });
    });

    it('should clear password error when starting new password update', async () => {
      const { result } = renderHook(() => useAccountManagement());

      // Set initial error
      mockUpdatePassword.mockResolvedValueOnce({
        success: false,
        error: { message: 'Initial error' },
      });

      act(() => {
        result.current.setNewPassword('errorpass123');
        result.current.setConfirmPassword('errorpass123');
      });

      await act(async () => {
        await result.current.updateUserPassword();
      });

      expect(result.current.passwordError).toBe('Initial error');

      // Start new update - should clear error immediately
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdatePassword.mockReturnValue(promise);

      act(() => {
        result.current.setNewPassword('newpass123');
        result.current.setConfirmPassword('newpass123');
      });

      act(() => {
        result.current.updateUserPassword();
      });

      expect(result.current.passwordError).toBe(null);

      // Complete the update
      await act(async () => {
        resolvePromise({ success: true });
        await promise;
      });
    });

    it('should handle non-Error exceptions in email update', async () => {
      mockUpdateEmail.mockRejectedValue('String error');

      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewEmail('string@example.com');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateEmailAddress();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.emailError).toBe(errorMessage);
    });

    it('should handle non-Error exceptions in password update', async () => {
      mockUpdatePassword.mockRejectedValue('String error');

      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewPassword('stringpass123');
        result.current.setConfirmPassword('stringpass123');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateUserPassword();
      });

      expect(updateResult!).toBe(false);
      expect(result.current.passwordError).toBe(errorMessage);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user', () => {
      mockUser = undefined;

      const { result } = renderHook(() => useAccountManagement());

      expect(result.current.currentEmail).toBe('');
    });

    it('should handle user with undefined email', () => {
      mockUser = { email: undefined };

      const { result } = renderHook(() => useAccountManagement());

      expect(result.current.currentEmail).toBe('');
    });

    it('should validate password with exactly 6 characters', () => {
      const { result } = renderHook(() => useAccountManagement());

      act(() => {
        result.current.setNewPassword('123456');
        result.current.setConfirmPassword('123456');
      });

      expect(result.current.isPasswordValid).toBe(true);
    });
  });
});

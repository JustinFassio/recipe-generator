import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUsernameAvailability } from '@/hooks/profile/useUsernameAvailability';
import * as auth from '@/lib/auth';

// Mock the dependencies
const mockRefreshProfile = vi.fn();
const mockToast = vi.fn();

vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: () => ({
    refreshProfile: mockRefreshProfile,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/lib/auth', () => ({
  checkUsernameAvailability: vi.fn(),
  claimUsername: vi.fn(),
}));

describe('useUsernameAvailability', () => {
  const mockCheckUsernameAvailability =
    auth.checkUsernameAvailability as ReturnType<typeof vi.fn>;
  const mockClaimUsername = auth.claimUsername as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty values and loading false', () => {
      const { result } = renderHook(() => useUsernameAvailability());

      expect(result.current.username).toBe('');
      expect(result.current.isAvailable).toBe(null);
      expect(result.current.isChecking).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useUsernameAvailability());

      expect(typeof result.current.checkUsername).toBe('function');
      expect(typeof result.current.claimUsername).toBe('function');
      expect(typeof result.current.setUsername).toBe('function');
      expect(typeof result.current.handleUsernameChange).toBe('function');
      expect(typeof result.current.clearUsernameTimeout).toBe('function');
    });
  });

  describe('checkUsername', () => {
    it('should check username availability successfully', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({ available: true });

      const { result } = renderHook(() => useUsernameAvailability());

      await act(async () => {
        await result.current.checkUsername('testuser');
      });

      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('testuser');
      expect(result.current.isAvailable).toBe(true);
      expect(result.current.isChecking).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle username not available', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({ available: false });

      const { result } = renderHook(() => useUsernameAvailability());

      await act(async () => {
        await result.current.checkUsername('takenuser');
      });

      expect(result.current.isAvailable).toBe(false);
      expect(result.current.isChecking).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Username validation failed';
      mockCheckUsernameAvailability.mockResolvedValue({
        available: false,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useUsernameAvailability());

      await act(async () => {
        await result.current.checkUsername('erroruser');
      });

      expect(result.current.isAvailable).toBe(null);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isChecking).toBe(false);
    });

    it('should handle network errors', async () => {
      const errorMessage = 'Network error';
      mockCheckUsernameAvailability.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useUsernameAvailability());

      await act(async () => {
        await result.current.checkUsername('networkuser');
      });

      expect(result.current.isAvailable).toBe(null);
      expect(result.current.error).toBe(
        'Failed to check username availability'
      );
      expect(result.current.isChecking).toBe(false);
    });

    it('should not check username if too short', async () => {
      const { result } = renderHook(() => useUsernameAvailability());

      await act(async () => {
        await result.current.checkUsername('ab');
      });

      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
      expect(result.current.isAvailable).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should not check empty username', async () => {
      const { result } = renderHook(() => useUsernameAvailability());

      await act(async () => {
        await result.current.checkUsername('');
      });

      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
      expect(result.current.isAvailable).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should set loading state during check operation', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockCheckUsernameAvailability.mockReturnValue(promise);

      const { result } = renderHook(() => useUsernameAvailability());

      // Start checking
      act(() => {
        result.current.checkUsername('testuser');
      });

      expect(result.current.isChecking).toBe(true);

      // Complete checking
      await act(async () => {
        resolvePromise({ available: true });
        await promise;
      });

      expect(result.current.isChecking).toBe(false);
    });
  });

  describe('claimUsername', () => {
    it('should claim username successfully', async () => {
      mockClaimUsername.mockResolvedValue({ success: true });

      // Mock refreshProfile to call the callback immediately
      mockRefreshProfile.mockImplementation((callback) => {
        callback({ id: 'test-user', username: 'testuser' });
        return Promise.resolve();
      });

      const { result } = renderHook(() => useUsernameAvailability());

      // Set username first
      act(() => {
        result.current.setUsername('testuser');
      });

      let claimResult: boolean;
      await act(async () => {
        claimResult = await result.current.claimUsername('testuser');
      });

      expect(claimResult!).toBe(true);
      expect(mockClaimUsername).toHaveBeenCalledWith('testuser');
      expect(mockRefreshProfile).toHaveBeenCalledWith(expect.any(Function));
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Username updated successfully!',
      });
      expect(result.current.username).toBe(''); // Should be cleared after success
      expect(result.current.isAvailable).toBe(null);
    });

    it('should handle claim errors', async () => {
      const errorMessage = 'Username is already taken';
      mockClaimUsername.mockResolvedValue({
        success: false,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useUsernameAvailability());

      let claimResult: boolean;
      await act(async () => {
        claimResult = await result.current.claimUsername('takenuser');
      });

      expect(claimResult!).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('should use callback approach instead of timeout for profile refresh', async () => {
      mockClaimUsername.mockResolvedValue({ success: true });

      // Mock refreshProfile to call the callback immediately
      mockRefreshProfile.mockImplementation((callback) => {
        callback({ id: 'test-user', username: 'newusername' });
        return Promise.resolve();
      });

      const { result } = renderHook(() => useUsernameAvailability());

      await act(async () => {
        await result.current.claimUsername('newusername');
      });

      // Verify refreshProfile was called with callback
      expect(mockRefreshProfile).toHaveBeenCalledWith(expect.any(Function));

      // Verify toast was called (this happens in the callback)
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Username updated successfully!',
      });
    });

    it('should handle network errors during claim', async () => {
      const errorMessage = 'Network error';
      mockClaimUsername.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useUsernameAvailability());

      let claimResult: boolean;
      await act(async () => {
        claimResult = await result.current.claimUsername('networkuser');
      });

      expect(claimResult!).toBe(false);
      expect(result.current.error).toBe('Failed to claim username');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('should handle empty username', async () => {
      const { result } = renderHook(() => useUsernameAvailability());

      let claimResult: boolean;
      await act(async () => {
        claimResult = await result.current.claimUsername('');
      });

      expect(claimResult!).toBe(false);
      expect(result.current.error).toBe('Username is required');
      expect(mockClaimUsername).not.toHaveBeenCalled();
    });
  });

  describe('handleUsernameChange', () => {
    it('should sanitize and set username', () => {
      const { result } = renderHook(() => useUsernameAvailability());

      act(() => {
        result.current.handleUsernameChange('TestUser123!@#');
      });

      expect(result.current.username).toBe('testuser123');
      expect(result.current.isAvailable).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle special characters and uppercase', () => {
      const { result } = renderHook(() => useUsernameAvailability());

      act(() => {
        result.current.handleUsernameChange('User_Name-123!');
      });

      expect(result.current.username).toBe('user_name123');
    });

    it('should trigger debounced check after input', async () => {
      vi.useFakeTimers();
      mockCheckUsernameAvailability.mockResolvedValue({ available: true });

      const { result } = renderHook(() => useUsernameAvailability());

      act(() => {
        result.current.handleUsernameChange('testuser');
      });

      expect(result.current.username).toBe('testuser');
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();

      // Fast-forward time to trigger debounced check
      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('testuser');

      vi.useRealTimers();
    });

    it('should clear previous timeout on new input', async () => {
      vi.useFakeTimers();
      mockCheckUsernameAvailability.mockResolvedValue({ available: true });

      const { result } = renderHook(() => useUsernameAvailability());

      // First input
      act(() => {
        result.current.handleUsernameChange('test');
      });

      // Second input before timeout
      act(() => {
        result.current.handleUsernameChange('testuser');
      });

      // Fast-forward time
      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      // Should only check the latest username
      expect(mockCheckUsernameAvailability).toHaveBeenCalledTimes(1);
      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('testuser');

      vi.useRealTimers();
    });

    it('should not trigger check for empty username', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useUsernameAvailability());

      act(() => {
        result.current.handleUsernameChange('');
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('State Setters', () => {
    it('should update username state', () => {
      const { result } = renderHook(() => useUsernameAvailability());

      act(() => {
        result.current.setUsername('directset');
      });

      expect(result.current.username).toBe('directset');
    });
  });

  describe('Cleanup', () => {
    it('should clear timeout on unmount', () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { result, unmount } = renderHook(() => useUsernameAvailability());

      // Set up a timeout
      act(() => {
        result.current.handleUsernameChange('testuser');
      });

      // Unmount should clear the timeout
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      vi.useRealTimers();
      clearTimeoutSpy.mockRestore();
    });

    it('should provide clearUsernameTimeout function', () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { result } = renderHook(() => useUsernameAvailability());

      // Set up a timeout
      act(() => {
        result.current.handleUsernameChange('testuser');
      });

      // Manually clear timeout
      act(() => {
        result.current.clearUsernameTimeout();
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();

      vi.useRealTimers();
      clearTimeoutSpy.mockRestore();
    });
  });
});

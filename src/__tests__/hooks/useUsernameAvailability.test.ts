import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUsernameAvailability } from '@/hooks/profile/useUsernameAvailability';
import { checkUsernameAvailability, claimUsername } from '@/lib/auth';

// Mock the auth functions
vi.mock('@/lib/auth', () => ({
  checkUsernameAvailability: vi.fn(),
  claimUsername: vi.fn(),
}));

// Mock the auth context
vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: vi.fn(() => ({
    refreshProfile: vi.fn(),
  })),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

const mockCheckUsernameAvailability = vi.mocked(checkUsernameAvailability);
const mockClaimUsername = vi.mocked(claimUsername);

describe('useUsernameAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('handleUsernameChange', () => {
    it('should sanitize username input to lowercase', async () => {
      const { result } = renderHook(() => useUsernameAvailability());

      act(() => {
        result.current.handleUsernameChange('TestUser123');
      });

      expect(result.current.username).toBe('testuser123');
    });

    it('should remove invalid characters', async () => {
      const { result } = renderHook(() => useUsernameAvailability());

      act(() => {
        result.current.handleUsernameChange('test-user!@#');
      });

      expect(result.current.username).toBe('testuser');
    });

    it('should debounce username checking', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({
        available: true,
      });

      const { result } = renderHook(() => useUsernameAvailability());

      act(() => {
        result.current.handleUsernameChange('testuser');
      });

      // Should not check immediately
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();

      // Fast-forward time to trigger debounced check
      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('testuser');
      });
    });

    it('should clear previous timeout on new input', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({
        available: true,
      });

      const { result } = renderHook(() => useUsernameAvailability());

      // First input
      act(() => {
        result.current.handleUsernameChange('first');
      });

      // Second input before debounce completes
      act(() => {
        vi.advanceTimersByTime(250);
        result.current.handleUsernameChange('second');
      });

      // Advance to trigger second check
      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockCheckUsernameAvailability).toHaveBeenCalledTimes(1);
        expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('second');
      });
    });

    it('should not check empty usernames', async () => {
      const { result } = renderHook(() => useUsernameAvailability());

      act(() => {
        result.current.handleUsernameChange('');
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
      expect(result.current.isAvailable).toBeNull();
    });
  });

  describe('checkUsername', () => {
    it('should set available state when username is available', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({
        available: true,
      });

      const { result } = renderHook(() => useUsernameAvailability());

      await act(async () => {
        await result.current.checkUsername('testuser');
      });

      expect(result.current.isAvailable).toBe(true);
      expect(result.current.isChecking).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set unavailable state when username is taken', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({
        available: false,
      });

      const { result } = renderHook(() => useUsernameAvailability());

      await act(async () => {
        await result.current.checkUsername('alice');
      });

      expect(result.current.isAvailable).toBe(false);
      expect(result.current.isChecking).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors from availability check', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({
        available: false,
        error: { message: 'Database error' },
      });

      const { result } = renderHook(() => useUsernameAvailability());

      await act(async () => {
        await result.current.checkUsername('testuser');
      });

      expect(result.current.isAvailable).toBeNull();
      expect(result.current.isChecking).toBe(false);
      expect(result.current.error).toBe('Database error');
    });

    it('should not check usernames shorter than 3 characters', async () => {
      const { result } = renderHook(() => useUsernameAvailability());

      await act(async () => {
        await result.current.checkUsername('ab');
      });

      expect(result.current.isAvailable).toBeNull();
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });

    it('should show checking state during availability check', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: { available: boolean }) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockCheckUsernameAvailability.mockReturnValue(promise);

      const { result } = renderHook(() => useUsernameAvailability());

      const checkPromise = act(async () => {
        await result.current.checkUsername('testuser');
      });

      // Should be checking
      expect(result.current.isChecking).toBe(true);

      // Resolve the promise
      resolvePromise!({ available: true });
      await checkPromise;

      // Should no longer be checking
      expect(result.current.isChecking).toBe(false);
    });
  });

  describe('claimUsername', () => {
    it('should successfully claim username', async () => {
      mockClaimUsername.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useUsernameAvailability());

      const success = await act(async () => {
        return await result.current.claimUsername('newusername');
      });

      expect(success).toBe(true);
      expect(mockClaimUsername).toHaveBeenCalledWith('newusername');
    });

    it('should handle failed username claim', async () => {
      mockClaimUsername.mockResolvedValue({
        success: false,
        error: { message: 'Username already taken' },
      });

      const { result } = renderHook(() => useUsernameAvailability());

      const success = await act(async () => {
        return await result.current.claimUsername('alice');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Username already taken');
    });

    it('should handle empty username', async () => {
      const { result } = renderHook(() => useUsernameAvailability());

      const success = await act(async () => {
        return await result.current.claimUsername('');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Username is required');
    });

    it('should clear username state after successful claim', async () => {
      mockClaimUsername.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useUsernameAvailability());

      // Set a username first
      act(() => {
        result.current.setUsername('testuser');
      });

      expect(result.current.username).toBe('testuser');

      // Claim the username
      await act(async () => {
        await result.current.claimUsername('testuser');
      });

      // Username should be cleared
      expect(result.current.username).toBe('');
      expect(result.current.isAvailable).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should clear timeout on unmount', () => {
      const { unmount } = renderHook(() => useUsernameAvailability());

      // This should not throw any errors
      unmount();
    });

    it('should clear timeout when clearUsernameTimeout is called', () => {
      const { result } = renderHook(() => useUsernameAvailability());

      act(() => {
        result.current.handleUsernameChange('testuser');
      });

      // Clear the timeout
      act(() => {
        result.current.clearUsernameTimeout();
      });

      // Advance time - should not trigger check
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBioUpdate } from '@/hooks/profile/useBioUpdate';
import * as auth from '@/lib/auth';

// Mock the dependencies
const mockRefreshProfile = vi.fn();
const mockToast = vi.fn();

// Default mock profile
let mockProfile = {
  bio: 'Test bio content',
};

vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: () => ({
    profile: mockProfile,
    refreshProfile: mockRefreshProfile,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/lib/auth', () => ({
  updateProfile: vi.fn(),
}));

describe('useBioUpdate', () => {
  const mockUpdateProfile = auth.updateProfile as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock profile to default
    mockProfile = {
      bio: 'Test bio content',
    };
  });

  describe('Initial State', () => {
    it('should initialize with profile bio', () => {
      const { result } = renderHook(() => useBioUpdate());

      expect(result.current.bio).toBe('Test bio content');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should initialize with empty bio when profile has no bio', () => {
      mockProfile = { bio: null };

      const { result } = renderHook(() => useBioUpdate());

      expect(result.current.bio).toBe('');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useBioUpdate());

      expect(typeof result.current.setBio).toBe('function');
      expect(typeof result.current.saveBio).toBe('function');
      expect(typeof result.current.updateBio).toBe('function');
    });
  });

  describe('setBio', () => {
    it('should update bio state', () => {
      const { result } = renderHook(() => useBioUpdate());

      act(() => {
        result.current.setBio('New bio content');
      });

      expect(result.current.bio).toBe('New bio content');
    });

    it('should handle empty bio', () => {
      const { result } = renderHook(() => useBioUpdate());

      act(() => {
        result.current.setBio('');
      });

      expect(result.current.bio).toBe('');
    });
  });

  describe('saveBio', () => {
    it('should save bio successfully', async () => {
      mockUpdateProfile.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useBioUpdate());

      // Set bio first
      act(() => {
        result.current.setBio('Updated bio');
      });

      let saveResult: boolean;
      await act(async () => {
        saveResult = await result.current.saveBio();
      });

      expect(saveResult!).toBe(true);
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        bio: 'Updated bio',
      });
      expect(mockRefreshProfile).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Bio updated successfully!',
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should save empty bio as null', async () => {
      mockUpdateProfile.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useBioUpdate());

      // Set empty bio
      act(() => {
        result.current.setBio('');
      });

      await act(async () => {
        await result.current.saveBio();
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        bio: null,
      });
    });

    it('should handle save errors', async () => {
      const errorMessage = 'Update failed';
      mockUpdateProfile.mockResolvedValue({
        success: false,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useBioUpdate());

      let saveResult: boolean;
      await act(async () => {
        saveResult = await result.current.saveBio();
      });

      expect(saveResult!).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(mockRefreshProfile).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('should handle network errors', async () => {
      const errorMessage = 'Network error';
      mockUpdateProfile.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useBioUpdate());

      let saveResult: boolean;
      await act(async () => {
        saveResult = await result.current.saveBio();
      });

      expect(saveResult!).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('should handle errors without error message', async () => {
      mockUpdateProfile.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useBioUpdate());

      let saveResult: boolean;
      await act(async () => {
        saveResult = await result.current.saveBio();
      });

      expect(saveResult!).toBe(false);
      expect(result.current.error).toBe('Failed to update bio');
    });

    it('should set loading state during save operation', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdateProfile.mockReturnValue(promise);

      const { result } = renderHook(() => useBioUpdate());

      // Start saving
      act(() => {
        result.current.saveBio();
      });

      expect(result.current.loading).toBe(true);

      // Complete saving
      await act(async () => {
        resolvePromise({ success: true });
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('updateBio', () => {
    it('should update and save bio in one operation', async () => {
      mockUpdateProfile.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useBioUpdate());

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateBio('New bio from updateBio');
      });

      expect(updateResult!).toBe(true);
      expect(result.current.bio).toBe('New bio from updateBio');
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        bio: 'New bio from updateBio',
      });
      expect(mockRefreshProfile).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Bio updated successfully!',
      });
    });

    it('should handle updateBio errors', async () => {
      const errorMessage = 'Update failed';
      mockUpdateProfile.mockResolvedValue({
        success: false,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useBioUpdate());

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateBio('Failed bio');
      });

      expect(updateResult!).toBe(false);
      expect(result.current.bio).toBe('Failed bio'); // State should still be updated
      expect(result.current.error).toBe(errorMessage);
    });

    it('should save empty bio as null in updateBio', async () => {
      mockUpdateProfile.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useBioUpdate());

      await act(async () => {
        await result.current.updateBio('');
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        bio: null,
      });
    });
  });

  describe('Error State Management', () => {
    it('should clear error when starting new save', async () => {
      const { result } = renderHook(() => useBioUpdate());

      // Set initial error
      mockUpdateProfile.mockResolvedValueOnce({
        success: false,
        error: { message: 'Initial error' },
      });

      await act(async () => {
        await result.current.saveBio();
      });

      expect(result.current.error).toBe('Initial error');

      // Start new save - should clear error immediately
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdateProfile.mockReturnValue(promise);

      act(() => {
        result.current.saveBio();
      });

      expect(result.current.error).toBe(null);

      // Complete the save
      await act(async () => {
        resolvePromise({ success: true });
        await promise;
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockUpdateProfile.mockRejectedValue('String error');

      const { result } = renderHook(() => useBioUpdate());

      let saveResult: boolean;
      await act(async () => {
        saveResult = await result.current.saveBio();
      });

      expect(saveResult!).toBe(false);
      expect(result.current.error).toBe('Failed to update bio');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined profile', () => {
      mockProfile = undefined;

      const { result } = renderHook(() => useBioUpdate());

      expect(result.current.bio).toBe('');
    });

    it('should handle profile with undefined bio', () => {
      mockProfile = { bio: undefined };

      const { result } = renderHook(() => useBioUpdate());

      expect(result.current.bio).toBe('');
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAvatarUpload } from '@/hooks/profile/useAvatarUpload';
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
  uploadAvatar: vi.fn(),
}));

describe('useAvatarUpload', () => {
  const mockUploadAvatar = auth.uploadAvatar as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with loading false and no error', () => {
      const { result } = renderHook(() => useAvatarUpload());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should provide uploadAvatar function', () => {
      const { result } = renderHook(() => useAvatarUpload());

      expect(typeof result.current.uploadAvatar).toBe('function');
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      mockUploadAvatar.mockResolvedValue({
        success: true,
        avatarUrl: 'http://example.com/avatar.jpg',
      });

      const { result } = renderHook(() => useAvatarUpload());

      let uploadResult: boolean;
      await act(async () => {
        uploadResult = await result.current.uploadAvatar(mockFile);
      });

      expect(uploadResult!).toBe(true);
      expect(mockUploadAvatar).toHaveBeenCalledWith(mockFile);
      expect(mockRefreshProfile).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Avatar updated successfully!',
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      const errorMessage = 'File too large';
      mockUploadAvatar.mockResolvedValue({
        success: false,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useAvatarUpload());

      let uploadResult: boolean;
      await act(async () => {
        uploadResult = await result.current.uploadAvatar(mockFile);
      });

      expect(uploadResult!).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(mockRefreshProfile).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('should handle network errors', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      const errorMessage = 'Network error';
      mockUploadAvatar.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAvatarUpload());

      let uploadResult: boolean;
      await act(async () => {
        uploadResult = await result.current.uploadAvatar(mockFile);
      });

      expect(uploadResult!).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('should handle upload errors without error message', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      mockUploadAvatar.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAvatarUpload());

      let uploadResult: boolean;
      await act(async () => {
        uploadResult = await result.current.uploadAvatar(mockFile);
      });

      expect(uploadResult!).toBe(false);
      expect(result.current.error).toBe('Failed to upload avatar');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to upload avatar',
        variant: 'destructive',
      });
    });

    it('should set loading state during upload operation', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockUploadAvatar.mockReturnValue(promise);

      const { result } = renderHook(() => useAvatarUpload());

      // Start uploading
      act(() => {
        result.current.uploadAvatar(mockFile);
      });

      expect(result.current.loading).toBe(true);

      // Complete uploading
      await act(async () => {
        resolvePromise({ success: true });
        await promise;
        // Wait for the delay and profile refresh
        await new Promise((resolve) => setTimeout(resolve, 600));
      });

      expect(result.current.loading).toBe(false);
    });

    it('should clear error on successful upload after previous error', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      const { result } = renderHook(() => useAvatarUpload());

      // First upload fails
      mockUploadAvatar.mockResolvedValueOnce({
        success: false,
        error: { message: 'First error' },
      });

      await act(async () => {
        await result.current.uploadAvatar(mockFile);
      });

      expect(result.current.error).toBe('First error');

      // Second upload succeeds
      mockUploadAvatar.mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.uploadAvatar(mockFile);
      });

      expect(result.current.error).toBe(null);
    });

    it('should handle non-Error exceptions', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      mockUploadAvatar.mockRejectedValue('String error');

      const { result } = renderHook(() => useAvatarUpload());

      let uploadResult: boolean;
      await act(async () => {
        uploadResult = await result.current.uploadAvatar(mockFile);
      });

      expect(uploadResult!).toBe(false);
      expect(result.current.error).toBe('Failed to upload avatar');
    });
  });

  describe('Error State Management', () => {
    it('should clear error when starting new upload', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      const { result } = renderHook(() => useAvatarUpload());

      // Set initial error
      mockUploadAvatar.mockResolvedValueOnce({
        success: false,
        error: { message: 'Initial error' },
      });

      await act(async () => {
        await result.current.uploadAvatar(mockFile);
      });

      expect(result.current.error).toBe('Initial error');

      // Start new upload - should clear error immediately
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockUploadAvatar.mockReturnValue(promise);

      act(() => {
        result.current.uploadAvatar(mockFile);
      });

      expect(result.current.error).toBe(null);

      // Complete the upload
      await act(async () => {
        resolvePromise({ success: true });
        await promise;
      });
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import {
  useProfileUpdate,
  useProfileUpdateWithUserId,
  useBioUpdate,
} from '@/hooks/useProfileUpdate';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('useProfileUpdate', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  describe('useProfileUpdate', () => {
    it('should handle successful update', async () => {
      const mockUpdateFunction = vi.fn().mockResolvedValue({ success: true });
      const options = {
        successMessage: 'Success!',
        errorMessage: 'Error!',
      };

      const { result } = renderHook(() =>
        useProfileUpdate(mockUpdateFunction, options)
      );

      expect(result.current.loading).toBe(false);

      await act(async () => {
        const response = await result.current.executeUpdate({ test: 'data' });
        expect(response.success).toBe(true);
      });

      expect(mockUpdateFunction).toHaveBeenCalledWith({ test: 'data' });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Success!',
      });
    });

    it('should handle failed update', async () => {
      const mockUpdateFunction = vi.fn().mockResolvedValue({
        success: false,
        error: 'Update failed',
      });
      const options = {
        successMessage: 'Success!',
        errorMessage: 'Error!',
      };

      const { result } = renderHook(() =>
        useProfileUpdate(mockUpdateFunction, options)
      );

      await act(async () => {
        const response = await result.current.executeUpdate({ test: 'data' });
        expect(response.success).toBe(false);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Update failed',
        variant: 'destructive',
      });
    });

    it('should handle thrown errors', async () => {
      const mockUpdateFunction = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));
      const options = {
        successMessage: 'Success!',
        errorMessage: 'Error!',
      };

      const { result } = renderHook(() =>
        useProfileUpdate(mockUpdateFunction, options)
      );

      await act(async () => {
        const response = await result.current.executeUpdate({ test: 'data' });
        expect(response.success).toBe(false);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Network error',
        variant: 'destructive',
      });
    });
  });

  describe('useProfileUpdateWithUserId', () => {
    it('should handle successful update with userId', async () => {
      const mockUpdateFunction = vi.fn().mockResolvedValue({ success: true });
      const options = {
        successMessage: 'Success!',
        errorMessage: 'Error!',
      };

      const { result } = renderHook(() =>
        useProfileUpdateWithUserId(mockUpdateFunction, options)
      );

      await act(async () => {
        const response = await result.current.executeUpdate('user123', {
          test: 'data',
        });
        expect(response.success).toBe(true);
      });

      expect(mockUpdateFunction).toHaveBeenCalledWith('user123', {
        test: 'data',
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Success!',
      });
    });
  });

  describe('specialized hooks', () => {
    it('should create useBioUpdate hook correctly', () => {
      const { result } = renderHook(() => useBioUpdate());

      expect(result.current.loading).toBe(false);
      expect(typeof result.current.executeUpdate).toBe('function');
    });
  });
});

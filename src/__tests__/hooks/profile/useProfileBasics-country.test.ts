import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfileBasics } from '@/hooks/profile/useProfileBasics';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/lib/auth';

// Mock dependencies
vi.mock('@/contexts/AuthProvider');
vi.mock('@/hooks/use-toast');
vi.mock('@/lib/auth');

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseToast = useToast as vi.MockedFunction<typeof useToast>;
const mockUpdateProfile = updateProfile as vi.MockedFunction<
  typeof updateProfile
>;

describe('useProfileBasics - Country Fields', () => {
  const mockProfile = {
    id: 'test-user-id',
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: null,
    bio: null,
    region: 'North America',
    country: 'United States',
    state_province: 'California',
    city: 'San Francisco',
    language: 'en',
    units: 'metric',
    time_per_meal: 30,
    skill_level: 'intermediate',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockRefreshProfile = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' },
      profile: mockProfile,
      refreshProfile: mockRefreshProfile,
      signOut: vi.fn(),
      loading: false,
    });

    mockUseToast.mockReturnValue({
      toast: mockToast,
    });
  });

  describe('Initial State', () => {
    it('should initialize country fields from profile', () => {
      const { result } = renderHook(() => useProfileBasics());

      expect(result.current.country).toBe('United States');
      expect(result.current.stateProvince).toBe('California');
      expect(result.current.city).toBe('San Francisco');
    });

    it('should initialize with empty strings when profile has no country data', () => {
      const profileWithoutCountry = {
        ...mockProfile,
        country: null,
        state_province: null,
        city: null,
      };

      mockUseAuth.mockReturnValue({
        user: { id: 'test-user-id' },
        profile: profileWithoutCountry,
        refreshProfile: mockRefreshProfile,
        signOut: vi.fn(),
        loading: false,
      });

      const { result } = renderHook(() => useProfileBasics());

      expect(result.current.country).toBe('');
      expect(result.current.stateProvince).toBe('');
      expect(result.current.city).toBe('');
    });
  });

  describe('State Management', () => {
    it('should update country state', () => {
      const { result } = renderHook(() => useProfileBasics());

      act(() => {
        result.current.setCountry('Canada');
      });

      expect(result.current.country).toBe('Canada');
    });

    it('should update state/province state', () => {
      const { result } = renderHook(() => useProfileBasics());

      act(() => {
        result.current.setStateProvince('Ontario');
      });

      expect(result.current.stateProvince).toBe('Ontario');
    });

    it('should update city state', () => {
      const { result } = renderHook(() => useProfileBasics());

      act(() => {
        result.current.setCity('Toronto');
      });

      expect(result.current.city).toBe('Toronto');
    });
  });

  describe('Validation', () => {
    it('should validate country field length', async () => {
      const { result } = renderHook(() => useProfileBasics());

      await act(async () => {
        const success = await result.current.updateProfileBasics({
          full_name: 'Test User',
          region: null,
          country: 'A', // Too short
          state_province: null,
          city: null,
          language: 'en',
          units: 'metric',
          time_per_meal: 2,
          skill_level: '1',
        });

        expect(success).toBe(false);
      });

      // Wait for state update to complete
      await act(async () => {
        // Force a re-render to ensure state is updated
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe(
        'Country must be between 2 and 50 characters'
      );
    });

    it('should validate state/province field length', async () => {
      const { result } = renderHook(() => useProfileBasics());

      await act(async () => {
        const success = await result.current.updateProfileBasics({
          full_name: 'Test User',
          region: null,
          country: 'United States',
          state_province: 'A', // Too short
          city: null,
          language: 'en',
          units: 'metric',
          time_per_meal: 2,
          skill_level: '1',
        });

        expect(success).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.error).toBe(
          'State/Province must be between 2 and 50 characters'
        );
      });
    });

    it('should validate city field length', async () => {
      const { result } = renderHook(() => useProfileBasics());

      await act(async () => {
        const success = await result.current.updateProfileBasics({
          full_name: 'Test User',
          region: null,
          country: 'United States',
          state_province: 'California',
          city: 'A', // Too short
          language: 'en',
          units: 'metric',
          time_per_meal: 2,
          skill_level: '1',
        });

        expect(success).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.error).toBe(
          'City must be between 2 and 50 characters'
        );
      });
    });

    it('should validate country field characters', async () => {
      const { result } = renderHook(() => useProfileBasics());

      await act(async () => {
        const success = await result.current.updateProfileBasics({
          full_name: 'Test User',
          region: null,
          country: 'United States@', // Invalid character
          state_province: null,
          city: null,
          language: 'en',
          units: 'metric',
          time_per_meal: 2,
          skill_level: '1',
        });

        expect(success).toBe(false);
      });

      // Wait for state update to complete
      await act(async () => {
        // Force a re-render to ensure state is updated
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe(
        'Country contains invalid characters. Use only letters, spaces, hyphens, commas, periods, and parentheses'
      );
    });

    it('should accept valid country data', async () => {
      mockUpdateProfile.mockResolvedValue({
        success: true,
        profile: mockProfile,
      });

      const { result } = renderHook(() => useProfileBasics());

      await act(async () => {
        const success = await result.current.updateProfileBasics({
          full_name: 'Test User',
          region: null,
          country: 'United States',
          state_province: 'California',
          city: 'San Francisco',
          language: 'en',
          units: 'metric',
          time_per_meal: 2,
          skill_level: '1',
        });

        expect(success).toBe(true);
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        full_name: 'Test User',
        region: null,
        country: 'United States',
        state_province: 'California',
        city: 'San Francisco',
        language: 'en',
        units: 'metric',
        time_per_meal: 30,
        skill_level: 'beginner',
      });
    });
  });

  describe('Profile Update', () => {
    it('should update profile with country data', async () => {
      mockUpdateProfile.mockResolvedValue({
        success: true,
        profile: mockProfile,
      });

      const { result } = renderHook(() => useProfileBasics());

      await act(async () => {
        const success = await result.current.updateProfileBasics({
          full_name: 'Test User',
          region: null,
          country: 'Canada',
          state_province: 'Ontario',
          city: 'Toronto',
          language: 'en',
          units: 'metric',
          time_per_meal: 2,
          skill_level: '1',
        });

        expect(success).toBe(true);
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        full_name: 'Test User',
        region: null,
        country: 'Canada',
        state_province: 'Ontario',
        city: 'Toronto',
        language: 'en',
        units: 'metric',
        time_per_meal: 30,
        skill_level: 'beginner',
      });

      expect(mockRefreshProfile).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Profile updated successfully!',
      });
    });

    it('should handle update failure', async () => {
      mockUpdateProfile.mockResolvedValue({
        success: false,
        error: { message: 'Database error' },
      });

      const { result } = renderHook(() => useProfileBasics());

      await act(async () => {
        const success = await result.current.updateProfileBasics({
          full_name: 'Test User',
          region: null,
          country: 'United States',
          state_province: 'California',
          city: 'San Francisco',
          language: 'en',
          units: 'metric',
          time_per_meal: 2,
          skill_level: '1',
        });

        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Database error');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Database error',
        variant: 'destructive',
      });
    });

    it('should trim whitespace from country fields', async () => {
      mockUpdateProfile.mockResolvedValue({
        success: true,
        profile: mockProfile,
      });

      const { result } = renderHook(() => useProfileBasics());

      await act(async () => {
        const success = await result.current.updateProfileBasics({
          full_name: 'Test User',
          region: null,
          country: '  United States  ',
          state_province: '  California  ',
          city: '  San Francisco  ',
          language: 'en',
          units: 'metric',
          time_per_meal: 2,
          skill_level: '1',
        });

        expect(success).toBe(true);
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        full_name: 'Test User',
        region: null,
        country: 'United States',
        state_province: 'California',
        city: 'San Francisco',
        language: 'en',
        units: 'metric',
        time_per_meal: 30,
        skill_level: 'beginner',
      });
    });
  });

  describe('Profile Refresh', () => {
    it('should update state when profile changes', () => {
      const { result, rerender } = renderHook(() => useProfileBasics());

      // Initial state
      expect(result.current.country).toBe('United States');
      expect(result.current.stateProvince).toBe('California');
      expect(result.current.city).toBe('San Francisco');

      // Update profile
      const updatedProfile = {
        ...mockProfile,
        country: 'Canada',
        state_province: 'Ontario',
        city: 'Toronto',
      };

      mockUseAuth.mockReturnValue({
        user: { id: 'test-user-id' },
        profile: updatedProfile,
        refreshProfile: mockRefreshProfile,
        signOut: vi.fn(),
        loading: false,
      });

      rerender();

      expect(result.current.country).toBe('Canada');
      expect(result.current.stateProvince).toBe('Ontario');
      expect(result.current.city).toBe('Toronto');
    });
  });
});

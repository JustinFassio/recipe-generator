import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProfileBasics } from '@/hooks/profile/useProfileBasics';
import * as auth from '@/lib/auth';

// Mock the dependencies
const mockRefreshProfile = vi.fn();
const mockToast = vi.fn();

// Default mock profile
let mockProfile = {
  full_name: 'Test User',
  region: 'US',
  language: 'en',
  units: 'metric',
  time_per_meal: 45,
  skill_level: 'advanced', // Database value
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

describe('useProfileBasics', () => {
  const mockUpdateProfile = auth.updateProfile as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock profile to default
    mockProfile = {
      full_name: 'Test User',
      region: 'US',
      language: 'en',
      units: 'metric',
      time_per_meal: 45,
      skill_level: 'advanced', // Database value
    };
  });

  describe('Initial State', () => {
    it('should initialize with profile values', () => {
      const { result } = renderHook(() => useProfileBasics());

      expect(result.current.fullName).toBe('Test User');
      expect(result.current.region).toBe('US');
      expect(result.current.language).toBe('en');
      expect(result.current.units).toBe('metric');
      expect(result.current.timePerMeal).toBe(3);
      expect(result.current.skillLevel).toBe('3');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should initialize with defaults when profile is empty', () => {
      // Mock empty profile
      mockProfile = {};

      const { result } = renderHook(() => useProfileBasics());

      expect(result.current.fullName).toBe('');
      expect(result.current.region).toBe('');
      expect(result.current.language).toBe('en');
      expect(result.current.units).toBe('metric');
      expect(result.current.timePerMeal).toBe(2);
      expect(result.current.skillLevel).toBe('1'); // Default to beginner
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useProfileBasics());

      expect(typeof result.current.updateProfileBasics).toBe('function');
      expect(typeof result.current.setFullName).toBe('function');
      expect(typeof result.current.setRegion).toBe('function');
      expect(typeof result.current.setLanguage).toBe('function');
      expect(typeof result.current.setUnits).toBe('function');
      expect(typeof result.current.setTimePerMeal).toBe('function');
      expect(typeof result.current.setSkillLevel).toBe('function');
      // validateProfileData is now internal to the hook
      expect(typeof result.current.parseSkillLevel).toBe('function');
    });
  });

  describe('parseSkillLevel', () => {
    it('should parse valid string skill levels', () => {
      const { result } = renderHook(() => useProfileBasics());

      expect(result.current.parseSkillLevel('1')).toBe('beginner');
      expect(result.current.parseSkillLevel('3')).toBe('advanced');
      expect(result.current.parseSkillLevel('5')).toBe('chef');
    });

    it('should parse valid number skill levels', () => {
      const { result } = renderHook(() => useProfileBasics());

      expect(result.current.parseSkillLevel(1)).toBe('beginner');
      expect(result.current.parseSkillLevel(3)).toBe('advanced');
      expect(result.current.parseSkillLevel(5)).toBe('chef');
    });

    it('should return default for invalid skill levels', () => {
      const { result } = renderHook(() => useProfileBasics());

      expect(result.current.parseSkillLevel('0')).toBe('beginner');
      expect(result.current.parseSkillLevel('6')).toBe('beginner');
      expect(result.current.parseSkillLevel('invalid')).toBe('beginner');
      expect(result.current.parseSkillLevel(null)).toBe('beginner');
      expect(result.current.parseSkillLevel(undefined)).toBe('beginner');
    });
  });

  // validateProfileData is now internal to the hook and not part of the public API

  describe('updateProfileBasics', () => {
    it('should update profile successfully', async () => {
      mockUpdateProfile.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useProfileBasics());

      const updateData = {
        full_name: 'Updated User',
        region: 'CA',
        language: 'fr',
        units: 'imperial',
        time_per_meal: 4, // UI index for 60 minutes
        skill_level: '4', // UI value
      };

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateProfileBasics(updateData);
      });

      expect(updateResult!).toBe(true);
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        full_name: 'Updated User',
        region: 'CA',
        country: null,
        state_province: null,
        city: null,
        language: 'fr',
        units: 'imperial',
        time_per_meal: 60, // Converted from UI index 4
        skill_level: 'expert', // Converted from UI value '4'
      });
      expect(mockRefreshProfile).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Profile updated successfully!',
      });

      // Check that local state was updated
      expect(result.current.fullName).toBe('Updated User');
      expect(result.current.region).toBe('CA');
      expect(result.current.language).toBe('fr');
      expect(result.current.units).toBe('imperial');
      expect(result.current.timePerMeal).toBe(4); // UI index
      expect(result.current.skillLevel).toBe('4'); // UI value
    });

    it('should handle update errors', async () => {
      const errorMessage = 'Update failed';
      mockUpdateProfile.mockResolvedValue({
        success: false,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useProfileBasics());

      const updateData = {
        full_name: 'Test User',
        region: 'US',
        language: 'en',
        units: 'metric',
        time_per_meal: 2, // UI index for 30 minutes
        skill_level: '3', // UI value
      };

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateProfileBasics(updateData);
      });

      expect(updateResult!).toBe(false);
      expect(result.current.error).toBe('Update failed');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('should handle network errors', async () => {
      const errorMessage = 'Network error';
      mockUpdateProfile.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProfileBasics());

      const updateData = {
        full_name: 'Test User',
        region: 'US',
        language: 'en',
        units: 'metric',
        time_per_meal: 2, // UI index for 30 minutes
        skill_level: '3', // UI value
      };

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateProfileBasics(updateData);
      });

      expect(updateResult!).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('should reject invalid data', async () => {
      const { result } = renderHook(() => useProfileBasics());

      const invalidData = {
        full_name: 'Test User',
        region: 'US',
        language: '', // Invalid
        units: 'metric',
        time_per_meal: 2, // UI index for 30 minutes
        skill_level: '3', // UI value
      };

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateProfileBasics(invalidData);
      });

      expect(updateResult!).toBe(false);
      expect(result.current.error).toBe('Language is required');
      expect(mockUpdateProfile).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Please ensure all profile fields are valid.',
        variant: 'destructive',
      });
    });

    it('should set loading state during update operation', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdateProfile.mockReturnValue(promise);

      const { result } = renderHook(() => useProfileBasics());

      const updateData = {
        full_name: 'Test User',
        region: 'US',
        language: 'en',
        units: 'metric',
        time_per_meal: 2, // UI index for 30 minutes
        skill_level: '3', // UI value
      };

      // Start updating
      act(() => {
        result.current.updateProfileBasics(updateData);
      });

      expect(result.current.loading).toBe(true);

      // Complete updating
      await act(async () => {
        resolvePromise({ success: true });
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('State Setters', () => {
    it('should update fullName state', () => {
      const { result } = renderHook(() => useProfileBasics());

      act(() => {
        result.current.setFullName('New Name');
      });

      expect(result.current.fullName).toBe('New Name');
    });

    it('should update region state', () => {
      const { result } = renderHook(() => useProfileBasics());

      act(() => {
        result.current.setRegion('UK');
      });

      expect(result.current.region).toBe('UK');
    });

    it('should update language state', () => {
      const { result } = renderHook(() => useProfileBasics());

      act(() => {
        result.current.setLanguage('es');
      });

      expect(result.current.language).toBe('es');
    });

    it('should update units state', () => {
      const { result } = renderHook(() => useProfileBasics());

      act(() => {
        result.current.setUnits('imperial');
      });

      expect(result.current.units).toBe('imperial');
    });

    it('should update timePerMeal state', () => {
      const { result } = renderHook(() => useProfileBasics());

      act(() => {
        result.current.setTimePerMeal(90);
      });

      expect(result.current.timePerMeal).toBe(90);
    });

    it('should update skillLevel state', () => {
      const { result } = renderHook(() => useProfileBasics());

      act(() => {
        result.current.setSkillLevel('5');
      });

      expect(result.current.skillLevel).toBe('5');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values in profile data correctly', () => {
      // Mock profile with null values
      mockProfile = {
        full_name: null,
        region: null,
        language: null,
        units: null,
        time_per_meal: null,
        skill_level: null,
      };

      const { result } = renderHook(() => useProfileBasics());

      expect(result.current.fullName).toBe('');
      expect(result.current.region).toBe('');
      expect(result.current.language).toBe('en');
      expect(result.current.units).toBe('metric');
      expect(result.current.timePerMeal).toBe(2);
      expect(result.current.skillLevel).toBe('1');
    });

    it('should handle profile with string numbers correctly', () => {
      // Mock profile with string numbers
      mockProfile = {
        time_per_meal: '45', // String number
        skill_level: 'advanced', // Database value
      };

      const { result } = renderHook(() => useProfileBasics());

      expect(result.current.timePerMeal).toBe(3);
      expect(result.current.skillLevel).toBe('3');
    });
  });
});

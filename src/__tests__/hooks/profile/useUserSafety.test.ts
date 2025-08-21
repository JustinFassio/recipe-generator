import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserSafety } from '@/hooks/profile/useUserSafety';
import * as userPreferences from '@/lib/user-preferences';
import * as useToast from '@/hooks/use-toast';

// Mock the dependencies
vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/lib/user-preferences', () => ({
  getUserSafety: vi.fn(),
  updateUserSafety: vi.fn(),
  validateAllergies: vi.fn(),
}));

describe('useUserSafety', () => {
  const mockToast = vi.fn();
  const mockUseToast = useToast.useToast as ReturnType<typeof vi.fn>;
  const mockGetUserSafety = userPreferences.getUserSafety as ReturnType<
    typeof vi.fn
  >;
  const mockUpdateUserSafety = userPreferences.updateUserSafety as ReturnType<
    typeof vi.fn
  >;
  const mockValidateAllergies = userPreferences.validateAllergies as ReturnType<
    typeof vi.fn
  >;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  describe('Initial State', () => {
    it('should initialize with empty arrays and loading false', () => {
      const { result } = renderHook(() => useUserSafety());

      expect(result.current.allergies).toEqual([]);
      expect(result.current.dietaryRestrictions).toEqual([]);
      expect(result.current.medicalConditions).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useUserSafety());

      expect(typeof result.current.loadUserSafety).toBe('function');
      expect(typeof result.current.saveUserSafety).toBe('function');
      expect(typeof result.current.validateSafetyData).toBe('function');
      expect(typeof result.current.setAllergies).toBe('function');
      expect(typeof result.current.setDietaryRestrictions).toBe('function');
      expect(typeof result.current.setMedicalConditions).toBe('function');
    });
  });

  describe('loadUserSafety', () => {
    it('should load user safety data successfully', async () => {
      const mockSafetyData = {
        user_id: 'test-user-id',
        allergies: ['peanuts', 'shellfish'],
        dietary_restrictions: ['vegetarian'],
        medical_conditions: ['diabetes'],
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockGetUserSafety.mockResolvedValue(mockSafetyData);

      const { result } = renderHook(() => useUserSafety());

      await act(async () => {
        await result.current.loadUserSafety();
      });

      expect(result.current.allergies).toEqual(['peanuts', 'shellfish']);
      expect(result.current.dietaryRestrictions).toEqual(['vegetarian']);
      expect(result.current.medicalConditions).toEqual(['diabetes']);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle null safety data (no existing data)', async () => {
      mockGetUserSafety.mockResolvedValue(null);

      const { result } = renderHook(() => useUserSafety());

      await act(async () => {
        await result.current.loadUserSafety();
      });

      expect(result.current.allergies).toEqual([]);
      expect(result.current.dietaryRestrictions).toEqual([]);
      expect(result.current.medicalConditions).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle loading errors', async () => {
      const errorMessage = 'Failed to load safety data';
      mockGetUserSafety.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useUserSafety());

      await act(async () => {
        await result.current.loadUserSafety();
      });

      expect(result.current.error).toBe('Failed to load safety preferences');
      expect(result.current.loading).toBe(false);
    });

    it('should set loading state during load operation', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockGetUserSafety.mockReturnValue(promise);

      const { result } = renderHook(() => useUserSafety());

      // Start loading
      act(() => {
        result.current.loadUserSafety();
      });

      expect(result.current.loading).toBe(true);

      // Complete loading
      await act(async () => {
        resolvePromise(null);
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('saveUserSafety', () => {
    it('should save user safety data successfully', async () => {
      const safetyData = {
        allergies: ['peanuts'],
        dietary_restrictions: ['vegetarian'],
        medical_conditions: ['diabetes'],
      };

      mockValidateAllergies.mockReturnValue(true);
      mockUpdateUserSafety.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useUserSafety());

      await act(async () => {
        await result.current.saveUserSafety(safetyData);
      });

      expect(userPreferences.updateUserSafety).toHaveBeenCalledWith(
        'test-user-id',
        safetyData
      );
      expect(result.current.allergies).toEqual(['peanuts']);
      expect(result.current.dietaryRestrictions).toEqual(['vegetarian']);
      expect(result.current.medicalConditions).toEqual(['diabetes']);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Safety preferences saved successfully!',
      });
    });

    it('should handle save errors', async () => {
      const safetyData = {
        allergies: ['peanuts'],
        dietary_restrictions: ['vegetarian'],
        medical_conditions: ['diabetes'],
      };
      const errorMessage = 'Failed to save safety data';

      mockValidateAllergies.mockReturnValue(true);
      mockUpdateUserSafety.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useUserSafety());

      await act(async () => {
        await result.current.saveUserSafety(safetyData);
      });

      expect(result.current.error).toBe('Failed to save safety data');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to save safety data',
        variant: 'destructive',
      });
    });

    it('should handle validation errors', async () => {
      const safetyData = {
        allergies: [''], // Invalid - empty string
        dietary_restrictions: ['vegetarian'],
        medical_conditions: ['diabetes'],
      };

      mockValidateAllergies.mockReturnValue(false);

      const { result } = renderHook(() => useUserSafety());

      await act(async () => {
        await result.current.saveUserSafety(safetyData);
      });

      expect(result.current.error).toBe('Invalid safety data provided');
      expect(userPreferences.updateUserSafety).not.toHaveBeenCalled();
    });
  });

  describe('validateSafetyData', () => {
    beforeEach(() => {
      mockValidateAllergies.mockReturnValue(true);
    });

    it('should validate valid safety data', () => {
      const { result } = renderHook(() => useUserSafety());

      const validData = {
        allergies: ['peanuts', 'shellfish'],
        dietary_restrictions: ['vegetarian'],
        medical_conditions: ['diabetes'],
      };

      const isValid = result.current.validateSafetyData(validData);
      expect(isValid).toBe(true);
    });

    it('should reject data with empty dietary restrictions', () => {
      const { result } = renderHook(() => useUserSafety());

      const invalidData = {
        allergies: ['peanuts'],
        dietary_restrictions: [''], // Invalid
        medical_conditions: ['diabetes'],
      };

      const isValid = result.current.validateSafetyData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject data with empty medical conditions', () => {
      const { result } = renderHook(() => useUserSafety());

      const invalidData = {
        allergies: ['peanuts'],
        dietary_restrictions: ['vegetarian'],
        medical_conditions: ['', 'diabetes'], // One invalid
      };

      const isValid = result.current.validateSafetyData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should handle validation exceptions', () => {
      mockValidateAllergies.mockImplementation(() => {
        throw new Error('Validation error');
      });

      const { result } = renderHook(() => useUserSafety());

      const data = {
        allergies: ['peanuts'],
        dietary_restrictions: ['vegetarian'],
        medical_conditions: ['diabetes'],
      };

      const isValid = result.current.validateSafetyData(data);
      expect(isValid).toBe(false);
    });
  });

  describe('State Setters', () => {
    it('should update allergies state', () => {
      const { result } = renderHook(() => useUserSafety());

      act(() => {
        result.current.setAllergies(['peanuts', 'shellfish']);
      });

      expect(result.current.allergies).toEqual(['peanuts', 'shellfish']);
    });

    it('should update dietary restrictions state', () => {
      const { result } = renderHook(() => useUserSafety());

      act(() => {
        result.current.setDietaryRestrictions(['vegetarian', 'gluten-free']);
      });

      expect(result.current.dietaryRestrictions).toEqual([
        'vegetarian',
        'gluten-free',
      ]);
    });

    it('should update medical conditions state', () => {
      const { result } = renderHook(() => useUserSafety());

      act(() => {
        result.current.setMedicalConditions(['diabetes', 'hypertension']);
      });

      expect(result.current.medicalConditions).toEqual([
        'diabetes',
        'hypertension',
      ]);
    });
  });
});

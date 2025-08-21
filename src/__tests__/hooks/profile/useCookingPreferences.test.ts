import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCookingPreferences } from '@/hooks/profile/useCookingPreferences';
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
  getCookingPreferences: vi.fn(),
  updateCookingPreferences: vi.fn(),
  MIN_SPICE_TOLERANCE: 1,
  MAX_SPICE_TOLERANCE: 5,
}));

describe('useCookingPreferences', () => {
  const mockToast = vi.fn();
  const mockUseToast = useToast.useToast as ReturnType<typeof vi.fn>;
  const mockGetCookingPreferences =
    userPreferences.getCookingPreferences as ReturnType<typeof vi.fn>;
  const mockUpdateCookingPreferences =
    userPreferences.updateCookingPreferences as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  describe('Initial State', () => {
    it('should initialize with default values and loading false', () => {
      const { result } = renderHook(() => useCookingPreferences());

      expect(result.current.preferredCuisines).toEqual([]);
      expect(result.current.availableEquipment).toEqual([]);
      expect(result.current.dislikedIngredients).toEqual([]);
      expect(result.current.spiceTolerance).toBe(3);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useCookingPreferences());

      expect(typeof result.current.loadCookingPreferences).toBe('function');
      expect(typeof result.current.saveCookingPreferences).toBe('function');
      expect(typeof result.current.validateCookingData).toBe('function');
      expect(typeof result.current.setPreferredCuisines).toBe('function');
      expect(typeof result.current.setAvailableEquipment).toBe('function');
      expect(typeof result.current.setDislikedIngredients).toBe('function');
      expect(typeof result.current.setSpiceTolerance).toBe('function');
    });
  });

  describe('loadCookingPreferences', () => {
    it('should load cooking preferences data successfully', async () => {
      const mockCookingData = {
        user_id: 'test-user-id',
        preferred_cuisines: ['Italian', 'Mexican'],
        available_equipment: ['Oven', 'Stovetop'],
        disliked_ingredients: ['Mushrooms'],
        spice_tolerance: 4,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockGetCookingPreferences.mockResolvedValue(mockCookingData);

      const { result } = renderHook(() => useCookingPreferences());

      await act(async () => {
        await result.current.loadCookingPreferences();
      });

      expect(result.current.preferredCuisines).toEqual(['Italian', 'Mexican']);
      expect(result.current.availableEquipment).toEqual(['Oven', 'Stovetop']);
      expect(result.current.dislikedIngredients).toEqual(['Mushrooms']);
      expect(result.current.spiceTolerance).toBe(4);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle null cooking preferences data (no existing data)', async () => {
      mockGetCookingPreferences.mockResolvedValue(null);

      const { result } = renderHook(() => useCookingPreferences());

      await act(async () => {
        await result.current.loadCookingPreferences();
      });

      expect(result.current.preferredCuisines).toEqual([]);
      expect(result.current.availableEquipment).toEqual([]);
      expect(result.current.dislikedIngredients).toEqual([]);
      expect(result.current.spiceTolerance).toBe(3);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle loading errors', async () => {
      const errorMessage = 'Failed to load cooking preferences';
      mockGetCookingPreferences.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCookingPreferences());

      await act(async () => {
        await result.current.loadCookingPreferences();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    it('should set loading state during load operation', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockGetCookingPreferences.mockReturnValue(promise);

      const { result } = renderHook(() => useCookingPreferences());

      // Start loading
      act(() => {
        result.current.loadCookingPreferences();
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

  describe('saveCookingPreferences', () => {
    it('should save cooking preferences data successfully', async () => {
      const cookingData = {
        preferred_cuisines: ['Italian'],
        available_equipment: ['Oven'],
        disliked_ingredients: ['Mushrooms'],
        spice_tolerance: 3,
      };

      mockUpdateCookingPreferences.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useCookingPreferences());

      await act(async () => {
        await result.current.saveCookingPreferences(cookingData);
      });

      expect(userPreferences.updateCookingPreferences).toHaveBeenCalledWith(
        'test-user-id',
        cookingData
      );
      expect(result.current.preferredCuisines).toEqual(['Italian']);
      expect(result.current.availableEquipment).toEqual(['Oven']);
      expect(result.current.dislikedIngredients).toEqual(['Mushrooms']);
      expect(result.current.spiceTolerance).toBe(3);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Cooking preferences saved successfully!',
      });
    });

    it('should handle save errors', async () => {
      const cookingData = {
        preferred_cuisines: ['Italian'],
        available_equipment: ['Oven'],
        disliked_ingredients: ['Mushrooms'],
        spice_tolerance: 3,
      };
      const errorMessage = 'Failed to save cooking preferences';

      mockUpdateCookingPreferences.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useCookingPreferences());

      await act(async () => {
        await result.current.saveCookingPreferences(cookingData);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('should handle validation errors', async () => {
      const cookingData = {
        preferred_cuisines: [''], // Invalid - empty string
        available_equipment: ['Oven'],
        disliked_ingredients: ['Mushrooms'],
        spice_tolerance: 3,
      };

      const { result } = renderHook(() => useCookingPreferences());

      await act(async () => {
        await result.current.saveCookingPreferences(cookingData);
      });

      expect(result.current.error).toBe(
        'Invalid cooking preferences data provided'
      );
      expect(userPreferences.updateCookingPreferences).not.toHaveBeenCalled();
    });
  });

  describe('validateCookingData', () => {
    it('should validate valid cooking data', () => {
      const { result } = renderHook(() => useCookingPreferences());

      const validData = {
        preferred_cuisines: ['Italian', 'Mexican'],
        available_equipment: ['Oven', 'Stovetop'],
        disliked_ingredients: ['Mushrooms'],
        spice_tolerance: 3,
      };

      const isValid = result.current.validateCookingData(validData);
      expect(isValid).toBe(true);
    });

    it('should reject data with empty preferred cuisines', () => {
      const { result } = renderHook(() => useCookingPreferences());

      const invalidData = {
        preferred_cuisines: ['Italian', ''], // One invalid
        available_equipment: ['Oven'],
        disliked_ingredients: ['Mushrooms'],
        spice_tolerance: 3,
      };

      const isValid = result.current.validateCookingData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject data with empty available equipment', () => {
      const { result } = renderHook(() => useCookingPreferences());

      const invalidData = {
        preferred_cuisines: ['Italian'],
        available_equipment: [''], // Invalid
        disliked_ingredients: ['Mushrooms'],
        spice_tolerance: 3,
      };

      const isValid = result.current.validateCookingData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject data with empty disliked ingredients', () => {
      const { result } = renderHook(() => useCookingPreferences());

      const invalidData = {
        preferred_cuisines: ['Italian'],
        available_equipment: ['Oven'],
        disliked_ingredients: [''], // Invalid
        spice_tolerance: 3,
      };

      const isValid = result.current.validateCookingData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject data with invalid spice tolerance (too low)', () => {
      const { result } = renderHook(() => useCookingPreferences());

      const invalidData = {
        preferred_cuisines: ['Italian'],
        available_equipment: ['Oven'],
        disliked_ingredients: ['Mushrooms'],
        spice_tolerance: 0, // Below MIN_SPICE_TOLERANCE
      };

      const isValid = result.current.validateCookingData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject data with invalid spice tolerance (too high)', () => {
      const { result } = renderHook(() => useCookingPreferences());

      const invalidData = {
        preferred_cuisines: ['Italian'],
        available_equipment: ['Oven'],
        disliked_ingredients: ['Mushrooms'],
        spice_tolerance: 6, // Above MAX_SPICE_TOLERANCE
      };

      const isValid = result.current.validateCookingData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should handle validation exceptions', () => {
      const { result } = renderHook(() => useCookingPreferences());

      // Create invalid data that causes an exception during validation
      const invalidData = {
        preferred_cuisines: null as unknown as string[], // This will cause an exception
        available_equipment: ['Oven'],
        disliked_ingredients: ['Mushrooms'],
        spice_tolerance: 3,
      };

      const isValid = result.current.validateCookingData(invalidData);
      expect(isValid).toBe(false);
    });
  });

  describe('State Setters', () => {
    it('should update preferred cuisines state', () => {
      const { result } = renderHook(() => useCookingPreferences());

      act(() => {
        result.current.setPreferredCuisines(['Italian', 'Mexican']);
      });

      expect(result.current.preferredCuisines).toEqual(['Italian', 'Mexican']);
    });

    it('should update available equipment state', () => {
      const { result } = renderHook(() => useCookingPreferences());

      act(() => {
        result.current.setAvailableEquipment(['Oven', 'Stovetop', 'Microwave']);
      });

      expect(result.current.availableEquipment).toEqual([
        'Oven',
        'Stovetop',
        'Microwave',
      ]);
    });

    it('should update disliked ingredients state', () => {
      const { result } = renderHook(() => useCookingPreferences());

      act(() => {
        result.current.setDislikedIngredients(['Mushrooms', 'Olives']);
      });

      expect(result.current.dislikedIngredients).toEqual([
        'Mushrooms',
        'Olives',
      ]);
    });

    it('should update spice tolerance state', () => {
      const { result } = renderHook(() => useCookingPreferences());

      act(() => {
        result.current.setSpiceTolerance(5);
      });

      expect(result.current.spiceTolerance).toBe(5);
    });
  });
});

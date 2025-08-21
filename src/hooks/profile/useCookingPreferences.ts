import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import {
  getCookingPreferences,
  updateCookingPreferences,
  MIN_SPICE_TOLERANCE,
  MAX_SPICE_TOLERANCE,
} from '@/lib/user-preferences';

// Data interface for cooking preferences updates
export interface CookingPreferencesData {
  preferred_cuisines: string[];
  available_equipment: string[];
  disliked_ingredients: string[];
  spice_tolerance: number;
}

// Hook return interface
export interface UseCookingPreferencesReturn {
  // State
  preferredCuisines: string[];
  availableEquipment: string[];
  dislikedIngredients: string[];
  spiceTolerance: number;
  loading: boolean;
  error: string | null;

  // Actions
  loadCookingPreferences: () => Promise<void>;
  saveCookingPreferences: (data: CookingPreferencesData) => Promise<void>;
  validateCookingData: (data: CookingPreferencesData) => boolean;

  // State setters (for component compatibility)
  setPreferredCuisines: (cuisines: string[]) => void;
  setAvailableEquipment: (equipment: string[]) => void;
  setDislikedIngredients: (ingredients: string[]) => void;
  setSpiceTolerance: (tolerance: number) => void;
}

/**
 * Hook for managing user cooking preferences (cuisines, equipment, spice tolerance, dislikes)
 * Extracted from profile page to centralize cooking-related business logic
 */
export function useCookingPreferences(): UseCookingPreferencesReturn {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([]);
  const [spiceTolerance, setSpiceTolerance] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user cooking preferences from the database
   */
  const loadCookingPreferences = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cookingData = await getCookingPreferences(user.id);

      if (cookingData) {
        setPreferredCuisines(cookingData.preferred_cuisines || []);
        setAvailableEquipment(cookingData.available_equipment || []);
        setDislikedIngredients(cookingData.disliked_ingredients || []);
        setSpiceTolerance(cookingData.spice_tolerance || 3);
      } else {
        // No existing data - use defaults
        setPreferredCuisines([]);
        setAvailableEquipment([]);
        setDislikedIngredients([]);
        setSpiceTolerance(3);
      }
    } catch {
      setError('Failed to load cooking preferences');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Validate cooking preferences data before saving
   */
  const validateCookingData = useCallback(
    (data: CookingPreferencesData): boolean => {
      try {
        // Validate preferred cuisines - ensure no empty strings
        if (
          !data.preferred_cuisines.every((cuisine) => cuisine.trim().length > 0)
        ) {
          return false;
        }

        // Validate available equipment - ensure no empty strings
        if (
          !data.available_equipment.every(
            (equipment) => equipment.trim().length > 0
          )
        ) {
          return false;
        }

        // Validate disliked ingredients - ensure no empty strings
        if (
          !data.disliked_ingredients.every(
            (ingredient) => ingredient.trim().length > 0
          )
        ) {
          return false;
        }

        // Validate spice tolerance range
        if (
          data.spice_tolerance < MIN_SPICE_TOLERANCE ||
          data.spice_tolerance > MAX_SPICE_TOLERANCE
        ) {
          return false;
        }

        return true;
      } catch {
        setError('Validation error occurred');
        return false;
      }
    },
    []
  );

  /**
   * Save user cooking preferences to the database
   */
  const saveCookingPreferences = useCallback(
    async (data: CookingPreferencesData) => {
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Validate data before saving
      if (!validateCookingData(data)) {
        setError('Invalid cooking preferences data provided');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await updateCookingPreferences(user.id, {
          preferred_cuisines: data.preferred_cuisines,
          available_equipment: data.available_equipment,
          disliked_ingredients: data.disliked_ingredients,
          spice_tolerance: data.spice_tolerance,
        });

        if (result.success) {
          // Update local state to match saved data
          setPreferredCuisines(data.preferred_cuisines);
          setAvailableEquipment(data.available_equipment);
          setDislikedIngredients(data.disliked_ingredients);
          setSpiceTolerance(data.spice_tolerance);

          toast({
            title: 'Success',
            description: 'Cooking preferences saved successfully!',
          });
        } else {
          throw new Error(result.error || 'Failed to save cooking preferences');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to save cooking preferences';
        setError(errorMessage);

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [user?.id, toast, validateCookingData]
  );

  return {
    // State
    preferredCuisines,
    availableEquipment,
    dislikedIngredients,
    spiceTolerance,
    loading,
    error,

    // Actions
    loadCookingPreferences,
    saveCookingPreferences,
    validateCookingData,

    // State setters (for component compatibility)
    setPreferredCuisines,
    setAvailableEquipment,
    setDislikedIngredients,
    setSpiceTolerance,
  };
}

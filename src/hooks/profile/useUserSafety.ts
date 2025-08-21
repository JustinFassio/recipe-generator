import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import {
  getUserSafety,
  updateUserSafety,
  validateAllergies,
} from '@/lib/user-preferences';

// Data interface for safety updates
export interface UserSafetyData {
  allergies: string[];
  dietary_restrictions: string[];
  medical_conditions: string[];
}

// Hook return interface
export interface UseUserSafetyReturn {
  // State
  allergies: string[];
  dietaryRestrictions: string[];
  medicalConditions: string[];
  loading: boolean;
  error: string | null;

  // Actions
  loadUserSafety: () => Promise<void>;
  saveUserSafety: (data: UserSafetyData) => Promise<void>;
  validateSafetyData: (data: UserSafetyData) => boolean;

  // State setters (for component compatibility)
  setAllergies: (allergies: string[]) => void;
  setDietaryRestrictions: (restrictions: string[]) => void;
  setMedicalConditions: (conditions: string[]) => void;
}

/**
 * Hook for managing user safety preferences (allergies, dietary restrictions, medical conditions)
 * Extracted from profile page to centralize safety-related business logic
 */
export function useUserSafety(): UseUserSafetyReturn {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user safety data from the database
   */
  const loadUserSafety = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const safetyData = await getUserSafety(user.id);

      if (safetyData) {
        setAllergies(safetyData.allergies || []);
        setDietaryRestrictions(safetyData.dietary_restrictions || []);
        setMedicalConditions(safetyData.medical_conditions || []);
      } else {
        // No existing data - use empty arrays as defaults
        setAllergies([]);
        setDietaryRestrictions([]);
        setMedicalConditions([]);
      }
    } catch {
      setError('Failed to load safety preferences');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Validate safety data before saving
   */
  const validateSafetyData = useCallback((data: UserSafetyData): boolean => {
    try {
      // Validate allergies using existing validation function
      if (!validateAllergies(data.allergies)) {
        return false;
      }

      // Validate dietary restrictions (same logic as allergies)
      if (
        !data.dietary_restrictions.every(
          (restriction) => restriction.trim().length > 0
        )
      ) {
        return false;
      }

      // Validate medical conditions (same logic as allergies)
      if (
        !data.medical_conditions.every(
          (condition) => condition.trim().length > 0
        )
      ) {
        return false;
      }

      return true;
    } catch {
      setError('Validation error occurred');
      return false;
    }
  }, []);

  /**
   * Save user safety data to the database
   */
  const saveUserSafety = useCallback(
    async (data: UserSafetyData) => {
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Validate data before saving
      if (!validateSafetyData(data)) {
        setError('Invalid safety data provided');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await updateUserSafety(user.id, {
          allergies: data.allergies,
          dietary_restrictions: data.dietary_restrictions,
          medical_conditions: data.medical_conditions,
        });

        if (result.success) {
          // Update local state to match saved data
          setAllergies(data.allergies);
          setDietaryRestrictions(data.dietary_restrictions);
          setMedicalConditions(data.medical_conditions);

          toast({
            title: 'Success',
            description: 'Safety preferences saved successfully!',
          });
        } else {
          throw new Error(result.error || 'Failed to save safety preferences');
        }
      } catch {
        setError('Failed to save safety data');

        toast({
          title: 'Error',
          description: 'Failed to save safety data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [user?.id, toast, validateSafetyData]
  );

  return {
    // State
    allergies,
    dietaryRestrictions,
    medicalConditions,
    loading,
    error,

    // Actions
    loadUserSafety,
    saveUserSafety,
    validateSafetyData,

    // State setters (for component compatibility)
    setAllergies,
    setDietaryRestrictions,
    setMedicalConditions,
  };
}

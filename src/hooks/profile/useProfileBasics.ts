import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/lib/auth';
import { MIN_TIME_PER_MEAL, MAX_TIME_PER_MEAL } from '@/lib/user-preferences';

// Data interface for profile basics updates
export interface ProfileBasicsData {
  full_name: string | null;
  region: string | null;
  language: string;
  units: string;
  time_per_meal: number;
  skill_level: string;
}

export interface UseProfileBasicsReturn {
  // State
  fullName: string;
  region: string;
  language: string;
  units: string;
  timePerMeal: number;
  skillLevel: string;
  loading: boolean;
  error: string | null;

  // Actions
  updateProfileBasics: (data: ProfileBasicsData) => Promise<boolean>;
  setFullName: (value: string) => void;
  setRegion: (value: string) => void;
  setLanguage: (value: string) => void;
  setUnits: (value: string) => void;
  setTimePerMeal: (value: number) => void;
  setSkillLevel: (value: string) => void;

  // Utility function to parse skill level from unknown input
  parseSkillLevel: (value: unknown) => string;
}

/**
 * Hook for managing profile basics (region, language, units, time per meal, skill level)
 * Extracted from profile page to centralize profile basics business logic
 */
export function useProfileBasics(): UseProfileBasicsReturn {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  // State - Initialize from profile or defaults
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [region, setRegion] = useState(profile?.region || '');
  const [language, setLanguage] = useState(profile?.language || 'en');
  const [units, setUnits] = useState(profile?.units || 'metric');
  const [timePerMeal, setTimePerMeal] = useState<number>(
    Number(profile?.time_per_meal) || 30
  );

  // Robust skill level parsing function
  const parseSkillLevel = useCallback((value: unknown): string => {
    if (typeof value === 'string' && /^[1-5]$/.test(value)) {
      return value;
    }
    if (typeof value === 'number' && value >= 1 && value <= 5) {
      return value.toString();
    }
    return '1'; // Default to beginner
  }, []);

  const [skillLevel, setSkillLevel] = useState<string>(
    parseSkillLevel(profile?.skill_level)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate profile basics data before updating
   */
  const validateProfileData = useCallback(
    (data: ProfileBasicsData): boolean => {
      try {
        // Check if data exists
        if (!data) {
          return false;
        }

        // Validate language (should be a valid language code)
        if (!data.language || data.language.trim().length === 0) {
          return false;
        }

        // Validate units (should be 'metric' or 'imperial')
        if (!['metric', 'imperial'].includes(data.units)) {
          return false;
        }

        // Validate time per meal (should be within established bounds)
        if (
          data.time_per_meal < MIN_TIME_PER_MEAL ||
          data.time_per_meal > MAX_TIME_PER_MEAL
        ) {
          return false;
        }

        // Validate skill level (should be 1-5)
        if (!/^[1-5]$/.test(data.skill_level)) {
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
   * Update profile basics in the database
   */
  const updateProfileBasics = useCallback(
    async (data: ProfileBasicsData): Promise<boolean> => {
      // Validate data before updating
      if (!validateProfileData(data)) {
        setError('Invalid profile data provided');
        toast({
          title: 'Error',
          description: 'Please ensure all profile fields are valid.',
          variant: 'destructive',
        });
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const { success, error: updateError } = await updateProfile({
          full_name: data.full_name,
          region: data.region,
          language: data.language,
          units: data.units,
          time_per_meal: data.time_per_meal,
          skill_level: data.skill_level,
        });

        if (success) {
          // Update local state to match saved data
          setFullName(data.full_name || '');
          setRegion(data.region || '');
          setLanguage(data.language);
          setUnits(data.units);
          setTimePerMeal(data.time_per_meal);
          setSkillLevel(data.skill_level);

          // Refresh the profile context
          await refreshProfile();

          toast({
            title: 'Success',
            description: 'Profile updated successfully!',
          });

          return true;
        } else {
          throw new Error(updateError?.message || 'Failed to update profile');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update profile';
        setError(errorMessage);

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        setError('Failed to update profile basics');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [validateProfileData, toast, refreshProfile]
  );

  return {
    // State
    fullName,
    region,
    language,
    units,
    timePerMeal,
    skillLevel,
    loading,
    error,

    // Actions
    updateProfileBasics,
    setFullName,
    setRegion,
    setLanguage,
    setUnits,
    setTimePerMeal,
    setSkillLevel,

    // Utility function to parse skill level from unknown input
    parseSkillLevel,
  };
}

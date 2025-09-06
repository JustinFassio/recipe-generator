import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/lib/auth';
import {
  SKILL_LEVEL_MAP,
  SKILL_LEVEL_REVERSE_MAP,
  SKILL_LEVEL_DB_VALUES,
  type SkillLevelDB,
} from '@/lib/profile-constants';

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
  // Convert database time_per_meal (minutes) to UI index (1-5)
  const getTimePerMealForUI = useCallback(
    (dbValue: number | string | null): number => {
      if (!dbValue) return 2; // Default to 30 minutes (index 2)
      const numericValue =
        typeof dbValue === 'string' ? parseInt(dbValue, 10) : dbValue;
      if (isNaN(numericValue)) return 2; // Default to 30 minutes if not a number
      const timePerMealValues = [15, 30, 45, 60, 90];
      const index = timePerMealValues.findIndex(
        (value) => value === numericValue
      );
      return index >= 0 ? index + 1 : 2; // Default to 30 minutes if not found
    },
    []
  );

  // Convert UI index (1-5) to database time_per_meal (minutes)
  const getTimePerMealForDB = useCallback((uiIndex: number): number => {
    const timePerMealValues = [15, 30, 45, 60, 90];
    return timePerMealValues[uiIndex - 1] || 30; // Default to 30 minutes
  }, []);

  const [timePerMeal, setTimePerMeal] = useState<number>(
    getTimePerMealForUI(profile?.time_per_meal || null)
  );

  // Use shared skill level mapping constants

  // Robust skill level parsing function
  const parseSkillLevel = useCallback((value: unknown): string => {
    if (typeof value === 'string') {
      // If it's already a valid database value, return it
      if (SKILL_LEVEL_DB_VALUES.includes(value as SkillLevelDB)) {
        return value;
      }
      // If it's a numeric string (1-5), convert to database value
      if (/^[1-5]$/.test(value)) {
        return SKILL_LEVEL_MAP[value];
      }
    }
    if (typeof value === 'number' && value >= 1 && value <= 5) {
      return SKILL_LEVEL_MAP[value.toString()];
    }
    return 'beginner'; // Default to beginner
  }, []);

  // Convert database skill level to numeric for UI display
  const getSkillLevelForUI = useCallback((dbValue: string | null): string => {
    if (!dbValue) return '1';
    return SKILL_LEVEL_REVERSE_MAP[dbValue] || '1';
  }, []);

  const [skillLevel, setSkillLevel] = useState<string>(
    getSkillLevelForUI(profile?.skill_level || null)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state when profile changes (fixes refresh issue)
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRegion(profile.region || '');
      setLanguage(profile.language || 'en');
      setUnits(profile.units || 'metric');
      setTimePerMeal(getTimePerMealForUI(profile.time_per_meal || null));
      setSkillLevel(getSkillLevelForUI(profile.skill_level));
    }
  }, [profile, getSkillLevelForUI, getTimePerMealForUI]);

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

        // Validate time per meal (should be UI index 1-5)
        if (data.time_per_meal < 1 || data.time_per_meal > 5) {
          return false;
        }

        // Validate skill level (should be 1-5 for UI)
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
        // Convert numeric skill level to database string value
        const dbSkillLevel = SKILL_LEVEL_MAP[data.skill_level] || 'beginner';

        // Convert UI time_per_meal index to database value (minutes)
        const dbTimePerMeal = getTimePerMealForDB(data.time_per_meal);

        const { success, error: updateError } = await updateProfile({
          full_name: data.full_name,
          region: data.region,
          language: data.language,
          units: data.units,
          time_per_meal: dbTimePerMeal,
          skill_level: dbSkillLevel,
        });

        if (success) {
          // Update local state to match saved data
          setFullName(data.full_name || '');
          setRegion(data.region || '');
          setLanguage(data.language);
          setUnits(data.units);
          setTimePerMeal(data.time_per_meal);
          setSkillLevel(data.skill_level); // Keep numeric value for UI

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
    [validateProfileData, toast, refreshProfile, getTimePerMealForDB]
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

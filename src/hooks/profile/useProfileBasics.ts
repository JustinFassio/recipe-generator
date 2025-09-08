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
  country: string | null;
  state_province: string | null;
  city: string | null;
  language: string;
  units: string;
  time_per_meal: number;
  skill_level: string;
}

export interface UseProfileBasicsReturn {
  // State
  fullName: string;
  region: string;
  country: string;
  stateProvince: string;
  city: string;
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
  setCountry: (value: string) => void;
  setStateProvince: (value: string) => void;
  setCity: (value: string) => void;
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
  const [country, setCountry] = useState(profile?.country || '');
  const [stateProvince, setStateProvince] = useState(
    profile?.state_province || ''
  );
  const [city, setCity] = useState(profile?.city || '');
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
      setCountry(profile.country || '');
      setStateProvince(profile.state_province || '');
      setCity(profile.city || '');
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

        // Validate full_name (matches database constraint: length(trim(full_name)) BETWEEN 1 AND 80)
        if (data.full_name !== null && data.full_name !== undefined) {
          const trimmedName = data.full_name.trim();
          if (trimmedName.length < 1 || trimmedName.length > 80) {
            setError('Full name must be between 1 and 80 characters');
            return false;
          }
        }

        // Validate region (optional field, but if provided should be reasonable length)
        if (
          data.region !== null &&
          data.region !== undefined &&
          data.region.trim().length > 0
        ) {
          const trimmedRegion = data.region.trim();
          if (trimmedRegion.length > 100) {
            setError('Region must be 100 characters or less');
            return false;
          }
          // Basic validation for reasonable region names (no special characters except spaces, hyphens, commas)
          if (!/^[a-zA-Z\s\-,.()]+$/.test(trimmedRegion)) {
            setError(
              'Region contains invalid characters. Use only letters, spaces, hyphens, commas, periods, and parentheses'
            );
            return false;
          }
        }

        // Validate country (optional field, but if provided should be reasonable length)
        if (
          data.country !== null &&
          data.country !== undefined &&
          data.country.trim().length > 0
        ) {
          const trimmedCountry = data.country.trim();
          if (trimmedCountry.length < 2 || trimmedCountry.length > 50) {
            setError('Country must be between 2 and 50 characters');
            return false;
          }
          // Basic validation for reasonable country names
          if (!/^[a-zA-Z\s\-,.()]+$/.test(trimmedCountry)) {
            setError(
              'Country contains invalid characters. Use only letters, spaces, hyphens, commas, periods, and parentheses'
            );
            return false;
          }
        }

        // Validate state/province (optional field, but if provided should be reasonable length)
        if (
          data.state_province !== null &&
          data.state_province !== undefined &&
          data.state_province.trim().length > 0
        ) {
          const trimmedStateProvince = data.state_province.trim();
          if (
            trimmedStateProvince.length < 2 ||
            trimmedStateProvince.length > 50
          ) {
            setError('State/Province must be between 2 and 50 characters');
            return false;
          }
          // Basic validation for reasonable state/province names
          if (!/^[a-zA-Z\s\-,.()]+$/.test(trimmedStateProvince)) {
            setError(
              'State/Province contains invalid characters. Use only letters, spaces, hyphens, commas, periods, and parentheses'
            );
            return false;
          }
        }

        // Validate city (optional field, but if provided should be reasonable length)
        if (
          data.city !== null &&
          data.city !== undefined &&
          data.city.trim().length > 0
        ) {
          const trimmedCity = data.city.trim();
          if (trimmedCity.length < 2 || trimmedCity.length > 50) {
            setError('City must be between 2 and 50 characters');
            return false;
          }
          // Basic validation for reasonable city names
          if (!/^[a-zA-Z\s\-,.()]+$/.test(trimmedCity)) {
            setError(
              'City contains invalid characters. Use only letters, spaces, hyphens, commas, periods, and parentheses'
            );
            return false;
          }
        }

        // Validate language (should be a valid language code)
        if (!data.language || data.language.trim().length === 0) {
          setError('Language is required');
          return false;
        }

        // Validate units (should be 'metric' or 'imperial')
        if (!['metric', 'imperial'].includes(data.units)) {
          setError('Units must be either metric or imperial');
          return false;
        }

        // Validate time per meal (should be UI index 1-5)
        if (data.time_per_meal < 1 || data.time_per_meal > 5) {
          setError('Time per meal must be between 1 and 5');
          return false;
        }

        // Validate skill level (should be 1-5 for UI)
        if (!/^[1-5]$/.test(data.skill_level)) {
          setError('Skill level must be between 1 and 5');
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
        toast({
          title: 'Error',
          description: 'Please ensure all profile fields are valid.',
          variant: 'destructive',
        });
        return false;
      }

      setLoading(true);
      setError(null); // Clear any previous errors only if validation passes

      try {
        // Convert numeric skill level to database string value
        const dbSkillLevel = SKILL_LEVEL_MAP[data.skill_level] || 'beginner';

        // Convert UI time_per_meal index to database value (minutes)
        const dbTimePerMeal = getTimePerMealForDB(data.time_per_meal);

        const { success, error: updateError } = await updateProfile({
          full_name: data.full_name ? data.full_name.trim() : null,
          region: data.region ? data.region.trim() : null,
          country: data.country ? data.country.trim() : null,
          state_province: data.state_province
            ? data.state_province.trim()
            : null,
          city: data.city ? data.city.trim() : null,
          language: data.language,
          units: data.units,
          time_per_meal: dbTimePerMeal,
          skill_level: dbSkillLevel,
        });

        if (success) {
          // Update local state to match saved data
          setFullName(data.full_name || '');
          setRegion(data.region || '');
          setCountry(data.country || '');
          setStateProvince(data.state_province || '');
          setCity(data.city || '');
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
    country,
    stateProvince,
    city,
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
    setCountry,
    setStateProvince,
    setCity,
    setLanguage,
    setUnits,
    setTimePerMeal,
    setSkillLevel,

    // Utility function to parse skill level from unknown input
    parseSkillLevel,
  };
}

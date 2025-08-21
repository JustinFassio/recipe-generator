import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import {
  updateProfile,
  updateEmail,
  updatePassword,
  claimUsername,
  checkUsernameAvailability,
  uploadAvatar,
} from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { getUserSafety, getCookingPreferences } from '@/lib/user-preferences';
import {
  useBioUpdate,
  useUserSafetyUpdate,
  useCookingPreferencesUpdate,
} from '@/hooks/useProfileUpdate';

// Component imports
import {
  AvatarCard,
  BioCard,
  ProfileInfoForm,
} from '@/components/profile/basic';
import {
  SafetySection,
  MedicalConditionsField,
  AllergiesField,
  DietaryRestrictionsField,
  SafetySaveButton,
} from '@/components/profile/safety';
import {
  CookingSection,
  PreferredCuisinesField,
  EquipmentField,
  SpiceToleranceField,
  DislikedIngredientsField,
  CookingSaveButton,
} from '@/components/profile/cooking';
import { EmailCard, PasswordCard } from '@/components/profile/account';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks for profile updates
  const bioUpdate = useBioUpdate();
  const safetyUpdate = useUserSafetyUpdate();
  const cookingUpdate = useCookingPreferencesUpdate();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, []);

  // Load user preferences data
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user?.id) return;

      try {
        const [safetyData, cookingData] = await Promise.all([
          getUserSafety(user.id),
          getCookingPreferences(user.id),
        ]);

        if (safetyData) {
          setAllergies(safetyData.allergies);
          setDietaryRestrictions(safetyData.dietary_restrictions);
          setMedicalConditions(safetyData.medical_conditions);
        }

        if (cookingData) {
          setPreferredCuisines(cookingData.preferred_cuisines);
          setAvailableEquipment(cookingData.available_equipment);
          setDislikedIngredients(cookingData.disliked_ingredients);
          setSpiceTolerance(cookingData.spice_tolerance || 3);
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
  }, [user?.id]);

  // Avatar state and handlers
  const [avatarLoading, setAvatarLoading] = useState(false);
  const handleAvatarUpload = async (file: File) => {
    setAvatarLoading(true);
    const { success, error } = await uploadAvatar(file);

    if (!success && error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Avatar updated successfully!',
      });
      await refreshProfile();
    }
    setAvatarLoading(false);
  };

  // Bio state and handlers
  const [bio, setBio] = useState(profile?.bio || '');
  const handleBioSave = async () => {
    const result = await bioUpdate.executeUpdate({ bio: bio || null });
    if (result.success) {
      await refreshProfile();
    }
  };

  // Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [region, setRegion] = useState(profile?.region || '');
  const [language, setLanguage] = useState(profile?.language || 'en');
  const [units, setUnits] = useState(profile?.units || 'metric');
  const [timePerMeal, setTimePerMeal] = useState<number>(
    Number(profile?.time_per_meal) || 30
  );
  // Robust skill level parsing function
  function parseSkillLevel(value: unknown): number {
    const num = typeof value === 'string' ? Number(value) : value;
    return typeof num === 'number' && !isNaN(num) && num > 0 ? num : 1;
  }

  const [skillLevel, setSkillLevel] = useState<number>(
    parseSkillLevel(profile?.skill_level)
  );
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Username availability check
  const checkUsername = async (usernameValue: string) => {
    if (!usernameValue || usernameValue.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    const { available } = await checkUsernameAvailability(usernameValue);
    setUsernameAvailable(available);
    setUsernameChecking(false);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameAvailable(null);

    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    usernameTimeoutRef.current = setTimeout(() => {
      checkUsername(value);
    }, 500);
  };

  // Profile form submission
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);

    try {
      const updates = {
        full_name: fullName || null,
        region: region || null,
        language,
        units,
        time_per_meal: timePerMeal,
        skill_level: skillLevel.toString(),
      };

      const { success: profileSuccess, error: profileError } =
        await updateProfile(updates);

      if (!profileSuccess && profileError) {
        throw new Error(profileError.message);
      }

      if (username && usernameAvailable) {
        const { success: usernameSuccess, error: usernameError } =
          await claimUsername(username);
        if (!usernameSuccess && usernameError) {
          throw new Error(usernameError.message);
        }
      }

      await refreshProfile();
      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });

      if (username && usernameAvailable) {
        setUsername('');
        setUsernameAvailable(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Safety preferences state
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);

  const handleSafetySave = async () => {
    if (!user?.id) return;

    const result = await safetyUpdate.executeUpdate(user.id, {
      allergies,
      dietary_restrictions: dietaryRestrictions,
      medical_conditions: medicalConditions,
    });

    if (result.success) {
      // Success handled by hook
    }
  };

  // Cooking preferences state
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([]);
  const [spiceTolerance, setSpiceTolerance] = useState(3);

  const handleCookingSave = async () => {
    if (!user?.id) return;

    const result = await cookingUpdate.executeUpdate(user.id, {
      preferred_cuisines: preferredCuisines,
      available_equipment: availableEquipment,
      disliked_ingredients: dislikedIngredients,
      spice_tolerance: spiceTolerance,
    });

    if (result.success) {
      // Success handled by hook
    }
  };

  // Email/Password form state
  const [currentEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');

  // Email update handler
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);

    try {
      const { success, error } = await updateEmail(newEmail);

      if (!success && error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description:
          'Email update initiated! Please check your new email for confirmation.',
      });
      setNewEmail('');
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update email',
        variant: 'destructive',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  // Password update handler
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);

    try {
      const { success, error } = await updatePassword(newPassword);

      if (!success && error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description: 'Password updated successfully!',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content">
          Account Settings
        </h1>
        <p className="text-base-content/60 mt-2">
          Manage your profile and account preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-boxed tabs mb-8">
        <button
          className={`tab ${activeTab === 'profile' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`tab ${activeTab === 'account' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid gap-8 md:grid-cols-2">
          {/* Avatar Section */}
          <AvatarCard
            avatarUrl={profile.avatar_url}
            loading={avatarLoading}
            onUpload={handleAvatarUpload}
          />

          {/* Bio Section */}
          <BioCard
            bio={bio}
            onChange={setBio}
            onSave={handleBioSave}
            loading={bioUpdate.loading}
          />

          {/* Profile Form */}
          <ProfileInfoForm
            fullName={fullName}
            onFullNameChange={setFullName}
            username={username}
            onUsernameChange={handleUsernameChange}
            usernameAvailable={usernameAvailable}
            usernameChecking={usernameChecking}
            currentUsername={profile.username}
            region={region}
            onRegionChange={setRegion}
            language={language}
            onLanguageChange={setLanguage}
            units={units}
            onUnitsChange={setUnits}
            timePerMeal={timePerMeal}
            onTimePerMealChange={setTimePerMeal}
            skillLevel={skillLevel}
            onSkillLevelChange={setSkillLevel}
            onSubmit={handleProfileUpdate}
            submitting={profileSubmitting}
            className="md:col-span-2"
          />

          {/* Safety Section */}
          <SafetySection className="md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <MedicalConditionsField
                values={medicalConditions}
                onChange={setMedicalConditions}
              />
              <AllergiesField values={allergies} onChange={setAllergies} />
            </div>
            <DietaryRestrictionsField
              values={dietaryRestrictions}
              onChange={setDietaryRestrictions}
              className="mt-4"
            />
            <SafetySaveButton
              onClick={handleSafetySave}
              loading={safetyUpdate.loading}
              className="mt-4"
            />
          </SafetySection>

          {/* Cooking Section */}
          <CookingSection className="md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <PreferredCuisinesField
                values={preferredCuisines}
                onChange={setPreferredCuisines}
              />
              <EquipmentField
                values={availableEquipment}
                onChange={setAvailableEquipment}
              />
              <SpiceToleranceField
                value={spiceTolerance}
                onChange={setSpiceTolerance}
              />
              <DislikedIngredientsField
                values={dislikedIngredients}
                onChange={setDislikedIngredients}
              />
            </div>
            <CookingSaveButton
              onClick={handleCookingSave}
              loading={cookingUpdate.loading}
              className="mt-4"
            />
          </CookingSection>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="grid gap-8 md:grid-cols-2">
          {/* Email Section */}
          <EmailCard
            currentEmail={currentEmail}
            newEmail={newEmail}
            onNewEmailChange={setNewEmail}
            onSubmit={handleEmailUpdate}
            loading={emailLoading}
          />

          {/* Password Section */}
          <PasswordCard
            newPassword={newPassword}
            onNewPasswordChange={setNewPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handlePasswordUpdate}
            loading={passwordLoading}
          />
        </div>
      )}
    </div>
  );
}

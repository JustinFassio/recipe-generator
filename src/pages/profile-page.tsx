import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from '@/hooks/use-toast';
import {
  useUserSafety,
  useCookingPreferences,
  useUsernameAvailability,
  useProfileBasics,
  useAvatarUpload,
  useBioUpdate,
  useAccountManagement,
} from '@/hooks/profile';

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
  const { user, profile } = useAuth();

  // All profile functionality via hooks
  const userSafety = useUserSafety();
  const cookingPrefs = useCookingPreferences();
  const usernameAvailability = useUsernameAvailability();
  const profileBasics = useProfileBasics();
  const avatarUpload = useAvatarUpload();
  const bioUpdate = useBioUpdate();
  const accountManagement = useAccountManagement();

  // Load user preferences data
  // Load user preferences data once when component mounts
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        // Load data via hooks
        await Promise.all([
          userSafety.loadUserSafety(),
          cookingPrefs.loadCookingPreferences(),
        ]);
      } catch {
        // Error handling is managed by individual hooks
      }
    };

    loadData();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Profile form submission state
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Profile form submission
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);

    try {
      // Update profile basics via hook
      const profileSuccess = await profileBasics.updateProfileBasics({
        full_name: profileBasics.fullName || null,
        region: profileBasics.region || null,
        language: profileBasics.language,
        units: profileBasics.units,
        time_per_meal: profileBasics.timePerMeal,
        skill_level: profileBasics.skillLevel,
      });

      if (!profileSuccess) {
        throw new Error('Failed to update profile');
      }

      // Handle username claiming via hook
      if (usernameAvailability.username && usernameAvailability.isAvailable) {
        const usernameSuccess = await usernameAvailability.claimUsername(
          usernameAvailability.username
        );
        if (!usernameSuccess) {
          throw new Error('Failed to update username');
        }
      }

      // Success message is handled by the hook
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

  // Wrapper handlers for component compatibility
  const handleAvatarUpload = async (file: File): Promise<void> => {
    await avatarUpload.uploadAvatar(file);
  };

  const handleBioSave = async (): Promise<void> => {
    await bioUpdate.saveBio();
  };

  const handleSafetySave = async () => {
    await userSafety.saveUserSafety({
      allergies: userSafety.allergies,
      dietary_restrictions: userSafety.dietaryRestrictions,
      medical_conditions: userSafety.medicalConditions,
    });
  };

  const handleCookingSave = async () => {
    await cookingPrefs.saveCookingPreferences({
      preferred_cuisines: cookingPrefs.preferredCuisines,
      available_equipment: cookingPrefs.availableEquipment,
      disliked_ingredients: cookingPrefs.dislikedIngredients,
      spice_tolerance: cookingPrefs.spiceTolerance,
    });
  };

  // Active tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');

  // Simple form handlers that delegate to hooks
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await accountManagement.updateEmailAddress();
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await accountManagement.updateUserPassword();
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
        <h1 className="text-base-content text-3xl font-bold">
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
            avatarUrl={profile?.avatar_url || null}
            loading={avatarUpload.loading}
            onUpload={handleAvatarUpload}
          />

          {/* Bio Section */}
          <BioCard
            bio={bioUpdate.bio}
            onChange={bioUpdate.setBio}
            onSave={handleBioSave}
            loading={bioUpdate.loading}
          />

          {/* Profile Form */}
          <ProfileInfoForm
            fullName={profileBasics.fullName}
            onFullNameChange={profileBasics.setFullName}
            username={usernameAvailability.username}
            onUsernameChange={usernameAvailability.handleUsernameChange}
            usernameAvailable={usernameAvailability.isAvailable}
            usernameChecking={usernameAvailability.isChecking}
            currentUsername={profile?.username}
            region={profileBasics.region}
            onRegionChange={profileBasics.setRegion}
            language={profileBasics.language}
            onLanguageChange={profileBasics.setLanguage}
            units={profileBasics.units}
            onUnitsChange={profileBasics.setUnits}
            timePerMeal={profileBasics.timePerMeal}
            onTimePerMealChange={profileBasics.setTimePerMeal}
            skillLevel={profileBasics.skillLevel}
            onSkillLevelChange={profileBasics.setSkillLevel}
            onSubmit={handleProfileUpdate}
            submitting={profileSubmitting}
            className="md:col-span-2"
          />
          {/* Debug info */}
          {import.meta.env.DEV && (
            <div className="mt-2 text-xs text-gray-500">
              Debug: profile.username = "{profile?.username}" (type:{' '}
              {typeof profile?.username})
            </div>
          )}

          {/* Safety Section */}
          <SafetySection className="md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <MedicalConditionsField
                values={userSafety.medicalConditions}
                onChange={userSafety.setMedicalConditions}
              />
              <AllergiesField
                values={userSafety.allergies}
                onChange={userSafety.setAllergies}
              />
            </div>
            <DietaryRestrictionsField
              values={userSafety.dietaryRestrictions}
              onChange={userSafety.setDietaryRestrictions}
              className="mt-4"
            />
            <SafetySaveButton
              onClick={handleSafetySave}
              loading={userSafety.loading}
              className="mt-4"
            />
          </SafetySection>

          {/* Cooking Section */}
          <CookingSection className="md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <PreferredCuisinesField
                values={cookingPrefs.preferredCuisines}
                onChange={cookingPrefs.setPreferredCuisines}
              />
              <EquipmentField
                values={cookingPrefs.availableEquipment}
                onChange={cookingPrefs.setAvailableEquipment}
              />
              <SpiceToleranceField
                value={cookingPrefs.spiceTolerance}
                onChange={cookingPrefs.setSpiceTolerance}
              />
              <DislikedIngredientsField
                values={cookingPrefs.dislikedIngredients}
                onChange={cookingPrefs.setDislikedIngredients}
              />
            </div>
            <CookingSaveButton
              onClick={handleCookingSave}
              loading={cookingPrefs.loading}
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
            currentEmail={accountManagement.currentEmail}
            newEmail={accountManagement.newEmail}
            onNewEmailChange={accountManagement.setNewEmail}
            onSubmit={handleEmailUpdate}
            loading={accountManagement.emailLoading}
          />

          {/* Password Section */}
          <PasswordCard
            newPassword={accountManagement.newPassword}
            onNewPasswordChange={accountManagement.setNewPassword}
            confirmPassword={accountManagement.confirmPassword}
            onConfirmPasswordChange={accountManagement.setConfirmPassword}
            onSubmit={handlePasswordUpdate}
            loading={accountManagement.passwordLoading}
          />
        </div>
      )}
    </div>
  );
}

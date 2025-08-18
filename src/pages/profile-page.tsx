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
import {
  getUserSafety,
  updateUserSafety,
  getCookingPreferences,
  updateCookingPreferences,
} from '@/lib/user-preferences';
import {
  withTextWrapping,
  getHelperTextClasses,
} from '@/lib/text-wrapping-migration';
import {
  User,
  Mail,
  Lock,
  Camera,
  Check,
  X,
  Loader2,
  UserCheck,
  AtSign,
  MapPin,
  Globe,
  Ruler,
  Clock,
  GraduationCap,
  Shield,
  ChefHat,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [usernameChecking, setUsernameChecking] = useState(false);

  // Email/Password form state
  const [currentEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Active tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');

  // Phase 1A: Basic profile preferences state
  const [region, setRegion] = useState(profile?.region || '');
  const [language, setLanguage] = useState(profile?.language || 'en');
  const [units, setUnits] = useState(profile?.units || 'metric');
  const [timePerMeal, setTimePerMeal] = useState(profile?.time_per_meal || 30);
  const [skillLevel, setSkillLevel] = useState(
    profile?.skill_level || 'beginner'
  );

  // Phase 1B: Safety data state
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);

  // Phase 1C: Cooking preferences state
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([]);
  const [spiceTolerance, setSpiceTolerance] = useState(3);

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  const handleUsernameCheck = async (usernameValue: string) => {
    if (!usernameValue || usernameValue === profile.username) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    const { available, error } = await checkUsernameAvailability(usernameValue);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setUsernameAvailable(false);
    } else {
      setUsernameAvailable(available);
    }

    setUsernameChecking(false);
  };

  const handleUsernameChange = (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleanValue);

    // Clear previous timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    // Debounce the availability check
    usernameTimeoutRef.current = setTimeout(() => {
      handleUsernameCheck(cleanValue);
    }, 500);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile info
      const { success: profileSuccess, error: profileError } =
        await updateProfile({
          full_name: fullName,
          region: region || null,
          language,
          units,
          time_per_meal: timePerMeal,
          skill_level: skillLevel,
        });

      if (!profileSuccess && profileError) {
        throw new Error(profileError.message);
      }

      // Claim username if provided and available
      if (username && username !== profile.username && usernameAvailable) {
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

      setUsername('');
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setLoading(true);
    const { success, error } = await updateEmail(newEmail);

    if (!success && error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Check your email to confirm the change!',
      });
      setNewEmail('');
    }

    setLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { success, error } = await updatePassword(newPassword);

    if (!success && error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Password updated successfully!',
      });
      setNewPassword('');
      setConfirmPassword('');
    }

    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={withTextWrapping()}>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-content">
            Account Settings
          </h1>
          <p className="text-base-content/60 mt-2">
            Manage your profile and account preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs-boxed tabs mb-8 w-fit">
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
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Profile Picture</h2>

                <div className="flex flex-col items-center space-y-4">
                  <div className="avatar">
                    <div className="h-24 w-24 rounded-full">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" />
                      ) : (
                        <div className="flex items-center justify-center bg-primary/20">
                          <User className="h-12 w-12 text-primary" />
                        </div>
                      )}
                      {avatarLoading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarLoading}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {avatarLoading ? 'Uploading...' : 'Change Photo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="card w-full bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">About Me</h2>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bio</span>
                    <span className="label-text-alt">{bio.length}/500</span>
                  </label>
                  <textarea
                    className="textarea-bordered textarea w-full"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a bit about yourself, your cooking interests, or dietary preferences..."
                    rows={4}
                    maxLength={500}
                  />
                  <label className="label">
                    <span
                      className={`label-text-alt ${getHelperTextClasses()}`}
                    >
                      Share your cooking style, favorite cuisines, or any other
                      details that help personalize your recipe recommendations.
                    </span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const { success: profileSuccess, error: profileError } =
                        await updateProfile({
                          bio: bio || null,
                        });

                      if (!profileSuccess && profileError) {
                        throw new Error(profileError.message);
                      }

                      await refreshProfile();

                      toast({
                        title: 'Success',
                        description: 'Bio updated successfully!',
                      });
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description:
                          error instanceof Error
                            ? error.message
                            : 'Failed to update bio',
                        variant: 'destructive',
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Save Bio
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Profile Information</h2>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  {/* Full Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Full Name</span>
                    </label>
                    <div className="relative">
                      <User className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                      <input
                        type="text"
                        className="input-bordered input w-full pl-10"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  {/* Current Username */}
                  {profile.username && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Current Username</span>
                      </label>
                      <div className="relative">
                        <AtSign className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                        <input
                          type="text"
                          className="input-bordered input w-full pl-10"
                          value={profile.username}
                          disabled
                        />
                      </div>
                    </div>
                  )}

                  {/* New Username */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">
                        {profile.username
                          ? 'Change Username'
                          : 'Claim Username'}
                      </span>
                    </label>
                    <div className="relative">
                      <AtSign className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                      <input
                        type="text"
                        className={`input-bordered input w-full pl-10 pr-10 ${
                          username && usernameAvailable === true
                            ? 'input-success'
                            : username && usernameAvailable === false
                              ? 'input-error'
                              : ''
                        }`}
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="Choose a username"
                        pattern="[a-z0-9_]{3,24}"
                        minLength={3}
                        maxLength={24}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                        {usernameChecking ? (
                          <Loader2 className="text-base-content/40 h-4 w-4 animate-spin" />
                        ) : username && usernameAvailable === true ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : username && usernameAvailable === false ? (
                          <X className="h-4 w-4 text-error" />
                        ) : null}
                      </div>
                    </div>
                    <label className="label">
                      <span
                        className={`label-text-alt ${getHelperTextClasses()}`}
                      >
                        3-24 characters, lowercase letters, numbers, and
                        underscores only
                      </span>
                    </label>
                    {username && usernameAvailable === false && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          This username is not available
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Phase 1A: Basic Preferences */}
                  <div className="divider">Preferences</div>

                  {/* Region */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Region</span>
                    </label>
                    <div className="relative">
                      <MapPin className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                      <input
                        type="text"
                        className="input-bordered input w-full pl-10"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="e.g., United States, Canada, UK"
                      />
                    </div>
                  </div>

                  {/* Language */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Language</span>
                    </label>
                    <div className="relative">
                      <Globe className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                      <select
                        className="select-bordered select w-full pl-10"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                      </select>
                    </div>
                  </div>

                  {/* Units */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Measurement Units</span>
                    </label>
                    <div className="relative">
                      <Ruler className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                      <select
                        className="select-bordered select w-full pl-10"
                        value={units}
                        onChange={(e) => setUnits(e.target.value)}
                      >
                        <option value="metric">Metric (kg, L, °C)</option>
                        <option value="imperial">
                          Imperial (lbs, cups, °F)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Time per Meal */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Time per Meal</span>
                      <span className="label-text-alt">
                        {timePerMeal} minutes
                      </span>
                    </label>
                    <div className="relative">
                      <Clock className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                      <input
                        type="range"
                        min="10"
                        max="120"
                        step="5"
                        className="range range-primary ml-10"
                        value={timePerMeal}
                        onChange={(e) => setTimePerMeal(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex w-full justify-between px-2 text-xs">
                      <span>10 min</span>
                      <span>30 min</span>
                      <span>60 min</span>
                      <span>120 min</span>
                    </div>
                  </div>

                  {/* Skill Level */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Cooking Skill Level</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                      <select
                        className="select-bordered select w-full pl-10"
                        value={skillLevel}
                        onChange={(e) => setSkillLevel(e.target.value)}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={
                      loading || (!!username && usernameAvailable !== true)
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Update Profile
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Phase 1B: Safety & Dietary Section */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-warning" />
                  Safety & Dietary
                </h2>
                <p className="text-base-content/60 mb-4 text-sm">
                  Help us keep you safe by sharing any allergies or dietary
                  restrictions.
                </p>

                <div className="space-y-4">
                  {/* Medical Conditions */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Medical Conditions
                      </span>
                      <span className="label-text-alt whitespace-normal break-words text-info">
                        Help us recommend foods that support your health
                      </span>
                    </label>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {[
                        'diabetes',
                        'hypertension',
                        'heart disease',
                        'high cholesterol',
                        'kidney disease',
                        'liver disease',
                        'thyroid issues',
                        'arthritis',
                        'osteoporosis',
                        'acid reflux',
                      ].map((condition) => (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => {
                            if (medicalConditions.includes(condition)) {
                              setMedicalConditions(
                                medicalConditions.filter((c) => c !== condition)
                              );
                            } else {
                              setMedicalConditions([
                                ...medicalConditions,
                                condition,
                              ]);
                            }
                          }}
                          className={`btn btn-sm ${medicalConditions.includes(condition) ? 'btn-info' : 'btn-outline'}`}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="input-bordered input w-full"
                      placeholder="Other conditions (press Enter to add)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !medicalConditions.includes(value)) {
                            setMedicalConditions([...medicalConditions, value]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Allergies */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Food Allergies
                      </span>
                      <span className="label-text-alt text-warning">
                        Critical for safety
                      </span>
                    </label>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {[
                        'peanut',
                        'tree nuts',
                        'milk',
                        'eggs',
                        'wheat',
                        'soy',
                        'fish',
                        'shellfish',
                        'sesame',
                      ].map((allergen) => (
                        <button
                          key={allergen}
                          type="button"
                          onClick={() => {
                            if (allergies.includes(allergen)) {
                              setAllergies(
                                allergies.filter((a) => a !== allergen)
                              );
                            } else {
                              setAllergies([...allergies, allergen]);
                            }
                          }}
                          className={`btn btn-sm ${allergies.includes(allergen) ? 'btn-error' : 'btn-outline'}`}
                        >
                          {allergen}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="input-bordered input w-full"
                      placeholder="Other allergies (comma separated)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !allergies.includes(value)) {
                            setAllergies([...allergies, value]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Dietary Restrictions */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Dietary Restrictions
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'vegan',
                        'vegetarian',
                        'pescatarian',
                        'halal',
                        'kosher',
                        'gluten-free',
                        'dairy-free',
                      ].map((restriction) => (
                        <button
                          key={restriction}
                          type="button"
                          onClick={() => {
                            if (dietaryRestrictions.includes(restriction)) {
                              setDietaryRestrictions(
                                dietaryRestrictions.filter(
                                  (r) => r !== restriction
                                )
                              );
                            } else {
                              setDietaryRestrictions([
                                ...dietaryRestrictions,
                                restriction,
                              ]);
                            }
                          }}
                          className={`btn btn-sm ${dietaryRestrictions.includes(restriction) ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {restriction}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await updateUserSafety(user.id, {
                          allergies,
                          dietary_restrictions: dietaryRestrictions,
                          medical_conditions: medicalConditions,
                        });

                        if (result.success) {
                          toast({
                            title: 'Success',
                            description:
                              'Safety preferences updated successfully!',
                          });
                        } else {
                          throw new Error(result.error);
                        }
                      } catch (error) {
                        toast({
                          title: 'Error',
                          description:
                            error instanceof Error
                              ? error.message
                              : 'Failed to update safety preferences',
                          variant: 'destructive',
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="btn btn-warning w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Save Safety Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Phase 1C: Cooking Preferences Section */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title flex items-center">
                  <ChefHat className="mr-2 h-5 w-5 text-primary" />
                  Cooking Preferences
                </h2>
                <p className="text-base-content/60 mb-4 text-sm">
                  Tell us about your cooking style and preferences for better
                  recipe recommendations.
                </p>

                <div className="space-y-4">
                  {/* Preferred Cuisines */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Preferred Cuisines
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'italian',
                        'mexican',
                        'chinese',
                        'indian',
                        'thai',
                        'japanese',
                        'french',
                        'mediterranean',
                        'american',
                        'korean',
                      ].map((cuisine) => (
                        <button
                          key={cuisine}
                          type="button"
                          onClick={() => {
                            if (preferredCuisines.includes(cuisine)) {
                              setPreferredCuisines(
                                preferredCuisines.filter((c) => c !== cuisine)
                              );
                            } else {
                              setPreferredCuisines([
                                ...preferredCuisines,
                                cuisine,
                              ]);
                            }
                          }}
                          className={`btn btn-sm ${preferredCuisines.includes(cuisine) ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {cuisine}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available Equipment */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Available Equipment
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'oven',
                        'stove',
                        'microwave',
                        'air fryer',
                        'instant pot',
                        'slow cooker',
                        'grill',
                        'food processor',
                        'blender',
                      ].map((equipment) => (
                        <button
                          key={equipment}
                          type="button"
                          onClick={() => {
                            if (availableEquipment.includes(equipment)) {
                              setAvailableEquipment(
                                availableEquipment.filter(
                                  (e) => e !== equipment
                                )
                              );
                            } else {
                              setAvailableEquipment([
                                ...availableEquipment,
                                equipment,
                              ]);
                            }
                          }}
                          className={`btn btn-sm ${availableEquipment.includes(equipment) ? 'btn-secondary' : 'btn-outline'}`}
                        >
                          {equipment}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spice Tolerance */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Spice Tolerance
                      </span>
                      <span className="label-text-alt">
                        Level {spiceTolerance}/5
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      className="range range-primary"
                      value={spiceTolerance}
                      onChange={(e) =>
                        setSpiceTolerance(Number(e.target.value))
                      }
                    />
                    <div className="flex w-full justify-between px-2 text-xs">
                      <span>Mild</span>
                      <span>Medium</span>
                      <span>Hot</span>
                      <span>Very Hot</span>
                      <span>Extreme</span>
                    </div>
                  </div>

                  {/* Disliked Ingredients */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Disliked Ingredients
                      </span>
                    </label>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {dislikedIngredients.map((ingredient, index) => (
                        <div key={index} className="badge badge-outline gap-1">
                          {ingredient}
                          <button
                            type="button"
                            onClick={() =>
                              setDislikedIngredients(
                                dislikedIngredients.filter(
                                  (_, i) => i !== index
                                )
                              )
                            }
                            className="btn btn-ghost btn-xs btn-circle"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="input-bordered input w-full"
                      placeholder="Add ingredients you dislike (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !dislikedIngredients.includes(value)) {
                            setDislikedIngredients([
                              ...dislikedIngredients,
                              value,
                            ]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await updateCookingPreferences(user.id, {
                          preferred_cuisines: preferredCuisines,
                          available_equipment: availableEquipment,
                          disliked_ingredients: dislikedIngredients,
                          spice_tolerance: spiceTolerance,
                        });

                        if (result.success) {
                          toast({
                            title: 'Success',
                            description:
                              'Cooking preferences updated successfully!',
                          });
                        } else {
                          throw new Error(result.error);
                        }
                      } catch (error) {
                        toast({
                          title: 'Error',
                          description:
                            error instanceof Error
                              ? error.message
                              : 'Failed to update cooking preferences',
                          variant: 'destructive',
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="btn btn-primary w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <ChefHat className="mr-2 h-4 w-4" />
                        Save Cooking Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Email Section */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Email Address</h2>

                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Current Email</span>
                    </label>
                    <div className="relative">
                      <Mail className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                      <input
                        type="email"
                        className="input-bordered input w-full pl-10"
                        value={currentEmail}
                        disabled
                      />
                    </div>
                  </div>

                  <form onSubmit={handleEmailUpdate} className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">New Email</span>
                      </label>
                      <div className="relative">
                        <Mail className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                        <input
                          type="email"
                          className="input-bordered input w-full pl-10"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter new email"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                      disabled={loading || !newEmail}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Update Email
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Password</h2>

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">New Password</span>
                    </label>
                    <div className="relative">
                      <Lock className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                      <input
                        type="password"
                        className="input-bordered input w-full pl-10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Confirm Password</span>
                    </label>
                    <div className="relative">
                      <Lock className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                      <input
                        type="password"
                        className="input-bordered input w-full pl-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        minLength={6}
                      />
                    </div>
                    <label className="label">
                      <span
                        className={`label-text-alt ${getHelperTextClasses()}`}
                      >
                        Password must be at least 6 characters long
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={
                      loading ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword !== confirmPassword
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

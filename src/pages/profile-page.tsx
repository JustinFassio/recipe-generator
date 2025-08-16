import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/DebugAuthProvider';
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
  User,
  Mail,
  Lock,
  Camera,
  Check,
  X,
  Loader2,
  UserCheck,
  AtSign,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
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

    // Debounce the availability check
    const timeoutId = setTimeout(() => {
      handleUsernameCheck(cleanValue);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile info
      const { success: profileSuccess, error: profileError } =
        await updateProfile({
          full_name: fullName,
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
    <div className="min-h-screen bg-base-100">
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
                      <span className="label-text-alt text-base-content/60">
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
                        minLength={8}
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
                        minLength={8}
                      />
                    </div>
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        Password must be at least 8 characters long
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

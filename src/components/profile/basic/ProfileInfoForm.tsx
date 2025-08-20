import React from 'react';
import {
  SectionCard,
  InlineIconInput,
  RangeWithTicks,
} from '@/components/profile/shared';
import {
  User,
  AtSign,
  MapPin,
  Globe,
  Ruler,
  Clock,
  GraduationCap,
  Check,
  X,
  Loader2,
} from 'lucide-react';

interface ProfileInfoFormProps {
  // Form data
  fullName: string;
  onFullNameChange: (value: string) => void;

  // Username
  username: string;
  onUsernameChange: (value: string) => void;
  usernameAvailable: boolean | null;
  usernameChecking: boolean;
  currentUsername: string | null;

  // Preferences
  region: string;
  onRegionChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  units: string;
  onUnitsChange: (value: string) => void;
  timePerMeal: number;
  onTimePerMealChange: (value: number) => void;
  skillLevel: number;
  onSkillLevelChange: (value: number) => void;

  // Form actions
  onSubmit: (e: React.FormEvent) => Promise<void>;
  submitting: boolean;
  className?: string;
}

const timePerMealLabels = ['15m', '30m', '45m', '60m', '90m+'];
const skillLevelLabels = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
  'Chef',
];

export const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({
  fullName,
  onFullNameChange,
  username,
  onUsernameChange,
  usernameAvailable,
  usernameChecking,
  currentUsername,
  region,
  onRegionChange,
  language,
  onLanguageChange,
  units,
  onUnitsChange,
  timePerMeal,
  onTimePerMealChange,
  skillLevel,
  onSkillLevelChange,
  onSubmit,
  submitting,
  className = '',
}) => {
  return (
    <SectionCard className={className}>
      <h2 className="card-title">Profile Information</h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Full Name</span>
          </label>
          <InlineIconInput
            icon={User}
            value={fullName}
            onChange={onFullNameChange}
            placeholder="Your full name"
          />
        </div>

        {/* Current Username */}
        {currentUsername && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Current Username</span>
            </label>
            <InlineIconInput
              icon={AtSign}
              value={currentUsername}
              onChange={() => {}} // disabled
              disabled={true}
            />
          </div>
        )}

        {/* New Username */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {currentUsername ? 'Change Username' : 'Claim Username'}
            </span>
          </label>
          <div className="relative">
            <AtSign className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            <input
              type="text"
              className={`input-bordered input w-full pl-10 pr-10 ${
                username && usernameAvailable === true
                  ? 'border-success'
                  : username && usernameAvailable === false
                    ? 'border-error'
                    : ''
              }`}
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Choose a unique username"
              pattern="^[a-zA-Z0-9_-]+$"
              minLength={3}
              maxLength={30}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
              {usernameChecking ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : username ? (
                usernameAvailable === true ? (
                  <Check className="h-4 w-4 text-success" />
                ) : usernameAvailable === false ? (
                  <X className="h-4 w-4 text-error" />
                ) : null
              ) : null}
            </div>
          </div>
          {username && (
            <label className="label">
              <span
                className={`label-text-alt ${
                  usernameAvailable === true
                    ? 'text-success'
                    : usernameAvailable === false
                      ? 'text-error'
                      : ''
                }`}
              >
                {usernameChecking
                  ? 'Checking availability...'
                  : usernameAvailable === true
                    ? 'Username is available!'
                    : usernameAvailable === false
                      ? 'Username is not available'
                      : 'Enter 3-30 characters (letters, numbers, _, -)'}
              </span>
            </label>
          )}
        </div>

        {/* Region */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Region</span>
          </label>
          <InlineIconInput
            icon={MapPin}
            value={region}
            onChange={onRegionChange}
            placeholder="e.g., North America, Europe, Asia"
          />
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
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
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
              onChange={(e) => onUnitsChange(e.target.value)}
            >
              <option value="metric">Metric (kg, L, °C)</option>
              <option value="imperial">Imperial (lbs, cups, °F)</option>
            </select>
          </div>
        </div>

        {/* Time Per Meal */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              Time Per Meal: {timePerMealLabels[timePerMeal - 1]}
            </span>
          </label>
          <div className="relative">
            <Clock className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            <div className="pl-10">
              <RangeWithTicks
                value={timePerMeal}
                onChange={onTimePerMealChange}
                min={1}
                max={5}
                ticks={timePerMealLabels}
              />
            </div>
          </div>
        </div>

        {/* Cooking Skill Level */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              Cooking Skill Level: {skillLevelLabels[skillLevel - 1]}
            </span>
          </label>
          <div className="relative">
            <GraduationCap className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            <div className="pl-10">
              <RangeWithTicks
                value={skillLevel}
                onChange={onSkillLevelChange}
                min={1}
                max={5}
                ticks={skillLevelLabels}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`btn btn-primary w-full ${submitting ? 'loading' : ''}`}
          disabled={submitting}
        >
          {submitting ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </SectionCard>
  );
};

import React from 'react';
import {
  SectionCard,
  InlineIconInput,
  ValueSlider,
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
import {
  NORTH_AMERICAN_COUNTRIES,
  getStatesProvincesByCountry,
  getCitiesByStateProvince,
} from '@/lib/geographic-data';

// Username validation constant
const USERNAME_PATTERN = '^[a-z0-9_]+$';

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

  // Geographic preferences
  country: string;
  onCountryChange: (value: string) => void;
  stateProvince: string;
  onStateProvinceChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  region: string; // Legacy field
  onRegionChange: (value: string) => void;

  // Other preferences
  language: string;
  onLanguageChange: (value: string) => void;
  units: string;
  onUnitsChange: (value: string) => void;
  timePerMeal: number;
  onTimePerMealChange: (value: number) => void;
  skillLevel: string;
  onSkillLevelChange: (value: string) => void;

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
  country,
  onCountryChange,
  stateProvince,
  onStateProvinceChange,
  city,
  onCityChange,
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
  // Debug logging for currentUsername
  console.log('🎯 ProfileInfoForm received currentUsername:', currentUsername);
  console.log(
    '🎯 ProfileInfoForm will show "Current Username":',
    !!currentUsername
  );
  console.log(
    '🎯 ProfileInfoForm will show "Claim Username":',
    !currentUsername
  );

  // Full Name validation helpers
  const isFullNameTooLong = fullName.length > 80;
  const isFullNameOnlySpaces =
    fullName.trim().length === 0 && fullName.length > 0;

  // Get available states/provinces and cities based on selected country
  const availableStatesProvinces = getStatesProvincesByCountry(country);
  const availableCities = getCitiesByStateProvince(stateProvince);
  return (
    <SectionCard className={className}>
      <h2 className="card-title">Profile Information</h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Full Name</span>
            <span className="label-text-alt text-base-content/60">
              {fullName.length}/80
            </span>
          </label>
          <InlineIconInput
            icon={User}
            value={fullName}
            onChange={onFullNameChange}
            placeholder="Your full name"
            maxLength={80}
            className={
              isFullNameTooLong || isFullNameOnlySpaces ? 'border-error' : ''
            }
          />
          {isFullNameTooLong && (
            <label className="label">
              <span className="label-text-alt text-error">
                Full name must be 80 characters or less
              </span>
            </label>
          )}
          {isFullNameOnlySpaces && (
            <label className="label">
              <span className="label-text-alt text-warning">
                Full name cannot be only spaces
              </span>
            </label>
          )}
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
            <AtSign className="text-base-content/40 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <input
              type="text"
              className={`input-bordered input w-full pr-10 pl-10 ${
                username && usernameAvailable === true
                  ? 'border-success'
                  : username && usernameAvailable === false
                    ? 'border-error'
                    : ''
              }`}
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Choose a unique username"
              pattern={USERNAME_PATTERN}
              minLength={3}
              maxLength={24}
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
              {usernameChecking ? (
                <Loader2 className="text-primary h-4 w-4 animate-spin" />
              ) : username ? (
                usernameAvailable === true ? (
                  <Check className="text-success h-4 w-4" />
                ) : usernameAvailable === false ? (
                  <X className="text-error h-4 w-4" />
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
                      : 'Enter 3-24 characters (lowercase letters, numbers, _)'}
              </span>
            </label>
          )}
        </div>

        {/* Geographic Location */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-base-content">Location</h3>

          {/* Country */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Country</span>
            </label>
            <div className="relative">
              <Globe className="text-base-content/40 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <select
                className="select-bordered select w-full pl-10"
                value={country}
                onChange={(e) => onCountryChange(e.target.value)}
                aria-label="Country"
              >
                <option value="">Select a country</option>
                {NORTH_AMERICAN_COUNTRIES.map((countryOption) => (
                  <option key={countryOption.value} value={countryOption.value}>
                    {countryOption.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                Select your country for localized recipe recommendations
              </span>
            </label>
          </div>

          {/* State/Province */}
          {country && availableStatesProvinces.length > 0 && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {country === 'United States'
                    ? 'State'
                    : country === 'Canada'
                      ? 'Province/Territory'
                      : country === 'Mexico'
                        ? 'State'
                        : 'State/Province'}
                </span>
              </label>
              <div className="relative">
                <MapPin className="text-base-content/40 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <select
                  className="select-bordered select w-full pl-10"
                  value={stateProvince}
                  onChange={(e) => onStateProvinceChange(e.target.value)}
                  aria-label="State or Province"
                >
                  <option value="">
                    Select{' '}
                    {country === 'United States'
                      ? 'state'
                      : country === 'Canada'
                        ? 'province/territory'
                        : country === 'Mexico'
                          ? 'state'
                          : 'state/province'}
                  </option>
                  {availableStatesProvinces.map((stateProvinceOption) => (
                    <option
                      key={stateProvinceOption.value}
                      value={stateProvinceOption.value}
                    >
                      {stateProvinceOption.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* City */}
          {stateProvince && availableCities.length > 0 && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">City</span>
              </label>
              <div className="relative">
                <MapPin className="text-base-content/40 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <select
                  className="select-bordered select w-full pl-10"
                  value={city}
                  onChange={(e) => onCityChange(e.target.value)}
                  aria-label="City"
                >
                  <option value="">Select a city</option>
                  {availableCities.map((cityOption) => (
                    <option key={cityOption} value={cityOption}>
                      {cityOption}
                    </option>
                  ))}
                </select>
              </div>
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Select your city for hyper-local recipe recommendations
                </span>
              </label>
            </div>
          )}

          {/* Legacy Region Field (Hidden but maintained for backward compatibility) */}
          <div className="form-control" style={{ display: 'none' }}>
            <label className="label">
              <span className="label-text">Region (Legacy)</span>
            </label>
            <InlineIconInput
              icon={MapPin}
              value={region}
              onChange={onRegionChange}
              placeholder="Legacy region field"
            />
          </div>
        </div>

        {/* Language */}
        <div className="form-control">
          <label className="label" htmlFor="language-select">
            <span className="label-text">Language</span>
          </label>
          <div className="relative">
            <Globe className="text-base-content/40 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <select
              id="language-select"
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
          <label className="label" htmlFor="units-select">
            <span className="label-text">Measurement Units</span>
          </label>
          <div className="relative">
            <Ruler className="text-base-content/40 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <select
              id="units-select"
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
            <span className="label-text flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Average Time Per Meal
            </span>
          </label>
          <ValueSlider
            value={timePerMeal}
            onChange={onTimePerMealChange}
            min={1}
            max={5}
            valueFormatter={(value) => timePerMealLabels[value - 1]}
            className="w-full"
          />
        </div>

        {/* Cooking Skill Level */}
        <div className="form-control">
          <label className="label">
            <span className="label-text flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Cooking Skill Level
            </span>
          </label>
          <ValueSlider
            value={Number(skillLevel)}
            onChange={(value) => onSkillLevelChange(value.toString())}
            min={1}
            max={5}
            valueFormatter={(value) => skillLevelLabels[value - 1]}
            className="w-full"
          />
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

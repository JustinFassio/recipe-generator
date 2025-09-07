import React from 'react';
import { SectionCard } from '@/components/profile/shared';
import { getHelperTextClasses } from '@/lib/text-wrapping-migration';

interface BioCardProps {
  bio: string;
  onChange: (value: string) => void;
  onSave: () => Promise<void>;
  loading: boolean;
  className?: string;
}

export const BioCard: React.FC<BioCardProps> = ({
  bio,
  onChange,
  onSave,
  loading,
  className = '',
}) => {
  return (
    <SectionCard className={className}>
      <h2 className="card-title">About Me</h2>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Bio</span>
          <span
            className={`label-text-alt ${
              bio.length > 480
                ? 'text-error'
                : bio.length > 400
                  ? 'text-warning'
                  : 'text-base-content/60'
            }`}
          >
            {bio.length}/500
          </span>
        </label>
        <textarea
          className="textarea-bordered textarea w-full"
          value={bio}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tell us a bit about yourself, your cooking interests, or dietary preferences..."
          rows={4}
          maxLength={500}
        />
        <label className="label">
          <span className={`label-text-alt ${getHelperTextClasses()}`}>
            Share your cooking style, favorite cuisines, or any other details
            that help personalize your recipe recommendations.
          </span>
        </label>
      </div>
      <button
        type="button"
        className={`btn btn-primary ${loading ? 'loading' : ''}`}
        onClick={onSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Bio'}
      </button>
    </SectionCard>
  );
};

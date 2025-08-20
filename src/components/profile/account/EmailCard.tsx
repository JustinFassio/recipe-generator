import React from 'react';
import { SectionCard, InlineIconInput } from '@/components/profile/shared';
import { Mail } from 'lucide-react';

interface EmailCardProps {
  currentEmail: string;
  newEmail: string;
  onNewEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  className?: string;
}

export const EmailCard: React.FC<EmailCardProps> = ({
  currentEmail,
  newEmail,
  onNewEmailChange,
  onSubmit,
  loading,
  className = '',
}) => {
  return (
    <SectionCard className={className}>
      <h2 className="card-title">Email Address</h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Current Email */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Current Email</span>
          </label>
          <InlineIconInput
            icon={Mail}
            value={currentEmail}
            onChange={() => {}} // disabled
            disabled={true}
          />
        </div>

        {/* New Email */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">New Email</span>
          </label>
          <InlineIconInput
            icon={Mail}
            type="email"
            value={newEmail}
            onChange={onNewEmailChange}
            placeholder="Enter new email address"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
          disabled={loading || !newEmail.trim()}
        >
          {loading ? 'Updating...' : 'Update Email'}
        </button>
      </form>
    </SectionCard>
  );
};

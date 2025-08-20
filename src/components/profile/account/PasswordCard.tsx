import React from 'react';
import { SectionCard, InlineIconInput } from '@/components/profile/shared';
import { Lock } from 'lucide-react';

interface PasswordCardProps {
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  className?: string;
}

export const PasswordCard: React.FC<PasswordCardProps> = ({
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  onSubmit,
  loading,
  className = '',
}) => {
  const passwordsMatch = newPassword === confirmPassword;
  const isValid = newPassword.length >= 6 && passwordsMatch;

  return (
    <SectionCard className={className}>
      <h2 className="card-title">Password</h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* New Password */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">New Password</span>
          </label>
          <InlineIconInput
            icon={Lock}
            type="password"
            value={newPassword}
            onChange={onNewPasswordChange}
            placeholder="Enter new password"
            minLength={6}
          />
        </div>

        {/* Confirm Password */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Confirm Password</span>
          </label>
          <InlineIconInput
            icon={Lock}
            type="password"
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            placeholder="Confirm new password"
            className={confirmPassword && !passwordsMatch ? 'border-error' : ''}
          />
          {confirmPassword && !passwordsMatch && (
            <label className="label">
              <span className="label-text-alt text-error">
                Passwords do not match
              </span>
            </label>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
          disabled={loading || !isValid}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </SectionCard>
  );
};

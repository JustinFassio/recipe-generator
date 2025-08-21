import React, { useRef, useId } from 'react';
import { SectionCard } from '@/components/profile/shared';
import { User, Camera, Loader2 } from 'lucide-react';

interface AvatarCardProps {
  avatarUrl: string | null;
  loading: boolean;
  onUpload: (file: File) => Promise<void>;
  className?: string;
}

export const AvatarCard: React.FC<AvatarCardProps> = ({
  avatarUrl,
  loading,
  onUpload,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const statusId = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await onUpload(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <SectionCard className={className}>
      <h2 className="card-title">Profile Picture</h2>

      <div className="flex flex-col items-center space-y-4">
        <div className="avatar" role="img" aria-describedby={statusId}>
          <div className="h-24 w-24 rounded-full">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Your profile picture"
                className="object-cover"
              />
            ) : (
              <div
                className="flex items-center justify-center bg-primary/20"
                aria-label="Default profile picture placeholder"
              >
                <User className="h-12 w-12 text-primary" aria-hidden="true" />
              </div>
            )}
            {loading && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50"
                aria-label="Uploading profile picture"
              >
                <Loader2
                  className="h-6 w-6 animate-spin text-white"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
        </div>

        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload profile picture"
        />

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleButtonClick}
          disabled={loading}
          aria-describedby={statusId}
        >
          <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
          {loading ? 'Uploading...' : 'Change Photo'}
        </button>

        <div id={statusId} className="sr-only" aria-live="polite">
          {loading
            ? 'Uploading profile picture, please wait...'
            : avatarUrl
              ? 'Profile picture uploaded successfully'
              : 'No profile picture set'}
        </div>
      </div>
    </SectionCard>
  );
};

import React, { useRef } from 'react';
import { User, Camera, Loader2 } from 'lucide-react';
import { SectionCard } from '@/components/profile/shared';

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
        <div className="avatar">
          <div className="h-24 w-24 rounded-full">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" />
            ) : (
              <div className="flex items-center justify-center bg-primary/20">
                <User className="h-12 w-12 text-primary" />
              </div>
            )}
            {loading && (
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
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleButtonClick}
          disabled={loading}
        >
          <Camera className="mr-2 h-4 w-4" />
          {loading ? 'Uploading...' : 'Change Photo'}
        </button>
      </div>
    </SectionCard>
  );
};

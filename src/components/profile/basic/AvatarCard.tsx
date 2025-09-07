import React, { useRef, useEffect } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { SectionCard } from '@/components/profile/shared';
import { ProgressiveAvatar } from '@/components/shared/ProgressiveImage';
import { useAdvancedAvatarCache } from '@/lib/avatar-cache-advanced';
import { useAvatarAnalytics } from '@/lib/avatar-analytics';
import { useAuth } from '@/contexts/AuthProvider';

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
  const { preloadAvatar, isAvatarCached } = useAdvancedAvatarCache();
  const { trackView } = useAvatarAnalytics();
  const { user } = useAuth();

  // Preload avatar when component mounts with analytics tracking
  useEffect(() => {
    if (avatarUrl) {
      const startTime = performance.now();
      const cacheHit = isAvatarCached(avatarUrl, 'large');

      preloadAvatar(avatarUrl, 'large').then(() => {
        const loadTime = performance.now() - startTime;

        // Track avatar view with performance metrics
        trackView({
          userId: user?.id || 'anonymous',
          avatarUrl,
          size: 'large',
          loadTime,
          cacheHit,
        });
      });
    }
  }, [avatarUrl, preloadAvatar, isAvatarCached, trackView, user?.id]);

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
        <div className="relative">
          <ProgressiveAvatar
            src={avatarUrl}
            alt="Profile picture"
            size="xlarge"
            fallbackText="User"
            priority={true}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
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

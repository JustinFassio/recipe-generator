import React, { useState, useCallback } from 'react';
import { User } from 'lucide-react';
import { getOptimizedAvatarUrl, type AvatarSizeKey } from '@/lib/avatar-utils';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: AvatarSizeKey | number;
  fallbackText?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
  showFallback?: boolean;
  priority?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'medium',
  fallbackText,
  className = '',
  loading = 'lazy',
  onClick,
  showFallback = true,
  priority = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Handle successful image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Get size dimensions
  const getSizeClasses = () => {
    if (typeof size === 'number') {
      return `w-${size} h-${size}`;
    }

    const sizeMap = {
      small: 'w-8 h-8',
      medium: 'w-12 h-12',
      large: 'w-16 h-16',
      xlarge: 'w-24 h-24',
    };

    return sizeMap[size];
  };

  // Get optimized image URL
  const getImageUrl = () => {
    if (!src || imageError) return null;

    const sizeKey = typeof size === 'number' ? 'medium' : size;
    return getOptimizedAvatarUrl(src, sizeKey);
  };

  // Generate fallback content
  const getFallbackContent = () => {
    if (fallbackText) {
      const initials = fallbackText
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="bg-primary/20 flex items-center justify-center text-primary font-semibold">
          {initials}
        </div>
      );
    }

    return (
      <div className="bg-primary/20 flex items-center justify-center">
        <User className="text-primary" />
      </div>
    );
  };

  const imageUrl = getImageUrl();
  const sizeClasses = getSizeClasses();
  const isClickable = !!onClick;

  return (
    <div
      className={`
        avatar relative overflow-hidden rounded-full
        ${sizeClasses}
        ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {imageUrl && !imageError ? (
        <>
          {/* Low-quality placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          {/* Main image */}
          <img
            src={imageUrl}
            alt={alt}
            loading={priority ? 'eager' : loading}
            decoding="async"
            className={`
              w-full h-full object-cover transition-opacity duration-300
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      ) : (
        showFallback && getFallbackContent()
      )}
    </div>
  );
};

// Preset Avatar sizes for common use cases
export const AvatarSizes = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
  '2xl': 96,
  '3xl': 128,
} as const;

// Convenience components for specific use cases
export const ProfileAvatar: React.FC<
  Omit<AvatarProps, 'size'> & { size?: 'sm' | 'md' | 'lg' | 'xl' }
> = ({ size = 'lg', ...props }) => {
  const sizeMap = {
    sm: 'medium' as AvatarSizeKey,
    md: 'large' as AvatarSizeKey,
    lg: 'xlarge' as AvatarSizeKey,
    xl: 'xlarge' as AvatarSizeKey,
  };

  return <Avatar size={sizeMap[size]} {...props} />;
};

export const ChatAvatar: React.FC<Omit<AvatarProps, 'size'>> = (props) => (
  <Avatar size="medium" {...props} />
);

export const NavbarAvatar: React.FC<Omit<AvatarProps, 'size'>> = (props) => (
  <Avatar size="small" {...props} />
);

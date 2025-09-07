import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface ProgressiveImageProps {
  src: string;
  placeholder?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  blurDataURL?: string;
  priority?: boolean;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholder,
  alt,
  className = '',
  loading = 'lazy',
  onLoad,
  onError,
  blurDataURL,
  priority = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when src changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setShowPlaceholder(true);
  }, [src]);

  // Handle successful image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setShowPlaceholder(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageError(true);
    setShowPlaceholder(false);
    onError?.();
  }, [onError]);

  // Generate a simple blur placeholder if none provided
  const generateBlurPlaceholder = useCallback(
    (width: number = 400, height: number = 400) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Create a simple gradient blur
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#f3f4f6');
        gradient.addColorStop(1, '#e5e7eb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      return canvas.toDataURL('image/jpeg', 0.1);
    },
    []
  );

  // Get placeholder source
  const getPlaceholderSrc = useCallback(() => {
    if (blurDataURL) return blurDataURL;
    if (placeholder) return placeholder;
    return generateBlurPlaceholder();
  }, [blurDataURL, placeholder, generateBlurPlaceholder]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'lazy' && imgRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
              observer.unobserve(img);
            }
          });
        },
        { rootMargin: '50px' }
      );

      observer.observe(imgRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [loading]);

  if (imageError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
      >
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Blur Image */}
      {showPlaceholder && (
        <img
          src={getPlaceholderSrc()}
          alt=""
          className={`
            absolute inset-0 w-full h-full object-cover
            transition-opacity duration-500
            ${imageLoaded ? 'opacity-0' : 'opacity-100'}
          `}
          style={{
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Main Image */}
      <img
        ref={imgRef}
        src={loading === 'lazy' ? undefined : src}
        data-src={loading === 'lazy' ? src : undefined}
        alt={alt}
        loading={priority ? 'eager' : loading}
        decoding="async"
        className={`
          w-full h-full object-cover
          transition-opacity duration-500
          ${imageLoaded ? 'opacity-100' : 'opacity-0'}
        `}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Loading Spinner */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

// Specialized component for avatars with progressive loading
export const ProgressiveAvatar: React.FC<{
  src: string | null;
  alt: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  fallbackText?: string;
  priority?: boolean;
}> = ({
  src,
  alt,
  size = 'medium',
  className = '',
  fallbackText,
  priority = false,
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24',
  };

  if (!src) {
    return (
      <div className={`avatar ${sizeClasses[size]} ${className}`}>
        <div className="bg-primary/20 flex items-center justify-center rounded-full w-full h-full">
          {fallbackText ? (
            <span className="text-primary font-semibold text-sm">
              {fallbackText
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          ) : (
            <svg
              className="w-4 h-4 text-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`avatar ${sizeClasses[size]} ${className}`}>
      <ProgressiveImage
        src={src}
        alt={alt}
        className="rounded-full"
        priority={priority}
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      />
    </div>
  );
};

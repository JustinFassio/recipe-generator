/**
 * Avatar Utilities
 *
 * Provides utilities for generating optimized avatar URLs with image transformation
 * and fallback handling.
 */

export interface AvatarSize {
  width: number;
  height: number;
}

export const AVATAR_SIZES = {
  small: { width: 64, height: 64 },
  medium: { width: 96, height: 96 },
  large: { width: 128, height: 128 },
  xlarge: { width: 256, height: 256 },
} as const;

export type AvatarSizeKey = keyof typeof AVATAR_SIZES;

/**
 * Generate an optimized avatar URL with image transformation
 */
export function getOptimizedAvatarUrl(
  avatarUrl: string | null,
  size: AvatarSizeKey = 'medium'
): string | null {
  if (!avatarUrl) return null;

  // If it's already a transformed URL, return as-is
  if (avatarUrl.includes('?')) {
    return avatarUrl;
  }

  const { width, height } = AVATAR_SIZES[size];

  // Generate transformed URL with Supabase Image Transformation
  const transformedUrl = `${avatarUrl}?width=${width}&height=${height}&resize=cover&format=webp&quality=80`;

  return transformedUrl;
}

/**
 * Generate multiple avatar URLs for different sizes (for responsive images)
 */
export function getResponsiveAvatarUrls(avatarUrl: string | null): {
  small: string | null;
  medium: string | null;
  large: string | null;
  xlarge: string | null;
} {
  if (!avatarUrl) {
    return {
      small: null,
      medium: null,
      large: null,
      xlarge: null,
    };
  }

  return {
    small: getOptimizedAvatarUrl(avatarUrl, 'small'),
    medium: getOptimizedAvatarUrl(avatarUrl, 'medium'),
    large: getOptimizedAvatarUrl(avatarUrl, 'large'),
    xlarge: getOptimizedAvatarUrl(avatarUrl, 'xlarge'),
  };
}

/**
 * Get the best avatar URL for a given container size
 */
export function getBestAvatarUrl(
  avatarUrl: string | null,
  containerSize: number
): string | null {
  if (!avatarUrl) return null;

  // Determine the best size based on container size
  let sizeKey: AvatarSizeKey = 'medium';

  if (containerSize <= 64) {
    sizeKey = 'small';
  } else if (containerSize <= 96) {
    sizeKey = 'medium';
  } else if (containerSize <= 128) {
    sizeKey = 'large';
  } else {
    sizeKey = 'xlarge';
  }

  return getOptimizedAvatarUrl(avatarUrl, sizeKey);
}

/**
 * Check if an avatar URL is valid and accessible
 */
export async function validateAvatarUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate a fallback avatar URL with user initials
 */
export function generateFallbackAvatarUrl(
  name: string,
  size: AvatarSizeKey = 'medium'
): string {
  const initials = name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const { width, height } = AVATAR_SIZES[size];

  // Generate a simple SVG avatar with initials
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#6366f1"/>
      <text x="50%" y="50%" font-family="system-ui, sans-serif" font-size="${Math.floor(width * 0.4)}" 
            font-weight="bold" fill="white" text-anchor="middle" dy="0.35em">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

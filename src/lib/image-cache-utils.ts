/**
 * Utility functions for smart image caching and cache invalidation
 */

import { FALLBACK_IMAGE_PATH } from '@/lib/constants';

/**
 * Generates an optimized image URL with selective cache-busting
 * Only adds cache-busting parameters for Supabase storage URLs and recently updated content
 * External URLs (like DALL-E) are returned as-is to avoid 403 errors
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  updatedAt: string,
  createdAt: string,
  cacheBustWindowHours: number = 24
): string {
  // Don't apply cache-busting to external URLs (DALL-E, etc.)
  // These URLs don't support query parameters and will return 403
  if (!isSupabaseStorageUrl(imageUrl)) {
    return imageUrl;
  }

  const lastModified = new Date(updatedAt || createdAt);
  const now = new Date();
  const hoursSinceUpdate =
    (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60);

  // Only add cache-busting if content was updated recently
  return hoursSinceUpdate < cacheBustWindowHours
    ? `${imageUrl}?v=${lastModified.getTime()}`
    : imageUrl;
}

/**
 * Check if the URL is a Supabase storage URL that supports cache-busting
 */
function isSupabaseStorageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Check if it's a Supabase storage URL (contains supabase domain and storage path)
    return (
      urlObj.hostname.includes('supabase') ||
      urlObj.pathname.includes('/storage/v1/object/public/') ||
      urlObj.pathname.includes('/storage/v1/object/sign/')
    );
  } catch {
    return false;
  }
}

/**
 * Alternative implementation for when we have a dedicated image_updated_at field
 * This would be the ideal solution with proper database schema
 */
export function getOptimizedImageUrlWithImageTimestamp(
  imageUrl: string,
  imageUpdatedAt?: string | null
): string {
  return imageUpdatedAt
    ? `${imageUrl}?v=${new Date(imageUpdatedAt).getTime()}`
    : imageUrl;
}

/**
 * Check if an image URL is likely to be expired or cause 403 errors
 */
export function isLikelyExpiredUrl(url: string): boolean {
  try {
    // Check for URLs with expiration timestamps in the query string
    if (url.includes('se=') && url.includes('st=')) {
      try {
        const urlObj = new URL(url);
        const expiresParam = urlObj.searchParams.get('se');
        if (expiresParam) {
          const expiresTime = new Date(expiresParam);
          const now = new Date();
          return now.getTime() >= expiresTime.getTime();
        }
      } catch {
        // If we can't parse the expiration, DON'T assume it's expired
        // Only return true if we're CERTAIN it's expired
        return false;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get a safe image URL with fallback handling
 */
export function getSafeImageUrl(
  imageUrl: string,
  updatedAt: string,
  createdAt: string,
  fallbackUrl?: string
): string {
  // If the image_url is already the fallback logo, return it as-is
  if (imageUrl === FALLBACK_IMAGE_PATH || imageUrl === fallbackUrl) {
    return imageUrl;
  }

  // If URL is likely expired (for DALL-E URLs or expired Azure blob URLs), return fallback or default fallback
  if (isLikelyExpiredUrl(imageUrl)) {
    return fallbackUrl || FALLBACK_IMAGE_PATH;
  }

  // For all other URLs (including external URLs like Unsplash), apply cache-busting
  const optimizedUrl = getOptimizedImageUrl(imageUrl, updatedAt, createdAt);
  return optimizedUrl;
}

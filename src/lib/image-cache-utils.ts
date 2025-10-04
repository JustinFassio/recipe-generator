/**
 * Utility functions for smart image caching and cache invalidation
 */

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
    // Check for expired DALL-E URLs
    if (url.includes('oaidalleapiprodscus.blob.core.windows.net')) {
      return true;
    }

    // Check for other temporary URLs that might expire
    if (url.includes('blob.core.windows.net') && !url.includes('supabase')) {
      return true;
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
  // If URL is likely expired, return fallback or null
  if (isLikelyExpiredUrl(imageUrl)) {
    return fallbackUrl || '';
  }

  // Otherwise, return optimized URL
  return getOptimizedImageUrl(imageUrl, updatedAt, createdAt);
}

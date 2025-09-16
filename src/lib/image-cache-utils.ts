/**
 * Utility functions for smart image caching and cache invalidation
 */

/**
 * Generates an optimized image URL with selective cache-busting
 * Only adds cache-busting parameters for recently updated content
 * to balance fresh content with effective caching
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  updatedAt: string,
  createdAt: string,
  cacheBustWindowHours: number = 24
): string {
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

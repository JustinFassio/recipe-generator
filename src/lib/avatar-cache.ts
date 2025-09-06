import { useCallback } from 'react';

/**
 * Avatar Caching System
 *
 * Provides intelligent caching for avatar images to improve performance
 * and reduce redundant network requests.
 */

interface CachedAvatar {
  url: string;
  timestamp: number;
  size: string;
  blob?: Blob;
}

interface CacheConfig {
  maxAge: number; // in milliseconds
  maxEntries: number;
  enableBlobCache: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxEntries: 100,
  enableBlobCache: true,
};

class AvatarCache {
  private cache = new Map<string, CachedAvatar>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate cache key for avatar
   */
  private getCacheKey(originalUrl: string, size: string): string {
    return `${originalUrl}:${size}`;
  }

  /**
   * Check if avatar is cached and still valid
   */
  isCached(originalUrl: string, size: string): boolean {
    const key = this.getCacheKey(originalUrl, size);
    const cached = this.cache.get(key);

    if (!cached) return false;

    // Check if cache entry is still valid
    const isExpired = Date.now() - cached.timestamp > this.config.maxAge;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cached avatar URL or blob
   */
  getCached(originalUrl: string, size: string): string | Blob | null {
    const key = this.getCacheKey(originalUrl, size);
    const cached = this.cache.get(key);

    if (!cached || Date.now() - cached.timestamp > this.config.maxAge) {
      return null;
    }

    return cached.blob || cached.url;
  }

  /**
   * Cache avatar data
   */
  setCached(originalUrl: string, size: string, url: string, blob?: Blob): void {
    const key = this.getCacheKey(originalUrl, size);

    // Clean up old entries if cache is full
    if (this.cache.size >= this.config.maxEntries) {
      this.cleanup();
    }

    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      size,
      blob: this.config.enableBlobCache ? blob : undefined,
    });
  }

  /**
   * Preload avatar image
   */
  async preloadAvatar(originalUrl: string, size: string): Promise<void> {
    if (this.isCached(originalUrl, size)) {
      return;
    }

    try {
      const optimizedUrl = this.getOptimizedUrl(originalUrl, size);

      if (this.config.enableBlobCache) {
        // Fetch and cache as blob
        const response = await fetch(optimizedUrl);
        if (response.ok) {
          const blob = await response.blob();
          this.setCached(originalUrl, size, optimizedUrl, blob);
        }
      } else {
        // Just cache the URL
        this.setCached(originalUrl, size, optimizedUrl);
      }
    } catch (error) {
      console.warn('Failed to preload avatar:', error);
    }
  }

  /**
   * Get optimized URL for avatar
   */
  private getOptimizedUrl(originalUrl: string, size: string): string {
    // This would integrate with your avatar-utils.ts
    // For now, return the original URL with size parameters
    const sizeMap: Record<string, number> = {
      small: 64,
      medium: 96,
      large: 128,
      xlarge: 256,
    };

    const width = sizeMap[size] || 96;
    return `${originalUrl}?width=${width}&height=${width}&resize=cover&format=webp&quality=80`;
  }

  /**
   * Clean up expired and old cache entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > this.config.maxAge) {
        this.cache.delete(key);
      }
    });

    // If still over limit, remove oldest entries
    if (this.cache.size >= this.config.maxEntries) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      const toRemove = sortedEntries.slice(
        0,
        this.cache.size - this.config.maxEntries + 1
      );
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Clear all cached avatars
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxEntries: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      hitRate: 0, // Would need to track hits/misses for accurate hit rate
    };
  }
}

// Global avatar cache instance
export const avatarCache = new AvatarCache();

/**
 * Hook for avatar caching
 */
export function useAvatarCache() {
  const preloadAvatar = useCallback(async (url: string, size: string) => {
    await avatarCache.preloadAvatar(url, size);
  }, []);

  const getCachedAvatar = useCallback((url: string, size: string) => {
    return avatarCache.getCached(url, size);
  }, []);

  const isAvatarCached = useCallback((url: string, size: string) => {
    return avatarCache.isCached(url, size);
  }, []);

  return {
    preloadAvatar,
    getCachedAvatar,
    isAvatarCached,
    clearCache: () => avatarCache.clear(),
    getStats: () => avatarCache.getStats(),
  };
}

/**
 * Preload avatars for a list of users
 */
export async function preloadUserAvatars(
  users: Array<{ avatar_url?: string | null; id: string }>,
  size: string = 'medium'
): Promise<void> {
  const preloadPromises = users
    .filter((user) => user.avatar_url)
    .map((user) => avatarCache.preloadAvatar(user.avatar_url!, size));

  await Promise.allSettled(preloadPromises);
}

/**
 * Advanced Avatar Caching System
 *
 * Provides intelligent caching with service worker support, cache warming,
 * invalidation strategies, and offline capabilities.
 */

import { getOptimizedAvatarUrl, type AvatarSizeKey } from './avatar-utils';

interface CacheEntry {
  url: string;
  timestamp: number;
  size: string;
  blob?: Blob;
  etag?: string;
  lastModified?: string;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxAge: number;
  maxEntries: number;
  enableBlobCache: boolean;
  enableServiceWorker: boolean;
  enableCacheWarming: boolean;
  warmupThreshold: number; // Number of accesses before warming
}

interface CacheStats {
  size: number;
  maxEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  averageAccessTime: number;
  cacheEfficiency: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 10 * 60 * 1000, // 10 minutes
  maxEntries: 200,
  enableBlobCache: true,
  enableServiceWorker: true,
  enableCacheWarming: true,
  warmupThreshold: 3,
};

class AdvancedAvatarCache {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    totalAccessTime: 0,
    accessCount: 0,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeServiceWorker();
  }

  /**
   * Initialize service worker for offline caching
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!this.config.enableServiceWorker || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration =
        await navigator.serviceWorker.register('/sw-avatar.js');
      console.log('Avatar cache service worker registered:', registration);
    } catch (error) {
      console.warn('Failed to register avatar cache service worker:', error);
    }
  }

  /**
   * Generate cache key with versioning
   */
  private getCacheKey(
    originalUrl: string,
    size: string,
    version?: string
  ): string {
    const baseKey = `${originalUrl}:${size}`;
    return version ? `${baseKey}:${version}` : baseKey;
  }

  /**
   * Check if entry is cached and valid
   */
  isCached(originalUrl: string, size: string): boolean {
    const key = this.getCacheKey(originalUrl, size);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return false;
    }

    const isExpired = Date.now() - entry.timestamp > this.config.maxAge;
    if (isExpired) {
      this.cache.delete(key);
      this.stats.misses++;
      return false;
    }

    this.stats.hits++;
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    return true;
  }

  /**
   * Get cached avatar with performance tracking
   */
  getCached(originalUrl: string, size: string): string | Blob | null {
    const startTime = performance.now();
    const key = this.getCacheKey(originalUrl, size);
    const entry = this.cache.get(key);

    if (!entry || Date.now() - entry.timestamp > this.config.maxAge) {
      this.stats.misses++;
      this.stats.totalAccessTime += performance.now() - startTime;
      this.stats.accessCount++;
      return null;
    }

    this.stats.hits++;
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.totalAccessTime += performance.now() - startTime;
    this.stats.accessCount++;

    return entry.blob || entry.url;
  }

  /**
   * Cache avatar with enhanced metadata
   */
  setCached(
    originalUrl: string,
    size: string,
    url: string,
    blob?: Blob,
    etag?: string,
    lastModified?: string
  ): void {
    const key = this.getCacheKey(originalUrl, size);

    // Clean up if cache is full
    if (this.cache.size >= this.config.maxEntries) {
      this.cleanup();
    }

    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      size,
      blob: this.config.enableBlobCache ? blob : undefined,
      etag,
      lastModified,
      accessCount: 1,
      lastAccessed: Date.now(),
    });

    // Trigger cache warming if enabled
    if (this.config.enableCacheWarming) {
      this.warmupRelatedSizes(originalUrl, size);
    }
  }

  /**
   * Preload avatar with retry mechanism
   */
  async preloadAvatar(
    originalUrl: string,
    size: string,
    retries = 3
  ): Promise<void> {
    if (this.isCached(originalUrl, size)) {
      return;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const optimizedUrl = getOptimizedAvatarUrl(
          originalUrl,
          size as AvatarSizeKey
        );

        if (!optimizedUrl) {
          throw new Error('Failed to generate optimized URL');
        }

        if (this.config.enableBlobCache) {
          const response = await fetch(optimizedUrl, {
            headers: {
              'Cache-Control': 'max-age=3600',
            },
          });

          if (response.ok) {
            const blob = await response.blob();
            const etag = response.headers?.get('etag');
            const lastModified = response.headers?.get('last-modified');

            this.setCached(
              originalUrl,
              size,
              optimizedUrl,
              blob,
              etag || undefined,
              lastModified || undefined
            );
            return;
          }
        } else {
          this.setCached(originalUrl, size, optimizedUrl);
          return;
        }
      } catch (error) {
        console.warn(`Avatar preload attempt ${attempt} failed:`, error);
        if (attempt === retries) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Warm up related avatar sizes
   */
  private async warmupRelatedSizes(
    originalUrl: string,
    currentSize: string
  ): Promise<void> {
    const sizes: AvatarSizeKey[] = ['small', 'medium', 'large', 'xlarge'];
    const currentSizeIndex = sizes.indexOf(currentSize as AvatarSizeKey);

    // Preload adjacent sizes
    const adjacentSizes = [
      sizes[currentSizeIndex - 1],
      sizes[currentSizeIndex + 1],
    ].filter(Boolean);

    const warmupPromises = adjacentSizes.map((size) =>
      this.preloadAvatar(originalUrl, size).catch(() => {
        // Silently fail for warmup
      })
    );

    await Promise.allSettled(warmupPromises);
  }

  /**
   * Invalidate cache for specific user
   */
  invalidateUserAvatars(userId: string): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.url.includes(`/${userId}/`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Invalidate cache for specific avatar URL
   */
  invalidateAvatar(originalUrl: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(originalUrl)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Advanced cleanup with LRU strategy
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > this.config.maxAge) {
        this.cache.delete(key);
      }
    });

    // If still over limit, use LRU strategy
    if (this.cache.size >= this.config.maxEntries) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort(([, a], [, b]) => {
          // Sort by last accessed time (LRU)
          return a.lastAccessed - b.lastAccessed;
        });

      const toRemove = sortedEntries.slice(
        0,
        this.cache.size - this.config.maxEntries + 1
      );

      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate =
      totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const missRate =
      totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;
    const averageAccessTime =
      this.stats.accessCount > 0
        ? this.stats.totalAccessTime / this.stats.accessCount
        : 0;

    // Calculate cache efficiency based on access patterns
    const entries = Array.from(this.cache.values());
    const totalAccesses = entries.reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    );
    const cacheEfficiency =
      entries.length > 0 ? (totalAccesses / entries.length) * 100 : 0;

    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      averageAccessTime: Math.round(averageAccessTime * 100) / 100,
      cacheEfficiency: Math.round(cacheEfficiency * 100) / 100,
    };
  }

  /**
   * Clear all cached avatars
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalAccessTime: 0,
      accessCount: 0,
    };
  }

  /**
   * Export cache data for debugging
   */
  exportCacheData(): Record<string, unknown> {
    const entries: Record<string, unknown> = {};

    for (const [key, entry] of this.cache.entries()) {
      entries[key] = {
        url: entry.url,
        timestamp: entry.timestamp,
        size: entry.size,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
        age: Date.now() - entry.timestamp,
      };
    }

    return {
      entries,
      stats: this.getStats(),
      config: this.config,
    };
  }
}

// Global advanced avatar cache instance
export const advancedAvatarCache = new AdvancedAvatarCache();

/**
 * Enhanced hook for avatar caching with analytics
 */
export function useAdvancedAvatarCache() {
  const preloadAvatar = async (url: string, size: string, retries = 3) => {
    await advancedAvatarCache.preloadAvatar(url, size, retries);
  };

  const getCachedAvatar = (url: string, size: string) => {
    return advancedAvatarCache.getCached(url, size);
  };

  const isAvatarCached = (url: string, size: string) => {
    return advancedAvatarCache.isCached(url, size);
  };

  const invalidateUserAvatars = (userId: string) => {
    advancedAvatarCache.invalidateUserAvatars(userId);
  };

  const invalidateAvatar = (url: string) => {
    advancedAvatarCache.invalidateAvatar(url);
  };

  const getCacheStats = () => {
    return advancedAvatarCache.getStats();
  };

  const clearCache = () => {
    advancedAvatarCache.clear();
  };

  const exportCacheData = () => {
    return advancedAvatarCache.exportCacheData();
  };

  return {
    preloadAvatar,
    getCachedAvatar,
    isAvatarCached,
    invalidateUserAvatars,
    invalidateAvatar,
    getCacheStats,
    clearCache,
    exportCacheData,
  };
}

/**
 * Preload avatars for multiple users with intelligent batching
 */
export async function preloadUserAvatarsBatch(
  users: Array<{ avatar_url?: string | null; id: string }>,
  size: string = 'medium',
  batchSize: number = 5
): Promise<void> {
  const validUsers = users.filter((user) => user.avatar_url);

  // Process in batches to avoid overwhelming the network
  for (let i = 0; i < validUsers.length; i += batchSize) {
    const batch = validUsers.slice(i, i + batchSize);

    const preloadPromises = batch.map((user) =>
      advancedAvatarCache.preloadAvatar(user.avatar_url!, size).catch(() => {
        // Silently fail for batch preloading
      })
    );

    await Promise.allSettled(preloadPromises);

    // Small delay between batches
    if (i + batchSize < validUsers.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

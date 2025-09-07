/**
 * Avatar Analytics System
 *
 * Tracks avatar upload performance, compression ratios, user engagement,
 * and provides insights for optimization.
 */

import { supabase } from './supabase';

export interface AvatarUploadEvent {
  userId: string;
  originalFileSize: number;
  processedFileSize: number;
  compressionRatio: number;
  uploadDuration: number;
  fileType: string;
  success: boolean;
  errorType?: string;
  timestamp: number;
}

export interface AvatarViewEvent {
  userId: string;
  avatarUrl: string;
  size: string;
  loadTime: number;
  cacheHit: boolean;
  timestamp: number;
}

export interface AvatarCacheEvent {
  cacheHit: boolean;
  cacheSize: number;
  hitRate: number;
  averageAccessTime: number;
  timestamp: number;
}

export interface AvatarAnalytics {
  uploadStats: {
    totalUploads: number;
    successfulUploads: number;
    failedUploads: number;
    averageCompressionRatio: number;
    averageUploadTime: number;
    averageFileSize: number;
    successRate: number;
  };
  performanceStats: {
    averageLoadTime: number;
    cacheHitRate: number;
    totalViews: number;
    averageCacheAccessTime: number;
  };
  userEngagement: {
    uniqueUsers: number;
    uploadsPerUser: number;
    viewsPerUser: number;
  };
}

class AvatarAnalyticsTracker {
  private uploadEvents: AvatarUploadEvent[] = [];
  private viewEvents: AvatarViewEvent[] = [];
  private cacheEvents: AvatarCacheEvent[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.loadStoredEvents();
    this.setupPeriodicFlush();
  }

  /**
   * Track avatar upload event
   */
  trackUpload(event: Omit<AvatarUploadEvent, 'timestamp'>): void {
    if (!this.isEnabled) return;

    const uploadEvent: AvatarUploadEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.uploadEvents.push(uploadEvent);
    this.storeEvents();
    this.sendToAnalytics('upload', uploadEvent);
  }

  /**
   * Track avatar view event
   */
  trackView(event: Omit<AvatarViewEvent, 'timestamp'>): void {
    if (!this.isEnabled) return;

    const viewEvent: AvatarViewEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.viewEvents.push(viewEvent);
    this.storeEvents();
    this.sendToAnalytics('view', viewEvent);
  }

  /**
   * Track cache performance event
   */
  trackCache(event: Omit<AvatarCacheEvent, 'timestamp'>): void {
    if (!this.isEnabled) return;

    const cacheEvent: AvatarCacheEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.cacheEvents.push(cacheEvent);
    this.storeEvents();
    this.sendToAnalytics('cache', cacheEvent);
  }

  /**
   * Get comprehensive analytics
   */
  getAnalytics(): AvatarAnalytics {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;

    // Filter events from last 24 hours
    const recentUploads = this.uploadEvents.filter(
      (e) => e.timestamp > last24Hours
    );
    const recentViews = this.viewEvents.filter(
      (e) => e.timestamp > last24Hours
    );
    const recentCacheEvents = this.cacheEvents.filter(
      (e) => e.timestamp > last24Hours
    );

    // Calculate upload statistics
    const successfulUploads = recentUploads.filter((e) => e.success);
    const failedUploads = recentUploads.filter((e) => !e.success);

    const uploadStats = {
      totalUploads: recentUploads.length,
      successfulUploads: successfulUploads.length,
      failedUploads: failedUploads.length,
      averageCompressionRatio: this.calculateAverage(
        successfulUploads.map((e) => e.compressionRatio)
      ),
      averageUploadTime: this.calculateAverage(
        successfulUploads.map((e) => e.uploadDuration)
      ),
      averageFileSize: this.calculateAverage(
        recentUploads.map((e) => e.originalFileSize)
      ),
      successRate:
        recentUploads.length > 0
          ? (successfulUploads.length / recentUploads.length) * 100
          : 0,
    };

    // Calculate performance statistics
    const performanceStats = {
      averageLoadTime: this.calculateAverage(
        recentViews.map((e) => e.loadTime)
      ),
      cacheHitRate:
        recentCacheEvents.length > 0
          ? (recentCacheEvents.filter((e) => e.cacheHit).length /
              recentCacheEvents.length) *
            100
          : 0,
      totalViews: recentViews.length,
      averageCacheAccessTime: this.calculateAverage(
        recentCacheEvents.map((e) => e.averageAccessTime)
      ),
    };

    // Calculate user engagement
    const uniqueUsers = new Set([
      ...recentUploads.map((e) => e.userId),
      ...recentViews.map((e) => e.userId),
    ]).size;

    const userEngagement = {
      uniqueUsers,
      uploadsPerUser: uniqueUsers > 0 ? recentUploads.length / uniqueUsers : 0,
      viewsPerUser: uniqueUsers > 0 ? recentViews.length / uniqueUsers : 0,
    };

    return {
      uploadStats,
      performanceStats,
      userEngagement,
    };
  }

  /**
   * Get upload performance insights
   */
  getUploadInsights(): {
    compressionEfficiency: 'excellent' | 'good' | 'fair' | 'poor';
    uploadReliability: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  } {
    const analytics = this.getAnalytics();
    const { uploadStats } = analytics;

    // Analyze compression efficiency
    let compressionEfficiency: 'excellent' | 'good' | 'fair' | 'poor';
    if (uploadStats.averageCompressionRatio >= 70) {
      compressionEfficiency = 'excellent';
    } else if (uploadStats.averageCompressionRatio >= 50) {
      compressionEfficiency = 'good';
    } else if (uploadStats.averageCompressionRatio >= 30) {
      compressionEfficiency = 'fair';
    } else {
      compressionEfficiency = 'poor';
    }

    // Analyze upload reliability
    let uploadReliability: 'excellent' | 'good' | 'fair' | 'poor';
    if (uploadStats.successRate >= 95) {
      uploadReliability = 'excellent';
    } else if (uploadStats.successRate >= 90) {
      uploadReliability = 'good';
    } else if (uploadStats.successRate >= 80) {
      uploadReliability = 'fair';
    } else {
      uploadReliability = 'poor';
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (uploadStats.averageFileSize > 2 * 1024 * 1024) {
      // 2MB
      recommendations.push(
        'Consider implementing more aggressive image compression'
      );
    }

    if (uploadStats.averageUploadTime > 5000) {
      // 5 seconds
      recommendations.push(
        'Upload times are high - consider optimizing network requests'
      );
    }

    if (uploadStats.successRate < 90) {
      recommendations.push(
        'Upload success rate is low - investigate error patterns'
      );
    }

    if (analytics.performanceStats.cacheHitRate < 70) {
      recommendations.push(
        'Cache hit rate is low - consider improving cache warming strategy'
      );
    }

    return {
      compressionEfficiency,
      uploadReliability,
      recommendations,
    };
  }

  /**
   * Send analytics data to backend
   */
  private async sendToAnalytics(
    type: string,
    event: AvatarUploadEvent | AvatarViewEvent | AvatarCacheEvent
  ): Promise<void> {
    try {
      // Skip analytics in development or if tables don't exist
      if (
        import.meta.env.DEV ||
        import.meta.env.VITE_SUPABASE_URL?.includes('127.0.0.1')
      ) {
        return;
      }

      // Send to Supabase analytics table (if it exists)
      const { error } = await supabase.from('avatar_analytics').insert({
        event_type: type,
        event_data: event,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('Failed to send avatar analytics:', error);
      }
    } catch (error) {
      console.warn('Analytics service unavailable:', error);
    }
  }

  /**
   * Store events in localStorage for persistence
   */
  private storeEvents(): void {
    try {
      localStorage.setItem(
        'avatar_upload_events',
        JSON.stringify(this.uploadEvents.slice(-1000))
      );
      localStorage.setItem(
        'avatar_view_events',
        JSON.stringify(this.viewEvents.slice(-1000))
      );
      localStorage.setItem(
        'avatar_cache_events',
        JSON.stringify(this.cacheEvents.slice(-1000))
      );
    } catch (error) {
      console.warn('Failed to store avatar analytics:', error);
    }
  }

  /**
   * Load stored events from localStorage
   */
  private loadStoredEvents(): void {
    try {
      const storedUploads = localStorage.getItem('avatar_upload_events');
      const storedViews = localStorage.getItem('avatar_view_events');
      const storedCache = localStorage.getItem('avatar_cache_events');

      if (storedUploads) {
        this.uploadEvents = JSON.parse(storedUploads);
      }
      if (storedViews) {
        this.viewEvents = JSON.parse(storedViews);
      }
      if (storedCache) {
        this.cacheEvents = JSON.parse(storedCache);
      }
    } catch (error) {
      console.warn('Failed to load stored avatar analytics:', error);
    }
  }

  /**
   * Setup periodic flush of analytics data
   */
  private setupPeriodicFlush(): void {
    // Flush analytics every 5 minutes
    setInterval(
      () => {
        this.flushAnalytics();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Flush analytics data to backend
   */
  async flushAnalytics(): Promise<void> {
    if (
      this.uploadEvents.length === 0 &&
      this.viewEvents.length === 0 &&
      this.cacheEvents.length === 0
    ) {
      return;
    }

    try {
      // Skip analytics in development or if tables don't exist
      if (
        import.meta.env.DEV ||
        import.meta.env.VITE_SUPABASE_URL?.includes('127.0.0.1')
      ) {
        // Clear local events in development
        this.uploadEvents = [];
        this.viewEvents = [];
        this.cacheEvents = [];
        this.storeEvents();
        return;
      }

      const analytics = this.getAnalytics();

      // Compute period_start and period_end from event timestamps
      const allTimestamps: number[] = [
        ...this.uploadEvents.map((e) => e.timestamp),
        ...this.viewEvents.map((e) => e.timestamp),
        ...this.cacheEvents.map((e) => e.timestamp),
      ];
      const period_start =
        allTimestamps.length > 0
          ? new Date(Math.min(...allTimestamps)).toISOString()
          : new Date().toISOString();
      const period_end =
        allTimestamps.length > 0
          ? new Date(Math.max(...allTimestamps)).toISOString()
          : new Date().toISOString();

      await supabase.from('avatar_analytics_summary').insert({
        analytics_data: analytics,
        created_at: new Date().toISOString(),
        period_start,
        period_end,
      });

      // Clear local events after successful flush
      this.uploadEvents = [];
      this.viewEvents = [];
      this.cacheEvents = [];
      this.storeEvents();
    } catch (error) {
      console.warn('Failed to flush avatar analytics:', error);
    }
  }

  /**
   * Calculate average of array
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Enable/disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.uploadEvents = [];
    this.viewEvents = [];
    this.cacheEvents = [];
    this.storeEvents();
  }
}

// Global analytics tracker instance
export const avatarAnalytics = new AvatarAnalyticsTracker();

/**
 * Hook for avatar analytics
 */
export function useAvatarAnalytics() {
  const trackUpload = (event: Omit<AvatarUploadEvent, 'timestamp'>) => {
    avatarAnalytics.trackUpload(event);
  };

  const trackView = (event: Omit<AvatarViewEvent, 'timestamp'>) => {
    avatarAnalytics.trackView(event);
  };

  const trackCache = (event: Omit<AvatarCacheEvent, 'timestamp'>) => {
    avatarAnalytics.trackCache(event);
  };

  const getAnalytics = () => {
    return avatarAnalytics.getAnalytics();
  };

  const getUploadInsights = () => {
    return avatarAnalytics.getUploadInsights();
  };

  const flushAnalytics = () => {
    return avatarAnalytics.flushAnalytics();
  };

  return {
    trackUpload,
    trackView,
    trackCache,
    getAnalytics,
    getUploadInsights,
    flushAnalytics,
  };
}

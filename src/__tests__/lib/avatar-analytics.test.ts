import { describe, it, expect, beforeEach, vi } from 'vitest';
import { avatarAnalytics, useAvatarAnalytics } from '@/lib/avatar-analytics';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Avatar Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    avatarAnalytics.clear();
  });

  describe('trackUpload', () => {
    it('should track successful upload event', () => {
      const uploadEvent = {
        userId: 'user-123',
        originalFileSize: 1024000, // 1MB
        processedFileSize: 256000, // 256KB
        compressionRatio: 75,
        uploadDuration: 2000,
        fileType: 'image/jpeg',
        success: true,
      };

      avatarAnalytics.trackUpload(uploadEvent);

      const analytics = avatarAnalytics.getAnalytics();
      expect(analytics.uploadStats.totalUploads).toBe(1);
      expect(analytics.uploadStats.successfulUploads).toBe(1);
      expect(analytics.uploadStats.failedUploads).toBe(0);
      expect(analytics.uploadStats.averageCompressionRatio).toBe(75);
      expect(analytics.uploadStats.successRate).toBe(100);
    });

    it('should track failed upload event', () => {
      const uploadEvent = {
        userId: 'user-123',
        originalFileSize: 1024000,
        processedFileSize: 1024000,
        compressionRatio: 0,
        uploadDuration: 1000,
        fileType: 'image/jpeg',
        success: false,
        errorType: 'network_error',
      };

      avatarAnalytics.trackUpload(uploadEvent);

      const analytics = avatarAnalytics.getAnalytics();
      expect(analytics.uploadStats.totalUploads).toBe(1);
      expect(analytics.uploadStats.successfulUploads).toBe(0);
      expect(analytics.uploadStats.failedUploads).toBe(1);
      expect(analytics.uploadStats.successRate).toBe(0);
    });
  });

  describe('trackView', () => {
    it('should track avatar view event', () => {
      const viewEvent = {
        userId: 'user-123',
        avatarUrl: 'https://example.com/avatar.jpg',
        size: 'large',
        loadTime: 500,
        cacheHit: true,
      };

      avatarAnalytics.trackView(viewEvent);

      const analytics = avatarAnalytics.getAnalytics();
      expect(analytics.performanceStats.totalViews).toBe(1);
      expect(analytics.performanceStats.averageLoadTime).toBe(500);
    });
  });

  describe('trackCache', () => {
    it('should track cache performance event', () => {
      const cacheEvent = {
        cacheHit: true,
        cacheSize: 50,
        hitRate: 85.5,
        averageAccessTime: 10.5,
      };

      avatarAnalytics.trackCache(cacheEvent);

      const analytics = avatarAnalytics.getAnalytics();
      expect(analytics.performanceStats.cacheHitRate).toBe(100); // Only one cache event, so 100% hit rate
      expect(analytics.performanceStats.averageCacheAccessTime).toBe(10.5);
    });
  });

  describe('getUploadInsights', () => {
    it('should provide excellent compression insights', () => {
      // Add multiple successful uploads with high compression
      for (let i = 0; i < 5; i++) {
        avatarAnalytics.trackUpload({
          userId: `user-${i}`,
          originalFileSize: 1000000,
          processedFileSize: 200000,
          compressionRatio: 80,
          uploadDuration: 1500,
          fileType: 'image/jpeg',
          success: true,
        });
      }

      const insights = avatarAnalytics.getUploadInsights();
      expect(insights.compressionEfficiency).toBe('excellent');
      expect(insights.uploadReliability).toBe('excellent');
    });

    it('should provide poor compression insights', () => {
      // Add uploads with low compression
      for (let i = 0; i < 3; i++) {
        avatarAnalytics.trackUpload({
          userId: `user-${i}`,
          originalFileSize: 1000000,
          processedFileSize: 900000,
          compressionRatio: 10,
          uploadDuration: 5000,
          fileType: 'image/jpeg',
          success: false,
        });
      }

      const insights = avatarAnalytics.getUploadInsights();
      expect(insights.compressionEfficiency).toBe('poor');
      expect(insights.uploadReliability).toBe('poor');
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('useAvatarAnalytics hook', () => {
    it('should provide all analytics functions', () => {
      const analytics = useAvatarAnalytics();

      expect(typeof analytics.trackUpload).toBe('function');
      expect(typeof analytics.trackView).toBe('function');
      expect(typeof analytics.trackCache).toBe('function');
      expect(typeof analytics.getAnalytics).toBe('function');
      expect(typeof analytics.getUploadInsights).toBe('function');
      expect(typeof analytics.flushAnalytics).toBe('function');
    });
  });

  describe('analytics persistence', () => {
    it('should store events in localStorage', () => {
      const uploadEvent = {
        userId: 'user-123',
        originalFileSize: 1024000,
        processedFileSize: 256000,
        compressionRatio: 75,
        uploadDuration: 2000,
        fileType: 'image/jpeg',
        success: true,
      };

      avatarAnalytics.trackUpload(uploadEvent);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'avatar_upload_events',
        expect.any(String)
      );
    });
  });
});

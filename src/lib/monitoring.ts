import { QueryClient } from '@tanstack/react-query';

// Performance monitoring utilities
export interface QueryMetrics {
  queryKey: string;
  executionTime: number;
  cacheHit: boolean;
  errorCount: number;
  successCount: number;
  timestamp: number;
}

export interface DatabaseMetrics {
  connectionCount: number;
  slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: number;
  }>;
  errorRate: number;
  avgResponseTime: number;
}

class PerformanceMonitor {
  private queryMetrics: Map<string, QueryMetrics> = new Map();
  private errorLog: Array<{
    error: unknown;
    timestamp: number;
    context: string;
  }> = [];
  private performanceThresholds = {
    slowQueryMs: 1000,
    errorRateThreshold: 0.05, // 5% error rate threshold
    cacheHitRateThreshold: 0.8, // 80% cache hit rate threshold
  };

  // Track query performance
  trackQuery(queryKey: string[], startTime: number, error?: unknown) {
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    const keyString = JSON.stringify(queryKey);

    const existing = this.queryMetrics.get(keyString) || {
      queryKey: keyString,
      executionTime: 0,
      cacheHit: false,
      errorCount: 0,
      successCount: 0,
      timestamp: startTime,
    };

    if (error) {
      existing.errorCount++;
      this.logError(error, `Query: ${keyString}`);
    } else {
      existing.successCount++;
    }

    existing.executionTime = (existing.executionTime + executionTime) / 2; // Moving average
    existing.timestamp = endTime;

    this.queryMetrics.set(keyString, existing);

    // Alert on slow queries
    if (executionTime > this.performanceThresholds.slowQueryMs) {
      console.warn(
        `🐌 Slow query detected: ${keyString} took ${executionTime}ms`
      );
    }

    return executionTime;
  }

  // Track cache performance
  trackCacheHit(queryKey: string[], wasFromCache: boolean) {
    const keyString = JSON.stringify(queryKey);
    const existing = this.queryMetrics.get(keyString);

    if (existing) {
      existing.cacheHit = wasFromCache;
    }
  }

  // Log errors with context
  logError(error: unknown, context: string) {
    const errorEntry = {
      error: {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        code: error?.code,
        details: error?.details,
      },
      timestamp: Date.now(),
      context,
    };

    this.errorLog.push(errorEntry);

    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`🚨 Database Error [${context}]:`, error);
    }
  }

  // Get performance summary
  getPerformanceSummary(): {
    totalQueries: number;
    avgResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    slowQueries: number;
    recentErrors: typeof this.errorLog;
  } {
    const metrics = Array.from(this.queryMetrics.values());
    const totalQueries = metrics.reduce(
      (sum, m) => sum + m.successCount + m.errorCount,
      0
    );
    const totalErrors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    // const totalSuccesses = metrics.reduce((sum, m) => sum + m.successCount, 0);
    const avgResponseTime =
      metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length ||
      0;
    const cacheHits = metrics.filter((m) => m.cacheHit).length;
    const slowQueries = metrics.filter(
      (m) => m.executionTime > this.performanceThresholds.slowQueryMs
    ).length;

    return {
      totalQueries,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      errorRate: totalQueries > 0 ? totalErrors / totalQueries : 0,
      cacheHitRate: metrics.length > 0 ? cacheHits / metrics.length : 0,
      slowQueries,
      recentErrors: this.errorLog.slice(-10), // Last 10 errors
    };
  }

  // Get detailed query metrics
  getQueryMetrics(): QueryMetrics[] {
    return Array.from(this.queryMetrics.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50); // Last 50 queries
  }

  // Check if system is healthy
  isHealthy(): { healthy: boolean; issues: string[] } {
    const summary = this.getPerformanceSummary();
    const issues: string[] = [];

    if (summary.errorRate > this.performanceThresholds.errorRateThreshold) {
      issues.push(`High error rate: ${(summary.errorRate * 100).toFixed(1)}%`);
    }

    if (
      summary.cacheHitRate < this.performanceThresholds.cacheHitRateThreshold
    ) {
      issues.push(
        `Low cache hit rate: ${(summary.cacheHitRate * 100).toFixed(1)}%`
      );
    }

    if (summary.slowQueries > 0) {
      issues.push(`${summary.slowQueries} slow queries detected`);
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }

  // Clear old metrics (call periodically)
  clearOldMetrics(olderThanMs: number = 60 * 60 * 1000) {
    // 1 hour default
    const cutoff = Date.now() - olderThanMs;

    for (const [key, metrics] of this.queryMetrics.entries()) {
      if (metrics.timestamp < cutoff) {
        this.queryMetrics.delete(key);
      }
    }

    this.errorLog = this.errorLog.filter((error) => error.timestamp > cutoff);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Setup monitoring for a QueryClient
export function setupQueryClientMonitoring(queryClient: QueryClient) {
  // Monitor query start/end
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'observerResultsUpdated') {
      const { query } = event;
      const startTime = query.state.dataUpdatedAt || Date.now();

      // Track cache hits
      const wasFromCache =
        query.state.fetchStatus === 'idle' && query.state.data !== undefined;
      performanceMonitor.trackCacheHit(query.queryKey, wasFromCache);

      // Track query performance
      if (query.state.error) {
        performanceMonitor.trackQuery(
          query.queryKey,
          startTime,
          query.state.error
        );
      } else if (query.state.data !== undefined) {
        performanceMonitor.trackQuery(query.queryKey, startTime);
      }
    }
  });

  // Monitor mutations
  queryClient.getMutationCache().subscribe((event) => {
    if (event.type === 'observerResult') {
      const { mutation } = event;

      if (mutation.state.error) {
        performanceMonitor.logError(
          mutation.state.error,
          `Mutation: ${JSON.stringify(mutation.options.mutationKey || 'unknown')}`
        );
      }
    }
  });

  // Clean up old metrics every 30 minutes
  setInterval(
    () => {
      performanceMonitor.clearOldMetrics();
    },
    30 * 60 * 1000
  );

  // Log performance summary every 5 minutes in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(
      () => {
        const summary = performanceMonitor.getPerformanceSummary();
        const health = performanceMonitor.isHealthy();

        console.log('📊 Performance Summary:', summary);
        if (!health.healthy) {
          console.warn('⚠️ Health Issues:', health.issues);
        }
      },
      5 * 60 * 1000
    );
  }
}

// Export performance data for external monitoring
export function getPerformanceData() {
  return {
    summary: performanceMonitor.getPerformanceSummary(),
    metrics: performanceMonitor.getQueryMetrics(),
    health: performanceMonitor.isHealthy(),
    timestamp: Date.now(),
  };
}

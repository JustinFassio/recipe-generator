import { supabase } from './supabase';
import { databaseMonitor } from './database-monitoring';
import { getPerformanceData } from './monitoring';

// Health check API endpoints
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: number;
  services: {
    database: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
      details?: Record<string, unknown>;
    };
    auth: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
    };
    storage: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
    };
  };
  performance: {
    queryMetrics: Record<string, unknown>;
    databaseHealth: Record<string, unknown>;
  };
  recommendations: string[];
}

class HealthAPI {
  // Basic health check - lightweight endpoint for monitoring
  async getBasicHealth(): Promise<{ status: string; timestamp: number }> {
    try {
      const startTime = Date.now();

      // Simple database connectivity test
      const { error } = await supabase.from('recipes').select('id').limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        throw error;
      }

      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        timestamp: Date.now(),
      };
    } catch {
      return {
        status: 'down',
        timestamp: Date.now(),
      };
    }
  }

  // Comprehensive health check with detailed metrics
  async getDetailedHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    // Initialize status
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: startTime,
      services: {
        database: { status: 'down', responseTime: 0 },
        auth: { status: 'down', responseTime: 0 },
        storage: { status: 'down', responseTime: 0 },
      },
      performance: {
        queryMetrics: {},
        databaseHealth: {},
      },
      recommendations: [],
    };

    // Check database health
    try {
      const dbStartTime = Date.now();
      const { error: dbError } = await supabase
        .from('recipes')
        .select('id')
        .limit(1);

      const dbResponseTime = Date.now() - dbStartTime;

      if (dbError) {
        throw dbError;
      }

      health.services.database = {
        status: dbResponseTime < 1000 ? 'healthy' : 'degraded',
        responseTime: dbResponseTime,
      };

      // Get detailed database metrics
      try {
        const dbHealth = await databaseMonitor.getCurrentHealth();
        health.services.database.details = dbHealth as unknown as Record<
          string,
          unknown
        >;
        health.performance.databaseHealth =
          databaseMonitor.getPerformanceSummary();
      } catch (e) {
        console.debug('Detailed database metrics unavailable:', e);
      }
    } catch {
      health.services.database = {
        status: 'down',
        responseTime: Date.now() - startTime,
      };
    }

    // Check auth service
    try {
      const authStartTime = Date.now();
      const { error: authError } = await supabase.auth.getSession();
      const authResponseTime = Date.now() - authStartTime;

      health.services.auth = {
        status: authError ? 'degraded' : 'healthy',
        responseTime: authResponseTime,
      };
    } catch {
      health.services.auth = {
        status: 'down',
        responseTime: Date.now() - startTime,
      };
    }

    // Check storage service
    try {
      const storageStartTime = Date.now();
      const { error: storageError } = await supabase.storage.listBuckets();
      const storageResponseTime = Date.now() - storageStartTime;

      health.services.storage = {
        status: storageError ? 'degraded' : 'healthy',
        responseTime: storageResponseTime,
      };
    } catch {
      health.services.storage = {
        status: 'down',
        responseTime: Date.now() - startTime,
      };
    }

    // Get query performance metrics
    try {
      health.performance.queryMetrics = getPerformanceData();
    } catch (e) {
      console.debug('Query metrics unavailable:', e);
    }

    // Determine overall status
    const serviceStatuses = Object.values(health.services).map((s) => s.status);
    if (serviceStatuses.includes('down')) {
      health.status = 'down';
    } else if (serviceStatuses.includes('degraded')) {
      health.status = 'degraded';
    }

    // Generate recommendations
    health.recommendations = this.generateRecommendations(health);

    return health;
  }

  // Get database performance metrics
  async getDatabaseMetrics(): Promise<{
    slowQueries: Record<string, unknown>[];
    tableStats: Record<string, unknown>[];
    databaseMetrics: Record<string, unknown>[];
    indexUsage: Record<string, unknown>[];
  }> {
    const results = {
      slowQueries: [],
      tableStats: [],
      databaseMetrics: [],
      indexUsage: [],
    };

    try {
      // Get slow queries
      const { data: slowQueries } = await supabase.rpc('get_slow_queries');
      results.slowQueries = slowQueries || [];
    } catch (e) {
      console.debug('Slow queries unavailable:', e);
    }

    try {
      // Get table statistics
      const { data: tableStats } = await supabase.rpc('get_table_stats');
      results.tableStats = tableStats || [];
    } catch (e) {
      console.debug('Table stats unavailable:', e);
    }

    try {
      // Get database metrics
      const { data: dbMetrics } = await supabase.rpc('get_database_metrics');
      results.databaseMetrics = dbMetrics || [];
    } catch (e) {
      console.debug('Database metrics unavailable:', e);
    }

    try {
      // Get index usage
      const { data: indexUsage } = await supabase.rpc('get_index_usage');
      results.indexUsage = indexUsage || [];
    } catch (e) {
      console.debug('Index usage unavailable:', e);
    }

    return results;
  }

  // Generate actionable recommendations based on health status
  private generateRecommendations(health: HealthStatus): string[] {
    const recommendations: string[] = [];

    // Database recommendations
    if (health.services.database.status === 'down') {
      recommendations.push(
        '🔴 Database is down - Check connection and service status immediately'
      );
    } else if (health.services.database.status === 'degraded') {
      recommendations.push(
        '🟡 Database response is slow - Consider optimizing queries or scaling resources'
      );
    }

    if (health.services.database.responseTime > 2000) {
      recommendations.push(
        '⚡ Database response time > 2s - Investigate query performance and connection pooling'
      );
    }

    // Auth recommendations
    if (health.services.auth.status === 'down') {
      recommendations.push(
        '🔴 Authentication service is down - Users cannot log in'
      );
    } else if (health.services.auth.status === 'degraded') {
      recommendations.push(
        '🟡 Authentication service is slow - Monitor auth provider status'
      );
    }

    // Storage recommendations
    if (health.services.storage.status === 'down') {
      recommendations.push(
        '🔴 Storage service is down - Image uploads will fail'
      );
    } else if (health.services.storage.status === 'degraded') {
      recommendations.push(
        '🟡 Storage service is slow - Monitor file upload performance'
      );
    }

    // Performance recommendations
    if (
      (health.performance.queryMetrics as Record<string, unknown>)?.summary &&
      (health.performance.queryMetrics as Record<string, unknown>).summary &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (health.performance.queryMetrics as any).summary.errorRate > 0.05
    ) {
      recommendations.push(
        '📊 High query error rate detected - Review error logs and fix failing queries'
      );
    }

    if (
      (health.performance.queryMetrics as Record<string, unknown>)?.summary &&
      (health.performance.queryMetrics as Record<string, unknown>).summary &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (health.performance.queryMetrics as any).summary.avgResponseTime > 1000
    ) {
      recommendations.push(
        '📊 Average query response time is high - Optimize slow queries'
      );
    }

    if (
      (health.performance.queryMetrics as Record<string, unknown>)?.summary &&
      (health.performance.queryMetrics as Record<string, unknown>).summary &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (health.performance.queryMetrics as any).summary.cacheHitRate < 0.8
    ) {
      recommendations.push(
        '💾 Low cache hit rate - Review caching strategy and stale times'
      );
    }

    // Database-specific recommendations
    if (
      (health.performance.databaseHealth as Record<string, unknown>)?.current &&
      (health.performance.databaseHealth as Record<string, unknown>).current &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (health.performance.databaseHealth as any).current.slowQueries &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (health.performance.databaseHealth as any).current.slowQueries.length > 5
    ) {
      recommendations.push(
        '🐌 Multiple slow queries detected - Review and optimize database queries'
      );
    }

    if (
      (health.performance.databaseHealth as Record<string, unknown>)?.trend &&
      (health.performance.databaseHealth as Record<string, unknown>).trend &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (health.performance.databaseHealth as any).trend.trend === 'degrading'
    ) {
      recommendations.push(
        '📉 Database performance is degrading - Monitor resource usage trends'
      );
    }

    // Default recommendation if everything is healthy
    if (recommendations.length === 0) {
      recommendations.push(
        '✅ All systems are operating normally - Continue monitoring'
      );
    }

    return recommendations;
  }

  // Test all monitoring functions
  async testMonitoringSetup(): Promise<{
    success: boolean;
    results: Record<string, unknown>;
    errors: string[];
  }> {
    const results: Record<string, unknown> = {};
    const errors: string[] = [];

    // Test basic health
    try {
      results.basicHealth = await this.getBasicHealth();
    } catch (e) {
      errors.push(`Basic health check failed: ${e}`);
    }

    // Test monitoring functions
    const functions = [
      'get_slow_queries',
      'get_table_stats',
      'get_database_metrics',
      'get_index_usage',
    ];

    for (const func of functions) {
      try {
        const { data, error } = await supabase.rpc(func);
        if (error) throw error;
        results[func] = data;
      } catch (e) {
        errors.push(`Function ${func} failed: ${e}`);
      }
    }

    // Test performance monitoring
    try {
      results.performanceData = getPerformanceData();
    } catch (e) {
      errors.push(`Performance data failed: ${e}`);
    }

    return {
      success: errors.length === 0,
      results,
      errors,
    };
  }
}

// Global health API instance
export const healthAPI = new HealthAPI();

// Development helper - log health status periodically
if (process.env.NODE_ENV === 'development') {
  // Log basic health every 2 minutes
  setInterval(
    async () => {
      try {
        const health = await healthAPI.getBasicHealth();
        console.log('🏥 Health Check:', health);
      } catch (e) {
        console.error('Health check failed:', e);
      }
    },
    2 * 60 * 1000
  );
}

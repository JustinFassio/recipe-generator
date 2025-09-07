import { supabase } from './supabase';

// Database-specific monitoring utilities
export interface DatabaseHealth {
  connectionStatus: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  activeConnections?: number;
  slowQueries: Array<{
    query: string;
    duration: number;
    calls: number;
  }>;
  tableStats: Array<{
    tableName: string;
    rowCount: number;
    size: string;
    indexCount: number;
  }>;
  errorRate: number;
  lastChecked: number;
}

class DatabaseMonitor {
  private healthHistory: DatabaseHealth[] = [];
  private lastHealthCheck = 0;
  private healthCheckInterval = 5 * 60 * 1000; // 5 minutes

  // Check database connectivity and basic health
  async checkDatabaseHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now();
    let connectionStatus: DatabaseHealth['connectionStatus'] = 'down';
    let responseTime = 0;
    let slowQueries: DatabaseHealth['slowQueries'] = [];
    let tableStats: DatabaseHealth['tableStats'] = [];
    let errorRate = 0;

    try {
      // Basic connectivity test
      const { error } = await supabase.from('recipes').select('id').limit(1);

      responseTime = Date.now() - startTime;

      if (error) {
        throw error;
      }

      connectionStatus = responseTime < 1000 ? 'healthy' : 'degraded';

      // Get slow query statistics (if pg_stat_statements is available)
      try {
        const { data: slowQueryData } = await supabase
          .rpc('get_slow_queries', {})
          .limit(10);

        if (slowQueryData) {
          slowQueries = slowQueryData.map((q: Record<string, unknown>) => ({
            query:
              (q.query as string)?.substring(0, 100) + '...' || 'Unknown query',
            duration: q.mean_exec_time || 0,
            calls: q.calls || 0,
          }));
        }
      } catch (e) {
        // pg_stat_statements might not be available, continue without it
        console.debug('Slow query monitoring not available:', e);
      }

      // Get table statistics
      try {
        const { data: tableStatsData } = await supabase.rpc('get_table_stats');

        if (tableStatsData) {
          tableStats = tableStatsData.map((t: Record<string, unknown>) => ({
            tableName: t.table_name || 'unknown',
            rowCount: t.row_count || 0,
            size: t.size || '0 bytes',
            indexCount: t.index_count || 0,
          }));
        }
      } catch (e) {
        // Fallback to basic table info
        console.debug('Detailed table stats not available:', e);
        try {
          const { data: basicStats } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');

          if (basicStats) {
            tableStats = basicStats.map((t) => ({
              tableName: t.table_name,
              rowCount: 0,
              size: 'N/A',
              indexCount: 0,
            }));
          }
        } catch (fallbackError) {
          console.debug('Basic table stats also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      responseTime = Date.now() - startTime;
      connectionStatus = 'down';
      errorRate = 1.0;
    }

    const health: DatabaseHealth = {
      connectionStatus,
      responseTime,
      slowQueries,
      tableStats,
      errorRate,
      lastChecked: Date.now(),
    };

    // Store in history (keep last 24 hours)
    this.healthHistory.push(health);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.healthHistory = this.healthHistory.filter(
      (h) => h.lastChecked > oneDayAgo
    );

    this.lastHealthCheck = Date.now();
    return health;
  }

  // Get cached health or perform new check if needed
  async getCurrentHealth(): Promise<DatabaseHealth> {
    const timeSinceLastCheck = Date.now() - this.lastHealthCheck;

    if (
      timeSinceLastCheck > this.healthCheckInterval ||
      this.healthHistory.length === 0
    ) {
      return await this.checkDatabaseHealth();
    }

    return this.healthHistory[this.healthHistory.length - 1];
  }

  // Get health trend over time
  getHealthTrend(): {
    avgResponseTime: number;
    uptimePercentage: number;
    errorRate: number;
    trend: 'improving' | 'stable' | 'degrading';
  } {
    if (this.healthHistory.length < 2) {
      return {
        avgResponseTime: 0,
        uptimePercentage: 100,
        errorRate: 0,
        trend: 'stable',
      };
    }

    const recentChecks = this.healthHistory.slice(-10); // Last 10 checks
    const avgResponseTime =
      recentChecks.reduce((sum, h) => sum + h.responseTime, 0) /
      recentChecks.length;
    const healthyChecks = recentChecks.filter(
      (h) => h.connectionStatus === 'healthy'
    ).length;
    const uptimePercentage = (healthyChecks / recentChecks.length) * 100;
    const errorRate =
      recentChecks.reduce((sum, h) => sum + h.errorRate, 0) /
      recentChecks.length;

    // Determine trend
    const firstHalf = recentChecks.slice(
      0,
      Math.floor(recentChecks.length / 2)
    );
    const secondHalf = recentChecks.slice(Math.floor(recentChecks.length / 2));

    const firstHalfAvgResponse =
      firstHalf.reduce((sum, h) => sum + h.responseTime, 0) / firstHalf.length;
    const secondHalfAvgResponse =
      secondHalf.reduce((sum, h) => sum + h.responseTime, 0) /
      secondHalf.length;

    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    const responseDiff = secondHalfAvgResponse - firstHalfAvgResponse;

    if (responseDiff > 100) {
      // More than 100ms slower
      trend = 'degrading';
    } else if (responseDiff < -50) {
      // More than 50ms faster
      trend = 'improving';
    }

    return {
      avgResponseTime: Math.round(avgResponseTime),
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      errorRate: Math.round(errorRate * 1000) / 1000,
      trend,
    };
  }

  // Get performance summary for monitoring dashboard
  getPerformanceSummary() {
    const currentHealth = this.healthHistory[this.healthHistory.length - 1];
    const trend = this.getHealthTrend();

    return {
      current: currentHealth,
      trend,
      history: this.healthHistory.slice(-24), // Last 24 checks
      recommendations: this.getRecommendations(currentHealth, trend),
    };
  }

  // Generate recommendations based on health data
  private getRecommendations(
    health: DatabaseHealth,
    trend: ReturnType<typeof this.getHealthTrend>
  ): string[] {
    const recommendations: string[] = [];

    if (health.responseTime > 1000) {
      recommendations.push(
        'Database response time is slow. Consider optimizing queries or scaling resources.'
      );
    }

    if (health.slowQueries.length > 5) {
      recommendations.push(
        `${health.slowQueries.length} slow queries detected. Review and optimize query performance.`
      );
    }

    if (trend.uptimePercentage < 95) {
      recommendations.push(
        `Database uptime is ${trend.uptimePercentage}%. Investigate connection stability.`
      );
    }

    if (trend.trend === 'degrading') {
      recommendations.push(
        'Performance is degrading. Monitor resource usage and consider scaling.'
      );
    }

    if (health.connectionStatus === 'down') {
      recommendations.push(
        'Database is currently unavailable. Check connection and service status.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Database is performing well. Continue monitoring.');
    }

    return recommendations;
  }

  // Start automatic health monitoring
  startMonitoring() {
    // Initial check
    this.checkDatabaseHealth();

    // Schedule regular checks
    setInterval(async () => {
      try {
        await this.checkDatabaseHealth();
      } catch (error) {
        console.error('Scheduled health check failed:', error);
      }
    }, this.healthCheckInterval);

    console.log(
      `🔍 Database monitoring started (checking every ${this.healthCheckInterval / 1000 / 60} minutes)`
    );
  }
}

// Global database monitor instance
export const databaseMonitor = new DatabaseMonitor();

// Helper function to create monitoring SQL functions (run these in Supabase SQL editor)
export const monitoringSQLFunctions = `
-- Function to get slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
  query text,
  calls bigint,
  total_exec_time double precision,
  mean_exec_time double precision
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pss.query,
    pss.calls,
    pss.total_exec_time,
    pss.mean_exec_time
  FROM pg_stat_statements pss
  WHERE pss.mean_exec_time > 100 -- Queries taking more than 100ms on average
  ORDER BY pss.mean_exec_time DESC
  LIMIT 10;
EXCEPTION
  WHEN undefined_table THEN
    -- pg_stat_statements not available
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE (
  table_name text,
  row_count bigint,
  size text,
  index_count bigint
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    COALESCE(s.n_live_tup, 0) as row_count,
    pg_size_pretty(pg_total_relation_size(t.table_name::regclass)) as size,
    (SELECT count(*) FROM pg_indexes WHERE tablename = t.table_name) as index_count
  FROM information_schema.tables t
  LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
  WHERE t.table_schema = 'public'
  ORDER BY s.n_live_tup DESC NULLS LAST;
EXCEPTION
  WHEN others THEN
    -- Fallback to basic table list
    RETURN QUERY
    SELECT 
      t.table_name::text,
      0::bigint as row_count,
      'N/A'::text as size,
      0::bigint as index_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public';
END;
$$ LANGUAGE plpgsql;
`;

// Initialize monitoring in development
if (process.env.NODE_ENV === 'development') {
  // Start monitoring after a short delay to allow app to initialize
  setTimeout(() => {
    databaseMonitor.startMonitoring();
  }, 5000);
}

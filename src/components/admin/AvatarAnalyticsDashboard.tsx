import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Image,
  AlertTriangle,
} from 'lucide-react';
import { useAvatarAnalytics } from '@/lib/avatar-analytics';
import { useAdvancedAvatarCache } from '@/lib/avatar-cache-advanced';

interface AvatarAnalyticsDashboardProps {
  className?: string;
}

export const AvatarAnalyticsDashboard: React.FC<
  AvatarAnalyticsDashboardProps
> = ({ className = '' }) => {
  const { getAnalytics, getUploadInsights, flushAnalytics } =
    useAvatarAnalytics();
  const { getCacheStats, exportCacheData } = useAdvancedAvatarCache();

  const [analytics, setAnalytics] = useState<ReturnType<
    typeof getAnalytics
  > | null>(null);
  const [insights, setInsights] = useState<ReturnType<
    typeof getUploadInsights
  > | null>(null);
  const [cacheStats, setCacheStats] = useState<ReturnType<
    typeof getCacheStats
  > | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsData, insightsData, cacheData] = await Promise.all([
        Promise.resolve(getAnalytics()),
        Promise.resolve(getUploadInsights()),
        Promise.resolve(getCacheStats()),
      ]);

      setAnalytics(analyticsData);
      setInsights(insightsData);
      setCacheStats(cacheData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [getAnalytics, getUploadInsights, getCacheStats]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleFlushAnalytics = async () => {
    try {
      await flushAnalytics();
      await loadAnalytics();
    } catch (error) {
      console.error('Failed to flush analytics:', error);
    }
  };

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEfficiencyBadge = (efficiency: string) => {
    const colorClass = getEfficiencyColor(efficiency);
    return (
      <span className={`badge badge-outline ${colorClass}`}>
        {efficiency.charAt(0).toUpperCase() + efficiency.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`card bg-base-200 shadow-lg ${className}`}>
        <div className="card-body">
          <div className="flex items-center justify-center h-64">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="card-title">
                <BarChart3 className="h-6 w-6" />
                Avatar Analytics Dashboard
              </h2>
              <p className="text-base-content/60">
                Performance metrics and insights for avatar system
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleFlushAnalytics}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Upload Statistics */}
      {analytics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex items-center">
                <Image className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm text-base-content/60">Total Uploads</p>
                  <p className="text-2xl font-bold">
                    {analytics.uploadStats.totalUploads}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-base-content/60">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.uploadStats.successRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-base-content/60">
                    Avg Compression
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics.uploadStats.averageCompressionRatio.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-base-content/60">
                    Avg Upload Time
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(analytics.uploadStats.averageUploadTime / 1000).toFixed(
                      1
                    )}
                    s
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {insights && (
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">
              <AlertTriangle className="h-5 w-5" />
              Performance Insights
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Compression Efficiency</h4>
                <div className="flex items-center gap-2">
                  {getEfficiencyBadge(insights.compressionEfficiency)}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Upload Reliability</h4>
                <div className="flex items-center gap-2">
                  {getEfficiencyBadge(insights.uploadReliability)}
                </div>
              </div>
            </div>

            {insights.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1">
                  {insights.recommendations.map(
                    (recommendation: string, index: number) => (
                      <li key={index} className="text-sm text-base-content/80">
                        {recommendation}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cache Performance */}
      {cacheStats && (
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">
              <Users className="h-5 w-5" />
              Cache Performance
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="stat">
                <div className="stat-title">Cache Hit Rate</div>
                <div className="stat-value text-primary">
                  {cacheStats.hitRate.toFixed(1)}%
                </div>
                <div className="stat-desc">
                  {cacheStats.totalHits} hits / {cacheStats.totalMisses} misses
                </div>
              </div>

              <div className="stat">
                <div className="stat-title">Cache Size</div>
                <div className="stat-value text-secondary">
                  {cacheStats.size}
                </div>
                <div className="stat-desc">
                  of {cacheStats.maxEntries} max entries
                </div>
              </div>

              <div className="stat">
                <div className="stat-title">Avg Access Time</div>
                <div className="stat-value text-accent">
                  {cacheStats.averageAccessTime.toFixed(2)}ms
                </div>
                <div className="stat-desc">
                  Cache efficiency: {cacheStats.cacheEfficiency.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Engagement */}
      {analytics && (
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">
              <Users className="h-5 w-5" />
              User Engagement
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="stat">
                <div className="stat-title">Unique Users</div>
                <div className="stat-value text-primary">
                  {analytics.userEngagement.uniqueUsers}
                </div>
                <div className="stat-desc">Last 24 hours</div>
              </div>

              <div className="stat">
                <div className="stat-title">Uploads per User</div>
                <div className="stat-value text-secondary">
                  {analytics.userEngagement.uploadsPerUser.toFixed(1)}
                </div>
                <div className="stat-desc">Average uploads</div>
              </div>

              <div className="stat">
                <div className="stat-title">Views per User</div>
                <div className="stat-value text-accent">
                  {analytics.userEngagement.viewsPerUser.toFixed(1)}
                </div>
                <div className="stat-desc">Average views</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Information */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h3 className="card-title">Debug Information</h3>
          <div className="space-y-2">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const cacheData = exportCacheData();
                console.log('Cache Data:', cacheData);
              }}
            >
              Export Cache Data
            </button>
            <pre className="text-xs bg-base-300 p-4 rounded overflow-auto max-h-64">
              {JSON.stringify({ analytics, insights, cacheStats }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

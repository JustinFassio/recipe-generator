import { useState, useEffect } from 'react';
import { Eye, Users, TrendingUp, Calendar } from 'lucide-react';

interface AnalyticsPanelProps {
  recipeId: string;
  versionNumber?: number;
  showDetailedAnalytics?: boolean;
  className?: string;
}

interface AnalyticsData {
  views: number;
  uniqueUsers: number;
  engagementRate: number;
  lastViewed: string | null;
  commentsCount?: number;
  sharesCount?: number;
  savesCount?: number;
}

export function AnalyticsPanel({
  recipeId,
  versionNumber,
  showDetailedAnalytics = false,
  className = '',
}: AnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    trackView(); // Track this view
  }, [recipeId, versionNumber]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      console.log(
        `📈 [AnalyticsPanel] Loading analytics for recipe: ${recipeId}${versionNumber ? `, version: ${versionNumber}` : ''}`
      );

      // For now, create mock analytics data since we don't have analytics tables yet
      // TODO: Replace with real analyticsApi calls when analytics tables are created
      const mockAnalyticsData: AnalyticsData = {
        views: Math.floor(Math.random() * 500) + 10,
        uniqueUsers: Math.floor(Math.random() * 100) + 5,
        engagementRate: Math.random() * 100,
        lastViewed: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        commentsCount: Math.floor(Math.random() * 20),
        sharesCount: Math.floor(Math.random() * 15),
        savesCount: Math.floor(Math.random() * 30),
      };

      setAnalytics(mockAnalyticsData);
    } catch (error) {
      console.error('❌ [AnalyticsPanel] Failed to load analytics:', error);
      setAnalytics({
        views: 0,
        uniqueUsers: 0,
        engagementRate: 0,
        lastViewed: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      console.log(
        `👁️ [AnalyticsPanel] Tracking view for recipe: ${recipeId}${versionNumber ? `, version: ${versionNumber}` : ''}`
      );

      // TODO: Replace with real analyticsApi.trackRecipeView call when analytics tables exist
      // await analyticsApi.trackRecipeView(recipeId, versionNumber);
    } catch (error) {
      console.error('❌ [AnalyticsPanel] Failed to track view:', error);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded mb-4 w-24"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const analyticsTitle = versionNumber
    ? `Version ${versionNumber} Analytics`
    : 'Recipe Analytics';

  return (
    <div className={className}>
      <h4 className="font-semibold mb-4 text-gray-800">{analyticsTitle}</h4>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <AnalyticsMetric
          icon={<Eye className="w-5 h-5" />}
          value={analytics?.views || 0}
          label="Views"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />

        <AnalyticsMetric
          icon={<Users className="w-5 h-5" />}
          value={analytics?.uniqueUsers || 0}
          label="Unique Users"
          color="text-green-600"
          bgColor="bg-green-50"
        />

        <AnalyticsMetric
          icon={<TrendingUp className="w-5 h-5" />}
          value={`${analytics?.engagementRate?.toFixed(1) || '0.0'}%`}
          label="Engagement"
          color="text-purple-600"
          bgColor="bg-purple-50"
        />

        <AnalyticsMetric
          icon={<Calendar className="w-5 h-5" />}
          value={
            analytics?.lastViewed
              ? formatRelativeTime(analytics.lastViewed)
              : 'Never'
          }
          label="Last Viewed"
          color="text-orange-600"
          bgColor="bg-orange-50"
          isDate={true}
        />
      </div>

      {showDetailedAnalytics && analytics && (
        <div className="space-y-4">
          <h5 className="font-medium text-gray-700">Detailed Analytics</h5>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Comments</span>
                <span className="font-semibold text-gray-800">
                  {analytics.commentsCount || 0}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Shares</span>
                <span className="font-semibold text-gray-800">
                  {analytics.sharesCount || 0}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Saves</span>
                <span className="font-semibold text-gray-800">
                  {analytics.savesCount || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h6 className="font-medium text-blue-800 mb-2">
              Performance Insights
            </h6>
            <div className="text-sm text-blue-700 space-y-1">
              <p>
                • This {versionNumber ? 'version' : 'recipe'} has been viewed{' '}
                {analytics.views} times
              </p>
              <p>
                • Engagement rate of {analytics.engagementRate.toFixed(1)}% is{' '}
                {analytics.engagementRate > 50 ? 'above' : 'below'} average
              </p>
              <p>
                • {analytics.uniqueUsers} unique users have interacted with this
                content
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Supporting component for individual metrics
function AnalyticsMetric({
  icon,
  value,
  label,
  color,
  bgColor,
  isDate = false,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  bgColor: string;
  isDate?: boolean;
}) {
  return (
    <div className={`${bgColor} p-4 rounded-lg text-center`}>
      <div className={`${color} flex justify-center mb-2`}>{icon}</div>
      <div className={`${isDate ? 'text-sm' : 'text-2xl'} font-bold ${color}`}>
        {value}
      </div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

// Utility function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

import React, { useState, useEffect } from 'react';
import { recipeApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Star,
  MessageSquare,
  BarChart3,
  Calendar,
  Users,
  GitBranch,
} from 'lucide-react';
import type { Recipe } from '@/lib/types';

interface RecipeAnalyticsProps {
  recipe: Recipe;
  onClose: () => void;
}

interface AnalyticsData {
  version_stats: Array<{
    version_number: number;
    version_rating_count: number;
    version_avg_rating: number | null;
    version_view_count: number;
    recipe_id?: string;
    title?: string;
    version_comment_count?: number;
  }>;
  aggregate_stats: {
    total_versions: number;
    total_ratings: number;
    aggregate_avg_rating: number | null;
    total_views: number;
    total_comments?: number;
    latest_version?: number;
  };
  recent_activity: {
    ratings_this_week: number;
    views_this_week: number;
    comments_this_week: number;
  };
  top_comments: Array<{
    id: string;
    comment: string | null;
    rating: number;
    created_at: string;
    user_id: string;
  }>;
}

export function RecipeAnalytics({ recipe, onClose }: RecipeAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [recipe.id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await recipeApi.getRecipeAnalytics(recipe.id);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = 'blue',
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recipe Analytics</h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Recipe Analytics</h3>
              <p className="text-sm text-gray-600">{recipe.title}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-6">
            {analytics ? (
              <>
                {/* Overview Stats */}
                <div>
                  <h4 className="text-md font-semibold mb-4 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Overview
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      icon={Star}
                      title="Average Rating"
                      value={
                        analytics.aggregate_stats?.aggregate_avg_rating?.toFixed(
                          1
                        ) || '0.0'
                      }
                      subtitle={`${analytics.aggregate_stats?.total_ratings || 0} total ratings`}
                      color="orange"
                    />
                    <StatCard
                      icon={Eye}
                      title="Total Views"
                      value={analytics.aggregate_stats?.total_views || 0}
                      subtitle="All time"
                      color="blue"
                    />
                    <StatCard
                      icon={MessageSquare}
                      title="Comments"
                      value={analytics.aggregate_stats?.total_comments || 0}
                      subtitle="All versions"
                      color="green"
                    />
                    <StatCard
                      icon={GitBranch}
                      title="Versions"
                      value={analytics.aggregate_stats?.total_versions || 1}
                      subtitle={`v${analytics.aggregate_stats?.latest_version || 1} latest`}
                      color="purple"
                    />
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="text-md font-semibold mb-4 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    This Week
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      icon={Star}
                      title="New Ratings"
                      value={analytics.recent_activity.ratings_this_week}
                      subtitle="Last 7 days"
                      color="orange"
                    />
                    <StatCard
                      icon={Eye}
                      title="Views"
                      value={analytics.recent_activity.views_this_week}
                      subtitle="Last 7 days"
                      color="blue"
                    />
                    <StatCard
                      icon={MessageSquare}
                      title="Comments"
                      value={analytics.recent_activity.comments_this_week}
                      subtitle="Last 7 days"
                      color="green"
                    />
                  </div>
                </div>

                {/* Top Comments */}
                {analytics.top_comments.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-4 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Top Comments
                    </h4>
                    <div className="space-y-3">
                      {analytics.top_comments.slice(0, 3).map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {comment.rating}⭐
                              </Badge>
                              <span className="text-sm font-medium">
                                Community Member
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(
                                comment.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 italic">
                            "{comment.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Version Performance */}
                {analytics.version_stats.length > 1 && (
                  <div>
                    <h4 className="text-md font-semibold mb-4 flex items-center">
                      <GitBranch className="h-4 w-4 mr-2" />
                      Version Performance
                    </h4>
                    <div className="space-y-2">
                      {analytics.version_stats.map((versionStat) => (
                        <div
                          key={versionStat.recipe_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">
                              v{versionStat.version_number}
                            </Badge>
                            <span className="text-sm font-medium">
                              {versionStat.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <span>
                              ⭐{' '}
                              {versionStat.version_avg_rating?.toFixed(1) ||
                                '0.0'}
                            </span>
                            <span>👁️ {versionStat.version_view_count}</span>
                            <span>💬 {versionStat.version_comment_count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No analytics data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

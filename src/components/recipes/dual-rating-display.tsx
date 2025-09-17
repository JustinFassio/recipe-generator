import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Eye, MessageSquare, TrendingUp, BarChart3 } from 'lucide-react';
import { recipeApi } from '@/lib/api';
import {
  Recipe,
  AggregateStats,
  RecipeVersion,
  VersionStats,
} from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';

interface DualRatingDisplayProps {
  originalRecipeId: string;
  currentRecipe: Recipe;
  className?: string;
}

interface VersionWithStats {
  version: RecipeVersion;
  stats: VersionStats;
}

export function DualRatingDisplay({
  originalRecipeId,
  currentRecipe,
  className = '',
}: DualRatingDisplayProps) {
  const [versions, setVersions] = useState<VersionWithStats[]>([]);
  const [aggregateStats, setAggregateStats] = useState<AggregateStats | null>(
    null
  );
  const [selectedVersion, setSelectedVersion] = useState<number>(
    currentRecipe.version_number || 1
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadVersionData();
  }, [originalRecipeId]);

  const loadVersionData = async () => {
    try {
      setLoading(true);

      // Load all versions of this recipe and sort by version number descending (newest first)
      const recipeVersions =
        await recipeApi.getRecipeVersions(originalRecipeId);
      const sortedVersions = recipeVersions.sort(
        (a, b) => b.version_number - a.version_number
      );

      // Load stats for each version
      const versionsWithStats = await Promise.all(
        sortedVersions.map(async (version) => {
          const stats = await recipeApi.getVersionStats(
            version.version_recipe_id,
            version.version_number
          );
          return {
            version,
            stats: stats || {
              recipe_id: version.version_recipe_id,
              title: '',
              version_number: version.version_number,
              creator_rating: null,
              owner_id: '',
              version_rating_count: 0,
              version_avg_rating: null,
              version_view_count: 0,
              version_comment_count: 0,
              is_public: true,
              created_at: version.created_at,
              updated_at: version.created_at,
              parent_recipe_id: null,
              is_version: true,
            },
          };
        })
      );

      // Load aggregate stats
      const aggregate = await recipeApi.getAggregateStats(originalRecipeId);

      setVersions(versionsWithStats);
      setAggregateStats(aggregate);
    } catch (error) {
      console.error('Failed to load version data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (versionNumber: number, recipeId: string) => {
    setSelectedVersion(versionNumber);
    navigate(`/recipe/${recipeId}`);
  };

  const renderStars = (
    rating: number,
    count: number,
    size: 'sm' | 'md' = 'sm'
  ) => {
    const starSize = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';

    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`${starSize} ${
                star <= rating
                  ? 'text-orange-400 fill-orange-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span
          className={`${size === 'md' ? 'text-base' : 'text-sm'} text-muted-foreground`}
        >
          {rating > 0 ? `${rating.toFixed(1)} (${count})` : 'No ratings'}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${createDaisyUICardClasses('bordered')} ${className}`}>
        <div className="card-body">
          <div className="flex items-center justify-center py-8">
            <div className="loading loading-spinner loading-md"></div>
            <span className="ml-2">Loading version analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  const selectedVersionStats = versions.find(
    (v) => v.version.version_number === selectedVersion
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dual Rating Overview - The Key Feature */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Version-Specific Rating */}
        <div
          className={`${createDaisyUICardClasses('bordered')} border-blue-200 bg-blue-50/50`}
        >
          <div className="card-body">
            <h3
              className={`${createDaisyUICardTitleClasses()} flex items-center gap-2 text-blue-700`}
            >
              <Star className="h-5 w-5" />
              Version {selectedVersion} Rating
            </h3>
            {selectedVersionStats ? (
              <div className="space-y-4">
                {renderStars(
                  selectedVersionStats.stats.version_avg_rating || 0,
                  selectedVersionStats.stats.version_rating_count,
                  'md'
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedVersionStats.stats.version_view_count} views
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedVersionStats.stats.version_comment_count}{' '}
                      comments
                    </span>
                  </div>
                </div>
                {selectedVersionStats.version.version_name && (
                  <div className="text-sm text-blue-600 font-medium">
                    "{selectedVersionStats.version.version_name}"
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No data for this version
              </div>
            )}
          </div>
        </div>

        {/* Aggregate Rating */}
        <div
          className={`${createDaisyUICardClasses('bordered')} border-green-200 bg-green-50/50`}
        >
          <div className="card-body">
            <h3
              className={`${createDaisyUICardTitleClasses()} flex items-center gap-2 text-green-700`}
            >
              <BarChart3 className="h-5 w-5" />
              Overall Rating
            </h3>
            {aggregateStats ? (
              <div className="space-y-4">
                {renderStars(
                  aggregateStats.aggregate_avg_rating || 0,
                  aggregateStats.total_ratings,
                  'md'
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>{aggregateStats.total_versions} versions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{aggregateStats.total_views} total views</span>
                  </div>
                </div>
                <div className="text-xs text-green-600">
                  Combined rating from all {aggregateStats.total_versions}{' '}
                  version{aggregateStats.total_versions !== 1 ? 's' : ''}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No aggregate data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version Selector */}
      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3 className={createDaisyUICardTitleClasses()}>Recipe Versions</h3>
          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Only one version exists for this recipe.</p>
                <p className="text-sm mt-1">
                  Create a new version to see version comparison.
                </p>
              </div>
            ) : (
              versions.map((versionWithStats) => {
                const version = versionWithStats.version;
                const stats = versionWithStats.stats;
                const isSelected = version.version_number === selectedVersion;
                const isLatest =
                  version.version_number ===
                  Math.max(
                    ...versions.map((v) => v.version.version_number || 1)
                  );

                return (
                  <div
                    key={version.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() =>
                      handleVersionSelect(
                        version.version_number || 1,
                        version.version_recipe_id
                      )
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={isSelected ? 'default' : 'secondary'}>
                            v{version.version_number || 1}
                          </Badge>
                          {isLatest && (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              Latest
                            </Badge>
                          )}
                          {version.version_name && (
                            <span className="text-sm font-medium text-muted-foreground">
                              {version.version_name}
                            </span>
                          )}
                        </div>

                        {/* Version-Specific Analytics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            {renderStars(
                              stats.version_avg_rating || 0,
                              stats.version_rating_count
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span>{stats.version_view_count} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span>{stats.version_comment_count} comments</span>
                          </div>
                        </div>

                        {/* Show changelog if available */}
                        {version.changelog && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <strong>What changed:</strong> {version.changelog}
                          </div>
                        )}
                      </div>

                      {!isSelected && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVersionSelect(
                              version.version_number || 1,
                              version.version_recipe_id
                            );
                          }}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Detailed Analytics for Selected Version */}
      {selectedVersionStats && (
        <div className={createDaisyUICardClasses('bordered')}>
          <div className="card-body">
            <h3 className={createDaisyUICardTitleClasses()}>
              Version {selectedVersion} Details
              {selectedVersionStats.version.version_name && (
                <span className="text-base font-normal text-muted-foreground ml-2">
                  - {selectedVersionStats.version.version_name}
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-blue-700">
                  Community Response
                </h4>
                <div className="space-y-3">
                  {renderStars(
                    selectedVersionStats.stats.version_avg_rating || 0,
                    selectedVersionStats.stats.version_rating_count
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>
                        {selectedVersionStats.stats.version_view_count} people
                        viewed this version
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span>
                        {selectedVersionStats.stats.version_comment_count}{' '}
                        comments on this version
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-green-700">
                  Creator Rating
                </h4>
                <div className="space-y-2">
                  {selectedVersionStats.stats.creator_rating ? (
                    renderStars(selectedVersionStats.stats.creator_rating, 1)
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Not rated by creator
                    </span>
                  )}
                  <div className="text-xs text-muted-foreground">
                    How the recipe creator rates this version
                  </div>
                </div>
              </div>
            </div>

            {/* Changelog for this version */}
            {selectedVersionStats.version.changelog && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h5 className="font-medium mb-2">
                  What Changed in This Version
                </h5>
                <p className="text-sm text-muted-foreground">
                  {selectedVersionStats.version.changelog}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

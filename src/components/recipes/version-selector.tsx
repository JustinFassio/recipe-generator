import { useState, useEffect } from 'react';
import { recipeApi } from '@/lib/api';
import type { RecipeVersion, VersionStats, AggregateStats } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Eye, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RateCommentModal } from './rate-comment-modal';

interface VersionSelectorProps {
  recipeId: string;
  currentVersionNumber?: number;
  onVersionSelect: (version: RecipeVersion) => void;
  onRateVersion?: (
    recipeId: string,
    versionNumber: number,
    rating: number,
    comment?: string
  ) => void;
  className?: string;
}

export function VersionSelector({
  recipeId,
  currentVersionNumber = 1,
  onVersionSelect,
  onRateVersion,
  className = '',
}: VersionSelectorProps) {
  const [versions, setVersions] = useState<RecipeVersion[]>([]);
  const [versionStats, setVersionStats] = useState<Map<number, VersionStats>>(
    new Map()
  );
  const [aggregateStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState<{
    version: number;
    recipe_id: string;
    recipe_title: string;
    version_name?: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadVersionData();
  }, [recipeId]);

  const loadVersionData = async () => {
    try {
      setLoading(true);

      console.log(
        `🔍 [VersionSelector] Loading versions for recipe: ${recipeId}`
      );

      // Load all versions using new clean API (already sorted newest first)
      const versionsData = await recipeApi.getRecipeVersions(recipeId);

      console.log(
        `📊 [VersionSelector] API returned ${versionsData?.length || 0} versions:`,
        versionsData
      );

      const sortedVersions = versionsData.sort(
        (a, b) => b.version_number - a.version_number
      );

      console.log(
        `📋 [VersionSelector] Setting ${sortedVersions.length} sorted versions`
      );
      setVersions(sortedVersions);

      // Load individual version stats (simplified - versions now contain full content)
      const statsMap = new Map<number, VersionStats>();
      for (const version of versionsData) {
        // Create stats from version data (no separate API call needed)
        const stats: VersionStats = {
          recipe_id: version.recipe_id,
          title: version.title,
          version_number: version.version_number,
          creator_rating: version.creator_rating,
          owner_id: version.created_by,
          version_rating_count: 0, // TODO: Implement rating system for new schema
          version_avg_rating: null,
          version_view_count: 0, // TODO: Implement view tracking for new schema
          version_comment_count: 0,
          is_public: version.is_published,
          created_at: version.created_at,
          updated_at: version.created_at,
          parent_recipe_id: null, // Not applicable in new schema
          is_version: version.version_number > 0,
        };
        statsMap.set(version.version_number, stats);
      }
      setVersionStats(statsMap);
    } catch (error) {
      console.error('Failed to load version data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipe versions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmitted = async () => {
    // Reload stats after rating submission
    await loadVersionData();
    setShowRatingModal(null);
  };

  const renderStars = (rating: number | null, size: 'sm' | 'md' = 'sm') => {
    const stars = rating || 0;
    const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= stars
                ? 'text-orange-400 fill-orange-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderVersionCard = (
    version: RecipeVersion,
    stats: VersionStats | undefined,
    isLatest: boolean
  ) => {
    const isSelected = version.version_number === currentVersionNumber;

    return (
      <div
        key={version.id}
        className={`p-4 border rounded-lg transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Badge variant={isLatest ? 'default' : 'secondary'}>
              v{version.version_number} {isLatest && '(Latest)'}
            </Badge>
            {version.version_name && (
              <span className="text-sm font-medium text-gray-700">
                {version.version_name}
              </span>
            )}
          </div>
          {stats?.creator_rating && (
            <div className="flex items-center space-x-1">
              {renderStars(stats.creator_rating)}
              <span className="text-xs text-gray-500">Creator</span>
            </div>
          )}
        </div>

        {version.changelog && (
          <p className="text-sm text-gray-600 mb-3">{version.changelog}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {stats && (
              <>
                <div className="flex items-center space-x-1">
                  {renderStars(stats.version_avg_rating)}
                  <span className="text-xs text-gray-500">
                    {stats.version_avg_rating?.toFixed(1) || '0.0'} (
                    {stats.version_rating_count})
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {stats.version_view_count}
                  </span>
                </div>
                {stats.version_comment_count > 0 && (
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {stats.version_comment_count}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                console.log(
                  '🔍 [VersionSelector] View button clicked for version:',
                  {
                    versionNumber: version.version_number,
                    recipeId: version.recipe_id,
                    versionId: version.id,
                    hasRecipeId: !!version.recipe_id,
                  }
                );
                onVersionSelect(version);
              }}
              disabled={isSelected}
            >
              {isSelected ? 'Current' : 'View'}
            </Button>
            {onRateVersion && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setShowRatingModal({
                    version: version.version_number,
                    recipe_id: version.recipe_id,
                    recipe_title: version.title,
                    version_name: version.version_name || undefined,
                  })
                }
              >
                Rate & Comment
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Aggregate Stats Summary */}
      {aggregateStats && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {aggregateStats.original_title}
              </h3>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center space-x-1">
                  {renderStars(aggregateStats.aggregate_avg_rating, 'md')}
                  <span className="text-sm text-gray-600">
                    {aggregateStats.aggregate_avg_rating?.toFixed(1) || '0.0'}(
                    {aggregateStats.total_ratings} total ratings)
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {aggregateStats.total_views} total views
                  </span>
                </div>
              </div>
            </div>
            <Badge variant="outline">
              {aggregateStats.total_versions} version
              {aggregateStats.total_versions !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      )}

      {/* Version List */}
      <div className="space-y-3">
        {versions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No versions available
          </p>
        ) : (
          <>
            {/* Show all versions in descending order (newest first) */}
            {versions.map((version, index) =>
              renderVersionCard(
                version,
                versionStats.get(version.version_number),
                index === 0 // Mark first (newest) version as latest
              )
            )}
          </>
        )}
      </div>

      {/* Enhanced Rating & Comment Modal */}
      {showRatingModal && (
        <RateCommentModal
          recipeId={showRatingModal.recipe_id}
          versionNumber={showRatingModal.version}
          recipeTitle={showRatingModal.recipe_title}
          versionName={showRatingModal.version_name}
          onClose={() => setShowRatingModal(null)}
          onSubmitted={handleRatingSubmitted}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { versioningApi } from '@/lib/api/features/versioning-api';
import type { RecipeVersion } from '@/lib/types';

interface VersionNavigatorProps {
  recipeId: string;
  currentVersion?: number;
  onVersionSelect: (versionNumber: number) => void;
  className?: string;
}

export function VersionNavigator({
  recipeId,
  currentVersion,
  onVersionSelect,
  className = '',
}: VersionNavigatorProps) {
  const [versions, setVersions] = useState<RecipeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [recipeId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        `🔍 [VersionNavigator] Loading versions for recipe: ${recipeId}`
      );

      // ONLY handles version data - no ratings, no analytics, no artificial coupling
      const versionData = await versioningApi.getRecipeVersions(recipeId);

      console.log(
        `📊 [VersionNavigator] Loaded ${versionData.length} versions`
      );
      setVersions(versionData);
    } catch (error) {
      console.error('❌ [VersionNavigator] Failed to load versions:', error);
      setError('Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 ${className}`}>
        <p>⚠️ {error}</p>
        <button
          onClick={loadVersions}
          className="text-sm text-blue-600 hover:text-blue-800 underline mt-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className={`text-gray-500 ${className}`}>
        <p>📝 Only one version exists for this recipe.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Recipe Versions ({versions.length})
      </h3>

      <div className="space-y-3">
        {versions.map((version, index) => (
          <VersionCard
            key={version.id}
            version={version}
            isSelected={version.version_number === currentVersion}
            isLatest={index === 0 && version.version_number > 0} // First non-original version is latest
            isOriginal={version.version_number === 0} // Version 0 is the original
            onSelect={() => {
              console.log(
                `🔄 [VersionNavigator] Selected version ${version.version_number}`
              );
              onVersionSelect(version.version_number);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Supporting component - keeps it focused and reusable
function VersionCard({
  version,
  isSelected,
  isLatest,
  isOriginal,
  onSelect,
}: {
  version: RecipeVersion;
  isSelected: boolean;
  isLatest: boolean;
  isOriginal: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : isOriginal
            ? 'border-amber-200 hover:border-amber-300 hover:bg-amber-50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={
              isSelected
                ? 'default'
                : isOriginal || isLatest
                  ? 'default'
                  : 'secondary'
            }
            className={
              isOriginal
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : isLatest
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : ''
            }
          >
            {isOriginal ? 'Original' : `v${version.version_number}`}
            {isLatest && !isOriginal && ' (Latest)'}
          </Badge>

          {version.version_name && (
            <span className="text-sm font-medium text-gray-700">
              {version.version_name}
            </span>
          )}
        </div>

        {version.is_published && (
          <Badge variant="outline" className="text-xs">
            Published
          </Badge>
        )}
      </div>

      {version.changelog && (
        <div className="text-sm text-gray-600 mb-2">
          <strong>{isOriginal ? 'Description:' : 'Changes:'}</strong>{' '}
          {version.changelog}
        </div>
      )}

      <div className="text-xs text-gray-500 flex items-center justify-between">
        <span>
          {isOriginal
            ? 'Original recipe'
            : `Created ${new Date(version.created_at).toLocaleDateString()}`}
        </span>

        {isSelected && (
          <span className="text-blue-600 font-medium">Currently Viewing</span>
        )}
      </div>
    </div>
  );
}

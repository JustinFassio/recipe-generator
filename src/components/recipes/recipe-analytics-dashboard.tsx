import { VersionNavigator } from './version-navigator';
import { RatingDisplay } from './rating-display';
import { AnalyticsPanel } from './analytics-panel';

interface RecipeAnalyticsDashboardProps {
  recipeId: string;
  currentVersion?: number;
  onVersionChange: (versionNumber: number) => void;
  className?: string;
}

/**
 * RecipeAnalyticsDashboard - Clean orchestrator component
 *
 * This component demonstrates the CORRECT way to compose multiple systems:
 * - Each system is independent and focused on one domain
 * - No artificial data coupling between systems
 * - Clean separation of concerns
 * - Easy to test, maintain, and modify
 *
 * This REPLACES the problematic DualRatingDisplay component which violated
 * Single Responsibility Principle by mixing versioning, ratings, and analytics.
 */
export function RecipeAnalyticsDashboard({
  recipeId,
  currentVersion,
  onVersionChange,
  className = '',
}: RecipeAnalyticsDashboardProps) {
  console.log(
    `🎛️ [RecipeAnalyticsDashboard] Rendering dashboard for recipe: ${recipeId}, version: ${currentVersion || 'latest'}`
  );

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Version Navigation System - Independent Domain */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <VersionNavigator
          recipeId={recipeId}
          currentVersion={currentVersion}
          onVersionSelect={(versionNumber) => {
            console.log(
              `🔄 [RecipeAnalyticsDashboard] Version change requested: ${versionNumber}`
            );
            onVersionChange(versionNumber);
          }}
        />
      </div>

      {/* Rating System - Independent Domain */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Version-Specific Rating */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <RatingDisplay
            recipeId={recipeId}
            versionNumber={currentVersion || 1}
            allowRating={true}
          />
        </div>

        {/* Aggregate Rating Across All Versions */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <RatingDisplay
            recipeId={recipeId}
            showAggregateRating={true}
            allowRating={false} // Don't allow rating the aggregate
          />
        </div>
      </div>

      {/* Analytics System - Independent Domain */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <AnalyticsPanel
          recipeId={recipeId}
          versionNumber={currentVersion}
          showDetailedAnalytics={true}
        />
      </div>

      {/* System Status - Debug Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 className="font-medium text-yellow-800 mb-2">
          🔧 System Status (Debug)
        </h5>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>
            ✅ Version Navigation: Independent system handling version selection
          </p>
          <p>
            ✅ Rating Display: Independent system handling rating data (mock
            data)
          </p>
          <p>
            ✅ Analytics Panel: Independent system handling view tracking (mock
            data)
          </p>
          <p>🔄 Current Recipe ID: {recipeId}</p>
          <p>🔄 Current Version: {currentVersion || 'Latest'}</p>
          <p>🎯 Architecture: Clean domain separation (no coupling)</p>
        </div>
      </div>
    </div>
  );
}

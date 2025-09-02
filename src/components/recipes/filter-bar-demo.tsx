import { useState } from 'react';
import { EnhancedFilterBar } from './enhanced-filter-bar';
import type { RecipeFilters } from '@/lib/types';

export function FilterBarDemo() {
  const [filters, setFilters] = useState<RecipeFilters>({
    searchTerm: '',
    categories: [],
    cuisine: [],
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const [showAnalytics, setShowAnalytics] = useState(false);

  // Mock data for demonstration
  const totalRecipes = 150;
  const filteredCount = 45;
  const categoryStats = [
    { category: 'Italian', count: 12, percentage: 26.7 },
    { category: 'Quick & Easy', count: 8, percentage: 17.8 },
    { category: 'Vegetarian', count: 15, percentage: 33.3 },
    { category: 'Dessert', count: 10, percentage: 22.2 },
  ];

  const handleFiltersChange = (newFilters: RecipeFilters) => {
    setFilters(newFilters);
    console.log('Filters changed:', newFilters);
  };

  const handleShowAnalytics = () => {
    setShowAnalytics(!showAnalytics);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Enhanced Filter Bar Demo</h1>
        <p className="text-gray-600">
          Showcasing all the enhanced features: category-based filtering, filter
          persistence, active filter display, and filter analytics.
        </p>
      </div>

      {/* Enhanced Filter Bar */}
      <EnhancedFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalRecipes={totalRecipes}
        filteredCount={filteredCount}
        categoryStats={categoryStats}
        onShowAnalytics={handleShowAnalytics}
        showAnalytics={showAnalytics}
        className="bg-white p-4 rounded-lg shadow-lg"
      />

      {/* Current Filters Display */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Current Filter State</h3>
        <pre className="bg-white p-3 rounded border text-sm overflow-auto">
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div>

      {/* Analytics Display */}
      {showAnalytics && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">
            Filter Analytics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryStats.map((stat, index) => (
              <div
                key={index}
                className="text-center bg-white p-3 rounded border"
              >
                <div className="text-2xl font-bold text-blue-600">
                  {stat.count}
                </div>
                <div className="text-sm text-gray-600">{stat.category}</div>
                <div className="text-xs text-gray-500">{stat.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-green-800">
          How to Use
        </h3>
        <ul className="space-y-2 text-sm text-green-700">
          <li>
            • <strong>Search:</strong> Type to search with 300ms debouncing
          </li>
          <li>
            • <strong>Categories:</strong> Use the enhanced category filter with
            search and grouping
          </li>
          <li>
            • <strong>Cuisine:</strong> Select multiple cuisines with visual
            indicators
          </li>
          <li>
            • <strong>Advanced:</strong> Access sorting options in the advanced
            dropdown
          </li>
          <li>
            • <strong>Analytics:</strong> Toggle analytics view to see filter
            impact
          </li>
          <li>
            • <strong>Persistence:</strong> All filters are automatically saved
            to URL
          </li>
        </ul>
      </div>
    </div>
  );
}

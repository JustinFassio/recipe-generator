import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  BarChart3,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryChip } from '@/components/ui/category-chip';
import { CategoryFilter } from '@/components/ui/category-filter';
import { PREDEFINED_CATEGORIES } from '@/lib/constants';
import { CUISINE_OPTIONS, CUISINE_LABELS } from '@/lib/cuisines';
import { CANONICAL_CATEGORIES } from '@/lib/categories';
import type { RecipeFilters, Cuisine, SortOption } from '@/lib/types';

interface EnhancedFilterBarProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  className?: string;
  // Analytics props
  totalRecipes?: number;
  filteredCount?: number;
  categoryStats?: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  onShowAnalytics?: () => void;
  showAnalytics?: boolean;
}

export function EnhancedFilterBar({
  filters,
  onFiltersChange,
  className = '',
  totalRecipes = 0,
  filteredCount = 0,
  categoryStats = [],
  onShowAnalytics,
  showAnalytics = false,
}: EnhancedFilterBarProps) {
  const [isCuisineDropdownOpen, setIsCuisineDropdownOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');

  // Debounced search to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.searchTerm) {
        onFiltersChange({ ...filters, searchTerm });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.searchTerm, onFiltersChange]);

  const updateFilters = (updates: Partial<RecipeFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleCuisine = (cuisine: Cuisine) => {
    const currentCuisines = filters.cuisine || [];
    const newCuisines = currentCuisines.includes(cuisine)
      ? currentCuisines.filter((c: Cuisine) => c !== cuisine)
      : [...currentCuisines, cuisine];
    updateFilters({ cuisine: newCuisines });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: filters.searchTerm, // Keep search term
      sortBy: filters.sortBy, // Keep sort
      sortOrder: filters.sortOrder,
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
    updateFilters({ searchTerm: '' });
  };

  const hasActiveFilters = !!(
    filters.categories?.length ||
    filters.cuisine?.length ||
    (filters.searchTerm && filters.searchTerm.trim() !== '')
  );

  // Calculate filter analytics
  const filterAnalytics = useMemo(() => {
    const activeFilters = [
      ...(filters.categories || []),
      ...(filters.cuisine || []).map((c) => `Cuisine: ${c}`),
    ];

    const totalActiveFilters = activeFilters.length;
    const searchActive = filters.searchTerm && filters.searchTerm.trim() !== '';

    return {
      totalActiveFilters,
      searchActive,
      hasFilters: totalActiveFilters > 0 || searchActive,
      filterBreakdown: {
        categories: filters.categories?.length || 0,
        cuisines: filters.cuisine?.length || 0,
        search: searchActive ? 1 : 0,
      },
    };
  }, [filters]);

  // Get available categories for the category filter
  const availableCategories = useMemo(() => {
    // Combine predefined categories with canonical categories
    const allCategories = [
      ...new Set([...PREDEFINED_CATEGORIES, ...CANONICAL_CATEGORIES]),
    ];

    // Filter out any that might conflict with current filters
    return allCategories;
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar with Analytics */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search recipes, ingredients, or instructions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-20"
        />

        {/* Search Actions */}
        <div className="absolute top-1/2 right-2 flex items-center gap-1">
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0 hover:bg-base-200"
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          {/* Analytics Toggle */}
          {onShowAnalytics && (
            <Button
              variant={showAnalytics ? 'default' : 'outline'}
              size="sm"
              onClick={onShowAnalytics}
              className="h-6 px-2 text-xs gap-1"
            >
              <BarChart3 className="h-3 w-3" />
              {showAnalytics ? 'Hide' : 'Show'} Stats
            </Button>
          )}
        </div>
      </div>

      {/* Filter Summary Bar */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Active Filters</span>
              <span className="badge badge-primary badge-sm">
                {filterAnalytics.totalActiveFilters +
                  (filterAnalytics.searchActive ? 1 : 0)}
              </span>
            </div>

            {/* Filter Breakdown */}
            <div className="flex items-center gap-2 text-xs text-base-content opacity-70">
              {filterAnalytics.filterBreakdown.categories > 0 && (
                <span className="badge badge-outline badge-xs">
                  {filterAnalytics.filterBreakdown.categories} categories
                </span>
              )}
              {filterAnalytics.filterBreakdown.cuisines > 0 && (
                <span className="badge badge-outline badge-xs">
                  {filterAnalytics.filterBreakdown.cuisines} cuisines
                </span>
              )}
              {filterAnalytics.searchActive && (
                <span className="badge badge-outline badge-xs">
                  search active
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Results Count */}
            <div className="text-xs text-base-content opacity-70">
              {filteredCount} of {totalRecipes} recipes
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 px-2 text-xs gap-1"
            >
              <X className="h-3 w-3" />
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        {/* Enhanced Category Filter */}
        <CategoryFilter
          selectedCategories={filters.categories || []}
          onCategoriesChange={(categories) => updateFilters({ categories })}
          availableCategories={availableCategories}
          placeholder="Filter by categories..."
          className="flex-1"
        />

        {/* Cuisine Filter */}
        <DropdownMenu
          open={isCuisineDropdownOpen}
          onOpenChange={setIsCuisineDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Cuisine
              {filters.cuisine?.length ? (
                <span className="ml-1 badge badge-primary badge-xs">
                  {filters.cuisine.length}
                </span>
              ) : null}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {CUISINE_OPTIONS.map((cuisine) => (
              <DropdownMenuCheckboxItem
                key={cuisine}
                checked={filters.cuisine?.includes(cuisine) || false}
                onCheckedChange={() => toggleCuisine(cuisine)}
              >
                {CUISINE_LABELS[cuisine]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Advanced Filters Toggle */}
        <DropdownMenu
          open={isAdvancedFiltersOpen}
          onOpenChange={setIsAdvancedFiltersOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Advanced
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-2">
            <div className="space-y-3">
              {/* Sort Options */}
              <div>
                <label className="text-xs font-medium text-base-content opacity-70 mb-2 block">
                  Sort By
                </label>
                <Select
                  value={filters.sortBy || 'date'}
                  onValueChange={(value: SortOption) =>
                    updateFilters({ sortBy: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-xs font-medium text-base-content opacity-70 mb-2 block">
                  Sort Order
                </label>
                <Select
                  value={filters.sortOrder || 'desc'}
                  onValueChange={(value: 'asc' | 'desc') =>
                    updateFilters({ sortOrder: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">↓ Descending</SelectItem>
                    <SelectItem value="asc">↑ Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Actions */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-9 w-9 p-0"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="space-y-3">
          {/* Active Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {/* Category Chips */}
            {filters.categories?.map((category: string) => (
              <CategoryChip
                key={category}
                category={category}
                variant="removable"
                size="sm"
                onRemove={() => {
                  const newCategories =
                    filters.categories?.filter((c) => c !== category) || [];
                  updateFilters({ categories: newCategories });
                }}
              />
            ))}

            {/* Cuisine Chips */}
            {filters.cuisine?.map((cuisine: Cuisine) => (
              <CategoryChip
                key={cuisine}
                category={`Cuisine: ${CUISINE_LABELS[cuisine]}`}
                variant="removable"
                size="sm"
                onRemove={() => {
                  const newCuisines =
                    filters.cuisine?.filter((c) => c !== cuisine) || [];
                  updateFilters({ cuisine: newCuisines });
                }}
              />
            ))}

            {/* Search Term Chip */}
            {filters.searchTerm && (
              <CategoryChip
                category={`Search: "${filters.searchTerm}"`}
                variant="removable"
                size="sm"
                onRemove={clearSearch}
              />
            )}
          </div>

          {/* Filter Analytics Summary */}
          {categoryStats.length > 0 && (
            <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Filter Impact
                </h4>
                <span className="text-xs text-base-content opacity-70">
                  {filteredCount} results
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categoryStats.slice(0, 4).map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-lg font-semibold text-primary">
                      {stat.count}
                    </div>
                    <div className="text-xs text-base-content opacity-70 truncate">
                      {stat.category}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

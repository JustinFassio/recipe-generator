import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
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
import CategoryChip from '@/components/ui/CategoryChip';
import {
  CUISINE_OPTIONS,
  CUISINE_LABELS,
  PREDEFINED_CATEGORIES,
} from '@/lib/constants';
import type { RecipeFilters, Cuisine, SortOption } from '@/lib/types';

interface FilterBarProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  className?: string;
}

export function FilterBar({
  filters,
  onFiltersChange,
  className = '',
}: FilterBarProps) {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCuisineDropdownOpen, setIsCuisineDropdownOpen] = useState(false);

  const updateFilters = (updates: Partial<RecipeFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleCategory = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c: string) => c !== category)
      : [...currentCategories, category];
    updateFilters({ categories: newCategories });
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

  const hasActiveFilters = !!(
    filters.categories?.length || filters.cuisine?.length
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search recipes, ingredients, or instructions..."
          value={filters.searchTerm || ''}
          onChange={(e) => updateFilters({ searchTerm: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        {/* Categories Filter */}
        <DropdownMenu
          open={isCategoryDropdownOpen}
          onOpenChange={setIsCategoryDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Categories
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {PREDEFINED_CATEGORIES.map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={filters.categories?.includes(category) || false}
                onCheckedChange={() => toggleCategory(category)}
              >
                {category}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Cuisine Filter */}
        <DropdownMenu
          open={isCuisineDropdownOpen}
          onOpenChange={setIsCuisineDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Cuisine
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

        {/* Sort Options */}
        <Select
          value={filters.sortBy || 'date'}
          onValueChange={(value: SortOption) =>
            updateFilters({ sortBy: value })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="popularity">Popularity</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order */}
        <Select
          value={filters.sortOrder || 'desc'}
          onValueChange={(value: 'asc' | 'desc') =>
            updateFilters({ sortOrder: value })
          }
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">↓</SelectItem>
            <SelectItem value="asc">↑</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="mr-1 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.categories?.length || filters.cuisine?.length) && (
        <div className="flex flex-wrap gap-2">
          {/* Category Chips */}
          {filters.categories?.map((category: string) => (
            <CategoryChip
              key={category}
              category={category}
              onRemove={() => toggleCategory(category)}
              variant="removable"
            />
          ))}

          {/* Cuisine Chips */}
          {filters.cuisine?.map((cuisine: Cuisine) => (
            <CategoryChip
              key={cuisine}
              category={CUISINE_LABELS[cuisine]}
              onRemove={() => toggleCuisine(cuisine)}
              variant="removable"
            />
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
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
  COOKING_TIME_OPTIONS,
  DIFFICULTY_OPTIONS,
  COOKING_TIME_LABELS,
  DIFFICULTY_LABELS,
} from '@/lib/constants';
import type {
  RecipeFilters,
  CookingTime,
  Difficulty,
  SortOption,
} from '@/lib/types';

interface FilterBarProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  availableCategories?: string[];
  className?: string;
}

export function FilterBar({
  filters,
  onFiltersChange,
  availableCategories = [],
  className = '',
}: FilterBarProps) {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCookingTimeDropdownOpen, setIsCookingTimeDropdownOpen] =
    useState(false);
  const [isDifficultyDropdownOpen, setIsDifficultyDropdownOpen] =
    useState(false);

  const updateFilters = (updates: Partial<RecipeFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleCategory = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];
    updateFilters({ categories: newCategories });
  };

  const toggleCookingTime = (time: CookingTime) => {
    const currentTimes = filters.cookingTime || [];
    const newTimes = currentTimes.includes(time)
      ? currentTimes.filter((t) => t !== time)
      : [...currentTimes, time];
    updateFilters({ cookingTime: newTimes });
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    const currentDifficulties = filters.difficulty || [];
    const newDifficulties = currentDifficulties.includes(difficulty)
      ? currentDifficulties.filter((d) => d !== difficulty)
      : [...currentDifficulties, difficulty];
    updateFilters({ difficulty: newDifficulties });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: filters.searchTerm, // Keep search term
      sortBy: filters.sortBy, // Keep sort
      sortOrder: filters.sortOrder,
    });
  };

  const hasActiveFilters = !!(
    filters.categories?.length ||
    filters.cookingTime?.length ||
    filters.difficulty?.length
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
      <div className="flex flex-wrap items-center gap-2">
        {/* Category Filter */}
        <DropdownMenu
          open={isCategoryDropdownOpen}
          onOpenChange={setIsCategoryDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Categories
              {filters.categories?.length ? (
                <span className="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 py-0.5 text-xs">
                  {filters.categories.length}
                </span>
              ) : null}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <div className="space-y-2 p-2">
              {availableCategories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={filters.categories?.includes(category) || false}
                  onCheckedChange={() => toggleCategory(category)}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Cooking Time Filter */}
        <DropdownMenu
          open={isCookingTimeDropdownOpen}
          onOpenChange={setIsCookingTimeDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Cooking Time
              {filters.cookingTime?.length ? (
                <span className="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 py-0.5 text-xs">
                  {filters.cookingTime.length}
                </span>
              ) : null}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <div className="space-y-2 p-2">
              {COOKING_TIME_OPTIONS.map((time) => (
                <DropdownMenuCheckboxItem
                  key={time}
                  checked={filters.cookingTime?.includes(time) || false}
                  onCheckedChange={() => toggleCookingTime(time)}
                >
                  {COOKING_TIME_LABELS[time]}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Difficulty Filter */}
        <DropdownMenu
          open={isDifficultyDropdownOpen}
          onOpenChange={setIsDifficultyDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Difficulty
              {filters.difficulty?.length ? (
                <span className="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 py-0.5 text-xs">
                  {filters.difficulty.length}
                </span>
              ) : null}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <div className="space-y-2 p-2">
              {DIFFICULTY_OPTIONS.map((difficulty) => (
                <DropdownMenuCheckboxItem
                  key={difficulty}
                  checked={filters.difficulty?.includes(difficulty) || false}
                  onCheckedChange={() => toggleDifficulty(difficulty)}
                >
                  {DIFFICULTY_LABELS[difficulty]}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
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
            <SelectItem value="alphabetical">A-Z</SelectItem>
            <SelectItem value="popularity">Popular</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Active filters:
          </span>

          {/* Category chips */}
          {filters.categories?.map((category) => (
            <CategoryChip
              key={category}
              category={category}
              size="sm"
              onClick={() => toggleCategory(category)}
            />
          ))}

          {/* Cooking time chips */}
          {filters.cookingTime?.map((time) => (
            <span
              key={time}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 hover:bg-blue-200"
              onClick={() => toggleCookingTime(time)}
            >
              {COOKING_TIME_LABELS[time]}
              <X className="h-3 w-3" />
            </span>
          ))}

          {/* Difficulty chips */}
          {filters.difficulty?.map((difficulty) => (
            <span
              key={difficulty}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 hover:bg-green-200"
              onClick={() => toggleDifficulty(difficulty)}
            >
              {DIFFICULTY_LABELS[difficulty]}
              <X className="h-3 w-3" />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

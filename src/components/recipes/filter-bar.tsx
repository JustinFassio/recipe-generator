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
      ? currentCategories.filter((c: string) => c !== category)
      : [...currentCategories, category];
    updateFilters({ categories: newCategories });
  };

  const toggleCookingTime = (time: CookingTime) => {
    const currentTimes = filters.cookingTime || [];
    const newTimes = currentTimes.includes(time)
      ? currentTimes.filter((t: CookingTime) => t !== time)
      : [...currentTimes, time];
    updateFilters({ cookingTime: newTimes });
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    const currentDifficulties = filters.difficulty || [];
    const newDifficulties = currentDifficulties.includes(difficulty)
      ? currentDifficulties.filter((d: Difficulty) => d !== difficulty)
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
          <DropdownMenuContent align="start" className="w-56">
            {availableCategories.map((category) => (
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

        {/* Cooking Time Filter */}
        <DropdownMenu
          open={isCookingTimeDropdownOpen}
          onOpenChange={setIsCookingTimeDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Cooking Time
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {COOKING_TIME_OPTIONS.map((time: CookingTime) => (
              <DropdownMenuCheckboxItem
                key={time}
                checked={filters.cookingTime?.includes(time) || false}
                onCheckedChange={() => toggleCookingTime(time)}
              >
                {COOKING_TIME_LABELS[time]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Difficulty Filter */}
        <DropdownMenu
          open={isDifficultyDropdownOpen}
          onOpenChange={setIsDifficultyDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Difficulty
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {DIFFICULTY_OPTIONS.map((difficulty: Difficulty) => (
              <DropdownMenuCheckboxItem
                key={difficulty}
                checked={filters.difficulty?.includes(difficulty) || false}
                onCheckedChange={() => toggleDifficulty(difficulty)}
              >
                {DIFFICULTY_LABELS[difficulty]}
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
      {(filters.categories?.length ||
        filters.cookingTime?.length ||
        filters.difficulty?.length) && (
        <div className="flex flex-wrap gap-2">
          {/* Category Chips */}
          {filters.categories?.map((category: string) => (
            <CategoryChip
              key={category}
              category={category}
              size="sm"
              onClick={() => toggleCategory(category)}
            />
          ))}

          {/* Cooking Time Chips */}
          {filters.cookingTime?.map((time: CookingTime) => (
            <CategoryChip
              key={time}
              category={COOKING_TIME_LABELS[time]}
              size="sm"
              onClick={() => toggleCookingTime(time)}
            />
          ))}

          {/* Difficulty Chips */}
          {filters.difficulty?.map((difficulty: Difficulty) => (
            <CategoryChip
              key={difficulty}
              category={DIFFICULTY_LABELS[difficulty]}
              size="sm"
              onClick={() => toggleDifficulty(difficulty)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryFilter } from '@/components/ui/category-filter';
import { CuisineFilter } from '@/components/ui/cuisine-filter';
import { MoodFilter } from '@/components/ui/mood-filter';
import { IngredientFilter } from '@/components/ui/ingredient-filter';
import CategoryChip from '@/components/ui/CategoryChip';
// Domain-specific data imports - each from their specialized source
import { CUISINE_OPTIONS, CUISINE_LABELS } from '@/lib/cuisines'; // Regional cuisine definitions
import { CANONICAL_CATEGORIES } from '@/lib/categories'; // Namespaced category system
import { MOOD_OPTIONS } from '@/lib/moods'; // Flavor and mood definitions
import { useGroceries } from '@/hooks/useGroceries';

// Type definitions
import type { RecipeFilters, Cuisine, Mood, SortOption } from '@/lib/types';

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
  const groceries = useGroceries();

  const updateFilters = (updates: Partial<RecipeFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  // Get available ingredients from selected groceries
  const availableIngredients = Object.values(groceries.groceries).flat();

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: filters.searchTerm, // Keep search term
      sortBy: filters.sortBy, // Keep sort
      sortOrder: filters.sortOrder,
    });
  };

  const hasActiveFilters = !!(
    filters.categories?.length ||
    filters.cuisine?.length ||
    filters.moods?.length
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
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0">
        {/* Left side - Main filters (Categories, Cuisine, Mood, Ingredients) */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:gap-2">
          {/* Categories Filter */}
          <CategoryFilter
            selectedCategories={filters.categories || []}
            onCategoriesChange={(categories) => updateFilters({ categories })}
            availableCategories={CANONICAL_CATEGORIES}
            placeholder="Filter by categories..."
            className="w-full sm:w-36"
          />

          {/* Cuisine Filter */}
          <CuisineFilter
            selectedCuisines={filters.cuisine || []}
            onCuisinesChange={(cuisines) =>
              updateFilters({ cuisine: cuisines })
            }
            availableCuisines={CUISINE_OPTIONS}
            placeholder="Filter by cuisine..."
            className="w-full sm:w-36"
          />

          {/* Mood Filter */}
          <MoodFilter
            selectedMoods={filters.moods || []}
            onMoodsChange={(moods) => updateFilters({ moods })}
            availableMoods={MOOD_OPTIONS}
            placeholder="Filter by mood..."
            className="w-full sm:w-36"
          />

          {/* Ingredient Filter */}
          <IngredientFilter
            selectedIngredients={filters.availableIngredients || []}
            onIngredientsChange={(ingredients) =>
              updateFilters({ availableIngredients: ingredients })
            }
            availableIngredients={availableIngredients}
            placeholder="Filter by ingredients..."
            className="w-full sm:w-36"
          />
        </div>

        {/* Right side - Date/Sort options and clear filters */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:gap-2 sm:ml-auto">
          {/* Sort Options */}
          <Select
            value={filters.sortBy || 'date'}
            onValueChange={(value: SortOption) =>
              updateFilters({ sortBy: value })
            }
          >
            <SelectTrigger className="w-full sm:w-32">
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
            <SelectTrigger className="w-full sm:w-20">
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
              className="w-full sm:w-auto text-gray-500 hover:text-gray-700"
            >
              <X className="mr-1 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.categories?.length ||
        filters.cuisine?.length ||
        filters.moods?.length) && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Category Chips */}
          {filters.categories?.map((category: string) => (
            <CategoryChip
              key={category}
              category={category}
              onRemove={() => {
                const newCategories =
                  filters.categories?.filter((c) => c !== category) || [];
                updateFilters({ categories: newCategories });
              }}
              variant="removable"
            />
          ))}

          {/* Cuisine Chips */}
          {filters.cuisine?.map((cuisine: Cuisine) => (
            <CategoryChip
              key={cuisine}
              category={CUISINE_LABELS[cuisine]}
              onRemove={() => {
                const newCuisines =
                  filters.cuisine?.filter((c) => c !== cuisine) || [];
                updateFilters({ cuisine: newCuisines });
              }}
              variant="removable"
            />
          ))}

          {/* Mood Chips */}
          {filters.moods?.map((mood: Mood) => (
            <CategoryChip
              key={mood}
              category={mood}
              onRemove={() => {
                const newMoods = filters.moods?.filter((m) => m !== mood) || [];
                updateFilters({ moods: newMoods });
              }}
              variant="removable"
            />
          ))}
        </div>
      )}
    </div>
  );
}

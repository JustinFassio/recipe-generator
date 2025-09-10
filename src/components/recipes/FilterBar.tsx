import { Button } from '@/components/ui/button';
import { useFilterBar } from '@/hooks/useFilterBar';
import type { RecipeFilters } from '@/lib/types';

interface FilterBarProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  variant?: 'horizontal' | 'drawer' | 'auto';
  totalRecipes?: number;
  filteredCount?: number;
  className?: string;
}

export function FilterBar({
  filters,
  onFiltersChange,
  variant = 'auto',
  totalRecipes = 0,
  filteredCount = 0,
  className = '',
}: FilterBarProps) {
  const { clearAllFilters, hasActiveFilters, activeFilterCount, isDesktop } =
    useFilterBar(filters, onFiltersChange);

  // Responsive variant determination
  const effectiveVariant =
    variant === 'auto' ? (isDesktop ? 'horizontal' : 'drawer') : variant;

  return (
    <div
      className={`filter-bar ${effectiveVariant} ${className}`}
      data-testid={`filter-bar-${effectiveVariant}`}
    >
      {/* Component shell - detailed implementation in PR 2 */}
      <div className="p-4 border rounded-lg bg-base-100">
        <div className="text-center text-gray-600">
          <p>FilterBar Foundation - {effectiveVariant} layout</p>
          <p className="text-sm mt-2">
            Active filters: {activeFilterCount} | Total recipes: {totalRecipes}{' '}
            | Filtered: {filteredCount}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="mt-2"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

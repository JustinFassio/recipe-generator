# Phase 2: Core Implementation (3 days)

**Status**: 📋 Waiting for Phase 1  
**Duration**: 3 days  
**PRs**: 3 PRs  
**Goal**: Build fully functional unified FilterBar component

---

## 🎯 Phase Objectives

### **Primary Goals**

- Complete FilterBar responsive layout system
- Integrate all filter logic and state management
- Implement search and sort functionality
- Add active filter display and management
- Achieve feature parity with existing implementation

### **Success Criteria**

- ✅ Fully functional FilterBar component
- ✅ Complete responsive behavior (mobile/tablet/desktop)
- ✅ All filter types working correctly
- ✅ Search and sort functionality operational
- ✅ State management fully integrated
- ✅ Ready for page integration

---

## 📋 PR Breakdown

### **PR 3: Implement Responsive Layout System**

**Branch**: `feature/filter-bar-modernization-03-responsive`  
**Estimated Time**: 1 day  
**Lines Changed**: ~300 lines

#### **Files to Modify**

```
src/components/recipes/FilterBar.tsx (major update)
src/components/recipes/filters/*.tsx (layout updates)
src/__tests__/components/recipes/FilterBar.test.tsx (responsive tests)
```

#### **Responsive Layout Implementation**

##### **FilterBar.tsx - Complete Implementation**

```typescript
import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CategoryFilterSection } from './filters/CategoryFilterSection';
import { CuisineFilterSection } from './filters/CuisineFilterSection';
import { MoodFilterSection } from './filters/MoodFilterSection';
import { IngredientFilterSection } from './filters/IngredientFilterSection';
import { useFilterBar } from '../hooks/useFilterBar';
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
  const {
    localFilters,
    updateFilter,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount,
    isMobile,
    isTablet,
    isDesktop,
  } = useFilterBar(filters, onFiltersChange);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Determine effective variant based on screen size
  const effectiveVariant = variant === 'auto'
    ? (isDesktop ? 'horizontal' : (isTablet ? 'accordion' : 'drawer'))
    : variant;

  // Desktop Horizontal Layout
  if (effectiveVariant === 'horizontal') {
    return (
      <div className={`filter-bar-horizontal ${className}`}>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search recipes, ingredients, or instructions..."
              value={localFilters.searchTerm || ''}
              onChange={(e) => updateFilter({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0">
            {/* Main Filters */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:gap-2">
              <CategoryFilterSection
                selectedCategories={localFilters.categories || []}
                onCategoriesChange={(categories) => updateFilter({ categories })}
                variant="dropdown"
                className="w-full sm:w-36"
              />

              <CuisineFilterSection
                selectedCuisines={localFilters.cuisine || []}
                onCuisinesChange={(cuisines) => updateFilter({ cuisine: cuisines })}
                variant="dropdown"
                className="w-full sm:w-36"
              />

              <MoodFilterSection
                selectedMoods={localFilters.moods || []}
                onMoodsChange={(moods) => updateFilter({ moods })}
                variant="dropdown"
                className="w-full sm:w-36"
              />

              <IngredientFilterSection
                selectedIngredients={localFilters.availableIngredients || []}
                onIngredientsChange={(ingredients) => updateFilter({ availableIngredients: ingredients })}
                variant="dropdown"
                className="w-full sm:w-36"
              />
            </div>

            {/* Sort and Clear */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:gap-2 sm:ml-auto">
              {/* Sort controls will be added in PR 5 */}

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

          {/* Active Filters Display - will be added in PR 4 */}
        </div>
      </div>
    );
  }

  // Tablet Accordion Layout
  if (effectiveVariant === 'accordion') {
    return (
      <div className={`filter-bar-accordion ${className}`}>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search recipes..."
              value={localFilters.searchTerm || ''}
              onChange={(e) => updateFilter({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Collapsible Filter Sections */}
          <div className="space-y-2">
            <CategoryFilterSection
              selectedCategories={localFilters.categories || []}
              onCategoriesChange={(categories) => updateFilter({ categories })}
              variant="accordion"
            />

            <CuisineFilterSection
              selectedCuisines={localFilters.cuisine || []}
              onCuisinesChange={(cuisines) => updateFilter({ cuisine: cuisines })}
              variant="accordion"
            />

            <MoodFilterSection
              selectedMoods={localFilters.moods || []}
              onMoodsChange={(moods) => updateFilter({ moods })}
              variant="accordion"
            />

            <IngredientFilterSection
              selectedIngredients={localFilters.availableIngredients || []}
              onIngredientsChange={(ingredients) => updateFilter({ availableIngredients: ingredients })}
              variant="accordion"
            />
          </div>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Clear All Filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Mobile Drawer Layout
  return (
    <div className={`filter-bar-drawer ${className}`}>
      {/* Filter Trigger Button */}
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => setIsDrawerOpen(true)}
      >
        <Filter className="mr-2 h-5 w-5" />
        Filters & Search
        {hasActiveFilters && (
          <Badge variant="secondary" className="ml-2">
            {activeFilterCount}
          </Badge>
        )}
        <ChevronDown className="ml-auto h-4 w-4" />
      </Button>

      {/* Drawer Implementation - will use existing NestedDrawer component */}
      {/* Drawer content will be implemented with filter sections in drawer variant */}
    </div>
  );
}
```

#### **Enhanced Filter Section Variants**

Each filter section needs to support three variants:

##### **Dropdown Variant (Desktop)**

```typescript
// In CategoryFilterSection.tsx
if (variant === 'dropdown') {
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="justify-start">
          <Filter className="mr-2 h-4 w-4" />
          Categories
          {selectedCategories.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedCategories.length}
            </Badge>
          )}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-4">
        {/* Dropdown content with search and grouped categories */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

##### **Accordion Variant (Tablet)**

```typescript
// Accordion implementation
if (variant === 'accordion') {
  return (
    <div className="border rounded-lg">
      <Button
        variant="ghost"
        className="w-full justify-between p-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center">
          Categories
          {selectedCategories.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedCategories.length}
            </Badge>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="p-4 pt-0 border-t">
          {/* Accordion content */}
        </div>
      )}
    </div>
  );
}
```

##### **Drawer Variant (Mobile)**

```typescript
// Drawer implementation - integrates with existing drawer system
if (variant === 'drawer') {
  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => onOpenSection('categories')}
      >
        <span>
          Categories
          {selectedCategories.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              ({selectedCategories.length} selected)
            </span>
          )}
        </span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

#### **CSS Responsive System**

```css
/* FilterBar responsive styles */
.filter-bar-horizontal {
  @apply space-y-4;
}

.filter-bar-accordion {
  @apply space-y-4;
}

.filter-bar-drawer {
  @apply space-y-2;
}

/* Responsive breakpoints */
@media (min-width: 1024px) {
  .filter-bar-auto {
    @apply filter-bar-horizontal;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .filter-bar-auto {
    @apply filter-bar-accordion;
  }
}

@media (max-width: 767px) {
  .filter-bar-auto {
    @apply filter-bar-drawer;
  }
}
```

#### **Acceptance Criteria PR 3**

- [ ] All three layout variants implemented
- [ ] Smooth transitions between layouts
- [ ] Responsive behavior works correctly
- [ ] Touch interactions optimized for mobile
- [ ] Visual consistency across variants
- [ ] Performance optimized for layout changes

---

### **PR 4: Integrate Filter Logic and State Management**

**Branch**: `feature/filter-bar-modernization-04-logic`  
**Estimated Time**: 1 day  
**Lines Changed**: ~250 lines

#### **Files to Modify**

```
src/hooks/useFilterBar.ts (major enhancement)
src/components/recipes/FilterBar.tsx (add active filter display)
src/components/recipes/filters/*.tsx (integrate filter logic)
```

#### **Enhanced useFilterBar Hook**

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { useGroceries } from '@/hooks/useGroceries';
import type { RecipeFilters, Cuisine, Mood } from '@/lib/types';

export function useFilterBar(
  filters: RecipeFilters,
  onFiltersChange: (filters: RecipeFilters) => void
) {
  const [localFilters, setLocalFilters] = useState<RecipeFilters>(filters);
  const { isMobile, isTablet, isDesktop } = useMobileDetection();
  const groceries = useGroceries();

  // Sync with external filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Get available ingredients from groceries
  const availableIngredients = useMemo(() => {
    return Object.values(groceries.groceries).flat();
  }, [groceries.groceries]);

  const updateFilter = useCallback(
    (updates: Partial<RecipeFilters>) => {
      const newFilters = { ...localFilters, ...updates };
      setLocalFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [localFilters, onFiltersChange]
  );

  const clearAllFilters = useCallback(() => {
    const clearedFilters: RecipeFilters = {
      searchTerm: undefined,
      categories: undefined,
      cuisine: undefined,
      moods: undefined,
      availableIngredients: undefined,
      sortBy: localFilters.sortBy || 'date',
      sortOrder: localFilters.sortOrder || 'desc',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [localFilters.sortBy, localFilters.sortOrder, onFiltersChange]);

  const removeFilter = useCallback(
    (filterType: string, value: string) => {
      const updates: Partial<RecipeFilters> = {};

      switch (filterType) {
        case 'category':
          updates.categories = localFilters.categories?.filter(
            (c) => c !== value
          );
          break;
        case 'cuisine':
          updates.cuisine = localFilters.cuisine?.filter(
            (c) => c !== value
          ) as Cuisine[];
          break;
        case 'mood':
          updates.moods = localFilters.moods?.filter(
            (m) => m !== value
          ) as Mood[];
          break;
        case 'ingredient':
          updates.availableIngredients =
            localFilters.availableIngredients?.filter((i) => i !== value);
          break;
        case 'search':
          updates.searchTerm = undefined;
          break;
      }

      updateFilter(updates);
    },
    [localFilters, updateFilter]
  );

  const hasActiveFilters = useMemo(() => {
    return !!(
      localFilters.searchTerm ||
      localFilters.categories?.length ||
      localFilters.cuisine?.length ||
      localFilters.moods?.length ||
      localFilters.availableIngredients?.length
    );
  }, [localFilters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.searchTerm) count++;
    if (localFilters.categories?.length) count++;
    if (localFilters.cuisine?.length) count++;
    if (localFilters.moods?.length) count++;
    if (localFilters.availableIngredients?.length) count++;
    return count;
  }, [localFilters]);

  const activeFilters = useMemo(() => {
    const filters: Array<{ type: string; value: string; label: string }> = [];

    if (localFilters.searchTerm) {
      filters.push({
        type: 'search',
        value: localFilters.searchTerm,
        label: `Search: "${localFilters.searchTerm}"`,
      });
    }

    localFilters.categories?.forEach((category) => {
      filters.push({
        type: 'category',
        value: category,
        label: category,
      });
    });

    localFilters.cuisine?.forEach((cuisine) => {
      filters.push({
        type: 'cuisine',
        value: cuisine,
        label: cuisine,
      });
    });

    localFilters.moods?.forEach((mood) => {
      filters.push({
        type: 'mood',
        value: mood,
        label: mood,
      });
    });

    localFilters.availableIngredients?.forEach((ingredient) => {
      filters.push({
        type: 'ingredient',
        value: ingredient,
        label: ingredient,
      });
    });

    return filters;
  }, [localFilters]);

  return {
    localFilters,
    updateFilter,
    clearAllFilters,
    removeFilter,
    hasActiveFilters,
    activeFilterCount,
    activeFilters,
    availableIngredients,
    isMobile,
    isTablet,
    isDesktop,
  };
}
```

#### **Active Filters Display Component**

```typescript
// Add to FilterBar.tsx
const ActiveFiltersDisplay = ({ activeFilters, onRemoveFilter, onClearAll }) => {
  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map(({ type, value, label }) => (
        <Badge
          key={`${type}-${value}`}
          variant="secondary"
          className="flex items-center gap-1"
        >
          {label}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveFilter(type, value)}
            className="h-3 w-3 p-0 hover:bg-transparent"
          >
            <X className="h-2 w-2" />
          </Button>
        </Badge>
      ))}

      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear All
        </Button>
      )}
    </div>
  );
};
```

#### **Filter Logic Integration**

Each filter section needs to integrate the actual filtering logic from the existing components:

- **CategoryFilter**: Namespace parsing and grouping
- **CuisineFilter**: Regional grouping and cuisine labels
- **MoodFilter**: Mood regions and descriptions
- **IngredientFilter**: Grocery category grouping

#### **Acceptance Criteria PR 4**

- [ ] All filter logic integrated correctly
- [ ] Active filters display and removal works
- [ ] State management handles all filter types
- [ ] Filter chips show correct labels
- [ ] Clear functionality works for individual and all filters
- [ ] Filter state persists correctly

---

### **PR 5: Add Search and Sort Functionality**

**Branch**: `feature/filter-bar-modernization-05-search-sort`  
**Estimated Time**: 1 day  
**Lines Changed**: ~150 lines

#### **Files to Modify**

```
src/components/recipes/FilterBar.tsx (add sort controls)
src/hooks/useFilterBar.ts (add sort logic)
```

#### **Sort Controls Implementation**

```typescript
// Add to FilterBar.tsx
const SortControls = ({ sortBy, sortOrder, onSortChange }) => {
  return (
    <div className="flex gap-2">
      {/* Sort By */}
      <Select
        value={sortBy || 'date'}
        onValueChange={(value) => onSortChange({ sortBy: value })}
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
        value={sortOrder || 'desc'}
        onValueChange={(value) => onSortChange({ sortOrder: value })}
      >
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">↓</SelectItem>
          <SelectItem value="asc">↑</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
```

#### **Enhanced Search Implementation**

```typescript
// Enhanced search with debouncing
const useSearchDebounce = (searchTerm: string, delay: number = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  return debouncedTerm;
};
```

#### **Results Count Display**

```typescript
// Add to FilterBar.tsx
const ResultsCount = ({ totalRecipes, filteredCount, hasActiveFilters }) => {
  return (
    <div className="text-sm text-gray-600">
      {hasActiveFilters
        ? `${filteredCount} of ${totalRecipes} recipes`
        : `${totalRecipes} recipes`
      }
    </div>
  );
};
```

#### **Acceptance Criteria PR 5**

- [ ] Sort controls work correctly
- [ ] Search has appropriate debouncing
- [ ] Results count displays accurately
- [ ] Sort and search integrate with existing filter logic
- [ ] Performance is optimized for large recipe lists

---

## 🧪 Testing Strategy

### **Responsive Layout Tests**

```typescript
describe('FilterBar Responsive Layout', () => {
  it('renders horizontal layout on desktop', () => {});
  it('renders accordion layout on tablet', () => {});
  it('renders drawer layout on mobile', () => {});
  it('adapts layout when screen size changes', () => {});
  it('maintains state across layout changes', () => {});
});
```

### **Filter Logic Tests**

```typescript
describe('FilterBar Filter Logic', () => {
  it('applies category filters correctly', () => {});
  it('applies multiple filter types simultaneously', () => {});
  it('removes individual filters correctly', () => {});
  it('clears all filters correctly', () => {});
  it('displays active filters correctly', () => {});
});
```

### **Search and Sort Tests**

```typescript
describe('FilterBar Search and Sort', () => {
  it('debounces search input correctly', () => {});
  it('applies sort by date/title/popularity', () => {});
  it('toggles sort order correctly', () => {});
  it('combines search with other filters', () => {});
});
```

---

## 🔍 Quality Gates

### **Phase 2 Overall Quality Gates**

```bash
# Must pass before Phase 2 completion
npm run build
npx tsc --noEmit
npm run test:run -- src/__tests__/components/recipes/FilterBar.test.tsx
npm run test:run -- src/__tests__/components/recipes/filters/
npm run test:run -- src/__tests__/hooks/useFilterBar.test.tsx
npm run lint
npm run format:check
```

### **Manual QA Checklist**

- [ ] All three layout variants work correctly
- [ ] Filter selection/deselection works in all variants
- [ ] Search functionality works with debouncing
- [ ] Sort controls update results correctly
- [ ] Active filter display and removal works
- [ ] Clear all filters functionality works
- [ ] State persists across layout changes
- [ ] Performance is acceptable on all devices
- [ ] No console errors or warnings

---

## 📊 Phase 2 Success Metrics

### **Functional Completeness**

- ✅ All existing filter functionality replicated
- ✅ Responsive behavior across all screen sizes
- ✅ Search and sort functionality operational
- ✅ State management fully integrated

### **Code Quality**

- ✅ ~800 lines of code (vs 2,500 current)
- ✅ Single component architecture
- ✅ Comprehensive test coverage (>95%)
- ✅ TypeScript strict mode compliance

### **Performance**

- ✅ Fast filter application (<100ms)
- ✅ Smooth layout transitions
- ✅ Optimized bundle size
- ✅ Efficient re-rendering

---

## 🔄 Phase 2 → Phase 3 Handoff

### **What's Complete After Phase 2**

- Fully functional FilterBar component
- All filter types implemented and tested
- Responsive layout system working
- Search and sort functionality operational
- State management fully integrated
- Comprehensive test coverage

### **What's Next (Phase 3)**

- Integration with existing pages
- Migration from old components
- URL persistence integration
- Context integration for ChatRecipePage
- Backward compatibility handling

### **Phase 3 Dependencies**

- FilterBar must be feature-complete
- All tests must pass
- Performance benchmarks met
- Component API stable and documented

---

**Phase 2 Status**: 📋 Waiting for Phase 1 Completion  
**Next Action**: Begin PR 3 after Phase 1 completion  
**Success Metric**: Feature-complete FilterBar ready for integration  
**Timeline**: 3 days for complete Phase 2 implementation

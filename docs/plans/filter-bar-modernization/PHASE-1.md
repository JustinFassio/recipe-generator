# Phase 1: Foundation & Design (2 days)

**Status**: 📋 Ready to Start  
**Duration**: 2 days  
**PRs**: 2 PRs  
**Goal**: Create new component structure and design system

---

## 🎯 Phase Objectives

### **Primary Goals**

- Create new FilterBar component foundation
- Establish responsive design system
- Build filter section components
- Set up consolidated state management
- Establish testing patterns

### **Success Criteria**

- ✅ New component structure in place
- ✅ Responsive layout foundation working
- ✅ All filter sections implemented and tested
- ✅ State management hook created
- ✅ No integration yet (isolated development)

---

## 📋 PR Breakdown

### **PR 1: Create New Component Foundation**

**Branch**: `feature/filter-bar-modernization-01-foundation`  
**Estimated Time**: 1 day  
**Lines Changed**: ~200 lines

#### **Files to Create**

```
src/components/recipes/FilterBar.tsx
src/hooks/useFilterBar.ts
src/components/recipes/filters/ (directory)
src/__tests__/components/recipes/FilterBar.test.tsx
src/__tests__/hooks/useFilterBar.test.tsx
```

#### **FilterBar.tsx Implementation**

```typescript
import React from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    isDesktop,
    isMobile,
  } = useFilterBar(filters, onFiltersChange);

  // Responsive variant determination
  const effectiveVariant = variant === 'auto'
    ? (isDesktop ? 'horizontal' : 'drawer')
    : variant;

  return (
    <div className={`filter-bar ${effectiveVariant} ${className}`}>
      {/* Component shell - detailed implementation in PR 2 */}
      <div>FilterBar Foundation - {effectiveVariant} layout</div>
    </div>
  );
}
```

#### **useFilterBar.ts Implementation**

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import type { RecipeFilters } from '@/lib/types';

export function useFilterBar(
  filters: RecipeFilters,
  onFiltersChange: (filters: RecipeFilters) => void
) {
  const [localFilters, setLocalFilters] = useState<RecipeFilters>(filters);
  const { isMobile, isDesktop } = useMobileDetection();

  // Sync with external filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

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
      searchTerm: '',
      sortBy: 'date',
      sortOrder: 'desc',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [onFiltersChange]);

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

  return {
    localFilters,
    updateFilter,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount,
    isMobile,
    isDesktop,
  };
}
```

#### **Tests to Create**

- **FilterBar.test.tsx**: Basic render, props, responsive behavior
- **useFilterBar.test.tsx**: State management, filter updates, clear functionality

#### **Acceptance Criteria**

- [ ] FilterBar component renders without errors
- [ ] useFilterBar hook manages state correctly
- [ ] Responsive detection works
- [ ] Tests pass
- [ ] Build succeeds

---

### **PR 2: Implement Filter Section Components**

**Branch**: `feature/filter-bar-modernization-02-sections`  
**Estimated Time**: 1 day  
**Lines Changed**: ~400 lines

#### **Files to Create**

```
src/components/recipes/filters/CategoryFilterSection.tsx
src/components/recipes/filters/CuisineFilterSection.tsx
src/components/recipes/filters/MoodFilterSection.tsx
src/components/recipes/filters/IngredientFilterSection.tsx
src/components/recipes/filters/index.ts (exports)
src/__tests__/components/recipes/filters/ (test files)
```

#### **Shared Filter Section Pattern**

```typescript
interface FilterSectionProps {
  title: string;
  selectedValues: string[];
  availableOptions: FilterOption[];
  onValuesChange: (values: string[]) => void;
  searchable?: boolean;
  grouped?: boolean;
  variant: 'dropdown' | 'accordion' | 'drawer';
  placeholder?: string;
  className?: string;
}

interface FilterOption {
  value: string;
  label: string;
  group?: string;
  icon?: string;
}
```

#### **CategoryFilterSection.tsx**

```typescript
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { CANONICAL_CATEGORIES } from '@/lib/categories';
import { parseCategory } from '@/lib/category-parsing';

interface CategoryFilterSectionProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  variant: 'dropdown' | 'accordion' | 'drawer';
  className?: string;
}

export function CategoryFilterSection({
  selectedCategories,
  onCategoriesChange,
  variant,
  className = '',
}: CategoryFilterSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Group categories by namespace
  const groupedCategories = useMemo(() => {
    return CANONICAL_CATEGORIES.reduce((groups, category) => {
      const { namespace } = parseCategory(category);
      const groupKey = namespace || 'Other';

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(category);
      return groups;
    }, {} as Record<string, string[]>);
  }, []);

  // Filter categories based on search
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedCategories;

    return Object.entries(groupedCategories).reduce((filtered, [namespace, categories]) => {
      const matchingCategories = categories.filter(category =>
        category.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (matchingCategories.length > 0) {
        filtered[namespace] = matchingCategories;
      }

      return filtered;
    }, {} as Record<string, string[]>);
  }, [groupedCategories, searchTerm]);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  // Render based on variant
  if (variant === 'dropdown') {
    return (
      <div className={`category-filter-dropdown ${className}`}>
        {/* Desktop dropdown implementation */}
      </div>
    );
  }

  if (variant === 'accordion') {
    return (
      <div className={`category-filter-accordion ${className}`}>
        {/* Mobile accordion implementation */}
      </div>
    );
  }

  return (
    <div className={`category-filter-drawer ${className}`}>
      {/* Drawer implementation */}
    </div>
  );
}
```

#### **Similar Implementation for Other Filters**

- **CuisineFilterSection**: Region-grouped cuisine selection
- **MoodFilterSection**: Mood-grouped flavor profiles
- **IngredientFilterSection**: Category-grouped ingredients

#### **Tests to Create**

- **CategoryFilterSection.test.tsx**: Selection, search, grouping
- **CuisineFilterSection.test.tsx**: Regional grouping, selection
- **MoodFilterSection.test.tsx**: Mood grouping, selection
- **IngredientFilterSection.test.tsx**: Ingredient categories, selection

#### **Acceptance Criteria**

- [ ] All filter sections render correctly
- [ ] Search functionality works within each section
- [ ] Selection/deselection works properly
- [ ] Grouping displays correctly
- [ ] Responsive variants implemented
- [ ] Tests pass for all sections

---

## 🧪 Testing Strategy

### **Unit Tests**

```typescript
// FilterBar.test.tsx
describe('FilterBar', () => {
  it('renders without errors', () => {});
  it('applies correct variant based on screen size', () => {});
  it('passes filters to child components', () => {});
  it('calls onFiltersChange when filters update', () => {});
});

// useFilterBar.test.tsx
describe('useFilterBar', () => {
  it('manages local filter state', () => {});
  it('syncs with external filters', () => {});
  it('clears all filters correctly', () => {});
  it('calculates active filter count', () => {});
});

// Filter section tests
describe('CategoryFilterSection', () => {
  it('renders categories grouped by namespace', () => {});
  it('filters categories based on search', () => {});
  it('toggles category selection', () => {});
  it('adapts to different variants', () => {});
});
```

### **Integration Tests**

```typescript
describe('FilterBar Integration', () => {
  it('integrates all filter sections correctly', () => {});
  it('maintains state consistency across sections', () => {});
  it('handles responsive layout changes', () => {});
});
```

---

## 🔍 Quality Gates

### **PR 1 Quality Gates**

```bash
# Must pass before merge
npm run build          # TypeScript compilation
npx tsc --noEmit       # Type checking
npm run test:run -- src/__tests__/components/recipes/FilterBar.test.tsx
npm run test:run -- src/__tests__/hooks/useFilterBar.test.tsx
npm run lint           # ESLint checks
npm run format:check   # Prettier formatting
```

### **PR 2 Quality Gates**

```bash
# Must pass before merge
npm run build
npx tsc --noEmit
npm run test:run -- src/__tests__/components/recipes/filters/
npm run lint
npm run format:check
```

### **Manual QA Checklist**

- [ ] FilterBar renders in isolation
- [ ] All filter sections display correctly
- [ ] Search functionality works in each section
- [ ] Selection states update properly
- [ ] Responsive behavior works (desktop/mobile)
- [ ] No console errors or warnings
- [ ] TypeScript compilation successful
- [ ] All tests pass

---

## 📁 File Organization

### **Directory Structure After Phase 1**

```
src/components/recipes/
├── FilterBar.tsx ✨ (new - main component)
├── filters/ ✨ (new directory)
│   ├── CategoryFilterSection.tsx ✨
│   ├── CuisineFilterSection.tsx ✨
│   ├── MoodFilterSection.tsx ✨
│   ├── IngredientFilterSection.tsx ✨
│   └── index.ts ✨
├── hooks/ ✨ (new directory)
│   └── useFilterBar.ts ✨
└── (existing components unchanged)

src/__tests__/components/recipes/
├── FilterBar.test.tsx ✨
├── filters/ ✨
│   ├── CategoryFilterSection.test.tsx ✨
│   ├── CuisineFilterSection.test.tsx ✨
│   ├── MoodFilterSection.test.tsx ✨
│   └── IngredientFilterSection.test.tsx ✨
└── hooks/ ✨
    └── useFilterBar.test.tsx ✨
```

---

## 🚀 Phase 1 Completion Criteria

### **Technical Deliverables**

- ✅ FilterBar component foundation created
- ✅ useFilterBar hook implemented
- ✅ All 4 filter sections implemented
- ✅ Responsive variant system working
- ✅ Comprehensive test coverage

### **Quality Metrics**

- ✅ All tests passing (>95% coverage)
- ✅ TypeScript compilation successful
- ✅ ESLint/Prettier checks passing
- ✅ No runtime errors or warnings

### **Functional Verification**

- ✅ Components render correctly in isolation
- ✅ Filter selection/deselection works
- ✅ Search functionality operational
- ✅ Responsive behavior functional
- ✅ State management working

---

## 🔄 Phase 1 → Phase 2 Handoff

### **What's Complete**

- New component architecture established
- Filter sections implemented and tested
- State management foundation in place
- Responsive design system working

### **What's Next (Phase 2)**

- Implement complete responsive layout system
- Add full filter logic integration
- Implement search and sort functionality
- Add active filter display and management
- Complete FilterBar implementation

### **Dependencies for Phase 2**

- Phase 1 components must be fully tested
- All quality gates must pass
- Component interfaces must be stable
- No breaking changes to established patterns

---

**Phase 1 Status**: 📋 Ready to Begin  
**Next Action**: Create PR 1 - Component Foundation  
**Success Metric**: Foundation components working in isolation  
**Timeline**: 2 days for complete Phase 1 implementation

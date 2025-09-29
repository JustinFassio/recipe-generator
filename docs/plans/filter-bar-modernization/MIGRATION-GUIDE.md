# FilterBar Migration Guide

**Target Audience**: Developers working on the Recipe Generator codebase  
**Purpose**: Guide for migrating from the old multi-component filter system to the new unified FilterBar  
**Status**: Implementation Guide

---

## 🎯 Migration Overview

### **What's Changing**

- **From**: 15+ overlapping filter components with different patterns
- **To**: Single responsive FilterBar component with unified API

### **Why This Migration**

- **93% component reduction** (15+ → 1)
- **68% code reduction** (~2,500 → ~800 lines)
- **Consistent user experience** across all devices
- **Easier maintenance** and development

---

## 📋 Component Migration Map

### **Old Components → New Component**

#### **Core Components (Replaced)**

```typescript
// OLD - Multiple components for different contexts
import { FilterBar } from '@/components/recipes/filter-bar'; // ❌ Remove
import { HybridFilterBar } from '@/components/recipes/hybrid-filter-bar'; // ❌ Remove
import { FilterDrawerContainer } from '@/components/recipes/filter-drawer-container'; // ❌ Remove
import { FilterDrawer } from '@/components/recipes/filter-drawer'; // ❌ Remove

// NEW - Single unified component
import { FilterBar } from '@/components/recipes/FilterBar'; // ✅ Use this
```

#### **Individual Filters (Replaced)**

```typescript
// OLD - Desktop dropdown components
import { CategoryFilter } from '@/components/ui/category-filter'; // ❌ Remove
import { CuisineFilter } from '@/components/ui/cuisine-filter'; // ❌ Remove
import { MoodFilter } from '@/components/ui/mood-filter'; // ❌ Remove
import { IngredientFilter } from '@/components/ui/ingredient-filter'; // ❌ Remove

// NEW - Integrated into FilterBar (no separate imports needed)
// FilterBar handles all filter types internally
```

#### **Mobile Drawer Components (Replaced)**

```typescript
// OLD - Mobile-specific drawer components
import { CategorySelectionDrawer } from '@/components/recipes/category-selection-drawer'; // ❌ Remove
import { CuisineSelectionDrawer } from '@/components/recipes/cuisine-selection-drawer'; // ❌ Remove
import { MoodSelectionDrawer } from '@/components/recipes/mood-selection-drawer'; // ❌ Remove
import { IngredientSelectionDrawer } from '@/components/recipes/ingredient-selection-drawer'; // ❌ Remove

// NEW - Integrated into FilterBar responsive system
// FilterBar automatically handles mobile layout
```

#### **State Management Hooks (Replaced)**

```typescript
// OLD - Multiple specialized hooks
import { useNestedDrawer } from '@/hooks/use-nested-drawer'; // ❌ Remove
import { useFilterDrawer } from '@/hooks/use-filter-drawer'; // ❌ Remove

// NEW - Simplified state management
import { useRecipeFilters } from '@/hooks/use-recipe-filters'; // ✅ Keep (unchanged)
// useFilterBar is internal to FilterBar component
```

---

## 🔄 Usage Migration Examples

### **Example 1: RecipesPage Migration**

#### **Before (Old System)**

```typescript
import { HybridFilterBar } from '@/components/recipes/hybrid-filter-bar';
import { useRecipeFilters } from '@/hooks/use-recipe-filters';

export function RecipesPage() {
  const { filters, updateFilters } = useRecipeFilters();
  const { data: recipes = [] } = useRecipes(filters);

  return (
    <div>
      <HybridFilterBar
        filters={filters}
        onFiltersChange={updateFilters}
        totalRecipes={recipes.length}
        filteredCount={recipes.length}
        className="mb-6"
      />
      {/* Rest of page */}
    </div>
  );
}
```

#### **After (New System)**

```typescript
import { FilterBar } from '@/components/recipes/FilterBar';
import { useRecipeFilters } from '@/hooks/use-recipe-filters';

export function RecipesPage() {
  const { filters, updateFilters } = useRecipeFilters();
  const { data: recipes = [] } = useRecipes(filters);

  return (
    <div>
      <FilterBar
        filters={filters}
        onFiltersChange={updateFilters}
        totalRecipes={recipes.length}
        filteredCount={recipes.length}
        className="mb-6"
      />
      {/* Rest of page */}
    </div>
  );
}
```

**Changes**: Only import and component name change. Props remain identical.

### **Example 2: ChatRecipePage Migration**

#### **Before (Old System)**

```typescript
import { HybridFilterBar } from '@/components/recipes/hybrid-filter-bar';
import { useSelections } from '@/contexts/SelectionContext';

export function ChatRecipePage() {
  const { selections, updateSelections } = useSelections();

  return (
    <div>
      <HybridFilterBar
        filters={{
          categories: selections.categories,
          cuisine: selections.cuisines as any,
          moods: selections.moods as any,
          availableIngredients: selections.availableIngredients,
        } as Partial<RecipeFilters> as RecipeFilters}
        onFiltersChange={(f: RecipeFilters) => {
          updateSelections({
            categories: f.categories || [],
            cuisines: (f.cuisine as string[]) || [],
            moods: (f.moods as string[]) || [],
            availableIngredients: f.availableIngredients || [],
          });
        }}
        className="mb-6"
      />
    </div>
  );
}
```

#### **After (New System)**

```typescript
import { FilterBar } from '@/components/recipes/FilterBar';
import { useSelections } from '@/contexts/SelectionContext';
import { useMemo, useCallback } from 'react';
import type { RecipeFilters, Cuisine, Mood } from '@/lib/types';

// Adapter hook for cleaner integration
const useSelectionFilters = () => {
  const { selections, updateSelections } = useSelections();

  const filters: RecipeFilters = useMemo(() => ({
    categories: selections.categories,
    cuisine: selections.cuisines as Cuisine[],
    moods: selections.moods as Mood[],
    availableIngredients: selections.availableIngredients,
    searchTerm: undefined,
    sortBy: 'date',
    sortOrder: 'desc',
  }), [selections]);

  const updateFilters = useCallback((newFilters: RecipeFilters) => {
    updateSelections({
      categories: newFilters.categories || [],
      cuisines: (newFilters.cuisine as string[]) || [],
      moods: (newFilters.moods as string[]) || [],
      availableIngredients: newFilters.availableIngredients || [],
    });
  }, [updateSelections]);

  return { filters, updateFilters };
};

export function ChatRecipePage() {
  const { filters, updateFilters } = useSelectionFilters();

  return (
    <div>
      <FilterBar
        filters={filters}
        onFiltersChange={updateFilters}
        className="mb-6"
      />
    </div>
  );
}
```

**Changes**: Added adapter hook for cleaner SelectionContext integration.

### **Example 3: ExplorePage Migration**

#### **Before (Old System)**

```typescript
import { HybridFilterBar } from '../components/recipes/hybrid-filter-bar';

export default function ExplorePage() {
  const [filters, setFilters] = useState<RecipeFilters>({
    searchTerm: '',
    categories: [],
    cuisine: [],
    moods: [],
    sortBy: 'date',
    sortOrder: 'desc',
  });

  return (
    <div>
      <HybridFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        totalRecipes={recipes.length}
        filteredCount={filteredRecipes.length}
        className="mb-6"
      />
    </div>
  );
}
```

#### **After (New System) - Option 1: Keep Local State**

```typescript
import { FilterBar } from '@/components/recipes/FilterBar';

export default function ExplorePage() {
  const [filters, setFilters] = useState<RecipeFilters>({
    searchTerm: '',
    categories: [],
    cuisine: [],
    moods: [],
    sortBy: 'date',
    sortOrder: 'desc',
  });

  return (
    <div>
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        totalRecipes={recipes.length}
        filteredCount={filteredRecipes.length}
        className="mb-6"
      />
    </div>
  );
}
```

#### **After (New System) - Option 2: Standardize State Management**

```typescript
import { FilterBar } from '@/components/recipes/FilterBar';
import { useRecipeFilters } from '@/hooks/use-recipe-filters';

export default function ExplorePage() {
  const { filters, updateFilters } = useRecipeFilters();

  return (
    <div>
      <FilterBar
        filters={filters}
        onFiltersChange={updateFilters}
        totalRecipes={recipes.length}
        filteredCount={filteredRecipes.length}
        className="mb-6"
      />
    </div>
  );
}
```

**Changes**: Option 1 is minimal change. Option 2 standardizes state management for consistency.

---

## 🔧 API Reference

### **FilterBar Props**

```typescript
interface FilterBarProps {
  /** Current filter state */
  filters: RecipeFilters;

  /** Callback when filters change */
  onFiltersChange: (filters: RecipeFilters) => void;

  /** Layout variant - 'auto' adapts to screen size */
  variant?: 'horizontal' | 'drawer' | 'auto';

  /** Total number of recipes (for results display) */
  totalRecipes?: number;

  /** Number of filtered recipes (for results display) */
  filteredCount?: number;

  /** Additional CSS classes */
  className?: string;
}
```

### **RecipeFilters Interface (Unchanged)**

```typescript
interface RecipeFilters {
  searchTerm?: string;
  categories?: string[];
  cuisine?: Cuisine[];
  moods?: Mood[];
  availableIngredients?: string[];
  sortBy?: 'date' | 'title' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}
```

---

## 📱 Responsive Behavior

### **Automatic Layout Adaptation**

The new FilterBar automatically adapts to different screen sizes:

#### **Desktop (≥1024px)**

- **Layout**: Horizontal filter bar with dropdowns
- **Interaction**: Immediate filter application
- **Display**: Compact, space-efficient design

#### **Tablet (768-1023px)**

- **Layout**: Collapsible filter sections
- **Interaction**: Nested drawer navigation
- **Display**: Touch-optimized controls

#### **Mobile (<768px)**

- **Layout**: Drawer-based interface
- **Interaction**: Full-screen filter selection
- **Display**: Touch-optimized button grids

### **Manual Variant Control**

```typescript
// Force specific layout regardless of screen size
<FilterBar variant="horizontal" {...props} />  // Always horizontal
<FilterBar variant="drawer" {...props} />      // Always drawer
<FilterBar variant="auto" {...props} />        // Responsive (default)
```

---

## 🔄 State Management Migration

### **Recommended Patterns**

#### **Pattern 1: URL Persistence (Recommended for main pages)**

```typescript
import { useRecipeFilters } from '@/hooks/use-recipe-filters';

const { filters, updateFilters } = useRecipeFilters();

<FilterBar
  filters={filters}
  onFiltersChange={updateFilters}
/>
```

#### **Pattern 2: Context Integration (For specialized pages)**

```typescript
// Create adapter hook for context integration
const useContextFilters = () => {
  const { contextState, updateContext } = useYourContext();

  const filters = useMemo(
    () => ({
      // Map context to RecipeFilters
    }),
    [contextState]
  );

  const updateFilters = useCallback(
    (newFilters) => {
      // Map RecipeFilters back to context
    },
    [updateContext]
  );

  return { filters, updateFilters };
};
```

#### **Pattern 3: Local State (For simple cases)**

```typescript
const [filters, setFilters] = useState<RecipeFilters>({
  sortBy: 'date',
  sortOrder: 'desc',
});

<FilterBar
  filters={filters}
  onFiltersChange={setFilters}
/>
```

---

## 🧪 Testing Migration

### **Update Test Files**

#### **Remove Old Tests**

```bash
# Delete tests for removed components
rm src/__tests__/components/recipes/filter-bar.test.tsx
rm src/__tests__/components/recipes/hybrid-filter-bar.test.tsx
rm src/__tests__/components/ui/category-filter.test.tsx
# ... etc
```

#### **Update Page Tests**

```typescript
// Update page integration tests
describe('RecipesPage', () => {
  it('renders FilterBar correctly', () => {
    render(<RecipesPage />);

    // Update selectors to match new FilterBar
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    // ... etc
  });
});
```

### **New Test Patterns**

```typescript
// Test responsive behavior
describe('FilterBar Responsive', () => {
  it('adapts layout to screen size', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200, // Desktop
    });

    render(<FilterBar {...props} />);
    expect(screen.getByTestId('horizontal-layout')).toBeInTheDocument();
  });
});
```

---

## ⚠️ Breaking Changes

### **Component API Changes**

- **No breaking changes**: FilterBar props are compatible with old HybridFilterBar props
- **Import paths**: Update import statements to new component location

### **Behavior Changes**

- **Consistent UX**: Mobile and desktop now have unified behavior patterns
- **Performance**: Improved performance due to reduced component overhead
- **Bundle size**: Smaller bundle due to removed duplicate code

### **Removed Features**

- **Individual filter components**: No longer available as separate components
- **Drawer-specific hooks**: `useNestedDrawer` and `useFilterDrawer` removed

---

## 🚀 Migration Checklist

### **Phase 1: Preparation**

- [ ] Review current filter usage in your code
- [ ] Identify which pages use filter components
- [ ] Plan migration approach (gradual vs all-at-once)
- [ ] Update development environment

### **Phase 2: Code Changes**

- [ ] Update import statements
- [ ] Replace component usage
- [ ] Update state management if needed
- [ ] Add adapter hooks if using contexts

### **Phase 3: Testing**

- [ ] Update test files
- [ ] Test functionality on all screen sizes
- [ ] Verify state management works correctly
- [ ] Test filter combinations

### **Phase 4: Cleanup**

- [ ] Remove old component imports
- [ ] Clean up unused code
- [ ] Update documentation
- [ ] Remove deprecated test files

---

## 🐛 Troubleshooting

### **Common Issues**

#### **Issue: FilterBar not rendering correctly**

```typescript
// Check that you're importing from the correct location
import { FilterBar } from '@/components/recipes/FilterBar'; // ✅ Correct
import { FilterBar } from '@/components/recipes/filter-bar'; // ❌ Old location
```

#### **Issue: State management not working**

```typescript
// Ensure RecipeFilters interface is correctly typed
const filters: RecipeFilters = {
  // All properties should match the interface
  sortBy: 'date',
  sortOrder: 'desc',
};
```

#### **Issue: Mobile layout not working**

```typescript
// Check that responsive detection is working
const { isMobile } = useMobileDetection();
console.log('Is mobile:', isMobile); // Debug responsive detection
```

#### **Issue: Context integration broken**

```typescript
// Use adapter hook pattern for context integration
const useContextFilters = () => {
  // Map between context and RecipeFilters interface
};
```

### **Getting Help**

- **Documentation**: Check updated component documentation
- **Tests**: Look at test files for usage examples
- **Code Review**: Request review for migration changes
- **Team Support**: Ask team for migration assistance

---

## 📞 Support Resources

### **Documentation**

- [FilterBar Component API](./README.md#component-api)
- [Development Guidelines](../DEV-GUIDE.md)
- [Testing Guide](../testing/TESTING-GUIDE.md)

### **Examples**

- [RecipesPage Implementation](../../src/pages/recipes-page.tsx)
- [ChatRecipePage Implementation](../../src/pages/chat-recipe-page.tsx)
- [ExplorePage Implementation](../../src/pages/explore-page.tsx)

### **Migration Support**

- **Code Reviews**: Request review for migration PRs
- **Pair Programming**: Get help with complex migrations
- **Testing Support**: Help with updating test suites

---

**Migration Status**: 📋 Ready for Implementation  
**Support Level**: Full team support available  
**Timeline**: Gradual migration recommended over 1-2 sprints

---

_This migration guide ensures a smooth transition from the old complex filter system to the new unified FilterBar component while maintaining all existing functionality._

# FilterBar Testing Strategy

**Purpose**: Comprehensive testing approach for the FilterBar modernization project  
**Scope**: Unit, integration, performance, and accessibility testing  
**Framework**: Vitest + React Testing Library + Playwright (E2E)

---

## 🎯 Testing Objectives

### **Primary Goals**

- Ensure FilterBar works correctly across all screen sizes
- Verify all filter types function properly
- Confirm state management works consistently
- Validate performance improvements
- Ensure accessibility compliance
- Prevent regressions during migration

### **Quality Targets**

- **Code Coverage**: >95% for FilterBar components
- **Performance**: Filter response time <100ms
- **Accessibility**: WCAG 2.1 AA compliance
- **Cross-browser**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet

---

## 🧪 Testing Pyramid

### **Unit Tests (70%)**

- Individual component functionality
- Hook behavior and state management
- Filter logic and calculations
- Responsive behavior
- Error handling

### **Integration Tests (20%)**

- Component interaction with pages
- State synchronization across components
- Context integration
- URL persistence

### **E2E Tests (10%)**

- Complete user workflows
- Cross-browser compatibility
- Performance benchmarks
- Accessibility validation

---

## 📋 Unit Testing Strategy

### **FilterBar Component Tests**

#### **Core Functionality**

```typescript
// src/__tests__/components/recipes/FilterBar.test.tsx
describe('FilterBar', () => {
  const mockProps = {
    filters: {
      searchTerm: '',
      categories: [],
      cuisine: [],
      moods: [],
      availableIngredients: [],
      sortBy: 'date' as const,
      sortOrder: 'desc' as const,
    },
    onFiltersChange: jest.fn(),
    totalRecipes: 100,
    filteredCount: 25,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('displays correct recipe counts', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.getByText('25 of 100 recipes')).toBeInTheDocument();
    });

    it('shows active filter count when filters applied', () => {
      const propsWithFilters = {
        ...mockProps,
        filters: {
          ...mockProps.filters,
          searchTerm: 'pasta',
          categories: ['Italian'],
        },
      };

      render(<FilterBar {...propsWithFilters} />);
      expect(screen.getByText('2')).toBeInTheDocument(); // Active filter count
    });
  });

  describe('Search Functionality', () => {
    it('calls onFiltersChange when search term changes', () => {
      render(<FilterBar {...mockProps} />);

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'pasta' } });

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...mockProps.filters,
        searchTerm: 'pasta',
      });
    });

    it('debounces search input appropriately', async () => {
      jest.useFakeTimers();
      render(<FilterBar {...mockProps} />);

      const searchInput = screen.getByRole('searchbox');

      // Rapid typing
      fireEvent.change(searchInput, { target: { value: 'p' } });
      fireEvent.change(searchInput, { target: { value: 'pa' } });
      fireEvent.change(searchInput, { target: { value: 'pas' } });
      fireEvent.change(searchInput, { target: { value: 'pasta' } });

      // Should not call onChange until debounce period
      expect(mockProps.onFiltersChange).toHaveBeenCalledTimes(4); // Immediate updates

      jest.useRealTimers();
    });
  });

  describe('Filter Selection', () => {
    it('handles category selection correctly', () => {
      render(<FilterBar {...mockProps} />);

      // Open category dropdown
      const categoryButton = screen.getByText('Categories');
      fireEvent.click(categoryButton);

      // Select a category
      const italianCategory = screen.getByText('Italian');
      fireEvent.click(italianCategory);

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...mockProps.filters,
        categories: ['Italian'],
      });
    });

    it('handles multiple filter types simultaneously', () => {
      const propsWithFilters = {
        ...mockProps,
        filters: {
          ...mockProps.filters,
          categories: ['Italian'],
          cuisine: ['italian'],
        },
      };

      render(<FilterBar {...propsWithFilters} />);

      // Verify both filters are active
      expect(screen.getByText('Italian')).toBeInTheDocument();
      // Additional verification logic
    });
  });

  describe('Clear Functionality', () => {
    it('clears all filters when clear button clicked', () => {
      const propsWithFilters = {
        ...mockProps,
        filters: {
          ...mockProps.filters,
          searchTerm: 'pasta',
          categories: ['Italian'],
        },
      };

      render(<FilterBar {...propsWithFilters} />);

      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        searchTerm: undefined,
        categories: undefined,
        cuisine: undefined,
        moods: undefined,
        availableIngredients: undefined,
        sortBy: 'date',
        sortOrder: 'desc',
      });
    });

    it('removes individual filter chips correctly', () => {
      const propsWithFilters = {
        ...mockProps,
        filters: {
          ...mockProps.filters,
          categories: ['Italian', 'Mexican'],
        },
      };

      render(<FilterBar {...propsWithFilters} />);

      // Find and click remove button on Italian chip
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      fireEvent.click(removeButtons[0]);

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...mockProps.filters,
        categories: ['Mexican'],
      });
    });
  });

  describe('Sort Functionality', () => {
    it('updates sort criteria correctly', () => {
      render(<FilterBar {...mockProps} />);

      // Open sort dropdown
      const sortSelect = screen.getByDisplayValue('Date');
      fireEvent.change(sortSelect, { target: { value: 'title' } });

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...mockProps.filters,
        sortBy: 'title',
      });
    });

    it('toggles sort order correctly', () => {
      render(<FilterBar {...mockProps} />);

      const orderSelect = screen.getByDisplayValue('↓');
      fireEvent.change(orderSelect, { target: { value: 'asc' } });

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...mockProps.filters,
        sortOrder: 'asc',
      });
    });
  });
});
```

#### **Responsive Behavior Tests**

```typescript
describe('FilterBar Responsive Behavior', () => {
  const mockMatchMedia = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });

    window.dispatchEvent(new Event('resize'));
  };

  it('renders horizontal layout on desktop', () => {
    mockMatchMedia(1200);
    render(<FilterBar {...mockProps} />);

    expect(screen.getByTestId('filter-bar-horizontal')).toBeInTheDocument();
  });

  it('renders drawer layout on tablet', () => {
    mockMatchMedia(800);
    render(<FilterBar {...mockProps} />);

    expect(screen.getByTestId('filter-bar-drawer')).toBeInTheDocument();
  });

  it('renders drawer layout on mobile', () => {
    mockMatchMedia(400);
    render(<FilterBar {...mockProps} />);

    expect(screen.getByTestId('filter-bar-drawer')).toBeInTheDocument();
  });

  it('maintains state across layout changes', () => {
    const propsWithFilters = {
      ...mockProps,
      filters: { ...mockProps.filters, searchTerm: 'pasta' },
    };

    // Start desktop
    mockMatchMedia(1200);
    const { rerender } = render(<FilterBar {...propsWithFilters} />);
    expect(screen.getByDisplayValue('pasta')).toBeInTheDocument();

    // Switch to mobile
    mockMatchMedia(400);
    rerender(<FilterBar {...propsWithFilters} />);

    // State should persist
    expect(screen.getByDisplayValue('pasta')).toBeInTheDocument();
  });
});
```

### **Filter Section Component Tests**

#### **CategoryFilterSection Tests**

```typescript
// src/__tests__/components/recipes/filters/CategoryFilterSection.test.tsx
describe('CategoryFilterSection', () => {
  const mockProps = {
    selectedCategories: [],
    onCategoriesChange: jest.fn(),
    variant: 'dropdown' as const,
  };

  describe('Dropdown Variant', () => {
    it('renders dropdown correctly', () => {
      render(<CategoryFilterSection {...mockProps} />);
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    it('shows selected count in button', () => {
      const propsWithSelection = {
        ...mockProps,
        selectedCategories: ['Italian', 'Mexican'],
      };

      render(<CategoryFilterSection {...propsWithSelection} />);
      expect(screen.getByText('2')).toBeInTheDocument(); // Count badge
    });

    it('filters categories by search term', () => {
      render(<CategoryFilterSection {...mockProps} />);

      // Open dropdown
      fireEvent.click(screen.getByText('Categories'));

      // Type in search
      const searchInput = screen.getByPlaceholderText(/filter categories/i);
      fireEvent.change(searchInput, { target: { value: 'ital' } });

      // Should show only matching categories
      expect(screen.getByText('Italian')).toBeInTheDocument();
      expect(screen.queryByText('Mexican')).not.toBeInTheDocument();
    });

    it('groups categories by namespace', () => {
      render(<CategoryFilterSection {...mockProps} />);

      fireEvent.click(screen.getByText('Categories'));

      // Should show namespace headers
      expect(screen.getByText('Cuisine')).toBeInTheDocument();
      expect(screen.getByText('Diet')).toBeInTheDocument();
    });
  });

  describe('Drawer Variant', () => {
    const drawerProps = { ...mockProps, variant: 'drawer' as const };

    it('renders drawer correctly', () => {
      render(<CategoryFilterSection {...drawerProps} />);

      const drawerButton = screen.getByRole('button', { name: /categories/i });
      expect(drawerButton).toBeInTheDocument();
    });

    it('opens nested drawer correctly', () => {
      render(<CategoryFilterSection {...drawerProps} />);

      const drawerButton = screen.getByRole('button', { name: /categories/i });

      // Should be closed initially
      expect(screen.queryByText('Italian')).not.toBeInTheDocument();

      // Click to open nested drawer
      fireEvent.click(drawerButton);
      expect(screen.getByText('Italian')).toBeInTheDocument();

      // Should show back button in nested drawer
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
  });

  describe('Drawer Variant', () => {
    const drawerProps = { ...mockProps, variant: 'drawer' as const };

    it('renders drawer trigger correctly', () => {
      render(<CategoryFilterSection {...drawerProps} />);

      const drawerButton = screen.getByRole('button', { name: /categories/i });
      expect(drawerButton).toBeInTheDocument();
    });

    it('shows selection count in drawer button', () => {
      const propsWithSelection = {
        ...drawerProps,
        selectedCategories: ['Italian'],
      };

      render(<CategoryFilterSection {...propsWithSelection} />);
      expect(screen.getByText('(1 selected)')).toBeInTheDocument();
    });
  });

  describe('Category Selection Logic', () => {
    it('selects category correctly', () => {
      render(<CategoryFilterSection {...mockProps} />);

      fireEvent.click(screen.getByText('Categories'));
      fireEvent.click(screen.getByText('Italian'));

      expect(mockProps.onCategoriesChange).toHaveBeenCalledWith(['Italian']);
    });

    it('deselects category correctly', () => {
      const propsWithSelection = {
        ...mockProps,
        selectedCategories: ['Italian'],
      };

      render(<CategoryFilterSection {...propsWithSelection} />);

      fireEvent.click(screen.getByText('Categories'));
      fireEvent.click(screen.getByText('Italian'));

      expect(mockProps.onCategoriesChange).toHaveBeenCalledWith([]);
    });

    it('handles multiple selections correctly', () => {
      const propsWithSelection = {
        ...mockProps,
        selectedCategories: ['Italian'],
      };

      render(<CategoryFilterSection {...propsWithSelection} />);

      fireEvent.click(screen.getByText('Categories'));
      fireEvent.click(screen.getByText('Mexican'));

      expect(mockProps.onCategoriesChange).toHaveBeenCalledWith(['Italian', 'Mexican']);
    });
  });
});
```

### **Hook Testing**

#### **useFilterBar Hook Tests**

```typescript
// src/__tests__/hooks/useFilterBar.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useFilterBar } from '@/hooks/useFilterBar';

describe('useFilterBar', () => {
  const mockOnFiltersChange = jest.fn();
  const initialFilters = {
    searchTerm: '',
    categories: [],
    cuisine: [],
    moods: [],
    availableIngredients: [],
    sortBy: 'date' as const,
    sortOrder: 'desc' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with provided filters', () => {
    const { result } = renderHook(() =>
      useFilterBar(initialFilters, mockOnFiltersChange)
    );

    expect(result.current.localFilters).toEqual(initialFilters);
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('updates filters correctly', () => {
    const { result } = renderHook(() =>
      useFilterBar(initialFilters, mockOnFiltersChange)
    );

    act(() => {
      result.current.updateFilter({ searchTerm: 'pasta' });
    });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...initialFilters,
      searchTerm: 'pasta',
    });
  });

  it('clears all filters correctly', () => {
    const filtersWithData = {
      ...initialFilters,
      searchTerm: 'pasta',
      categories: ['Italian'],
    };

    const { result } = renderHook(() =>
      useFilterBar(filtersWithData, mockOnFiltersChange)
    );

    act(() => {
      result.current.clearAllFilters();
    });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      searchTerm: undefined,
      categories: undefined,
      cuisine: undefined,
      moods: undefined,
      availableIngredients: undefined,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  });

  it('removes individual filters correctly', () => {
    const filtersWithData = {
      ...initialFilters,
      categories: ['Italian', 'Mexican'],
    };

    const { result } = renderHook(() =>
      useFilterBar(filtersWithData, mockOnFiltersChange)
    );

    act(() => {
      result.current.removeFilter('category', 'Italian');
    });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...filtersWithData,
      categories: ['Mexican'],
    });
  });

  it('calculates active filter count correctly', () => {
    const filtersWithData = {
      ...initialFilters,
      searchTerm: 'pasta',
      categories: ['Italian'],
      cuisine: ['italian'],
    };

    const { result } = renderHook(() =>
      useFilterBar(filtersWithData, mockOnFiltersChange)
    );

    expect(result.current.activeFilterCount).toBe(3);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('generates active filters list correctly', () => {
    const filtersWithData = {
      ...initialFilters,
      searchTerm: 'pasta',
      categories: ['Italian'],
    };

    const { result } = renderHook(() =>
      useFilterBar(filtersWithData, mockOnFiltersChange)
    );

    expect(result.current.activeFilters).toEqual([
      { type: 'search', value: 'pasta', label: 'Search: "pasta"' },
      { type: 'category', value: 'Italian', label: 'Italian' },
    ]);
  });

  it('syncs with external filter changes', () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useFilterBar(filters, mockOnFiltersChange),
      { initialProps: { filters: initialFilters } }
    );

    const updatedFilters = { ...initialFilters, searchTerm: 'pasta' };
    rerender({ filters: updatedFilters });

    expect(result.current.localFilters).toEqual(updatedFilters);
  });
});
```

---

## 🔗 Integration Testing Strategy

### **Page Integration Tests**

#### **RecipesPage Integration**

```typescript
// src/__tests__/pages/recipes-page-integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipesPage } from '@/pages/recipes-page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the recipes API
jest.mock('@/hooks/use-recipes', () => ({
  useRecipes: jest.fn(() => ({
    data: [
      { id: 1, title: 'Pasta Carbonara', categories: ['Italian'] },
      { id: 2, title: 'Tacos', categories: ['Mexican'] },
    ],
    isLoading: false,
    error: null,
  })),
}));

describe('RecipesPage Integration', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RecipesPage />
      </QueryClientProvider>
    );
  };

  it('renders FilterBar and recipes correctly', () => {
    renderPage();

    // FilterBar should be present
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();

    // Recipes should be displayed
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Tacos')).toBeInTheDocument();
  });

  it('filters recipes when filter applied', async () => {
    renderPage();

    // Apply category filter
    fireEvent.click(screen.getByText('Categories'));
    fireEvent.click(screen.getByText('Italian'));

    // Should update URL and filter recipes
    await waitFor(() => {
      expect(window.location.search).toContain('category=Italian');
    });
  });

  it('maintains filter state on page reload', () => {
    // Set initial URL with filters
    window.history.pushState({}, '', '?search=pasta&category=Italian');

    renderPage();

    // FilterBar should reflect URL state
    expect(screen.getByDisplayValue('pasta')).toBeInTheDocument();
    // Italian category should be selected (would need specific test for this)
  });

  it('displays correct recipe counts', () => {
    renderPage();

    expect(screen.getByText('2 recipes')).toBeInTheDocument();

    // Apply filter that reduces results
    fireEvent.click(screen.getByText('Categories'));
    fireEvent.click(screen.getByText('Italian'));

    // Count should update
    expect(screen.getByText('1 of 2 recipes')).toBeInTheDocument();
  });
});
```

#### **ChatRecipePage Integration**

```typescript
// src/__tests__/pages/chat-recipe-page-integration.test.tsx
describe('ChatRecipePage Integration', () => {
  it('syncs FilterBar with SelectionContext', () => {
    const mockSelections = {
      categories: ['Italian'],
      cuisines: ['italian'],
      moods: ['comfort'],
      availableIngredients: ['pasta'],
    };

    render(
      <SelectionProvider initialSelections={mockSelections}>
        <ChatRecipePage />
      </SelectionProvider>
    );

    // FilterBar should reflect context state
    expect(screen.getByText('Italian')).toBeInTheDocument();
    // Additional verification for other selections
  });

  it('updates context when filters change', () => {
    const mockUpdateSelections = jest.fn();

    render(
      <SelectionProvider updateSelections={mockUpdateSelections}>
        <ChatRecipePage />
      </SelectionProvider>
    );

    // Change filter
    fireEvent.click(screen.getByText('Categories'));
    fireEvent.click(screen.getByText('Mexican'));

    expect(mockUpdateSelections).toHaveBeenCalledWith({
      categories: ['Mexican'],
      cuisines: [],
      moods: [],
      availableIngredients: [],
    });
  });
});
```

### **State Management Integration Tests**

```typescript
describe('FilterBar State Management Integration', () => {
  it('integrates with useRecipeFilters correctly', () => {
    const TestComponent = () => {
      const { filters, updateFilters } = useRecipeFilters();
      return (
        <FilterBar
          filters={filters}
          onFiltersChange={updateFilters}
        />
      );
    };

    render(<TestComponent />);

    // Test URL persistence
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'pasta' }
    });

    expect(window.location.search).toContain('search=pasta');
  });

  it('handles complex filter combinations', () => {
    const TestComponent = () => {
      const [filters, setFilters] = useState({
        searchTerm: 'pasta',
        categories: ['Italian'],
        cuisine: ['italian'],
        moods: ['comfort'],
      });

      return (
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
        />
      );
    };

    render(<TestComponent />);

    // All filters should be active
    expect(screen.getByDisplayValue('pasta')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    // Additional verification for other active filters
  });
});
```

---

## 🚀 Performance Testing

### **Performance Benchmarks**

```typescript
// src/__tests__/performance/FilterBar.performance.test.tsx
describe('FilterBar Performance', () => {
  it('renders quickly with large filter options', () => {
    const largeCategories = Array.from({ length: 1000 }, (_, i) => `Category ${i}`);
    const largeFilters = {
      categories: largeCategories,
      cuisine: [],
      moods: [],
      availableIngredients: [],
      searchTerm: '',
      sortBy: 'date' as const,
      sortOrder: 'desc' as const,
    };

    const startTime = performance.now();
    render(<FilterBar filters={largeFilters} onFiltersChange={() => {}} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100); // Should render in <100ms
  });

  it('responds quickly to filter changes', async () => {
    const mockOnChange = jest.fn();
    render(<FilterBar filters={{}} onFiltersChange={mockOnChange} />);

    const startTime = performance.now();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'pasta' }
    });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50); // Should respond in <50ms
  });

  it('handles rapid filter changes efficiently', () => {
    const mockOnChange = jest.fn();
    render(<FilterBar filters={{}} onFiltersChange={mockOnChange} />);

    const searchInput = screen.getByRole('searchbox');

    // Simulate rapid typing
    const startTime = performance.now();
    for (let i = 0; i < 10; i++) {
      fireEvent.change(searchInput, { target: { value: `search ${i}` } });
    }
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100);
    // Should handle rapid changes without performance issues
  });
});
```

### **Memory Usage Tests**

```typescript
describe('FilterBar Memory Usage', () => {
  it('does not leak memory on mount/unmount', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;

    // Mount and unmount multiple times
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(
        <FilterBar filters={{}} onFiltersChange={() => {}} />
      );
      unmount();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal
    expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB
  });
});
```

---

## ♿ Accessibility Testing

### **ARIA and Keyboard Navigation**

```typescript
// src/__tests__/accessibility/FilterBar.a11y.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('FilterBar Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <FilterBar filters={{}} onFiltersChange={() => {}} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', () => {
    render(<FilterBar filters={{}} onFiltersChange={() => {}} />);

    const searchInput = screen.getByRole('searchbox');
    searchInput.focus();

    // Tab should navigate to category filter
    fireEvent.keyDown(searchInput, { key: 'Tab' });

    const categoryButton = screen.getByText('Categories');
    expect(categoryButton).toHaveFocus();

    // Enter should open dropdown
    fireEvent.keyDown(categoryButton, { key: 'Enter' });

    // Should open category dropdown
    expect(screen.getByText('Italian')).toBeInTheDocument();
  });

  it('announces filter changes to screen readers', () => {
    render(<FilterBar filters={{}} onFiltersChange={() => {}} />);

    // Apply a filter
    fireEvent.click(screen.getByText('Categories'));
    fireEvent.click(screen.getByText('Italian'));

    // Should have appropriate ARIA announcements
    expect(screen.getByRole('status')).toHaveTextContent(/filter applied/i);
  });

  it('has proper ARIA labels and descriptions', () => {
    render(<FilterBar filters={{}} onFiltersChange={() => {}} />);

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAccessibleName(/search recipes/i);

    const categoryButton = screen.getByText('Categories');
    expect(categoryButton).toHaveAttribute('aria-expanded', 'false');
    expect(categoryButton).toHaveAttribute('aria-haspopup', 'true');
  });

  it('handles focus management in mobile drawer', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 400 });

    render(<FilterBar filters={{}} onFiltersChange={() => {}} />);

    const filterButton = screen.getByText(/filters & search/i);
    fireEvent.click(filterButton);

    // Focus should move to drawer content
    expect(document.activeElement).toBeInTheDocument();
    // Additional focus management tests
  });
});
```

### **Screen Reader Testing**

```typescript
describe('FilterBar Screen Reader Support', () => {
  it('announces active filter count', () => {
    const filtersWithData = {
      categories: ['Italian'],
      cuisine: ['italian'],
      moods: [],
      availableIngredients: [],
      searchTerm: '',
      sortBy: 'date' as const,
      sortOrder: 'desc' as const,
    };

    render(<FilterBar filters={filtersWithData} onFiltersChange={() => {}} />);

    const announcement = screen.getByRole('status', { hidden: true });
    expect(announcement).toHaveTextContent(/2 filters active/i);
  });

  it('announces recipe count changes', () => {
    const { rerender } = render(
      <FilterBar
        filters={{}}
        onFiltersChange={() => {}}
        totalRecipes={100}
        filteredCount={100}
      />
    );

    // Apply filter that reduces results
    rerender(
      <FilterBar
        filters={{ categories: ['Italian'] }}
        onFiltersChange={() => {}}
        totalRecipes={100}
        filteredCount={25}
      />
    );

    const announcement = screen.getByRole('status', { hidden: true });
    expect(announcement).toHaveTextContent(/showing 25 of 100 recipes/i);
  });
});
```

---

## 🌐 Cross-Browser Testing

### **Browser Compatibility Tests**

```typescript
// src/__tests__/compatibility/FilterBar.browser.test.tsx
describe('FilterBar Browser Compatibility', () => {
  const mockUserAgent = (userAgent: string) => {
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: userAgent,
    });
  };

  it('works in Chrome', () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    render(<FilterBar filters={{}} onFiltersChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('works in Firefox', () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0');

    render(<FilterBar filters={{}} onFiltersChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('works in Safari', () => {
    mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15');

    render(<FilterBar filters={{}} onFiltersChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('handles touch events on mobile browsers', () => {
    // Mock touch support
    Object.defineProperty(window, 'ontouchstart', { value: null });

    render(<FilterBar filters={{}} onFiltersChange={() => {}} />);

    // Should render mobile-optimized interface
    expect(screen.getByText(/filters & search/i)).toBeInTheDocument();
  });
});
```

---

## 🎭 End-to-End Testing

### **Playwright E2E Tests**

```typescript
// tests/e2e/filter-bar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('FilterBar E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recipes');
  });

  test('filters recipes correctly', async ({ page }) => {
    // Initial state - all recipes visible
    await expect(page.locator('[data-testid="recipe-card"]')).toHaveCount(10);

    // Apply category filter
    await page.click('text=Categories');
    await page.click('text=Italian');

    // Should filter results
    await expect(page.locator('[data-testid="recipe-card"]')).toHaveCount(3);
    await expect(page.locator('text=3 of 10 recipes')).toBeVisible();
  });

  test('search functionality works', async ({ page }) => {
    // Type in search box
    await page.fill('[role="searchbox"]', 'pasta');

    // Should filter results
    await expect(page.locator('[data-testid="recipe-card"]')).toHaveCount(2);
    await expect(page.locator('text=2 of 10 recipes')).toBeVisible();
  });

  test('mobile responsive behavior', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Should show mobile filter button
    await expect(page.locator('text=Filters & Search')).toBeVisible();

    // Click to open filter drawer
    await page.click('text=Filters & Search');

    // Should open drawer with filter options
    await expect(page.locator('text=Categories')).toBeVisible();
    await expect(page.locator('text=Cuisines')).toBeVisible();
  });

  test('URL persistence works', async ({ page }) => {
    // Apply filters
    await page.fill('[role="searchbox"]', 'pasta');
    await page.click('text=Categories');
    await page.click('text=Italian');

    // Check URL is updated
    await expect(page).toHaveURL(/search=pasta/);
    await expect(page).toHaveURL(/category=Italian/);

    // Reload page
    await page.reload();

    // Filters should persist
    await expect(page.locator('[role="searchbox"]')).toHaveValue('pasta');
    await expect(page.locator('text=Italian')).toBeVisible();
  });

  test('clear filters functionality', async ({ page }) => {
    // Apply multiple filters
    await page.fill('[role="searchbox"]', 'pasta');
    await page.click('text=Categories');
    await page.click('text=Italian');

    // Should show clear button
    await expect(page.locator('text=Clear Filters')).toBeVisible();

    // Click clear
    await page.click('text=Clear Filters');

    // Should clear all filters
    await expect(page.locator('[role="searchbox"]')).toHaveValue('');
    await expect(page.locator('text=10 recipes')).toBeVisible();
  });
});

test.describe('FilterBar Cross-Browser', () => {
  ['chromium', 'firefox', 'webkit'].forEach((browserName) => {
    test(`works in ${browserName}`, async ({
      page,
      browserName: currentBrowser,
    }) => {
      test.skip(currentBrowser !== browserName, `Only run on ${browserName}`);

      await page.goto('/recipes');

      // Basic functionality test
      await page.fill('[role="searchbox"]', 'test');
      await expect(page.locator('[role="searchbox"]')).toHaveValue('test');

      // Filter functionality
      await page.click('text=Categories');
      await page.click('text=Italian');

      // Should work consistently across browsers
      await expect(page.locator('text=Italian')).toBeVisible();
    });
  });
});
```

---

## 📊 Test Coverage and Reporting

### **Coverage Configuration**

```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        // Specific thresholds for FilterBar components
        'src/components/recipes/FilterBar.tsx': {
          branches: 95,
          functions: 98,
          lines: 98,
          statements: 98,
        },
      },
    },
  },
});
```

### **Test Scripts**

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:a11y": "vitest run --reporter=verbose src/__tests__/accessibility/",
    "test:performance": "vitest run src/__tests__/performance/",
    "test:browser": "playwright test --project=chromium --project=firefox --project=webkit"
  }
}
```

---

## 📋 Testing Checklist

### **Pre-Implementation Testing**

- [ ] Test plan reviewed and approved
- [ ] Testing environment set up
- [ ] Mock data and fixtures prepared
- [ ] Testing utilities configured

### **Unit Testing Checklist**

- [ ] FilterBar component tests complete
- [ ] All filter section components tested
- [ ] useFilterBar hook thoroughly tested
- [ ] Responsive behavior tested
- [ ] Error handling tested

### **Integration Testing Checklist**

- [ ] RecipesPage integration tested
- [ ] ChatRecipePage integration tested
- [ ] ExplorePage integration tested
- [ ] State management integration verified
- [ ] URL persistence tested

### **Performance Testing Checklist**

- [ ] Render performance benchmarked
- [ ] Filter response time measured
- [ ] Memory usage tested
- [ ] Bundle size impact measured

### **Accessibility Testing Checklist**

- [ ] ARIA compliance verified
- [ ] Keyboard navigation tested
- [ ] Screen reader compatibility confirmed
- [ ] Focus management validated

### **Cross-Browser Testing Checklist**

- [ ] Chrome compatibility verified
- [ ] Firefox compatibility verified
- [ ] Safari compatibility verified
- [ ] Edge compatibility verified
- [ ] Mobile browsers tested

### **E2E Testing Checklist**

- [ ] Complete user workflows tested
- [ ] Mobile responsive behavior verified
- [ ] URL persistence confirmed
- [ ] Filter combinations tested
- [ ] Performance benchmarks met

---

## 🚀 Continuous Integration

### **CI Pipeline Configuration**

```yaml
# .github/workflows/filter-bar-tests.yml
name: FilterBar Tests

on:
  pull_request:
    paths:
      - 'src/components/recipes/FilterBar.tsx'
      - 'src/components/recipes/filters/**'
      - 'src/hooks/useFilterBar.ts'
      - 'src/__tests__/components/recipes/FilterBar.test.tsx'
      - 'src/__tests__/components/recipes/filters/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:run -- src/__tests__/components/recipes/FilterBar.test.tsx
      - run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:run -- src/__tests__/pages/

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:a11y

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:performance
```

---

**Testing Strategy Status**: 📋 Ready for Implementation  
**Coverage Target**: >95% for FilterBar components  
**Performance Target**: <100ms filter response time  
**Accessibility Target**: WCAG 2.1 AA compliance

---

_This comprehensive testing strategy ensures the FilterBar modernization maintains high quality, performance, and accessibility standards while providing confidence in the migration process._

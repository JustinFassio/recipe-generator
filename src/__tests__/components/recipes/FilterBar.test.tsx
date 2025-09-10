import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilterBar } from '@/components/recipes/FilterBar';
import type { RecipeFilters } from '@/lib/types';

// Mock the mobile detection hook
vi.mock('@/hooks/use-mobile-detection', () => ({
  useMobileDetection: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    hasTouch: false,
    screenWidth: 1200,
    screenHeight: 800,
  })),
}));

// Mock the useFilterBar hook
vi.mock('@/hooks/useFilterBar', () => ({
  useFilterBar: vi.fn(() => ({
    localFilters: {
      searchTerm: '',
      categories: [],
      cuisine: [],
      moods: [],
      availableIngredients: [],
      sortBy: 'date' as const,
      sortOrder: 'desc' as const,
    },
    updateFilter: vi.fn(),
    clearAllFilters: vi.fn(),
    hasActiveFilters: false,
    activeFilterCount: 0,
    isDesktop: true,
    isMobile: false,
    isTablet: false,
  })),
}));

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
    } as RecipeFilters,
    onFiltersChange: vi.fn(),
    totalRecipes: 100,
    filteredCount: 25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.getByText(/FilterBar Foundation/)).toBeInTheDocument();
    });

    it('displays correct recipe counts', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.getByText(/Total recipes: 100/)).toBeInTheDocument();
      expect(screen.getByText(/Filtered: 25/)).toBeInTheDocument();
    });

    it('shows horizontal layout by default on desktop', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.getByTestId('filter-bar-horizontal')).toBeInTheDocument();
      expect(screen.getByText(/horizontal layout/)).toBeInTheDocument();
    });

    it('shows active filter count', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.getByText(/Active filters: 0/)).toBeInTheDocument();
    });
  });

  describe('Variant Selection', () => {
    it('applies correct variant based on screen size', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.getByTestId('filter-bar-horizontal')).toBeInTheDocument();
    });

    it('respects manual variant override', () => {
      render(<FilterBar {...mockProps} variant="drawer" />);
      expect(screen.getByTestId('filter-bar-drawer')).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('does not show clear button when no active filters', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.queryByText('Clear All Filters')).not.toBeInTheDocument();
    });
  });
});

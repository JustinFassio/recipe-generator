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

// Mock the filter section components
vi.mock('@/components/recipes/filters/CategoryFilterSection', () => ({
  CategoryFilterSection: vi.fn(({ variant }) => (
    <div data-testid={`category-filter-${variant}`}>Categories</div>
  )),
}));

vi.mock('@/components/recipes/filters/CuisineFilterSection', () => ({
  CuisineFilterSection: vi.fn(({ variant }) => (
    <div data-testid={`cuisine-filter-${variant}`}>Cuisines</div>
  )),
}));

vi.mock('@/components/recipes/filters/MoodFilterSection', () => ({
  MoodFilterSection: vi.fn(({ variant }) => (
    <div data-testid={`mood-filter-${variant}`}>Moods</div>
  )),
}));

vi.mock('@/components/recipes/filters/IngredientFilterSection', () => ({
  IngredientFilterSection: vi.fn(({ variant }) => (
    <div data-testid={`ingredient-filter-${variant}`}>Ingredients</div>
  )),
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
      expect(screen.getByTestId('filter-bar-horizontal')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          /Search recipes, ingredients, or instructions/
        )
      ).toBeInTheDocument();
    });

    it('renders filter sections correctly', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Cuisines')).toBeInTheDocument();
      expect(screen.getByText('Moods')).toBeInTheDocument();
      expect(screen.getByText('Ingredients')).toBeInTheDocument();
    });

    it('shows horizontal layout by default on desktop', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.getByTestId('filter-bar-horizontal')).toBeInTheDocument();
    });

    it('renders search input with correct placeholder', () => {
      render(<FilterBar {...mockProps} />);
      const searchInput = screen.getByPlaceholderText(
        /Search recipes, ingredients, or instructions/
      );
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Variant Selection', () => {
    it('applies correct variant based on screen size', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.getByTestId('filter-bar-horizontal')).toBeInTheDocument();
    });

    it('respects manual variant override - drawer', () => {
      render(<FilterBar {...mockProps} variant="drawer" />);
      expect(screen.getByTestId('filter-bar-drawer')).toBeInTheDocument();
    });

    it('respects manual variant override - accordion', () => {
      render(<FilterBar {...mockProps} variant="accordion" />);
      expect(screen.getByTestId('filter-bar-accordion')).toBeInTheDocument();
    });

    it('renders filter sections with correct variant prop in horizontal layout', () => {
      render(<FilterBar {...mockProps} variant="horizontal" />);
      expect(
        screen.getByTestId('category-filter-dropdown')
      ).toBeInTheDocument();
      expect(screen.getByTestId('cuisine-filter-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('mood-filter-dropdown')).toBeInTheDocument();
      expect(
        screen.getByTestId('ingredient-filter-dropdown')
      ).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('does not show clear button when no active filters', () => {
      render(<FilterBar {...mockProps} />);
      expect(screen.queryByText('Clear All Filters')).not.toBeInTheDocument();
    });
  });
});

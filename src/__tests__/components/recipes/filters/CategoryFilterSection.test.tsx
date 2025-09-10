import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryFilterSection } from '@/components/recipes/filters/CategoryFilterSection';

// Mock the category utilities
vi.mock('@/lib/category-utils', () => ({
  parseCategory: vi.fn((category: string) => {
    const parts = category.split(': ');
    return {
      namespace: parts.length > 1 ? parts[0] : null,
      value: parts.length > 1 ? parts[1] : parts[0],
    };
  }),
}));

describe('CategoryFilterSection', () => {
  const mockOnCategoriesChange = vi.fn();
  const defaultProps = {
    selectedCategories: [],
    onCategoriesChange: mockOnCategoriesChange,
    variant: 'dropdown' as const,
  };

  beforeEach(() => {
    mockOnCategoriesChange.mockClear();
  });

  describe('Dropdown Variant', () => {
    it('should render dropdown trigger with category count', () => {
      render(
        <CategoryFilterSection
          {...defaultProps}
          selectedCategories={['Course: Main', 'Dish Type: Soup']}
        />
      );

      expect(screen.getByText('Categories (2)')).toBeInTheDocument();
    });

    it('should toggle dropdown when clicked', () => {
      render(<CategoryFilterSection {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /categories/i });
      fireEvent.click(trigger);

      // Check if dropdown content is visible by looking for the search input
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });

  describe('Accordion Variant', () => {
    it('should render accordion with clear functionality', () => {
      render(
        <CategoryFilterSection
          {...defaultProps}
          variant="accordion"
          selectedCategories={['Course: Main']}
        />
      );

      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Clear All (1)')).toBeInTheDocument();
    });

    it('should clear all categories when clear button is clicked', () => {
      render(
        <CategoryFilterSection
          {...defaultProps}
          variant="accordion"
          selectedCategories={['Course: Main']}
        />
      );

      const clearButton = screen.getByText('Clear All (1)');
      fireEvent.click(clearButton);

      expect(mockOnCategoriesChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Drawer Variant', () => {
    it('should render drawer layout with selection count', () => {
      render(
        <CategoryFilterSection
          {...defaultProps}
          variant="drawer"
          selectedCategories={['Course: Main', 'Dish Type: Soup']}
        />
      );

      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('should show clear all button when categories are selected', () => {
      render(
        <CategoryFilterSection
          {...defaultProps}
          variant="drawer"
          selectedCategories={['Course: Main']}
        />
      );

      expect(screen.getByText('Clear All Categories')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input in accordion variant', () => {
      render(<CategoryFilterSection {...defaultProps} variant="accordion" />);

      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'main' } });

      expect(searchInput).toHaveValue('main');
    });
  });
});

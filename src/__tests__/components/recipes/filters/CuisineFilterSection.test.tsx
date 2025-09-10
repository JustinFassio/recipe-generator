import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CuisineFilterSection } from '@/components/recipes/filters/CuisineFilterSection';

describe('CuisineFilterSection', () => {
  const mockOnCuisinesChange = vi.fn();
  const defaultProps = {
    selectedCuisines: [] as string[],
    onCuisinesChange: mockOnCuisinesChange,
    variant: 'dropdown' as const,
  };

  beforeEach(() => {
    mockOnCuisinesChange.mockClear();
  });

  describe('Dropdown Variant', () => {
    it('should render dropdown trigger with cuisine count', () => {
      render(
        <CuisineFilterSection
          {...defaultProps}
          selectedCuisines={['Italian', 'Mexican'] as string[]}
        />
      );

      expect(screen.getByText('Cuisines (2)')).toBeInTheDocument();
    });

    it('should toggle dropdown when clicked', () => {
      render(<CuisineFilterSection {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /cuisines/i });
      fireEvent.click(trigger);

      // Check if dropdown content is visible by looking for the search input
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });

  describe('Accordion Variant', () => {
    it('should render accordion with clear functionality', () => {
      render(
        <CuisineFilterSection
          {...defaultProps}
          variant="accordion"
          selectedCuisines={['Italian'] as string[]}
        />
      );

      expect(screen.getByText('Cuisines')).toBeInTheDocument();
      expect(screen.getByText('Clear All (1)')).toBeInTheDocument();
    });

    it('should clear all cuisines when clear button is clicked', () => {
      render(
        <CuisineFilterSection
          {...defaultProps}
          variant="accordion"
          selectedCuisines={['Italian'] as string[]}
        />
      );

      const clearButton = screen.getByText('Clear All (1)');
      fireEvent.click(clearButton);

      expect(mockOnCuisinesChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Drawer Variant', () => {
    it('should render drawer layout with selection count', () => {
      render(
        <CuisineFilterSection
          {...defaultProps}
          variant="drawer"
          selectedCuisines={['Italian', 'Mexican'] as string[]}
        />
      );

      expect(screen.getByText('Cuisines')).toBeInTheDocument();
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('should show clear all button when cuisines are selected', () => {
      render(
        <CuisineFilterSection
          {...defaultProps}
          variant="drawer"
          selectedCuisines={['Italian'] as string[]}
        />
      );

      expect(screen.getByText('Clear All Cuisines')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input in accordion variant', () => {
      render(<CuisineFilterSection {...defaultProps} variant="accordion" />);

      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'italian' } });

      expect(searchInput).toHaveValue('italian');
    });
  });
});

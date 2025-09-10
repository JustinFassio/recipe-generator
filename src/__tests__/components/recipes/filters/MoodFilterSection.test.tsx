import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoodFilterSection } from '@/components/recipes/filters/MoodFilterSection';

describe('MoodFilterSection', () => {
  const mockOnMoodsChange = vi.fn();
  const defaultProps = {
    selectedMoods: [] as string[],
    onMoodsChange: mockOnMoodsChange,
    variant: 'dropdown' as const,
  };

  beforeEach(() => {
    mockOnMoodsChange.mockClear();
  });

  describe('Dropdown Variant', () => {
    it('should render dropdown trigger with mood count', () => {
      render(
        <MoodFilterSection
          {...defaultProps}
          selectedMoods={['Comfort', 'Spicy'] as string[]}
        />
      );

      expect(screen.getByText('Moods (2)')).toBeInTheDocument();
    });

    it('should toggle dropdown when clicked', () => {
      render(<MoodFilterSection {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /moods/i });
      fireEvent.click(trigger);

      // Check if dropdown content is visible by looking for the search input
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });

  describe('Accordion Variant', () => {
    it('should render accordion with clear functionality', () => {
      render(
        <MoodFilterSection
          {...defaultProps}
          variant="accordion"
          selectedMoods={['Comfort'] as string[]}
        />
      );

      expect(screen.getByText('Moods')).toBeInTheDocument();
      expect(screen.getByText('Clear All (1)')).toBeInTheDocument();
    });

    it('should clear all moods when clear button is clicked', () => {
      render(
        <MoodFilterSection
          {...defaultProps}
          variant="accordion"
          selectedMoods={['Comfort'] as string[]}
        />
      );

      const clearButton = screen.getByText('Clear All (1)');
      fireEvent.click(clearButton);

      expect(mockOnMoodsChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Drawer Variant', () => {
    it('should render drawer layout with selection count', () => {
      render(
        <MoodFilterSection
          {...defaultProps}
          variant="drawer"
          selectedMoods={['Comfort', 'Spicy'] as string[]}
        />
      );

      expect(screen.getByText('Moods')).toBeInTheDocument();
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('should show clear all button when moods are selected', () => {
      render(
        <MoodFilterSection
          {...defaultProps}
          variant="drawer"
          selectedMoods={['Comfort'] as string[]}
        />
      );

      expect(screen.getByText('Clear All Moods')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input in accordion variant', () => {
      render(<MoodFilterSection {...defaultProps} variant="accordion" />);

      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'comfort' } });

      expect(searchInput).toHaveValue('comfort');
    });
  });
});

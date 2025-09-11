import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IngredientFilterSection } from '@/components/recipes/filters/IngredientFilterSection';

// Mock the useGroceries hook
vi.mock('@/hooks/useGroceries', () => ({
  useGroceries: () => ({
    groceries: {
      vegetables: ['Tomato', 'Onion', 'Carrot'],
      proteins: ['Chicken', 'Beef', 'Tofu'],
    },
  }),
}));

describe('IngredientFilterSection', () => {
  const mockOnIngredientsChange = vi.fn();
  const defaultProps = {
    selectedIngredients: [],
    onIngredientsChange: mockOnIngredientsChange,
    variant: 'dropdown' as const,
  };

  beforeEach(() => {
    mockOnIngredientsChange.mockClear();
  });

  describe('Dropdown Variant', () => {
    it('should render dropdown trigger with ingredient count', () => {
      render(
        <IngredientFilterSection
          {...defaultProps}
          selectedIngredients={['Tomato', 'Chicken']}
        />
      );

      const button = screen.getByRole('button', { name: /ingredients/i });
      expect(button).toHaveTextContent('Ingredients (2)');
    });

    it('should toggle dropdown when clicked', () => {
      render(<IngredientFilterSection {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /ingredients/i });
      fireEvent.click(trigger);

      // Check if dropdown content is visible by looking for the search input
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });

  describe('Accordion Variant', () => {
    it('should render accordion with clear functionality', () => {
      render(
        <IngredientFilterSection
          {...defaultProps}
          variant="accordion"
          selectedIngredients={['Tomato']}
        />
      );

      expect(screen.getByText('Available Ingredients')).toBeInTheDocument();
      expect(screen.getByText('Clear All (1)')).toBeInTheDocument();
    });

    it('should clear all ingredients when clear button is clicked', () => {
      render(
        <IngredientFilterSection
          {...defaultProps}
          variant="accordion"
          selectedIngredients={['Tomato']}
        />
      );

      const clearButton = screen.getByText('Clear All (1)');
      fireEvent.click(clearButton);

      expect(mockOnIngredientsChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Drawer Variant', () => {
    it('should render drawer layout with selection count', () => {
      render(
        <IngredientFilterSection
          {...defaultProps}
          variant="drawer"
          selectedIngredients={['Tomato', 'Chicken']}
        />
      );

      expect(screen.getByText('Available Ingredients')).toBeInTheDocument();
      expect(screen.getByText(/2 ingredient.*selected/)).toBeInTheDocument();
    });

    it('should show clear all button when ingredients are selected', () => {
      render(
        <IngredientFilterSection
          {...defaultProps}
          variant="drawer"
          selectedIngredients={['Tomato']}
        />
      );

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input in accordion variant', () => {
      render(<IngredientFilterSection {...defaultProps} variant="accordion" />);

      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'tomato' } });

      expect(searchInput).toHaveValue('tomato');
    });
  });
});

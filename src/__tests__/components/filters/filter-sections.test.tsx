/**
 * Unit Tests for Individual Filter Sections
 *
 * Tests the specific behavior of each filter section component to ensure:
 * 1. Individual filter sections render correctly
 * 2. Selection state is managed properly
 * 3. onToggle callbacks work correctly
 * 4. Search functionality works in ingredient filter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoryFilterSection } from '@/components/recipes/filters/CategoryFilterSection';
import { CuisineFilterSection } from '@/components/recipes/filters/CuisineFilterSection';
import { MoodFilterSection } from '@/components/recipes/filters/MoodFilterSection';
import { IngredientFilterSection } from '@/components/recipes/filters/IngredientFilterSection';

// Mock the groceries hook
vi.mock('@/hooks/useGroceries', () => ({
  useGroceries: () => ({
    groceries: {
      groceries: ['Tomato', 'Basil', 'Onion', 'Garlic'],
      hasIngredient: vi.fn((ingredient: string) =>
        ['Tomato', 'Basil', 'Onion', 'Garlic'].includes(ingredient)
      ),
    },
    addGrocery: vi.fn(),
    removeGrocery: vi.fn(),
    toggleGrocery: vi.fn(),
    clearGroceries: vi.fn(),
  }),
}));

// Mock global ingredients hook
vi.mock('@/hooks/useGlobalIngredients', () => ({
  useGlobalIngredients: () => ({
    globalIngredients: [
      'Tomato',
      'Basil',
      'Onion',
      'Garlic',
      'Cheese',
      'Pasta',
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('CategoryFilterSection', () => {
  const mockOnCategoriesChange = vi.fn();
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render in dropdown variant', () => {
    render(
      <CategoryFilterSection
        selectedCategories={[]}
        onCategoriesChange={mockOnCategoriesChange}
        variant="dropdown"
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    expect(
      screen.getByRole('button', { name: /categories/i })
    ).toBeInTheDocument();
  });

  it('should show selected count in button', () => {
    render(
      <CategoryFilterSection
        selectedCategories={['Course: Main', 'Cuisine: Italian']}
        onCategoriesChange={mockOnCategoriesChange}
        variant="dropdown"
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // Badge with count
  });

  it('should call onToggle when button is clicked', () => {
    render(
      <CategoryFilterSection
        selectedCategories={[]}
        onCategoriesChange={mockOnCategoriesChange}
        variant="dropdown"
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /categories/i });
    fireEvent.click(button);

    expect(mockOnToggle).toHaveBeenCalledWith(true);
  });

  it('should show content when isOpen is true', () => {
    render(
      <CategoryFilterSection
        selectedCategories={[]}
        onCategoriesChange={mockOnCategoriesChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByTestId('category-filter-content')).toBeInTheDocument();
  });

  it('should handle category selection', async () => {
    render(
      <CategoryFilterSection
        selectedCategories={[]}
        onCategoriesChange={mockOnCategoriesChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    // First expand the Course group
    const courseGroup = screen.getByRole('button', { name: /course/i });
    fireEvent.click(courseGroup);

    await waitFor(() => {
      const mainButton = screen.getByRole('button', { name: /^main$/i });
      fireEvent.click(mainButton);
    });

    expect(mockOnCategoriesChange).toHaveBeenCalledWith(['Course: Main']);
  });

  it('should handle category deselection', async () => {
    render(
      <CategoryFilterSection
        selectedCategories={['Course: Main']}
        onCategoriesChange={mockOnCategoriesChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    // First expand the Course group
    const courseGroup = screen.getByRole('button', { name: /course/i });
    fireEvent.click(courseGroup);

    await waitFor(() => {
      const mainButton = screen.getByRole('button', { name: /^main$/i });
      // Button should have primary variant (selected state)
      expect(mainButton).toHaveClass('btn-primary');
      fireEvent.click(mainButton);
    });

    expect(mockOnCategoriesChange).toHaveBeenCalledWith([]);
  });
});

describe('CuisineFilterSection', () => {
  const mockOnCuisinesChange = vi.fn();
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with search functionality', () => {
    render(
      <CuisineFilterSection
        selectedCuisines={[]}
        onCuisinesChange={mockOnCuisinesChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByPlaceholderText(/search cuisines/i)).toBeInTheDocument();
  });

  it('should filter cuisines based on search', async () => {
    render(
      <CuisineFilterSection
        selectedCuisines={[]}
        onCuisinesChange={mockOnCuisinesChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search cuisines/i);
    fireEvent.change(searchInput, { target: { value: 'Italian' } });

    await waitFor(() => {
      expect(screen.getByText(/Italian/)).toBeInTheDocument();
      // Should not show cuisines that don't match
      expect(screen.queryByText(/Chinese/)).not.toBeInTheDocument();
    });
  });

  it('should handle cuisine selection', async () => {
    render(
      <CuisineFilterSection
        selectedCuisines={[]}
        onCuisinesChange={mockOnCuisinesChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    // First expand the Europe region (where Italian is located)
    const europeRegion = screen.getByRole('button', { name: /europe/i });
    fireEvent.click(europeRegion);

    await waitFor(() => {
      const italianButton = screen.getByRole('button', { name: /^italian$/i });
      fireEvent.click(italianButton);
    });

    expect(mockOnCuisinesChange).toHaveBeenCalledWith(['Italian']);
  });

  it('should show selected count', () => {
    render(
      <CuisineFilterSection
        selectedCuisines={['Italian', 'Mexican']}
        onCuisinesChange={mockOnCuisinesChange}
        variant="dropdown"
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

describe('MoodFilterSection', () => {
  const mockOnMoodsChange = vi.fn();
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render mood options', () => {
    render(
      <MoodFilterSection
        selectedMoods={[]}
        onMoodsChange={mockOnMoodsChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText(/Comfort Food/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick & Easy/i)).toBeInTheDocument();
    expect(screen.getByText(/Healthy/i)).toBeInTheDocument();
  });

  it('should handle mood selection', async () => {
    render(
      <MoodFilterSection
        selectedMoods={[]}
        onMoodsChange={mockOnMoodsChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      const comfortFoodButton = screen.getByRole('button', {
        name: /comfort food/i,
      });
      fireEvent.click(comfortFoodButton);
    });

    expect(mockOnMoodsChange).toHaveBeenCalledWith(['Comfort Food']);
  });

  it('should handle multiple mood selections', async () => {
    render(
      <MoodFilterSection
        selectedMoods={['Comfort Food']}
        onMoodsChange={mockOnMoodsChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      const healthyButton = screen.getByRole('button', { name: /healthy/i });
      fireEvent.click(healthyButton);
    });

    expect(mockOnMoodsChange).toHaveBeenCalledWith(['Comfort Food', 'Healthy']);
  });
});

describe('IngredientFilterSection', () => {
  const mockOnIngredientsChange = vi.fn();
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input', () => {
    render(
      <IngredientFilterSection
        selectedIngredients={[]}
        onIngredientsChange={mockOnIngredientsChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    expect(
      screen.getByPlaceholderText(/search ingredients/i)
    ).toBeInTheDocument();
  });

  it('should show search results when typing', async () => {
    render(
      <IngredientFilterSection
        selectedIngredients={[]}
        onIngredientsChange={mockOnIngredientsChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search ingredients/i);
    fireEvent.change(searchInput, { target: { value: 'tom' } });

    await waitFor(() => {
      expect(screen.getByText(/Tomato/i)).toBeInTheDocument();
    });
  });

  it('should handle ingredient selection from search results', async () => {
    render(
      <IngredientFilterSection
        selectedIngredients={[]}
        onIngredientsChange={mockOnIngredientsChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search.*ingredients/i);
    fireEvent.change(searchInput, { target: { value: 'tomato' } });

    await waitFor(() => {
      const tomatoButton = screen.getByRole('button', { name: /tomato/i });
      fireEvent.click(tomatoButton);
    });

    expect(mockOnIngredientsChange).toHaveBeenCalledWith(['Tomato']);
  });

  it('should show selected ingredients', () => {
    render(
      <IngredientFilterSection
        selectedIngredients={['Tomato', 'Basil']}
        onIngredientsChange={mockOnIngredientsChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Tomato')).toBeInTheDocument();
    expect(screen.getByText('Basil')).toBeInTheDocument();
  });

  it('should handle ingredient removal', async () => {
    render(
      <IngredientFilterSection
        selectedIngredients={['Tomato', 'Basil']}
        onIngredientsChange={mockOnIngredientsChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    // Find remove button for Tomato
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]); // Remove first ingredient

    expect(mockOnIngredientsChange).toHaveBeenCalledWith(['Basil']);
  });

  it('should show ingredient count in button', () => {
    render(
      <IngredientFilterSection
        selectedIngredients={['Tomato', 'Basil', 'Onion']}
        onIngredientsChange={mockOnIngredientsChange}
        variant="dropdown"
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should handle empty search gracefully', async () => {
    render(
      <IngredientFilterSection
        selectedIngredients={[]}
        onIngredientsChange={mockOnIngredientsChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search ingredients/i);
    fireEvent.change(searchInput, { target: { value: '' } });

    // Should not crash and should show some default state
    expect(searchInput).toBeInTheDocument();
  });

  it('should handle search with no results', async () => {
    render(
      <IngredientFilterSection
        selectedIngredients={[]}
        onIngredientsChange={mockOnIngredientsChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search ingredients/i);
    fireEvent.change(searchInput, {
      target: { value: 'nonexistentingredient' },
    });

    await waitFor(() => {
      // Should show no results or appropriate message
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });
});

describe('Filter Section Accordion Integration', () => {
  it('should handle toggle state correctly', () => {
    const mockOnToggle = vi.fn();

    const { rerender } = render(
      <CategoryFilterSection
        selectedCategories={[]}
        onCategoriesChange={vi.fn()}
        variant="dropdown"
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    // Click to open
    const button = screen.getByRole('button', { name: /categories/i });
    fireEvent.click(button);
    expect(mockOnToggle).toHaveBeenCalledWith(true);

    // Simulate parent component updating isOpen to true
    rerender(
      <CategoryFilterSection
        selectedCategories={[]}
        onCategoriesChange={vi.fn()}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    // Content should now be visible
    expect(screen.getByTestId('category-filter-content')).toBeInTheDocument();

    // Click again to close
    fireEvent.click(button);
    expect(mockOnToggle).toHaveBeenCalledWith(false);
  });

  it('should maintain selection state when toggling', () => {
    const mockOnCategoriesChange = vi.fn();
    const mockOnToggle = vi.fn();

    const { rerender } = render(
      <CategoryFilterSection
        selectedCategories={['Course: Main']}
        onCategoriesChange={mockOnCategoriesChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    // First expand the Course group
    const courseGroup = screen.getByRole('button', { name: /course/i });
    fireEvent.click(courseGroup);

    await waitFor(async () => {
      // Verify selection is shown (button should have primary variant)
      const mainButton = screen.getByRole('button', { name: /^main$/i });
      expect(mainButton).toHaveClass('btn-primary');
    });

    // Close and reopen
    rerender(
      <CategoryFilterSection
        selectedCategories={['Course: Main']}
        onCategoriesChange={mockOnCategoriesChange}
        variant="dropdown"
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    rerender(
      <CategoryFilterSection
        selectedCategories={['Course: Main']}
        onCategoriesChange={mockOnCategoriesChange}
        variant="dropdown"
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    // Expand group again and verify selection is still there
    const reopenedCourseGroup = screen.getByRole('button', { name: /course/i });
    fireEvent.click(reopenedCourseGroup);

    await waitFor(async () => {
      const reopenedMainButton = screen.getByRole('button', {
        name: /^main$/i,
      });
      expect(reopenedMainButton).toHaveClass('btn-primary');
    });
  });
});

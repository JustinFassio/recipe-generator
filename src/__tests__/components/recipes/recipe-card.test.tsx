import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecipeCard } from '@/components/recipes/recipe-card';
import type { Recipe } from '@/lib/supabase';

const mockRecipe: Recipe = {
  id: '1',
  title: 'Test Recipe',
  ingredients: ['ingredient 1', 'ingredient 2', 'ingredient 3'],
  instructions: 'Test cooking instructions for the recipe.',
  notes: 'Test notes and tips for the recipe.',
  image_url: null,
  user_id: 'user1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('RecipeCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render recipe information correctly', () => {
    render(
      <RecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText('Test cooking instructions for the recipe.')).toBeInTheDocument();
    expect(screen.getByText('Test notes and tips for the recipe.')).toBeInTheDocument();
    expect(screen.getByText('3 ingredients')).toBeInTheDocument();
  });

  it('should call onView when view button is clicked', () => {
    render(
      <RecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    // Find the view button by its icon (Eye icon)
    const buttons = screen.getAllByRole('button');
    const viewButton = buttons[0]; // First button is view
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockRecipe);
  });

  it('should call onEdit when edit button is clicked', () => {
    render(
      <RecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    // Find the edit button by its icon (Edit icon)
    const buttons = screen.getAllByRole('button');
    const editButton = buttons[1]; // Second button is edit
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockRecipe);
  });

  it('should display recipe image when available', () => {
    const recipeWithImage = {
      ...mockRecipe,
      image_url: 'https://example.com/recipe-image.jpg',
    };

    render(
      <RecipeCard
        recipe={recipeWithImage}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    const image = screen.getByAltText('Test Recipe');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/recipe-image.jpg');
  });

  it('should not display image section when no image is available', () => {
    render(
      <RecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    // Should not have an image element
    expect(screen.queryByAltText('Test Recipe')).not.toBeInTheDocument();
  });

  it('should truncate long titles appropriately', () => {
    const longTitleRecipe = {
      ...mockRecipe,
      title: 'This is a very long recipe title that should be truncated when it exceeds the maximum length allowed by the component',
    };

    render(
      <RecipeCard
        recipe={longTitleRecipe}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    const titleElement = screen.getByText(longTitleRecipe.title);
    expect(titleElement).toBeInTheDocument();
  });

  it('should display ingredient count correctly', () => {
    render(
      <RecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('3 ingredients')).toBeInTheDocument();
  });

  it('should handle recipe with no ingredients', () => {
    const recipeWithoutIngredients = {
      ...mockRecipe,
      ingredients: [],
    };

    render(
      <RecipeCard
        recipe={recipeWithoutIngredients}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('0 ingredients')).toBeInTheDocument();
  });

  it('should display creation date', () => {
    render(
      <RecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    // The date should be formatted and displayed
    expect(screen.getByText('12/31/2023')).toBeInTheDocument();
  });
});

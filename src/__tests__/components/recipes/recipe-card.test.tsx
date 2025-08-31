import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecipeCard } from '@/components/recipes/recipe-card';
import type { Recipe } from '@/lib/types';
import { AuthProvider } from '@/contexts/AuthProvider';
import { recipeApi } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  recipeApi: {
    toggleRecipePublic: vi.fn(),
  },
}));

// Mock the auth context
vi.mock('@/contexts/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useAuth: () => ({
    user: { id: 'user1', email: 'test@example.com' },
    profile: null,
    loading: false,
    refreshProfile: vi.fn(),
  }),
}));

const mockRecipe: Recipe = {
  id: '1',
  title: 'Test Recipe',
  ingredients: ['ingredient 1', 'ingredient 2', 'ingredient 3'],
  instructions: 'Test cooking instructions for the recipe.',
  notes: 'Test notes and tips for the recipe.',
  image_url: null,
  user_id: 'user1',
  is_public: false,
  created_at: '2023-12-31T00:00:00Z',
  updated_at: '2023-12-31T00:00:00Z',
};

// Wrapper component for testing with auth context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('RecipeCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnView = vi.fn();
  const mockOnShareToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the auth context
    vi.mocked(recipeApi.toggleRecipePublic).mockResolvedValue();
  });

  it('should render recipe information correctly', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(
      screen.getByText('Test cooking instructions for the recipe.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Test notes and tips for the recipe.')
    ).toBeInTheDocument();
    expect(screen.getByText('3 ingredients')).toBeInTheDocument();
  });

  it('should call onView when view button is clicked', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    const viewButton = screen.getByRole('button', { name: /view/i });
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockRecipe);
  });

  it('should call onEdit when edit button is clicked', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockRecipe);
  });

  it('should display recipe image when available', () => {
    const recipeWithImage = {
      ...mockRecipe,
      image_url: 'https://example.com/recipe-image.jpg',
    };

    render(
      <TestWrapper>
        <RecipeCard
          recipe={recipeWithImage}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    const image = screen.getByAltText('Test Recipe');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute(
      'src',
      'https://example.com/recipe-image.jpg'
    );
  });

  it('should not display image section when no image is available', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    expect(screen.queryByAltText('Test Recipe')).not.toBeInTheDocument();
  });

  it('should truncate long titles appropriately', () => {
    const longTitleRecipe = {
      ...mockRecipe,
      title:
        'This is a very long recipe title that should be truncated when it exceeds the maximum length allowed by the component',
    };

    render(
      <TestWrapper>
        <RecipeCard
          recipe={longTitleRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    const titleElement = screen.getByText(longTitleRecipe.title);
    expect(titleElement).toBeInTheDocument();
  });

  it('should display ingredient count correctly', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    expect(screen.getByText('3 ingredients')).toBeInTheDocument();
  });

  it('should handle recipe with no ingredients', () => {
    const recipeWithoutIngredients = {
      ...mockRecipe,
      ingredients: [],
    };

    render(
      <TestWrapper>
        <RecipeCard
          recipe={recipeWithoutIngredients}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    expect(screen.getByText('0 ingredients')).toBeInTheDocument();
  });

  // Share functionality tests
  describe('Share functionality', () => {
    it('should show Share button when showShareButton is true and user owns the recipe', () => {
      render(
        <TestWrapper>
          <RecipeCard
            recipe={mockRecipe}
            onEdit={mockOnEdit}
            onView={mockOnView}
            showShareButton={true}
            onShareToggle={mockOnShareToggle}
          />
        </TestWrapper>
      );

      expect(
        screen.getByRole('button', { name: /share recipe/i })
      ).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    it('should not show Share button when showShareButton is false', () => {
      render(
        <TestWrapper>
          <RecipeCard
            recipe={mockRecipe}
            onEdit={mockOnEdit}
            onView={mockOnView}
            showShareButton={false}
            onShareToggle={mockOnShareToggle}
          />
        </TestWrapper>
      );

      expect(
        screen.queryByRole('button', { name: /share recipe/i })
      ).not.toBeInTheDocument();
    });

    it('should show "Unshare" button when recipe is public', () => {
      const publicRecipe = {
        ...mockRecipe,
        is_public: true,
      };

      render(
        <TestWrapper>
          <RecipeCard
            recipe={publicRecipe}
            onEdit={mockOnEdit}
            onView={mockOnView}
            showShareButton={true}
            onShareToggle={mockOnShareToggle}
          />
        </TestWrapper>
      );

      expect(
        screen.getByRole('button', { name: /unshare recipe/i })
      ).toBeInTheDocument();
      expect(screen.getByText('Unshare')).toBeInTheDocument();
    });

    it('should call API and toggle state when Share button is clicked', async () => {
      render(
        <TestWrapper>
          <RecipeCard
            recipe={mockRecipe}
            onEdit={mockOnEdit}
            onView={mockOnView}
            showShareButton={true}
            onShareToggle={mockOnShareToggle}
          />
        </TestWrapper>
      );

      const shareButton = screen.getByRole('button', { name: /share recipe/i });
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(recipeApi.toggleRecipePublic).toHaveBeenCalledWith('1', true);
        expect(mockOnShareToggle).toHaveBeenCalled();
      });
    });

    it('should call API and toggle state when Unshare button is clicked', async () => {
      const publicRecipe = {
        ...mockRecipe,
        is_public: true,
      };

      render(
        <TestWrapper>
          <RecipeCard
            recipe={publicRecipe}
            onEdit={mockOnEdit}
            onView={mockOnView}
            showShareButton={true}
            onShareToggle={mockOnShareToggle}
          />
        </TestWrapper>
      );

      const unshareButton = screen.getByRole('button', {
        name: /unshare recipe/i,
      });
      fireEvent.click(unshareButton);

      await waitFor(() => {
        expect(recipeApi.toggleRecipePublic).toHaveBeenCalledWith('1', false);
        expect(mockOnShareToggle).toHaveBeenCalled();
      });
    });

    it('should show loading state during API call', async () => {
      // Mock a delayed API response
      vi.mocked(recipeApi.toggleRecipePublic).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <TestWrapper>
          <RecipeCard
            recipe={mockRecipe}
            onEdit={mockOnEdit}
            onView={mockOnView}
            showShareButton={true}
            onShareToggle={mockOnShareToggle}
          />
        </TestWrapper>
      );

      const shareButton = screen.getByRole('button', { name: /share recipe/i });
      fireEvent.click(shareButton);

      // Should show loading state
      expect(
        screen.getByRole('button', { name: /share recipe/i })
      ).toBeDisabled();
    });

    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.mocked(recipeApi.toggleRecipePublic).mockRejectedValue(
        new Error('API Error')
      );

      render(
        <TestWrapper>
          <RecipeCard
            recipe={mockRecipe}
            onEdit={mockOnEdit}
            onView={mockOnView}
            showShareButton={true}
            onShareToggle={mockOnShareToggle}
          />
        </TestWrapper>
      );

      const shareButton = screen.getByRole('button', { name: /share recipe/i });
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error toggling recipe sharing:',
          expect.any(Error)
        );
        // Button should not be disabled after error
        expect(
          screen.getByRole('button', { name: /share recipe/i })
        ).not.toBeDisabled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not show Share button for recipes owned by other users', () => {
      const otherUserRecipe = {
        ...mockRecipe,
        user_id: 'other-user',
      };

      render(
        <TestWrapper>
          <RecipeCard
            recipe={otherUserRecipe}
            onEdit={mockOnEdit}
            onView={mockOnView}
            showShareButton={true}
            onShareToggle={mockOnShareToggle}
          />
        </TestWrapper>
      );

      expect(
        screen.queryByRole('button', { name: /share recipe/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /unshare recipe/i })
      ).not.toBeInTheDocument();
    });
  });
});

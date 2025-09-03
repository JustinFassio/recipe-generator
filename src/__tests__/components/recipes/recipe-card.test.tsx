import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { useDeleteRecipe } from '@/hooks/use-recipes';
import { recipeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthProvider';

// Mock the hooks and API
vi.mock('@/hooks/use-recipes');
vi.mock('@/lib/api');
vi.mock('@/contexts/AuthProvider');

const mockUseDeleteRecipe = useDeleteRecipe as vi.MockedFunction<
  typeof useDeleteRecipe
>;
const mockRecipeApi = recipeApi as vi.Mocked<typeof recipeApi>;
const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;

// Mock recipe data
const mockRecipe = {
  id: '1',
  title: 'Test Recipe',
  ingredients: ['ingredient1', 'ingredient2', 'ingredient3'],
  instructions: 'Test cooking instructions for the recipe.',
  notes: 'Test notes and tips for the recipe.',
  categories: ['Italian', 'Dinner'],
  image_url: 'https://example.com/image.jpg',
  created_at: '2023-12-30T00:00:00Z',
  updated_at: '2023-12-30T00:00:00Z',
  user_id: 'user1',
  is_public: false,
  setup: 'Test setup instructions',
};

// Mock callback functions
const mockOnEdit = vi.fn();
const mockOnView = vi.fn();
const mockOnShareToggle = vi.fn();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

describe('RecipeCard', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock useDeleteRecipe hook
    mockUseDeleteRecipe.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useDeleteRecipe>);

    // Mock recipeApi
    mockRecipeApi.toggleRecipePublic = vi.fn().mockResolvedValue(undefined);

    // Mock useAuth hook
    mockUseAuth.mockReturnValue({
      user: { id: 'user1' },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAuth>);
  });

  // Helper function to open the drawer and access action buttons
  const openDrawer = () => {
    const drawerToggle = screen.getByLabelText('Recipe actions');
    fireEvent.click(drawerToggle);
  };

  it('renders recipe information correctly', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    // Use more specific selectors to avoid conflicts with drawer content
    expect(
      screen.getByRole('heading', { name: 'Test Recipe' })
    ).toBeInTheDocument();
    expect(screen.getByText('3 ingredients')).toBeInTheDocument();
    expect(
      screen.getByText('Test cooking instructions for the recipe.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Test notes and tips for the recipe.')
    ).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('renders recipe image when available', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    const image = screen.getByAltText('Test Recipe');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders recipe without image when image_url is not provided', () => {
    const recipeWithoutImage = { ...mockRecipe, image_url: undefined };

    render(
      <TestWrapper>
        <RecipeCard
          recipe={recipeWithoutImage}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    expect(screen.queryByAltText('Test Recipe')).not.toBeInTheDocument();
  });

  it('truncates long recipe titles', () => {
    const longTitleRecipe = {
      ...mockRecipe,
      title:
        'This is a very long recipe title that should be truncated when it exceeds the maximum length',
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

    // Look for the truncated title with ellipsis
    expect(
      screen.getByText('This is a very long recipe title that should...')
    ).toBeInTheDocument();
  });

  it('shows recipe actions drawer trigger button', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Recipe actions')).toBeInTheDocument();
  });

  it('opens drawer and shows action buttons when trigger is clicked', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    openDrawer();

    expect(screen.getByText('Recipe Actions')).toBeInTheDocument();
    expect(screen.getByText('View Recipe')).toBeInTheDocument();
    expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    expect(screen.getByText('Delete Recipe')).toBeInTheDocument();
  });

  it('calls onView when View button is clicked', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    openDrawer();
    const viewButton = screen.getByText('View Recipe');
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockRecipe);
  });

  it('calls onEdit when Edit button is clicked', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    openDrawer();
    const editButton = screen.getByText('Edit Recipe');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockRecipe);
  });

  it('shows delete confirmation dialog when Delete button is clicked', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    openDrawer();
    // Find the delete button by looking for the button containing the text
    const deleteButton = screen.getByRole('button', { name: /delete recipe/i });
    fireEvent.click(deleteButton);

    // Check for the dialog title and description
    expect(
      screen.getByRole('heading', { name: 'Delete Recipe' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to delete "Test Recipe"? This action cannot be undone.'
      )
    ).toBeInTheDocument();
  });

  it('calls delete mutation when delete is confirmed', async () => {
    const mockMutate = vi.fn();
    mockUseDeleteRecipe.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useDeleteRecipe>);

    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    openDrawer();
    const deleteButton = screen.getByText('Delete Recipe');
    fireEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmDeleteButton);

    expect(mockMutate).toHaveBeenCalledWith('1');
  });

  describe('Share functionality', () => {
    it('shows Share button when showShareButton is true and user owns recipe', () => {
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

      openDrawer();
      expect(screen.getByText('Share Recipe')).toBeInTheDocument();
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

      openDrawer();
      expect(screen.queryByText('Share Recipe')).not.toBeInTheDocument();
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

      openDrawer();
      expect(screen.getByText('Unshare Recipe')).toBeInTheDocument();
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

      openDrawer();
      const shareButton = screen.getByText('Share Recipe');
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

      openDrawer();
      const unshareButton = screen.getByText('Unshare Recipe');
      fireEvent.click(unshareButton);

      await waitFor(() => {
        expect(recipeApi.toggleRecipePublic).toHaveBeenCalledWith('1', false);
        expect(mockOnShareToggle).toHaveBeenCalled();
      });
    });

    it('should show loading state during API call', async () => {
      // Mock the API to return a pending promise
      mockRecipeApi.toggleRecipePublic.mockImplementation(
        () => new Promise(() => {}) // Never resolves
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

      openDrawer();
      const shareButton = screen.getByText('Share Recipe');
      fireEvent.click(shareButton);

      // Should show loading state - find the button element, not just the text
      const loadingButton = screen.getByRole('button', { name: /updating/i });
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton).toBeDisabled();
    });

    it('should not show Share button when user does not own recipe', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'different-user' },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useAuth>);

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

      openDrawer();
      expect(screen.queryByText('Share Recipe')).not.toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockRecipeApi.toggleRecipePublic.mockRejectedValue(
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

      openDrawer();
      const shareButton = screen.getByText('Share Recipe');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error toggling recipe sharing:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });
});

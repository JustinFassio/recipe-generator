import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecipeCard } from '../../../components/recipes/recipe-card';
import { useDeleteRecipe } from '../../../hooks/use-recipes';
import { recipeApi } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthProvider';
import type { Recipe } from '../../../lib/types';

// Mock the hooks and API
vi.mock('../../../hooks/use-recipes');
vi.mock('../../../lib/api');
vi.mock('../../../contexts/AuthProvider');

const mockUseDeleteRecipe = vi.mocked(useDeleteRecipe);
const mockRecipeApi = vi.mocked(recipeApi);
const mockUseAuth = vi.mocked(useAuth);

// Mock recipe data
const mockRecipe: Recipe = {
  id: '1',
  title: 'Test Recipe',
  description: 'A delicious test recipe for testing purposes.',
  ingredients: ['ingredient1', 'ingredient2', 'ingredient3'],
  instructions: 'Test cooking instructions for the recipe.',
  notes: 'Test notes and tips for the recipe.',
  categories: ['Italian', 'Dinner'],
  image_url: 'https://example.com/image.jpg',
  created_at: '2023-12-30T00:00:00Z',
  updated_at: '2023-12-30T00:00:00Z',
  user_id: 'user1',
  is_public: false,
  setup: ['Test setup instructions'],
  cooking_time: null,
  difficulty: null,
  creator_rating: null,
  current_version_id: null,
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
    } as unknown as ReturnType<typeof useDeleteRecipe>);

    // Mock recipeApi
    mockRecipeApi.toggleRecipePublic = vi.fn().mockResolvedValue(undefined);

    // Mock useAuth hook
    mockUseAuth.mockReturnValue({
      user: { id: 'user1' },
      profile: null,
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refreshProfile: vi.fn(async () => {}),
    } as unknown as ReturnType<typeof useAuth>);
  });

  // Helper function to get action buttons
  const getActionButtons = () => {
    return {
      viewButton: screen.getByLabelText('View recipe'),
      editButton: screen.getByLabelText('Edit recipe'),
      shareButton: screen.queryByLabelText('Share recipe'),
      deleteButton: screen.getByLabelText('Delete recipe'),
    };
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

    expect(
      screen.getByRole('heading', { name: 'Test Recipe' })
    ).toBeInTheDocument();
    expect(screen.getByText('3 ingredients')).toBeInTheDocument();
    expect(
      screen.getByText('A delicious test recipe for testing purposes.')
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
    expect(image).toHaveAttribute(
      'src',
      expect.stringContaining('https://example.com/image.jpg')
    );
  });

  it('renders recipe without image when image_url is not provided', () => {
    const recipeWithoutImage: Recipe = { ...mockRecipe, image_url: null };

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

    // The component truncates titles longer than 45 characters
    const truncatedTitle = 'This is a very long recipe title that should...';
    const titleElement = screen.getByRole('heading', {
      name: truncatedTitle,
    });
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent(truncatedTitle);
  });

  it('shows action buttons directly on the card', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
          showEditDelete={true}
        />
      </TestWrapper>
    );

    const { viewButton, editButton, deleteButton } = getActionButtons();
    expect(viewButton).toBeInTheDocument();
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });

  it('calls onView when view button is clicked', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    const { viewButton } = getActionButtons();
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockRecipe);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
          showEditDelete={true}
        />
      </TestWrapper>
    );

    const { editButton } = getActionButtons();
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockRecipe);
  });

  it('shows delete dialog when delete button is clicked', () => {
    const mockMutate = vi.fn();
    mockUseDeleteRecipe.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useDeleteRecipe>);

    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
          showEditDelete={true}
        />
      </TestWrapper>
    );

    const { deleteButton } = getActionButtons();
    fireEvent.click(deleteButton);

    // Should show delete confirmation dialog
    expect(screen.getByText('Delete Recipe')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete/)
    ).toBeInTheDocument();
  });

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

    const { shareButton } = getActionButtons();
    expect(shareButton).toBeInTheDocument();
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

    const { shareButton } = getActionButtons();
    expect(shareButton).not.toBeInTheDocument();
  });

  it('should not show Share button when user does not own recipe', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'different-user' },
      profile: null,
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refreshProfile: vi.fn(async () => {}),
    } as unknown as ReturnType<typeof useAuth>);

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

    const { shareButton } = getActionButtons();
    expect(shareButton).not.toBeInTheDocument();
  });

  it('calls onShareToggle when share button is clicked', async () => {
    // Mock the API call to resolve successfully
    mockRecipeApi.toggleRecipePublic.mockResolvedValue(undefined);

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

    const { shareButton } = getActionButtons();
    fireEvent.click(shareButton!);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockOnShareToggle).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockUseDeleteRecipe.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      error: new Error('Delete failed'),
    } as unknown as ReturnType<typeof useDeleteRecipe>);

    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    // Component should still render despite error
    expect(
      screen.getByRole('heading', { name: 'Test Recipe' })
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('displays loading state when delete is in progress', () => {
    mockUseDeleteRecipe.mockReturnValue({
      mutate: vi.fn(),
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useDeleteRecipe>);

    render(
      <TestWrapper>
        <RecipeCard
          recipe={mockRecipe}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </TestWrapper>
    );

    // Component should still render during loading
    expect(
      screen.getByRole('heading', { name: 'Test Recipe' })
    ).toBeInTheDocument();
  });
});

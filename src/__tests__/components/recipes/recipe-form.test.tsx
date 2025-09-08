import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecipeForm } from '@/components/recipes/recipe-form';
import {
  useCreateRecipe,
  useUpdateRecipe,
  useUploadImage,
} from '@/hooks/use-recipes';
import { supabase } from '@/lib/supabase';
import { processImageFile } from '@/lib/image-utils';

// Mock the hooks and modules
vi.mock('@/hooks/use-recipes');
vi.mock('@/lib/supabase');
vi.mock('@/lib/image-utils');
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
  toast: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(() => ({
    state: null,
  })),
  useNavigate: vi.fn(() => vi.fn()),
}));

const mockUseCreateRecipe = useCreateRecipe as vi.MockedFunction<
  typeof useCreateRecipe
>;
const mockUseUpdateRecipe = useUpdateRecipe as vi.MockedFunction<
  typeof useUpdateRecipe
>;
const mockUseUploadImage = useUploadImage as vi.MockedFunction<
  typeof useUploadImage
>;
const mockSupabase = supabase as vi.Mocked<typeof supabase>;
const mockProcessImageFile = processImageFile as vi.MockedFunction<
  typeof processImageFile
>;

// Mock recipe data
const mockRecipe = {
  id: '1',
  title: 'Test Recipe',
  ingredients: ['ingredient1', 'ingredient2'],
  instructions: 'Test instructions',
  notes: 'Test notes',
  categories: ['Italian'],
  image_url: 'https://example.com/image.jpg',
  created_at: '2023-12-30T00:00:00Z',
  updated_at: '2023-12-30T00:00:00Z',
  user_id: 'user1',
  is_public: false,
  setup: 'Test setup',
};

describe('RecipeForm', () => {
  const mockMutateAsync = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock hooks
    mockUseCreateRecipe.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    } as ReturnType<typeof useCreateRecipe>);

    mockUseUpdateRecipe.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    } as ReturnType<typeof useUpdateRecipe>);

    mockUseUploadImage.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    } as ReturnType<typeof useUploadImage>);

    // Mock Supabase auth
    mockSupabase.auth = {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user1' } },
        error: null,
      }),
    } as unknown as typeof import('@/lib/supabase').supabase.auth;

    // Mock image processing
    mockProcessImageFile.mockResolvedValue({
      success: true,
      compressedFile: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      previewUrl: 'blob:test-preview-url',
    });
  });

  it('renders form fields correctly', () => {
    render(<RecipeForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/recipe title/i)).toBeInTheDocument();
    expect(screen.getByText(/ingredients/i)).toBeInTheDocument();
    expect(screen.getByText(/instructions/i)).toBeInTheDocument();
    expect(screen.getByText(/notes/i)).toBeInTheDocument();
  });

  it('shows Upload Image button', () => {
    render(<RecipeForm onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('shows Save Image button when image file is selected', async () => {
    render(<RecipeForm onSuccess={mockOnSuccess} />);

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Mock the file input change
    const fileInput = document.querySelector('input[type="file"]');

    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('Save Image')).toBeInTheDocument();
    });
  });

  it('calls uploadImage.mutateAsync when Save Image button is clicked', async () => {
    const mockUploadMutateAsync = vi
      .fn()
      .mockResolvedValue('https://example.com/uploaded-image.jpg');
    mockUseUploadImage.mockReturnValue({
      mutateAsync: mockUploadMutateAsync,
      isPending: false,
      error: null,
    } as ReturnType<typeof useUploadImage>);

    render(<RecipeForm onSuccess={mockOnSuccess} />);

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Mock the file input change
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('Save Image')).toBeInTheDocument();
    });

    // Click Save Image button
    const saveImageButton = screen.getByText('Save Image');
    fireEvent.click(saveImageButton);

    await waitFor(() => {
      expect(mockUploadMutateAsync).toHaveBeenCalledWith(expect.any(File));
    });
  });

  it('shows Create Recipe button for new recipes', () => {
    render(<RecipeForm onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Create Recipe')).toBeInTheDocument();
  });

  it('shows Update Recipe button for existing recipes', () => {
    render(
      <RecipeForm existingRecipe={mockRecipe} onSuccess={mockOnSuccess} />
    );

    expect(screen.getByText('Update Recipe')).toBeInTheDocument();
  });

  it('calls createRecipe.mutateAsync when creating new recipe', async () => {
    const mockCreateMutateAsync = vi.fn().mockResolvedValue(mockRecipe);
    mockUseCreateRecipe.mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
      error: null,
    } as ReturnType<typeof useCreateRecipe>);

    render(<RecipeForm onSuccess={mockOnSuccess} />);

    // Fill in form data
    fireEvent.change(screen.getByLabelText(/recipe title/i), {
      target: { value: 'New Recipe' },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/enter cooking instructions/i),
      {
        target: { value: 'New instructions' },
      }
    );

    // Add an ingredient by clicking the Add Ingredient button
    const addIngredientButton = screen.getByText('Add Ingredient');
    fireEvent.click(addIngredientButton);

    // Fill in the ingredient
    fireEvent.change(screen.getByPlaceholderText(/ingredient 1/i), {
      target: { value: 'Test ingredient' },
    });

    // Submit form
    const submitButton = screen.getByText('Create Recipe');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Recipe',
          instructions: 'New instructions',
          is_public: false,
        })
      );
    });
  });

  it('calls updateRecipe.mutateAsync when updating existing recipe', async () => {
    const mockUpdateMutateAsync = vi.fn().mockResolvedValue(mockRecipe);
    mockUseUpdateRecipe.mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
      error: null,
    } as ReturnType<typeof useUpdateRecipe>);

    render(
      <RecipeForm existingRecipe={mockRecipe} onSuccess={mockOnSuccess} />
    );

    // Update form data
    fireEvent.change(screen.getByLabelText(/recipe title/i), {
      target: { value: 'Updated Recipe' },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/enter cooking instructions/i),
      {
        target: { value: 'Updated instructions' },
      }
    );

    // Add an ingredient by clicking the Add Ingredient button
    const addIngredientButton = screen.getByText('Add Ingredient');
    fireEvent.click(addIngredientButton);

    // Fill in the ingredient
    fireEvent.change(screen.getByPlaceholderText(/ingredient 1/i), {
      target: { value: 'Updated ingredient' },
    });

    // Submit form
    const submitButton = screen.getByText('Update Recipe');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: '1',
        updates: expect.objectContaining({
          title: 'Updated Recipe',
        }),
      });
    });
  });

  it('uploads image before creating recipe when image file is selected', async () => {
    const mockUploadMutateAsync = vi
      .fn()
      .mockResolvedValue('https://example.com/uploaded-image.jpg');
    const mockCreateMutateAsync = vi.fn().mockResolvedValue(mockRecipe);

    mockUseUploadImage.mockReturnValue({
      mutateAsync: mockUploadMutateAsync,
      isPending: false,
      error: null,
    } as ReturnType<typeof useUploadImage>);

    mockUseCreateRecipe.mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
      error: null,
    } as ReturnType<typeof useCreateRecipe>);

    render(<RecipeForm onSuccess={mockOnSuccess} />);

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Mock the file input change
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    // Fill in form data
    fireEvent.change(screen.getByLabelText(/recipe title/i), {
      target: { value: 'New Recipe' },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/enter cooking instructions/i),
      {
        target: { value: 'New instructions' },
      }
    );

    // Add an ingredient by clicking the Add Ingredient button
    const addIngredientButton = screen.getByText('Add Ingredient');
    fireEvent.click(addIngredientButton);

    // Fill in the ingredient
    fireEvent.change(screen.getByPlaceholderText(/ingredient 1/i), {
      target: { value: 'Test ingredient' },
    });

    // Ensure online to avoid disabled submit
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('online'));

    // Submit form directly to avoid disabled button edge cases
    const form = document.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(mockUploadMutateAsync).toHaveBeenCalledWith(expect.any(File));
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          image_url: 'https://example.com/uploaded-image.jpg',
        })
      );
    });
  });

  it('handles image processing errors gracefully', async () => {
    mockProcessImageFile.mockResolvedValue({
      success: false,
      error: 'Invalid image file',
    });

    render(<RecipeForm onSuccess={mockOnSuccess} />);

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Mock the file input change
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    // Should not show Save Image button when processing fails
    await waitFor(() => {
      expect(screen.queryByText('Save Image')).not.toBeInTheDocument();
    });
  });
});

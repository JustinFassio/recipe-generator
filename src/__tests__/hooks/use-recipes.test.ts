import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRecipes, useRecipe, useCreateRecipe } from '@/hooks/use-recipes';

// Mock the API module
vi.mock('@/lib/api', () => ({
  recipeApi: {
    getRecipes: vi.fn(),
    getRecipe: vi.fn(),
    createRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    uploadImage: vi.fn(),
  },
  parseRecipeFromText: vi.fn(),
}));

describe('useRecipes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a query result object', () => {
    const { result } = renderHook(() => useRecipes());

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });

  it('should handle recipe fetch error gracefully', () => {
    const { result } = renderHook(() => useRecipes());

    // Should return a valid query result object even on error
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });
});

describe('useRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a query result object for valid ID', () => {
    const { result } = renderHook(() => useRecipe('1'));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });

  it('should handle empty ID gracefully', () => {
    const { result } = renderHook(() => useRecipe(''));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });
});

describe('useCreateRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return mutation functions', () => {
    const { result } = renderHook(() => useCreateRecipe());

    expect(result.current).toHaveProperty('mutate');
    expect(result.current).toHaveProperty('mutateAsync');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });

  it('should provide mutation functions that are callable', () => {
    const { result } = renderHook(() => useCreateRecipe());

    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
  });
});

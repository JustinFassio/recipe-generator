import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFilterBar } from '@/hooks/useFilterBar';
import type { RecipeFilters } from '@/lib/types';

// Mock the mobile detection hook
vi.mock('@/hooks/use-mobile-detection', () => ({
  useMobileDetection: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    hasTouch: false,
    screenWidth: 1200,
    screenHeight: 800,
  })),
}));

describe('useFilterBar', () => {
  const mockOnFiltersChange = vi.fn();
  const initialFilters: RecipeFilters = {
    searchTerm: '',
    categories: [],
    cuisine: [],
    moods: [],
    availableIngredients: [],
    sortBy: 'date',
    sortOrder: 'desc',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with provided filters', () => {
    const { result } = renderHook(() =>
      useFilterBar(initialFilters, mockOnFiltersChange)
    );

    expect(result.current.localFilters).toEqual(initialFilters);
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('updates filters correctly', () => {
    const { result } = renderHook(() =>
      useFilterBar(initialFilters, mockOnFiltersChange)
    );

    act(() => {
      result.current.updateFilter({ searchTerm: 'pasta' });
    });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...initialFilters,
      searchTerm: 'pasta',
    });
  });

  it('clears all filters correctly', () => {
    const filtersWithData = {
      ...initialFilters,
      searchTerm: 'pasta',
      categories: ['Italian'],
    };

    const { result } = renderHook(() =>
      useFilterBar(filtersWithData, mockOnFiltersChange)
    );

    act(() => {
      result.current.clearAllFilters();
    });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      searchTerm: undefined,
      categories: undefined,
      cuisine: undefined,
      moods: undefined,
      availableIngredients: undefined,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  });

  it('calculates active filter count correctly', () => {
    const filtersWithData = {
      ...initialFilters,
      searchTerm: 'pasta',
      categories: ['Italian'],
      cuisine: ['italian' as const],
    };

    const { result } = renderHook(() =>
      useFilterBar(filtersWithData, mockOnFiltersChange)
    );

    expect(result.current.activeFilterCount).toBe(3);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('syncs with external filter changes', () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useFilterBar(filters, mockOnFiltersChange),
      { initialProps: { filters: initialFilters } }
    );

    const updatedFilters = { ...initialFilters, searchTerm: 'pasta' };
    rerender({ filters: updatedFilters });

    expect(result.current.localFilters).toEqual(updatedFilters);
  });

  it('provides correct device detection values', () => {
    const { result } = renderHook(() =>
      useFilterBar(initialFilters, mockOnFiltersChange)
    );

    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
  });
});

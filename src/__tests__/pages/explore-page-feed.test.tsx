import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Stub heavy child components and hooks used by ExplorePage
vi.mock('../../components/recipes/VersionedRecipeCard', () => ({
  VersionedRecipeCard: ({
    recipe,
  }: {
    recipe: { id: string; title: string };
  }) => <div data-testid="recipe-card">{recipe.title}</div>,
}));

vi.mock('../../components/recipes/FilterBar', () => ({
  FilterBar: () => <div data-testid="filter-bar" />,
}));

vi.mock('../../hooks/use-recipe-filters', () => ({
  useRecipeFilters: () => ({
    filters: {},
    updateFilters: vi.fn(),
  }),
}));

vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Spy on API calls
import { recipeApi } from '../../lib/api';
import type { PublicRecipe } from '../../lib/types';

describe('ExplorePage data source', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses getPublicRecipes (not aggregate view)', async () => {
    const publicSpy = vi
      .spyOn(recipeApi, 'getPublicRecipes')
      .mockResolvedValue([] as unknown as PublicRecipe[]);
    const statsSpy = vi
      .spyOn(recipeApi, 'getPublicRecipesWithStats')
      .mockResolvedValue([] as unknown as PublicRecipe[]);
    vi.spyOn(recipeApi, 'getTrendingRecipes').mockResolvedValue(
      [] as unknown as PublicRecipe[]
    );

    const ExplorePage = (await import('../../pages/explore-page')).default;

    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>
    );

    // Wait for initial load to complete
    await waitFor(() => expect(publicSpy).toHaveBeenCalledTimes(1));
    expect(statsSpy).not.toHaveBeenCalled();

    // Sanity: shows heading
    expect(
      await screen.findByRole('heading', { name: /Explore Recipes/i })
    ).toBeInTheDocument();
  });
});

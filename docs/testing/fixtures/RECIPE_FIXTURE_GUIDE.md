# Recipe Test Fixture Guide

## Purpose

Standard, type-safe `Recipe` fixtures for tests. Prevents shape drift and runtime surprises.

## Minimal `Recipe` Fixture (copy/paste)

```ts
import type { Recipe } from '@/lib/types';

export const createRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'test-recipe-1',
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
  setup: ['Test setup instructions'],
  cooking_time: null,
  difficulty: null,
  creator_rating: null,
  current_version_id: null,
  ...overrides,
});
```

## Do/Don’t

- Do: type fixtures as `Recipe` so TS enforces required fields
- Do: use `overrides` to customize per test
- Don’t: use wrong field types (e.g., `setup` must be `string[]`)

## `useAuth` mock shape (for components relying on auth)

The real hook returns `AuthContextType`. Mock with the full shape:

```ts
vi.mock('@/contexts/AuthProvider');
import { useAuth } from '@/contexts/AuthProvider';

vi.mocked(useAuth).mockReturnValue({
  user: { id: 'user1' } as any,
  profile: null,
  loading: false,
  error: null,
  signOut: vi.fn(async () => {}),
  refreshProfile: vi.fn(async () => {}),
});
```

Avoid using `isLoading`; the correct key is `loading`.

## jest-dom matchers

When using matchers like `toBeInTheDocument` or `toHaveTextContent`, ensure the test file imports:

```ts
import '@testing-library/jest-dom';
```

This provides types and runtime matchers to avoid lint/type errors.

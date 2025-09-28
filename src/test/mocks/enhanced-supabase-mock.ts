/**
 * Enhanced Supabase Mock
 * Provides realistic Supabase client behavior for testing
 * Supports all query methods and dynamic data updates
 */

import { vi } from 'vitest';

// Mock data storage
const mockRecipes = new Map();
const mockVersions = new Map();
const mockProfiles = new Map();
const mockUsernames = new Map();

// Helper function to generate realistic IDs
const generateId = (prefix: string = 'test') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Helper function to create realistic timestamps
const createTimestamp = () => new Date().toISOString();

// Helper function to create realistic version data
const createMockVersion = (
  recipeId: string,
  versionNumber: number = 0,
  overrides: Record<string, unknown> = {}
) => ({
  id: generateId('version'),
  recipe_id: recipeId,
  version_number: versionNumber,
  title: 'Test Recipe',
  ingredients: ['1 cup flour', '2 eggs', '1 cup milk'],
  instructions: 'Mix ingredients and bake at 350°F for 20 minutes.',
  created_at: createTimestamp(),
  updated_at: createTimestamp(),
  ...overrides,
});

// Query state interface
interface QueryState {
  table: string;
  filters: Array<{ type: string; column: string; value: unknown }>;
  orderBy: Array<{ column: string; ascending: boolean }>;
  limitCount: number | null;
  singleResult: boolean;
}

// Execute query based on state
const executeQuery = (queryState: QueryState) => {
  const { table, filters, orderBy, limitCount, singleResult } = queryState;

  let data: unknown[] = [];

  // Get data based on table
  switch (table) {
    case 'recipes':
      data = Array.from(mockRecipes.values());
      break;
    case 'recipe_versions':
    case 'recipe_content_versions':
      data = Array.from(mockVersions.values());
      break;
    case 'profiles':
      data = Array.from(mockProfiles.values());
      break;
    case 'usernames':
      data = Array.from(mockUsernames.values());
      break;
    default:
      data = [];
  }

  // Apply filters
  for (const filter of filters) {
    switch (filter.type) {
      case 'eq':
        data = data.filter((item: unknown) => {
          const obj = item as Record<string, unknown>;
          return obj[filter.column] === filter.value;
        });
        break;
      case 'contains':
        data = data.filter((item: unknown) => {
          const obj = item as Record<string, unknown>;
          const arrayValue = obj[filter.column] as unknown[];
          return arrayValue?.some((val: unknown) =>
            (filter.value as unknown[]).includes(val)
          );
        });
        break;
      case 'overlaps':
        data = data.filter((item: unknown) => {
          const obj = item as Record<string, unknown>;
          const arrayValue = obj[filter.column] as unknown[];
          return arrayValue?.some((val: unknown) =>
            (filter.value as unknown[]).some((v: unknown) =>
              String(val).includes(String(v))
            )
          );
        });
        break;
    }
  }

  // Apply order
  if (orderBy.length > 0) {
    data.sort((a: unknown, b: unknown) => {
      for (const order of orderBy) {
        const objA = a as Record<string, unknown>;
        const objB = b as Record<string, unknown>;
        const valA = objA[order.column];
        const valB = objB[order.column];
        if (valA < valB) return order.ascending ? -1 : 1;
        if (valA > valB) return order.ascending ? 1 : -1;
      }
      return 0;
    });
  }

  // Apply limit
  if (limitCount !== null) {
    data = data.slice(0, limitCount);
  }

  const result = singleResult ? (data.length > 0 ? data[0] : null) : data;
  return { data: result, error: null };
};

// Create query builder
const createQueryBuilder = (table: string) => {
  const queryState: QueryState = {
    table,
    filters: [],
    orderBy: [],
    limitCount: null,
    singleResult: false,
  };

  const builder = {
    select: vi.fn(() => {
      return builder;
    }),
    eq: vi.fn((column: string, value: unknown) => {
      queryState.filters.push({ type: 'eq', column, value });
      return builder;
    }),
    contains: vi.fn((column: string, values: unknown[]) => {
      queryState.filters.push({ type: 'contains', column, value: values });
      return builder;
    }),
    overlaps: vi.fn((column: string, values: unknown[]) => {
      queryState.filters.push({ type: 'overlaps', column, value: values });
      return builder;
    }),
    order: vi.fn((column: string, options?: { ascending?: boolean }) => {
      queryState.orderBy.push({
        column,
        ascending: options?.ascending ?? true,
      });
      return builder;
    }),
    limit: vi.fn((count: number) => {
      queryState.limitCount = count;
      return builder;
    }),
    single: vi.fn(() => {
      queryState.singleResult = true;
      return builder;
    }),
    then: vi.fn(
      (
        resolve: (value: unknown) => void,
        reject: (reason?: unknown) => void
      ) => {
        try {
          const result = executeQuery(queryState);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    ),
  };
  return builder;
};

// Enhanced Supabase mock
export const createEnhancedSupabaseMock = () => ({
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({ data: { user: null }, error: null })
    ),
    signInWithPassword: vi.fn(() =>
      Promise.resolve({ data: { user: null }, error: null })
    ),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn((table: string) => {
    const builder = createQueryBuilder(table);

    // Add insert method
    builder.insert = vi.fn((data: Record<string, unknown>) => ({
      select: vi.fn(() => ({
        single: vi.fn(() => {
          const id = generateId(table.replace('s', ''));
          const item = {
            id,
            ...data,
            created_at: createTimestamp(),
            updated_at: createTimestamp(),
          };

          // Store in appropriate map
          switch (table) {
            case 'recipes': {
              // Create version 0 when recipe is created
              const versionId = generateId('version');
              const version = createMockVersion(id, 0, {
                title: item.title,
                ingredients: item.ingredients,
                instructions: item.instructions,
              });
              mockVersions.set(versionId, version);

              // Set current_version_id on recipe
              item.current_version_id = versionId;
              mockRecipes.set(id, item);
              break;
            }
            case 'recipe_versions':
            case 'recipe_content_versions': {
              mockVersions.set(id, item);
              break;
            }
            case 'profiles': {
              mockProfiles.set(id, item);
              break;
            }
            case 'usernames': {
              mockUsernames.set(id, item);
              break;
            }
          }

          return Promise.resolve({ data: item, error: null });
        }),
      })),
    }));

    // Add update method
    builder.update = vi.fn((data: Record<string, unknown>) => ({
      eq: vi.fn((column: string, value: unknown) => ({
        select: vi.fn(() => ({
          single: vi.fn(() => {
            let item: unknown = null;
            switch (table) {
              case 'recipes': {
                item = mockRecipes.get(value);
                if (item) {
                  Object.assign(item, data, { updated_at: createTimestamp() });
                  mockRecipes.set(value as string, item);
                }
                break;
              }
              case 'recipe_versions':
              case 'recipe_content_versions': {
                item = mockVersions.get(value);
                if (item) {
                  Object.assign(item, data, { updated_at: createTimestamp() });
                  mockVersions.set(value as string, item);
                }
                break;
              }
              case 'profiles': {
                item = mockProfiles.get(value);
                if (item) {
                  Object.assign(item, data, { updated_at: createTimestamp() });
                  mockProfiles.set(value as string, item);
                }
                break;
              }
              case 'usernames': {
                item = mockUsernames.get(value);
                if (item) {
                  Object.assign(item, data, { updated_at: createTimestamp() });
                  mockUsernames.set(value as string, item);
                }
                break;
              }
            }
            return Promise.resolve({ data: item, error: null });
          }),
        })),
      })),
    }));

    // Add delete method
    builder.delete = vi.fn(() => ({
      eq: vi.fn((column: string, value: unknown) => {
        switch (table) {
          case 'recipes':
            mockRecipes.delete(value as string);
            break;
          case 'recipe_versions':
          case 'recipe_content_versions':
            mockVersions.delete(value as string);
            break;
          case 'profiles':
            mockProfiles.delete(value as string);
            break;
          case 'usernames':
            mockUsernames.delete(value as string);
            break;
        }
        return Promise.resolve({ error: null });
      }),
    }));

    return builder;
  }),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() =>
        Promise.resolve({ data: { path: 'test-path' }, error: null })
      ),
      download: vi.fn(() => Promise.resolve({ data: new Blob(), error: null })),
      remove: vi.fn(() => Promise.resolve({ data: [], error: null })),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: 'https://example.com/test' },
      })),
    })),
  },
});

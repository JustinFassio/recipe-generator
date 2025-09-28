/**
 * Enhanced Supabase Mock
 * Provides realistic Supabase client behavior for testing
 * Supports all query methods and dynamic data updates
 */

import { vi } from 'vitest';

// Mock data storage
const mockRecipes = new Map<string, Record<string, unknown>>();
const mockVersions = new Map<string, Record<string, unknown>>();
const mockProfiles = new Map<string, Record<string, unknown>>();
const mockUsernames = new Map<string, Record<string, unknown>>();

// Helper function to generate realistic IDs
const generateId = (prefix: string = 'test') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Helper function to create realistic timestamps
const createTimestamp = () => new Date().toISOString();

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

  let data: Record<string, unknown>[] = [];

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
        data = data.filter((item) => item[filter.column] === filter.value);
        break;
      case 'contains':
        data = data.filter((item) => {
          const value = item[filter.column];
          return (
            Array.isArray(value) && value.includes(filter.value as unknown)
          );
        });
        break;
      case 'overlaps':
        data = data.filter((item) => {
          const value = item[filter.column];
          return (
            Array.isArray(value) &&
            Array.isArray(filter.value) &&
            value.some((v) => (filter.value as unknown[]).includes(v))
          );
        });
        break;
    }
  }

  // Apply order
  if (orderBy.length > 0) {
    data.sort((a, b) => {
      for (const order of orderBy) {
        const valA = a[order.column] as string | number;
        const valB = b[order.column] as string | number;
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

  const builder: Record<string, unknown> = {
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
    insert: vi.fn((data: Record<string, unknown>) => ({
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
              const version = {
                id: versionId,
                recipe_id: id,
                version_number: 0,
                title: (item.title as string) || 'Test Recipe',
                ingredients: (item.ingredients as string[]) || [
                  '1 cup flour',
                  '2 eggs',
                  '1 cup milk',
                ],
                instructions:
                  (item.instructions as string) ||
                  'Mix ingredients and bake at 350°F for 20 minutes.',
                created_at: createTimestamp(),
                updated_at: createTimestamp(),
              };
              mockVersions.set(versionId, version);

              // Set current_version_id on recipe
              item.current_version_id = versionId;
              mockRecipes.set(id, item);
              break;
            }
            case 'recipe_versions':
            case 'recipe_content_versions':
              mockVersions.set(id, item);
              break;
            case 'profiles':
              mockProfiles.set(id, item);
              break;
            case 'usernames':
              mockUsernames.set(id, item);
              break;
          }

          return Promise.resolve({ data: item, error: null });
        }),
      })),
    })),
    update: vi.fn((data: Record<string, unknown>) => ({
      eq: vi.fn((column: string, value: unknown) => ({
        select: vi.fn(() => ({
          single: vi.fn(() => {
            let item: Record<string, unknown> | null = null;
            switch (table) {
              case 'recipes':
                item = mockRecipes.get(value as string) || null;
                if (item) {
                  Object.assign(item, data, { updated_at: createTimestamp() });
                  mockRecipes.set(value as string, item);
                }
                break;
              case 'recipe_versions':
              case 'recipe_content_versions':
                item = mockVersions.get(value as string) || null;
                if (item) {
                  Object.assign(item, data, { updated_at: createTimestamp() });
                  mockVersions.set(value as string, item);
                }
                break;
              case 'profiles':
                item = mockProfiles.get(value as string) || null;
                if (item) {
                  Object.assign(item, data, { updated_at: createTimestamp() });
                  mockProfiles.set(value as string, item);
                }
                break;
              case 'usernames':
                item = mockUsernames.get(value as string) || null;
                if (item) {
                  Object.assign(item, data, { updated_at: createTimestamp() });
                  mockUsernames.set(value as string, item);
                }
                break;
            }
            return Promise.resolve({ data: item, error: null });
          }),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn((_column: string, value: unknown) => {
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
    })),
  };

  return builder;
};

export const createEnhancedSupabaseMock = () => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn((table: string) => createQueryBuilder(table)),
  storage: {
    from: vi.fn(() => ({
      upload: vi
        .fn()
        .mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi
        .fn()
        .mockReturnValue({ data: { publicUrl: 'https://example.com/test' } }),
    })),
  },
});

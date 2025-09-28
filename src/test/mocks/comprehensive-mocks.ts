/**
 * Comprehensive Mock Strategy for Recipe Generator Tests
 *
 * This file provides a unified, well-planned mock system that covers all external dependencies
 * and ensures consistent test behavior across all test suites.
 */

import { vi } from 'vitest';

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  ...overrides,
});

export const createMockRecipe = (overrides = {}) => ({
  id: 'test-recipe-id',
  title: 'Test Recipe',
  ingredients: ['1 cup flour', '2 eggs', '1 cup sugar'],
  instructions: 'Mix ingredients and bake at 350°F for 30 minutes.',
  user_id: 'test-user-id',
  is_public: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockParsedRecipe = (overrides = {}) => ({
  title: 'Test Recipe',
  ingredients: ['1 cup flour', '2 eggs', '1 cup sugar'],
  instructions: 'Mix ingredients and bake at 350°F for 30 minutes.',
  categories: ['dessert'],
  ...overrides,
});

// ============================================================================
// SUPABASE MOCKS
// ============================================================================

export const createSupabaseMock = () => {
  const mockData = {
    recipes: [createMockRecipe()],
    users: [createMockUser()],
  };

  const createQueryChain = (tableName: string) => {
    const getTableData = () => {
      switch (tableName) {
        case 'recipes':
          return mockData.recipes;
        case 'users':
          return mockData.users;
        default:
          return [];
      }
    };

    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: getTableData()[0] || null,
              error: null,
            })
          ),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve({
              data: getTableData(),
              error: null,
            })
          ),
        })),
        single: vi.fn(() =>
          Promise.resolve({
            data: getTableData()[0] || null,
            error: null,
          })
        ),
        limit: vi.fn(() =>
          Promise.resolve({
            data: getTableData(),
            error: null,
          })
        ),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: createMockRecipe(),
              error: null,
            })
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: createMockRecipe(),
                error: null,
              })
            ),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    };
  };

  return {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: createMockUser() },
          error: null,
        })
      ),
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: null },
          error: null,
        })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      signInAnonymously: vi.fn(() =>
        Promise.resolve({
          data: { user: createMockUser({ id: 'anonymous-user', email: null }) },
          error: null,
        })
      ),
    },
    from: vi.fn((tableName: string) => createQueryChain(tableName)),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } })),
      })),
    },
  };
};

// ============================================================================
// API MOCKS
// ============================================================================

export const createApiMocks = () => ({
  // Mock recipe parser
  parseRecipeFromText: vi.fn(() => Promise.resolve(createMockParsedRecipe())),

  // Mock recipe standardizer
  standardizeRecipeWithAI: vi.fn(() =>
    Promise.resolve(createMockParsedRecipe())
  ),

  // Mock API client
  APIClient: vi.fn().mockImplementation(() => ({
    chatWithPersona: vi.fn().mockResolvedValue({
      response: 'Mocked AI response',
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    }),
  })),
});

// ============================================================================
// REACT QUERY MOCKS
// ============================================================================

export const createReactQueryMocks = () => ({
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useQuery: vi.fn(({ queryFn, enabled = true }) => {
    if (!enabled) {
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    }

    try {
      const data = queryFn ? queryFn() : [];
      return {
        data,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      return {
        data: undefined,
        isLoading: false,
        error,
      };
    }
  }),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
});

// ============================================================================
// REACT ROUTER MOCKS
// ============================================================================

export const createReactRouterMocks = () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ children }: { children: React.ReactNode }) => children,
  useNavigate: vi.fn(() => vi.fn()),
  useParams: vi.fn(() => ({})),
});

// ============================================================================
// UTILITY MOCKS
// ============================================================================

export const createUtilityMocks = () => ({
  // Mock toast
  toast: vi.fn(),
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),

  // Mock user preferences
  getUserGroceries: vi.fn().mockResolvedValue({
    groceries: {},
    shopping_list: {},
  }),
  updateUserGroceries: vi.fn().mockResolvedValue({
    success: true,
  }),
  getUserSafety: vi.fn().mockResolvedValue({
    allergies: [],
    dietary_restrictions: [],
  }),
  updateUserSafety: vi.fn().mockResolvedValue({
    success: true,
  }),
  getUserCookingPreferences: vi.fn().mockResolvedValue({
    cuisine_preferences: [],
    spice_level: 3,
  }),
  updateUserCookingPreferences: vi.fn().mockResolvedValue({
    success: true,
  }),
});

// ============================================================================
// GLOBAL MOCKS
// ============================================================================

export const createGlobalMocks = () => ({
  // Mock IntersectionObserver
  IntersectionObserver: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),

  // Mock global fetch
  fetch: vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
    blob: vi.fn().mockResolvedValue(new Blob()),
  }),
});

// ============================================================================
// UNIFIED MOCK SETUP
// ============================================================================

export const setupComprehensiveMocks = () => {
  // Set up global mocks
  const globalMocks = createGlobalMocks();
  Object.assign(global, globalMocks);

  // Mock all external dependencies
  vi.mock('@/lib/supabase', () => ({
    supabase: createSupabaseMock(),
  }));

  vi.mock('@/lib/recipe-parser', () => createApiMocks());
  vi.mock('@/lib/recipe-standardizer', () => createApiMocks());
  vi.mock('@/lib/api-client', () => createApiMocks());

  vi.mock('@tanstack/react-query', () => createReactQueryMocks());
  vi.mock('react-router-dom', () => createReactRouterMocks());
  vi.mock('@/hooks/use-toast', () => createUtilityMocks());
  vi.mock('@/lib/user-preferences', () => createUtilityMocks());
};

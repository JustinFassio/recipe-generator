// Polyfill for HTMLFormElement.prototype.requestSubmit (not implemented in jsdom)
if (typeof window !== 'undefined' && typeof HTMLFormElement !== 'undefined') {
  if (!HTMLFormElement.prototype.requestSubmit) {
    HTMLFormElement.prototype.requestSubmit = function () {
      this.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
    };
  }
}

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
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
          data: { user: { id: 'anonymous-user', email: null } },
          error: null,
        })
      ),
    },
    from: vi.fn(() => {
      const chain = {
        select: vi.fn(() => ({
          // support both select().eq().single() and select().order()
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: {
                  id: 'test-recipe-id',
                  title: 'Test Recipe',
                  ingredients: ['1 cup flour', '2 eggs', '1 cup milk'],
                  instructions:
                    'Mix ingredients and bake at 350°F for 20 minutes.',
                  user_id: 'test-user-id',
                  is_public: false,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z',
                },
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
                  data: {
                    id: 'test-recipe-id',
                    title: 'Test Recipe',
                    ingredients: ['1 cup flour', '2 eggs', '1 cup milk'],
                    instructions:
                      'Mix ingredients and bake at 350°F for 20 minutes.',
                    user_id: 'test-user-id',
                    is_public: false,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z',
                  },
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
      return chain;
    }),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } })),
      })),
    },
  },
}));

// Mock React Query with proper implementation
vi.mock('@tanstack/react-query', () => ({
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

    // Return the result of queryFn directly for testing
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
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ children }: { children: React.ReactNode }) => children,
  useNavigate: vi.fn(() => vi.fn()),
  useParams: vi.fn(() => ({})),
}));

// Mock API Client
vi.mock('@/lib/api-client', () => ({
  APIClient: vi.fn().mockImplementation(() => ({
    chatWithPersona: vi.fn().mockResolvedValue({
      response: 'Mocked AI response',
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    }),
  })),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  })),
}));

// Mock AuthProvider for tests
vi.mock('@/contexts/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    },
    profile: {
      id: 'test-user-id',
      username: 'testuser',
      full_name: 'Test User',
      avatar_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    loading: false,
    error: null,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  })),
}));

// Globally stub app data layer to keep page/integration tests simple and deterministic
vi.mock('@/lib/user-preferences', () => ({
  getUserSafety: vi.fn().mockResolvedValue({
    allergies: [],
    dietary_restrictions: [],
    medical_conditions: [],
  }),
  updateUserSafety: vi.fn().mockResolvedValue({ success: true }),
  getCookingPreferences: vi.fn().mockResolvedValue({
    preferred_cuisines: [],
    available_equipment: [],
    disliked_ingredients: [],
    spice_tolerance: 3,
  }),
  updateCookingPreferences: vi.fn().mockResolvedValue({ success: true }),
  getUserGroceries: vi.fn().mockResolvedValue({
    groceries: {},
    shopping_list: {},
  }),
  updateUserGroceries: vi.fn().mockResolvedValue({ success: true }),
  validateAllergies: vi.fn((allergies: string[]) =>
    allergies.every((allergy) => allergy.trim().length > 0)
  ),
  validateSpiceTolerance: vi.fn(
    (level: number) => Number.isInteger(level) && level >= 1 && level <= 5
  ),
  validateTimePerMeal: vi.fn(
    (minutes: number) =>
      Number.isInteger(minutes) && minutes >= 10 && minutes <= 120
  ),
  MIN_SPICE_TOLERANCE: 1,
  MAX_SPICE_TOLERANCE: 5,
  MIN_TIME_PER_MEAL: 10,
  MAX_TIME_PER_MEAL: 120,
}));

vi.mock('@/lib/auth', () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
  updateEmail: vi.fn().mockResolvedValue({ success: true }),
  updatePassword: vi.fn().mockResolvedValue({ success: true }),
  uploadAvatar: vi.fn().mockResolvedValue({
    success: true,
    avatarUrl: 'https://example.com/avatar.jpg',
  }),
  checkUsernameAvailability: vi.fn().mockResolvedValue({ available: true }),
  claimUsername: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock global fetch to prevent real HTTP requests during tests
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue(''),
  blob: vi.fn().mockResolvedValue(new Blob()),
});

// Mock recipe parser to prevent empty ingredients in tests
vi.mock('@/lib/recipe-parser', () => ({
  parseRecipeFromText: vi.fn().mockResolvedValue({
    title: 'Test Recipe',
    ingredients: ['1 cup flour', '2 eggs', '1 cup milk'],
    instructions: 'Mix ingredients and bake at 350°F for 20 minutes.',
    categories: ['Course: Dessert', 'Cuisine: American'],
  }),
}));

// Mock recipe standardizer
vi.mock('@/lib/recipe-standardizer', () => ({
  standardizeRecipeWithAI: vi.fn().mockResolvedValue({
    title: 'Test Recipe',
    ingredients: ['1 cup flour', '2 eggs', '1 cup milk'],
    instructions: 'Mix ingredients and bake at 350°F for 20 minutes.',
    categories: ['Course: Dessert', 'Cuisine: American'],
  }),
  convertToParsedRecipe: vi.fn().mockReturnValue({
    title: 'Test Recipe',
    ingredients: ['1 cup flour', '2 eggs', '1 cup milk'],
    instructions: 'Mix ingredients and bake at 350°F for 20 minutes.',
    categories: ['Course: Dessert', 'Cuisine: American'],
  }),
}));

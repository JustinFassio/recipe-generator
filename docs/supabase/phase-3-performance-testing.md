# Phase 3: Performance & Testing

**Timeline**: Day 3  
**Deliverable**: Optimized database performance and testing infrastructure for Phase 4

---

## 🎯 Objective

Add strategic database indexes for optimal performance and create the testing infrastructure needed to support Phase 4 profile testing.

---

## 📋 Implementation Steps

### Step 1: Performance Optimization

#### Migration 7: `20250120000007_add_performance_indexes.sql`

```sql
-- Add strategic indexes for optimal performance
BEGIN;

-- Username performance (supports useUsernameAvailability hook)
CREATE UNIQUE INDEX CONCURRENTLY idx_profiles_username_lower
ON profiles (LOWER(username))
WHERE username IS NOT NULL;

-- Array-based queries for user preferences (supports all tag fields)
CREATE INDEX CONCURRENTLY idx_user_safety_allergies
ON user_safety USING GIN (allergies);

CREATE INDEX CONCURRENTLY idx_user_safety_dietary_restrictions
ON user_safety USING GIN (dietary_restrictions);

CREATE INDEX CONCURRENTLY idx_cooking_preferences_cuisines
ON cooking_preferences USING GIN (preferred_cuisines);

CREATE INDEX CONCURRENTLY idx_cooking_preferences_equipment
ON cooking_preferences USING GIN (available_equipment);

CREATE INDEX CONCURRENTLY idx_cooking_preferences_disliked
ON cooking_preferences USING GIN (disliked_ingredients);

-- Profile lookup optimization
CREATE INDEX CONCURRENTLY idx_profiles_region
ON profiles (region)
WHERE region IS NOT NULL;

-- Recipe queries (existing functionality)
CREATE INDEX CONCURRENTLY idx_recipes_user_public
ON recipes (user_id, is_public, created_at DESC);

CREATE INDEX CONCURRENTLY idx_recipes_public_recent
ON recipes (created_at DESC)
WHERE is_public = true;

COMMIT;
```

### Step 2: Database Functions for Complex Operations

#### Migration 8: `20250120000008_add_helper_functions.sql`

```sql
-- Add helper functions for common operations
BEGIN;

-- Get complete user profile data (supports getAllUserPreferences)
CREATE OR REPLACE FUNCTION get_complete_user_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}';
  profile_data jsonb;
  safety_data jsonb;
  cooking_data jsonb;
BEGIN
  -- Security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: can only access own profile data';
  END IF;

  -- Get profile data
  SELECT to_jsonb(p) INTO profile_data
  FROM profiles p
  WHERE p.id = p_user_id;

  -- Get safety data
  SELECT to_jsonb(us) INTO safety_data
  FROM user_safety us
  WHERE us.user_id = p_user_id;

  -- Get cooking preferences
  SELECT to_jsonb(cp) INTO cooking_data
  FROM cooking_preferences cp
  WHERE cp.user_id = p_user_id;

  -- Combine results
  result := jsonb_build_object(
    'profile', profile_data,
    'safety', safety_data,
    'cooking', cooking_data
  );

  RETURN result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_complete_user_profile TO authenticated;

COMMIT;
```

### Step 3: Testing Infrastructure Setup

#### Create Test Data Factory

**File**: `src/test/fixtures/database-fixtures.ts`

```typescript
import type { Profile, UserSafety, CookingPreferences } from '@/lib/types';

// Test user profiles for comprehensive testing
export const testProfiles: Record<string, Profile> = {
  // Complete profile with all fields
  fullProfile: {
    id: 'test-user-full',
    username: 'fulluser',
    full_name: 'Full Profile User',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'I love cooking and trying new recipes from around the world!',
    region: 'North America',
    language: 'en',
    units: 'metric',
    time_per_meal: 45,
    skill_level: 'advanced',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },

  // Minimal profile (new user)
  minimalProfile: {
    id: 'test-user-minimal',
    username: null,
    full_name: 'New User',
    avatar_url: null,
    bio: null,
    region: null,
    language: 'en',
    units: 'metric',
    time_per_meal: null,
    skill_level: 'beginner',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },

  // Edge case profiles
  maxLengthProfile: {
    id: 'test-user-max',
    username: 'a'.repeat(24), // Max username length
    full_name: 'A'.repeat(80), // Max full name length
    avatar_url: 'https://example.com/long-url-avatar.jpg',
    bio: 'B'.repeat(500), // Max bio length
    region: 'Very Long Region Name That Tests Limits',
    language: 'en',
    units: 'imperial',
    time_per_meal: 120, // Max time per meal
    skill_level: 'advanced',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

// Test safety data
export const testUserSafety: Record<string, UserSafety> = {
  fullSafety: {
    user_id: 'test-user-full',
    allergies: ['peanuts', 'shellfish', 'tree nuts'],
    dietary_restrictions: ['vegetarian', 'gluten-free'],
    medical_conditions: ['diabetes', 'high blood pressure'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },

  minimalSafety: {
    user_id: 'test-user-minimal',
    allergies: [],
    dietary_restrictions: [],
    medical_conditions: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

// Test cooking preferences
export const testCookingPreferences: Record<string, CookingPreferences> = {
  fullCooking: {
    user_id: 'test-user-full',
    preferred_cuisines: ['Italian', 'Mexican', 'Thai', 'Japanese'],
    available_equipment: [
      'oven',
      'stovetop',
      'air fryer',
      'blender',
      'food processor',
    ],
    disliked_ingredients: ['cilantro', 'mushrooms'],
    spice_tolerance: 4,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },

  minimalCooking: {
    user_id: 'test-user-minimal',
    preferred_cuisines: [],
    available_equipment: ['oven', 'stovetop'],
    disliked_ingredients: [],
    spice_tolerance: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

// Factory functions for generating test data
export const createTestProfile = (overrides?: Partial<Profile>): Profile => ({
  ...testProfiles.fullProfile,
  ...overrides,
});

export const createTestUserSafety = (
  overrides?: Partial<UserSafety>
): UserSafety => ({
  ...testUserSafety.fullSafety,
  ...overrides,
});

export const createTestCookingPreferences = (
  overrides?: Partial<CookingPreferences>
): CookingPreferences => ({
  ...testCookingPreferences.fullCooking,
  ...overrides,
});
```

#### Enhanced Supabase Mocks

**File**: `src/test/mocks/supabase-mocks.ts`

```typescript
import { vi } from 'vitest';
import {
  testProfiles,
  testUserSafety,
  testCookingPreferences,
} from '../fixtures/database-fixtures';

// Database operation response builders
export const createSuccessResponse = <T>(data: T) => ({
  data,
  error: null,
});

export const createErrorResponse = (code: string, message: string) => ({
  data: null,
  error: { code, message },
});

// Common database scenarios
export const mockDatabaseScenarios = {
  // Profile operations
  profileExists: (profileId: string) =>
    createSuccessResponse(testProfiles.fullProfile),

  profileNotFound: () => createErrorResponse('PGRST116', 'No rows found'),

  profileCreated: () => createSuccessResponse(testProfiles.minimalProfile),

  // Safety operations
  safetyDataExists: () => createSuccessResponse(testUserSafety.fullSafety),

  safetyDataEmpty: () => createSuccessResponse(testUserSafety.minimalSafety),

  // Cooking preferences operations
  cookingPrefsExists: () =>
    createSuccessResponse(testCookingPreferences.fullCooking),

  cookingPrefsEmpty: () =>
    createSuccessResponse(testCookingPreferences.minimalCooking),

  // Username operations
  usernameAvailable: () => createSuccessResponse(null),

  usernameTaken: () =>
    createErrorResponse(
      '23505',
      'duplicate key value violates unique constraint'
    ),

  // Storage operations
  uploadSuccess: (fileName: string) =>
    createSuccessResponse({ path: fileName }),

  uploadError: () => createErrorResponse('storage_error', 'File upload failed'),
};

// Mock Supabase client for testing
export const createMockSupabaseClient = () => ({
  from: vi.fn((table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  })),
  auth: {
    getUser: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  storage: {
    from: vi.fn((bucket: string) => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: `https://example.com/${bucket}/test-file.jpg` },
      })),
      remove: vi.fn(),
    })),
  },
  rpc: vi.fn(),
});
```

#### Test Helpers for Profile Components

**File**: `src/test/helpers/profile-test-helpers.ts`

```typescript
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthProvider';
import { createMockSupabaseClient, mockDatabaseScenarios } from '../mocks/supabase-mocks';

// Test wrapper for profile components
export const renderWithProfileProviders = (
  ui: React.ReactElement,
  options?: {
    authState?: 'authenticated' | 'unauthenticated';
    hasProfile?: boolean;
    hasSafetyData?: boolean;
    hasCookingPrefs?: boolean;
  }
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockClient = createMockSupabaseClient();

  // Setup database mocks based on options
  if (options?.hasProfile) {
    mockClient.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(mockDatabaseScenarios.profileExists('test-user')),
        };
      }
      return mockClient.from(table);
    });
  }

  if (options?.hasSafetyData) {
    mockClient.from.mockImplementation((table) => {
      if (table === 'user_safety') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue(mockDatabaseScenarios.safetyDataExists()),
        };
      }
      return mockClient.from(table);
    });
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper });
};

// Performance test helpers
export const measureProfileLoadTime = async (profileId: string): Promise<number> => {
  const startTime = performance.now();

  // Simulate profile loading operations
  await Promise.all([
    mockDatabaseScenarios.profileExists(profileId),
    mockDatabaseScenarios.safetyDataExists(),
    mockDatabaseScenarios.cookingPrefsExists(),
  ]);

  const endTime = performance.now();
  return endTime - startTime;
};
```

---

## 🚀 Deployment

### Using Supabase CLI

```bash
# Run performance migrations
supabase db push

# Verify indexes are created
supabase db diff
```

---

## ✅ Verification Checklist

### Performance Optimization

- [ ] All strategic indexes created successfully
- [ ] Username availability checks < 100ms
- [ ] Profile loading < 200ms
- [ ] Array-based queries optimized with GIN indexes
- [ ] Recipe queries perform well

### Testing Infrastructure

- [ ] Test fixtures created for all profile data types
- [ ] Supabase mocks handle all common scenarios
- [ ] Profile component test helpers work
- [ ] Performance measurement utilities ready

### Database Functions

- [ ] `get_complete_user_profile` function works
- [ ] `update_username_atomic` function works
- [ ] Security policies enforced in functions
- [ ] Functions perform well under load

---

## 📊 Performance Benchmarks

**Target Performance Metrics:**

- Profile loading: < 200ms
- Username availability check: < 100ms
- Safety data save: < 300ms
- Cooking preferences save: < 300ms
- Recipe queries: < 500ms

**Query Performance Tests:**

```sql
-- Test username availability performance
EXPLAIN ANALYZE
SELECT 1 FROM profiles WHERE LOWER(username) = LOWER('testuser') LIMIT 1;

-- Test profile loading performance
EXPLAIN ANALYZE
SELECT * FROM profiles WHERE id = 'test-user-id';

-- Test array-based allergy queries
EXPLAIN ANALYZE
SELECT allergies FROM user_safety
WHERE user_id = 'test-user-id' AND allergies @> ARRAY['peanuts'];
```

---

## 🎯 Phase 4 Readiness

This phase provides everything needed for Phase 4 profile testing:

**Testing Infrastructure:**

- ✅ Comprehensive test fixtures for all profile data
- ✅ Realistic mock scenarios for database operations
- ✅ Test helpers for component integration testing
- ✅ Performance measurement utilities

**Database Foundation:**

- ✅ Optimized for all profile component operations
- ✅ Strategic indexing for performance
- ✅ Helper functions for complex operations
- ✅ Security policies validated and tested

**Ready for Phase 4 Implementation:**

- Unit tests for all profile components
- Integration tests for complete profile workflows
- Performance testing infrastructure
- Mock-based testing without database dependencies

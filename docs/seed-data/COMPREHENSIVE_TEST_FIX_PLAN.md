# Comprehensive Test Fix Plan

**Goal**: Achieve 100% test pass rate by fixing seed data and mock system issues

**Current Status**: 518/545 tests passing (95% pass rate) - 21 tests failing

**Last Updated**: January 2025

---

## 📊 **Current Test Analysis**

### **✅ Passing Tests (518/545)**

- **Component Tests**: All UI components working correctly
- **Hook Tests**: React Query hooks functioning properly
- **Unit Tests**: Business logic and utility functions
- **Recipe Parsing**: All 18 recipe parsing tests now passing
- **Profile Management**: User profile functionality working

### **❌ Failing Tests (21/545)**

1. **Database Tests (8 failures)**: Supabase mock interference
2. **Integration Tests (4 failures)**: Mock limitations with complex queries
3. **Dual Server Test (1 failure)**: Expected in test environment
4. **Profile Functions (4 failures)**: Database connection issues
5. **Username Functions (4 failures)**: Database connection issues

---

## 🎯 **Root Cause Analysis**

### **Primary Issues**

#### **1. Supabase Mock Limitations**

- **Problem**: Global mock in `src/test/setup.ts` is too simplistic
- **Impact**: Database tests can't connect to real Supabase
- **Symptoms**: `Cannot read properties of undefined (reading 'get')`

#### **2. Missing Query Methods**

- **Problem**: Mock doesn't support `.order()`, `.contains()`, `.overlaps()`
- **Impact**: Integration tests fail with method not found errors
- **Symptoms**: `supabase.from(...).select(...).eq(...).order is not a function`

#### **3. Hardcoded Mock Responses**

- **Problem**: Mock returns static "Test Recipe" instead of dynamic data
- **Impact**: Update operations don't reflect changes
- **Symptoms**: `expected 'Test Recipe' to be 'Updated Test Recipe'`

#### **4. Database Connection Issues**

- **Problem**: Database tests need real Supabase connections
- **Impact**: All database integration tests fail
- **Symptoms**: RLS policy violations, connection errors

---

## 🛠️ **Comprehensive Fix Strategy**

### **Phase 1: Enhanced Supabase Mock System**

#### **1.1 Create Realistic Supabase Mock**

```typescript
// Enhanced mock with full query support
const createEnhancedSupabaseMock = () => {
  const mockData = new Map();
  const mockRecipes = new Map();

  return {
    from: vi.fn((table: string) => ({
      select: vi.fn((columns = '*') => ({
        eq: vi.fn((column: string, value: any) => ({
          single: vi.fn(() => Promise.resolve({
            data: mockData.get(`${table}_${column}_${value}`) || null,
            error: null
          })),
          order: vi.fn((column: string, options: any) => ({
            limit: vi.fn((count: number) => Promise.resolve({
              data: Array.from(mockRecipes.values()).slice(0, count),
              error: null
            }))
          }))
        })),
        contains: vi.fn((column: string, values: any[]) => ({
          limit: vi.fn((count: number) => Promise.resolve({
            data: Array.from(mockRecipes.values()).filter(recipe =>
              recipe[column]?.some((cat: string) => values.includes(cat))
            ),
            error: null
          }))
        })),
        overlaps: vi.fn((column: string, values: any[]) => ({
          limit: vi.fn((count: number) => Promise.resolve({
            data: Array.from(mockRecipes.values()).filter(recipe =>
              recipe[column]?.some((cat: string) => values.some(v => cat.includes(v)))
            ),
            error: null
          }))
        })),
        order: vi.fn((column: string, options: any) => ({
          limit: vi.fn((count: number) => Promise.resolve({
            data: Array.from(mockRecipes.values()).slice(0, count),
            error: null
          }))
        })),
        limit: vi.fn((count: number) => Promise.resolve({
          data: Array.from(mockRecipes.values()).slice(0, count),
          error: null
        })),
        single: vi.fn(() => Promise.resolve({
          data: Array.from(mockRecipes.values())[0] || null,
          error: null
        }))
      })),
      insert: vi.fn((data: any) => ({
        select: vi.fn(() => ({
          single: vi.fn(() => {
            const id = `recipe-${Date.now()}`;
            const recipe = { id, ...data, created_at: new Date().toISOString() };
            mockRecipes.set(id, recipe);
            return Promise.resolve({ data: recipe, error: null });
          })
        }))
      })),
      update: vi.fn((data: any) => ({
        eq: vi.fn((column: string, value: any) => ({
          select: vi.fn(() => ({
            single: vi.fn(() => {
              const recipe = mockRecipes.get(value);
              if (recipe) {
                Object.assign(recipe, data, { updated_at: new Date().toISOString() });
                mockRecipes.set(value, recipe);
              }
              return Promise.resolve({ data: recipe, error: null });
            })
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn((column: string, value: any) => {
          mockRecipes.delete(value);
          return Promise.resolve({ error: null });
        })
      }))
    })
  };
};
```

#### **1.2 Conditional Mock Application**

```typescript
// Apply different mocks based on test type
const shouldUseRealSupabase = (testPath: string) => {
  return testPath.includes('database') || testPath.includes('integration');
};

// Enhanced setup with conditional mocking
if (!shouldUseRealSupabase(import.meta.url)) {
  vi.mock('@/lib/supabase', () => ({
    supabase: createEnhancedSupabaseMock(),
  }));
}
```

### **Phase 2: Database Test Environment**

#### **2.1 Separate Database Test Configuration**

```typescript
// src/test/database-setup.ts
export const setupDatabaseTests = () => {
  // Unmock Supabase for database tests
  vi.unmock('@/lib/supabase');
  vi.unmock('@supabase/supabase-js');

  // Use real Supabase client for database tests
  return createDbClient('service');
};
```

#### **2.2 Database Test Isolation**

```typescript
// Enhanced database test setup
beforeAll(async () => {
  if (shouldRunDbTests()) {
    // Use real Supabase connection
    supabase = createDbClient('service');
  } else {
    // Use enhanced mock
    supabase = createEnhancedSupabaseMock();
  }
});
```

### **Phase 3: Integration Test Mock Enhancement**

#### **3.1 Realistic Recipe Data Mock**

```typescript
// Mock with realistic recipe data
const mockRecipeData = {
  'recipe-1': {
    id: 'recipe-1',
    title: 'Test Recipe',
    ingredients: ['1 cup flour', '2 eggs', '1 cup milk'],
    instructions: 'Mix ingredients and bake at 350°F for 20 minutes.',
    user_id: 'test-user-id',
    is_public: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    categories: ['Course: Dessert', 'Cuisine: American'],
  },
};

// Enhanced update mock that reflects changes
update: vi.fn((data: any) => ({
  eq: vi.fn((column: string, value: any) => ({
    select: vi.fn(() => ({
      single: vi.fn(() => {
        const recipe = mockRecipeData[value];
        if (recipe) {
          // Update the recipe with new data
          Object.assign(recipe, data, { updated_at: new Date().toISOString() });
          mockRecipeData[value] = recipe;
        }
        return Promise.resolve({ data: recipe, error: null });
      }),
    })),
  })),
}));
```

#### **3.2 Version Support Mock**

```typescript
// Mock recipe versions
const mockVersions = new Map();

// Enhanced versioning support
const createVersionMock = () => ({
  select: vi.fn((columns = '*') => ({
    eq: vi.fn((column: string, value: any) => ({
      order: vi.fn((column: string, options: any) => ({
        limit: vi.fn((count: number) =>
          Promise.resolve({
            data: Array.from(mockVersions.values())
              .filter((v) => v.recipe_id === value)
              .sort((a, b) => a.version_number - b.version_number)
              .slice(0, count),
            error: null,
          })
        ),
      })),
    })),
  })),
});
```

### **Phase 4: Test Environment Optimization**

#### **4.1 Dual Server Test Fix**

```typescript
// Enhanced dual server test with better timeout handling
const waitForServers = async (maxAttempts = 10, delay = 2000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const [frontendStatus, apiStatus] = await Promise.all([
        checkServerStatus(5174),
        checkServerStatus(3000),
      ]);

      if (frontendStatus && apiStatus) {
        return true;
      }
    } catch (error) {
      console.log(`Attempt ${attempt}/${maxAttempts} failed:`, error.message);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return false;
};
```

#### **4.2 React Act Warnings Fix**

```typescript
// Enhanced test utilities with proper act wrapping
export const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClient>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </QueryClient>
  );
};

// Wrap state updates in act
export const actWrapper = async (fn: () => Promise<void>) => {
  await act(async () => {
    await fn();
  });
};
```

---

## 🚀 **Implementation Plan**

### **Step 1: Enhanced Supabase Mock (Priority: High)**

1. Create `src/test/mocks/enhanced-supabase-mock.ts`
2. Implement full query method support
3. Add realistic data management
4. Update `src/test/setup.ts` to use enhanced mock

### **Step 2: Database Test Isolation (Priority: High)**

1. Create `src/test/database-setup.ts`
2. Implement conditional mocking
3. Update database test files
4. Test database connectivity

### **Step 3: Integration Test Enhancement (Priority: Medium)**

1. Enhance recipe CRUD mock
2. Add versioning support
3. Implement dynamic data updates
4. Test integration scenarios

### **Step 4: Test Environment Optimization (Priority: Low)**

1. Fix dual server test timeout
2. Resolve React act warnings
3. Optimize test performance
4. Add test utilities

---

## 📋 **Detailed Implementation Steps**

### **Step 1: Create Enhanced Supabase Mock**

#### **1.1 Create Mock File**

```bash
# Create enhanced mock file
touch src/test/mocks/enhanced-supabase-mock.ts
```

#### **1.2 Implement Mock Logic**

```typescript
// src/test/mocks/enhanced-supabase-mock.ts
export const createEnhancedSupabaseMock = () => {
  const mockData = new Map();
  const mockRecipes = new Map();
  const mockVersions = new Map();

  // Implementation details as outlined above
};
```

#### **1.3 Update Test Setup**

```typescript
// src/test/setup.ts
import { createEnhancedSupabaseMock } from './mocks/enhanced-supabase-mock';

// Replace existing mock with enhanced version
vi.mock('@/lib/supabase', () => ({
  supabase: createEnhancedSupabaseMock(),
}));
```

### **Step 2: Database Test Configuration**

#### **2.1 Create Database Setup**

```bash
# Create database test setup
touch src/test/database-setup.ts
```

#### **2.2 Implement Conditional Mocking**

```typescript
// src/test/database-setup.ts
export const setupDatabaseTests = () => {
  // Unmock for database tests
  vi.unmock('@/lib/supabase');
  vi.unmock('@supabase/supabase-js');

  // Return real client
  return createDbClient('service');
};
```

#### **2.3 Update Database Tests**

```typescript
// Update all database test files
import { setupDatabaseTests } from '../database-setup';

beforeAll(async () => {
  supabase = setupDatabaseTests();
});
```

### **Step 3: Integration Test Enhancement**

#### **3.1 Enhance Recipe Mock**

```typescript
// Add to enhanced mock
const mockRecipeData = {
  // Realistic recipe data
};

const createRecipeMock = () => {
  // Enhanced recipe operations
};
```

#### **3.2 Add Versioning Support**

```typescript
// Add versioning to enhanced mock
const mockVersions = new Map();

const createVersionMock = () => {
  // Version management
};
```

### **Step 4: Test Environment Optimization**

#### **4.1 Fix Dual Server Test**

```typescript
// Enhanced dual server test
const waitForServers = async () => {
  // Improved server detection
};
```

#### **4.2 Resolve React Act Warnings**

```typescript
// Enhanced test utilities
export const renderWithProviders = (ui: React.ReactElement) => {
  // Proper provider wrapping
};
```

---

## 🧪 **Testing Strategy**

### **Test Categories**

#### **1. Unit Tests (Component/Logic)**

- **Status**: ✅ All passing
- **Action**: No changes needed
- **Focus**: Maintain current functionality

#### **2. Integration Tests (Recipe CRUD)**

- **Status**: ❌ 4 failures
- **Action**: Enhance Supabase mock
- **Focus**: Dynamic data updates, versioning

#### **3. Database Tests (Real Supabase)**

- **Status**: ❌ 8 failures
- **Action**: Conditional mocking
- **Focus**: Real database connections

#### **4. Dual Server Tests**

- **Status**: ❌ 1 failure
- **Action**: Improve timeout handling
- **Focus**: Server detection reliability

### **Testing Approach**

#### **Phase 1 Testing**

1. Test enhanced mock with integration tests
2. Verify dynamic data updates
3. Test all query methods
4. Validate error handling

#### **Phase 2 Testing**

1. Test database connectivity
2. Verify RLS policies
3. Test user creation
4. Validate data relationships

#### **Phase 3 Testing**

1. Test recipe CRUD operations
2. Verify versioning functionality
3. Test category filtering
4. Validate update operations

#### **Phase 4 Testing**

1. Test dual server detection
2. Verify React act warnings resolved
3. Test performance improvements
4. Validate test reliability

---

## 📊 **Success Metrics**

### **Target Goals**

- **Test Pass Rate**: 100% (545/545 tests passing)
- **Database Tests**: All 8 tests passing
- **Integration Tests**: All 4 tests passing
- **Dual Server Test**: 1 test passing
- **Performance**: Test execution time < 2 minutes

### **Quality Metrics**

- **Mock Realism**: Enhanced mock supports all Supabase operations
- **Test Isolation**: Database tests use real connections
- **Data Consistency**: Mock data reflects real operations
- **Error Handling**: Proper error responses for edge cases

### **Maintenance Metrics**

- **Code Coverage**: Maintain > 90% coverage
- **Test Reliability**: < 1% flaky tests
- **Performance**: Test suite runs in < 2 minutes
- **Maintainability**: Clear separation of concerns

---

## 🚨 **Risk Mitigation**

### **Potential Risks**

#### **1. Mock Complexity**

- **Risk**: Enhanced mock becomes too complex
- **Mitigation**: Keep mock focused on test needs
- **Fallback**: Use real Supabase for all tests

#### **2. Test Performance**

- **Risk**: Enhanced mock slows down tests
- **Mitigation**: Optimize mock operations
- **Fallback**: Use simpler mock for unit tests

#### **3. Database Dependencies**

- **Risk**: Database tests require external services
- **Mitigation**: Use local Supabase instance
- **Fallback**: Mock database operations

#### **4. Integration Complexity**

- **Risk**: Integration tests become flaky
- **Mitigation**: Use deterministic mock data
- **Fallback**: Simplify integration scenarios

### **Contingency Plans**

#### **Plan A: Enhanced Mock Success**

- Implement all phases as planned
- Achieve 100% test pass rate
- Maintain test performance

#### **Plan B: Hybrid Approach**

- Use enhanced mock for unit tests
- Use real Supabase for integration tests
- Accept some test complexity

#### **Plan C: Simplified Approach**

- Use basic mock for all tests
- Focus on critical functionality
- Accept some test limitations

---

## 📝 **Implementation Checklist**

### **Phase 1: Enhanced Mock (Week 1)**

- [ ] Create enhanced Supabase mock
- [ ] Implement all query methods
- [ ] Add realistic data management
- [ ] Test mock functionality
- [ ] Update test setup

### **Phase 2: Database Tests (Week 1)**

- [ ] Create database test setup
- [ ] Implement conditional mocking
- [ ] Update database test files
- [ ] Test database connectivity
- [ ] Verify RLS policies

### **Phase 3: Integration Tests (Week 2)**

- [ ] Enhance recipe CRUD mock
- [ ] Add versioning support
- [ ] Implement dynamic updates
- [ ] Test integration scenarios
- [ ] Validate data consistency

### **Phase 4: Optimization (Week 2)**

- [ ] Fix dual server test
- [ ] Resolve React act warnings
- [ ] Optimize test performance
- [ ] Add test utilities
- [ ] Final validation

### **Final Validation**

- [ ] Run full test suite
- [ ] Verify 100% pass rate
- [ ] Check performance metrics
- [ ] Validate test reliability
- [ ] Update documentation

---

## 🎯 **Expected Outcomes**

### **Immediate Benefits**

- **100% Test Pass Rate**: All 545 tests passing
- **Reliable Test Suite**: No flaky tests
- **Fast Execution**: Tests complete in < 2 minutes
- **Clear Separation**: Unit vs integration vs database tests

### **Long-term Benefits**

- **Maintainable Tests**: Clear mock structure
- **Scalable Testing**: Easy to add new test scenarios
- **Developer Experience**: Reliable test feedback
- **CI/CD Ready**: Tests pass consistently in CI

### **Quality Improvements**

- **Test Coverage**: Comprehensive test scenarios
- **Mock Realism**: Tests reflect real behavior
- **Error Handling**: Proper error scenarios
- **Performance**: Optimized test execution

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Status**: 🚧 In Progress

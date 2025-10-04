# API Modularization & Refactoring

**Status:** 🟡 Planning (Lessons Learned - Do Better)  
**Priority:** P2 Medium  
**Type:** Refactoring  
**Estimated Effort:** L (4-5 days split across multiple PRs)  
**Created:** 2025-10-07  
**Last Updated:** 2025-10-07

## Problem Statement

### What is the issue?

The `src/lib/api.ts` file has grown to over 1,200 lines and contains multiple concerns:

- Public recipe operations
- User recipe CRUD
- Rating and comment systems
- Image gallery operations
- Analytics and versioning
- Discovery/explore features

This monolithic structure makes:

- Code navigation difficult
- Testing harder to isolate
- Type definitions sprawling
- Merge conflicts more frequent
- Code review overwhelming

### How does it manifest?

- Developers struggle to find specific API methods
- TypeScript errors compound across unrelated features
- Pull requests touching API file are difficult to review
- Import statements become unclear (`import { everything } from '@/lib/api'`)

### When was it discovered?

- Attempted refactoring in `feature/debug-production-csp-errors` branch
- Commit `66ed6ca` attempted to split into modular structure
- **FAILED** due to type safety issues and scope being too large

### Impact Assessment

- **Users Affected:** Development team (internal)
- **Severity:** Medium (technical debt, not user-facing)
- **Workaround Available:** Yes - current monolithic structure works

## Root Cause Analysis

### Why does this issue exist?

1. **Organic Growth**
   - Started small, grew feature by feature
   - No refactoring checkpoints established
   - "Working code" prioritized over "clean code"

2. **Unclear Module Boundaries**
   - Mixed public/private recipe operations
   - Rating system coupled with recipe API
   - No separation between discovery and CRUD

3. **Type Definitions Scattered**
   - Types defined inline
   - No central type registry
   - Circular dependency risks

### Contributing Factors

- Rapid feature development
- Lack of architectural planning
- No module size limits enforced
- Type system not leveraged fully

### Code References

```typescript
// Location: src/lib/api.ts (BEFORE - Monolithic)
// 1,200+ lines, all concerns mixed together
export const recipeApi = {
  // User recipes
  async getUserRecipes() {
    /* ... */
  },
  async createRecipe() {
    /* ... */
  },

  // Public recipes
  async getPublicRecipe() {
    /* ... */
  },
  async getPublicRecipesWithStats() {
    /* ... */
  },

  // Ratings
  async getCommunityRating() {
    /* ... */
  },
  async submitRating() {
    /* ... */
  },

  // Images
  async addRecipeImage() {
    /* ... */
  },

  // ... 20+ more methods
};
```

## What Was Attempted (Previous Attempt)

### Original Refactoring Structure

The `feature/debug-production-csp-errors` branch attempted this structure:

```
src/lib/api/
├── index.ts                    # Main export barrel
├── core/
│   ├── recipe-api.ts          # Core recipe CRUD
│   └── public-recipe-api.ts   # Public recipe operations
├── features/
│   ├── rating-api.ts          # Ratings and comments
│   ├── versioning-api.ts      # Recipe versioning
│   └── image-gallery-api.ts   # Image management
├── discovery/
│   └── explore-api.ts         # Explore/trending features
├── user/
│   └── user-recipe-api.ts     # User-specific operations
└── shared/
    ├── types.ts               # Shared type definitions
    ├── constants.ts           # Shared constants
    └── error-handling.ts      # Error utilities
```

### What Worked ✅

1. **Logical separation** - Clear module boundaries
2. **Barrel exports** - Clean import paths maintained
3. **Shared utilities** - Error handling centralized
4. **Feature isolation** - Each module self-contained

### What Failed ❌

1. **All at once** - 18 files changed, 3,000 lines modified
2. **Type mismatches** - 16 TypeScript errors introduced
3. **Breaking changes** - Components expected old signatures
4. **No migration path** - Old code broken immediately
5. **Insufficient testing** - Type errors only caught at build time

### TypeScript Errors Encountered

```typescript
// Error 1: Missing method exports
Property 'submitRating' does not exist on type 'RatingAPI'
// Cause: Method renamed but consumers not updated

// Error 2: Signature mismatches
Expected 1 arguments, but got 2
// Cause: API signature changed without updating callers

// Error 3: Type incompatibility
Type 'Record<string, unknown>' is not assignable to 'ImageWithMetadata[]'
// Cause: Types not properly exported/imported

// Error 4: Missing type exports
Namespace has no exported member 'CommentRow'
// Cause: Interface not exported from module
```

## Proposed Solution (Improved Approach)

### High-Level Approach

**Incremental modularization** - One module at a time, maintaining backward compatibility

### Phase 1: Foundation (Week 1)

**Goal:** Set up infrastructure without breaking existing code

**Steps:**

1. Create `src/lib/api/shared/types.ts` with all current types
2. Create `src/lib/api/shared/constants.ts` with all constants
3. Update `src/lib/api.ts` to import from shared (no behavior change)
4. Verify everything still works

**Branch:** `refactor/api-foundation`  
**PR Size:** ~200 lines changed  
**Risk:** Low (no behavior change)

---

### Phase 2: Extract Rating API (Week 2)

**Goal:** Move rating operations to dedicated module while maintaining compatibility

**Steps:**

1. **Create new module with full types**

   ```typescript
   // src/lib/api/features/rating-api.ts
   import { supabase } from '@/lib/supabase';
   import { handleError } from '../shared/error-handling';

   export interface CommentRow {
     id: string;
     user_id: string;
     comment: string;
     rating?: number;
     created_at: string;
     updated_at: string;
     user_profile?: {
       id: string;
       full_name: string;
       avatar_url?: string;
     };
   }

   export interface CommunityRating {
     average: number;
     count: number;
     userRating?: number;
   }

   export const ratingApi = {
     async getCommunityRating(recipeId: string): Promise<CommunityRating> {
       // Implementation
     },

     async submitCommunityRating(
       recipeId: string,
       rating: number
     ): Promise<void> {
       // Implementation
     },

     async getComments(recipeId: string): Promise<CommentRow[]> {
       // Implementation
     },

     async submitComment(
       recipeId: string,
       comment: string,
       rating?: number
     ): Promise<void> {
       // Implementation
     },

     async getUserVersionRating(
       recipeId: string,
       versionNumber: number
     ): Promise<{
       rating: number;
       comment?: string;
     } | null> {
       // Implementation
     },
   };
   ```

2. **Update main API to re-export (backward compatibility)**

   ```typescript
   // src/lib/api.ts
   import { ratingApi as ratingApiModule } from './api/features/rating-api';

   export const recipeApi = {
     // ... existing methods ...

     // Re-export rating methods for backward compatibility
     getCommunityRating: ratingApiModule.getCommunityRating,
     submitCommunityRating: ratingApiModule.submitCommunityRating,
     getComments: ratingApiModule.getComments,
     submitComment: ratingApiModule.submitComment,
     getUserVersionRating: ratingApiModule.getUserVersionRating,
   };

   // Also export as separate module for new code
   export { ratingApi } from './api/features/rating-api';
   ```

3. **Add deprecation comments**

   ```typescript
   /**
    * @deprecated Import from '@/lib/api/features/rating-api' instead
    * This re-export maintains backward compatibility but will be removed in v2.0
    */
   getCommunityRating: ratingApiModule.getCommunityRating,
   ```

4. **Add comprehensive tests**

   ```typescript
   // src/__tests__/lib/api/features/rating-api.test.ts
   describe('Rating API', () => {
     describe('getCommunityRating', () => {
       it('should return community rating for recipe', async () => {
         // Test implementation
       });
     });
   });
   ```

5. **Update consumers incrementally** (separate PR if needed)

   ```typescript
   // OLD (still works via re-export)
   import { recipeApi } from '@/lib/api';
   recipeApi.getCommunityRating(id);

   // NEW (preferred for new code)
   import { ratingApi } from '@/lib/api/features/rating-api';
   ratingApi.getCommunityRating(id);
   ```

**Branch:** `refactor/api-rating-module`  
**PR Size:** ~400 lines (new module + tests)  
**Risk:** Low (backward compatible)

---

### Phase 3: Extract Image Gallery API (Week 3)

**Goal:** Create dedicated image operations module

**Steps:**

1. Define `ImageWithMetadata` type in shared types
2. Create `image-gallery-api.ts` with full type safety
3. Re-export from main API for compatibility
4. Add comprehensive tests
5. Update components to use new module (optional)

**Branch:** `refactor/api-image-gallery-module`  
**PR Size:** ~300 lines  
**Risk:** Low (new functionality, not replacing existing)

---

### Phase 4: Extract Public Recipe API (Week 4)

**Goal:** Separate public recipe operations from user operations

**Steps:**

1. Create `core/public-recipe-api.ts`
2. Move public-specific methods
3. Maintain backward compatibility via re-exports
4. Add tests
5. Update explore page to use new module

**Branch:** `refactor/api-public-recipe-module`  
**PR Size:** ~250 lines  
**Risk:** Medium (modifies core functionality)

---

### Phase 5: Extract User Recipe API (Week 5)

**Goal:** Consolidate user recipe CRUD operations

**Steps:**

1. Create `user/user-recipe-api.ts`
2. Move user-specific methods
3. Maintain backward compatibility
4. Add tests
5. Update recipe pages to use new module

**Branch:** `refactor/api-user-recipe-module`  
**PR Size:** ~300 lines  
**Risk:** Medium (core functionality)

---

### Phase 6: Extract Explore/Discovery API (Week 6)

**Goal:** Separate discovery features

**Steps:**

1. Create `discovery/explore-api.ts`
2. Move trending/explore methods
3. Re-export for compatibility
4. Add tests
5. Update explore page

**Branch:** `refactor/api-discovery-module`  
**PR Size:** ~400 lines  
**Risk:** Low (isolated feature)

---

### Phase 7: Deprecation & Cleanup (Week 7)

**Goal:** Remove re-exports, complete migration

**Steps:**

1. Update all components to use new modules
2. Remove re-exports from main API
3. Update documentation
4. Create migration guide for external consumers

**Branch:** `refactor/api-finalize-migration`  
**PR Size:** ~500 lines (across many files)  
**Risk:** Medium (breaking changes for external code)

## Technical Specifications

### Type Safety Requirements

**All modules must:**

1. Export all types used in public API
2. Use explicit return types (no inference for public methods)
3. Avoid `any` types (use `unknown` with type guards)
4. Document complex types with JSDoc

**Example:**

```typescript
/**
 * Represents a comment on a recipe with associated user profile
 */
export interface CommentRow {
  id: string;
  user_id: string;
  comment: string;
  /** Rating from 1-5, undefined if no rating provided */
  rating?: number;
  created_at: string;
  updated_at: string;
  /** User profile information, undefined if user deleted */
  user_profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}
```

### Error Handling Pattern

**All API methods must:**

1. Use shared error handler
2. Log errors consistently
3. Return null/undefined for "not found" (not throw)
4. Throw only for unexpected errors

**Example:**

```typescript
import { handleError } from '../shared/error-handling';

async getComments(recipeId: string): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from('recipe_comments')
    .select('*')
    .eq('recipe_id', recipeId);

  if (error) {
    handleError(error, 'Get comments');
    return []; // Safe default for "not found"
  }

  return data || [];
}
```

### Module Structure Template

```typescript
// src/lib/api/features/[feature]-api.ts

import { supabase } from '@/lib/supabase';
import { handleError } from '../shared/error-handling';
import type { SharedType1, SharedType2 } from '../shared/types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * [Type description]
 */
export interface FeatureType {
  // ... fields
}

// ============================================================================
// API
// ============================================================================

export const featureApi = {
  /**
   * [Method description]
   * @param param1 - [Description]
   * @returns [Description]
   * @throws [When and why]
   */
  async methodName(param1: string): Promise<FeatureType> {
    // Implementation
  },
};
```

## Lessons Learned from Failed Attempt

### What Went Wrong

**1. Big Bang Approach**

```diff
- 18 files changed
- 2,933 insertions, 1,373 deletions
- All at once
```

**Lesson:** Refactor incrementally, one module per PR

**2. Type Safety Neglected**

```typescript
// Problem: Types not exported
interface CommentRow {
  /* ... */
} // Not exported!

// Consumer trying to import
import type { CommentRow } from '@/lib/api/features/rating-api';
// Error: Has no exported member 'CommentRow'
```

**Lesson:** Export all types, test imports work

**3. Breaking Changes Without Migration**

```typescript
// Old signature (consumers expect this)
async submitRating(recipeId: string, versionNumber: number, rating: number)

// New signature (different arguments!)
async submitCommunityRating(recipeId: string, rating: number)

// Consumer code breaks
await recipeApi.submitRating(id, version, rating);
// Error: Property 'submitRating' does not exist
```

**Lesson:** Maintain backward compatibility, deprecate gradually

**4. Insufficient Testing**

```typescript
// Created new API modules but no tests
export const ratingApi = {
  /* 200 lines of code */
};
// Zero tests! Type errors only caught at build time
```

**Lesson:** Test each module in isolation before integration

### Key Insights

1. **Incremental > Big Bang**
   - One module per PR allows focused review
   - Easier to rollback if issues arise
   - Type errors isolated to single module

2. **Types First, Implementation Second**
   - Define interfaces before implementation
   - Export types for external use
   - Use types to guide implementation

3. **Backward Compatibility is Critical**
   - Old code must keep working
   - Deprecate, don't delete
   - Provide migration guide

4. **Test Coverage is Non-Negotiable**
   - Unit tests for each method
   - Integration tests for workflows
   - Type tests to verify exports

## Improved Incremental Approach

### Principles

1. **One Module Per PR** - Each refactoring is independently reviewable
2. **Types First** - Define all interfaces before implementation
3. **Maintain Compatibility** - Old code keeps working via re-exports
4. **Test Each Step** - Every module has tests before merging
5. **Document Migration** - Guide for updating consumer code

### Example: Rating API Module (Detailed)

#### Step 1: Create Types File

```typescript
// src/lib/api/features/rating-api.types.ts
// Created first, reviewed independently

export interface CommentRow {
  id: string;
  user_id: string;
  comment: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export interface CommunityRating {
  average: number;
  count: number;
  userRating?: number;
}

export interface VersionRating {
  rating: number;
  comment?: string;
}
```

**PR 1:** Type definitions only (~50 lines)  
**Review Focus:** Are types complete and accurate?

---

#### Step 2: Implement API Module

```typescript
// src/lib/api/features/rating-api.ts
// Implementation with types from Step 1

import type {
  CommentRow,
  CommunityRating,
  VersionRating,
} from './rating-api.types';
import { supabase } from '@/lib/supabase';
import { handleError } from '../shared/error-handling';

export const ratingApi = {
  async getCommunityRating(recipeId: string): Promise<CommunityRating> {
    // Implementation using defined types
  },

  // ... other methods
};

// Re-export types for convenience
export type { CommentRow, CommunityRating, VersionRating };
```

**PR 2:** Implementation (~200 lines)  
**Review Focus:** Does implementation match type definitions?

---

#### Step 3: Add Comprehensive Tests

```typescript
// src/__tests__/lib/api/features/rating-api.test.ts

import { ratingApi } from '@/lib/api/features/rating-api';
import type { CommentRow } from '@/lib/api/features/rating-api.types';

describe('Rating API', () => {
  describe('getCommunityRating', () => {
    it('should return rating with average and count', async () => {
      const result = await ratingApi.getCommunityRating('recipe-id');
      expect(result).toMatchObject({
        average: expect.any(Number),
        count: expect.any(Number),
      });
    });

    it('should include user rating if authenticated', async () => {
      // Test authenticated scenario
    });

    it('should handle missing rating gracefully', async () => {
      // Test not found scenario
    });
  });

  // ... comprehensive test coverage
});
```

**PR 3:** Tests (~300 lines)  
**Review Focus:** Is test coverage comprehensive?

---

#### Step 4: Update Main API (Backward Compatible)

```typescript
// src/lib/api.ts
import { ratingApi as ratingModule } from './api/features/rating-api';

export const recipeApi = {
  // ... existing methods stay as-is ...

  /**
   * @deprecated Use ratingApi from '@/lib/api/features/rating-api' instead
   * This re-export maintains backward compatibility but will be removed in v2.0
   */
  getCommunityRating: ratingModule.getCommunityRating,
  submitCommunityRating: ratingModule.submitCommunityRating,
  getComments: ratingModule.getComments,
  submitComment: ratingModule.submitComment,
  getUserVersionRating: ratingModule.getUserVersionRating,
};

// Export new module for direct use
export { ratingApi } from './api/features/rating-api';
export type {
  CommentRow,
  CommunityRating,
  VersionRating,
} from './api/features/rating-api';
```

**PR 4:** Integration (~100 lines)  
**Review Focus:** Does backward compatibility work?

---

#### Step 5: Update Consumers (Optional, Gradual)

```typescript
// BEFORE (still works!)
import { recipeApi } from '@/lib/api';
await recipeApi.getCommunityRating(id);

// AFTER (new code should use this)
import { ratingApi } from '@/lib/api/features/rating-api';
await ratingApi.getCommunityRating(id);
```

**PR 5:** Consumer updates (as needed, can be separate)  
**Review Focus:** Are all consumers updated correctly?

---

### Timeline for Full Refactoring

| Module                       | PRs   | Estimated Time | Dependencies           |
| ---------------------------- | ----- | -------------- | ---------------------- |
| Foundation (types/constants) | 1 PR  | 1 day          | None                   |
| Rating API                   | 4 PRs | 3 days         | Foundation             |
| Image Gallery API            | 3 PRs | 2 days         | Foundation             |
| Public Recipe API            | 4 PRs | 3 days         | Foundation             |
| User Recipe API              | 4 PRs | 3 days         | Foundation, Public API |
| Discovery/Explore API        | 3 PRs | 2 days         | Public API             |
| Versioning API               | 3 PRs | 2 days         | Foundation             |
| Final Migration & Cleanup    | 2 PRs | 2 days         | All above              |

**Total:** ~30 PRs over 6-8 weeks (with parallel work possible)

## Success Criteria

### Functional Requirements

- [ ] All existing functionality preserved
- [ ] No breaking changes to consumers
- [ ] All API methods properly typed
- [ ] Error handling consistent across modules

### Non-Functional Requirements

- [ ] Zero TypeScript errors
- [ ] 90%+ test coverage for each module
- [ ] All lint warnings resolved
- [ ] Build succeeds
- [ ] Bundle size not significantly increased

### Code Quality Metrics

- [ ] Average file size < 300 lines
- [ ] Each module has single responsibility
- [ ] Cyclomatic complexity < 10 per function
- [ ] No circular dependencies

### Validation Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Type checking succeeds
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Manual testing of affected features
- [ ] Code review approved
- [ ] Documentation updated

## Dependencies

### Blocked By

- None (can start immediately with Phase 1)

### Blocks

- Image Gallery System (should use modular API)
- Future API features (benefit from clean structure)

### Related Work

- Image Gallery System ([image-gallery-system.md](./image-gallery-system.md))
- Migration Scripts ([migration-scripts.md](./migration-scripts.md))

## Risks & Mitigation

| Risk                             | Probability | Impact | Mitigation                                |
| -------------------------------- | ----------- | ------ | ----------------------------------------- |
| Circular dependencies            | Medium      | High   | Strict module hierarchy, dependency graph |
| Type errors compound             | Low         | Medium | Test each module independently            |
| Performance regression           | Low         | Medium | Bundle size monitoring, code splitting    |
| Breaking changes slip through    | Low         | High   | Automated tests for all consumers         |
| Team confusion during transition | Medium      | Medium | Clear documentation, migration guides     |
| Increased maintenance burden     | Medium      | Low    | Automated tests, clear ownership          |

## Migration Guide for Consumers

### Timeline

- **Week 1-6:** New modular API available, old API still works
- **Week 7:** Deprecation warnings added
- **Week 8:** Update consumer code (optional but recommended)
- **v2.0:** Old re-exports removed (breaking change)

### How to Migrate

**Step 1: Update imports**

```typescript
// OLD
import { recipeApi } from '@/lib/api';

// NEW
import { ratingApi } from '@/lib/api/features/rating-api';
import { userRecipeApi } from '@/lib/api/user/user-recipe-api';
import { publicRecipeApi } from '@/lib/api/core/public-recipe-api';
```

**Step 2: Update method calls (if signatures changed)**

```typescript
// OLD
await recipeApi.submitRating(recipeId, versionNumber, rating);

// NEW
await ratingApi.submitVersionRating(recipeId, versionNumber, rating);
```

**Step 3: Update type imports**

```typescript
// OLD
import type { Recipe } from '@/lib/types';

// NEW
import type { Recipe } from '@/lib/types';
import type { CommentRow } from '@/lib/api/features/rating-api';
```

### Automated Migration

Consider creating codemod scripts for common patterns:

```bash
# Example codemod
npx jscodeshift -t scripts/codemods/migrate-rating-api.js src/
```

## Best Practices Going Forward

### DO ✅

1. **Define Types First**

   ```typescript
   // Create types file first
   // Get it reviewed
   // Then implement
   ```

2. **Keep Modules Small**

   ```typescript
   // Max ~300 lines per module
   // Single responsibility
   // Clear boundaries
   ```

3. **Maintain Backward Compatibility**

   ```typescript
   // Re-export old API
   // Add deprecation warnings
   // Provide migration period
   ```

4. **Test Exhaustively**

   ```typescript
   // Unit tests for each method
   // Integration tests for workflows
   // Type tests for exports
   ```

5. **Document Everything**
   ```typescript
   /**
    * JSDoc for all public methods
    * Examples for complex APIs
    * Migration guides for changes
    */
   ```

### DON'T ❌

1. **Refactor Everything at Once**

   ```typescript
   // DON'T: Touch 18 files in one PR
   // DO: One module per PR
   ```

2. **Skip Type Exports**

   ```typescript
   // DON'T: interface CommentRow { }  (not exported)
   // DO: export interface CommentRow { }
   ```

3. **Break Existing Code**

   ```typescript
   // DON'T: Remove old methods immediately
   // DO: Re-export, deprecate, then remove
   ```

4. **Skip Tests**

   ```typescript
   // DON'T: "I'll add tests later"
   // DO: Tests in same PR as implementation
   ```

5. **Use 'any' Types**
   ```typescript
   // DON'T: Record<string, any>
   // DO: Record<string, unknown> with type guards
   ```

## Code Review Checklist

### For Each Module PR

**Types:**

- [ ] All types exported
- [ ] No `any` types (use `unknown` with guards)
- [ ] JSDoc comments complete
- [ ] Types match database schema

**Implementation:**

- [ ] Error handling consistent
- [ ] No code duplication
- [ ] Async/await used correctly
- [ ] Logging appropriate

**Testing:**

- [ ] Unit tests for all methods
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Type exports verified

**Integration:**

- [ ] Re-exports from main API
- [ ] Deprecation warnings where appropriate
- [ ] No breaking changes
- [ ] Documentation updated

**Build:**

- [ ] TypeScript compilation succeeds
- [ ] Linter passes
- [ ] Tests pass
- [ ] Build succeeds

## Resources

### From Original Attempt

**What to Reference:**

- File structure from `feature/debug-production-csp-errors` commit `66ed6ca`
- Type definitions (as examples, not to copy directly)
- Module organization (good concept, poor execution)

**What to Avoid:**

- Trying to do everything at once
- Skipping type exports
- Not testing each module
- Breaking backward compatibility

### Documentation

- [TypeScript Module Documentation](https://www.typescriptlang.org/docs/handbook/modules.html)
- [API Design Best Practices](https://swagger.io/resources/articles/best-practices-in-api-design/)

### References

- Original refactoring attempt: `feature/debug-production-csp-errors` commit `66ed6ca`
- Clean Architecture principles
- SOLID principles for module design

## Implementation Tracking

### Phase 1: Foundation ⏳

- [ ] Create shared types
- [ ] Create shared constants
- [ ] Create shared error handling
- [ ] Update main API to import shared
- [ ] Add tests
- [ ] **Branch:** `refactor/api-foundation`

### Phase 2: Rating API ⏳

- [ ] Define types
- [ ] Implement module
- [ ] Add tests
- [ ] Update main API (re-export)
- [ ] **Branch:** `refactor/api-rating-module`

### Phase 3: Image Gallery API ⏳

- [ ] Define types
- [ ] Implement module
- [ ] Add tests
- [ ] Update main API
- [ ] **Branch:** `refactor/api-image-gallery-module`

### Phase 4: Public Recipe API ⏳

- [ ] Define types
- [ ] Implement module
- [ ] Add tests
- [ ] Update main API
- [ ] **Branch:** `refactor/api-public-recipe-module`

### Phase 5: User Recipe API ⏳

- [ ] Define types
- [ ] Implement module
- [ ] Add tests
- [ ] Update main API
- [ ] **Branch:** `refactor/api-user-recipe-module`

### Phase 6: Discovery API ⏳

- [ ] Define types
- [ ] Implement module
- [ ] Add tests
- [ ] Update main API
- [ ] **Branch:** `refactor/api-discovery-module`

### Phase 7: Cleanup ⏳

- [ ] Update all consumers
- [ ] Remove re-exports
- [ ] Remove old code
- [ ] Update documentation
- [ ] **Branch:** `refactor/api-finalize-migration`

## Notes

### Implementation Notes

- Each phase can be paused/resumed without blocking progress
- Phases 2-6 can potentially run in parallel (different modules)
- Foundation (Phase 1) must complete before others
- Cleanup (Phase 7) must be last

### Review Notes

Reviewers should verify:

- Type definitions are complete and accurate
- No breaking changes to existing consumers
- Tests provide adequate coverage
- Documentation is clear
- Module has single, clear responsibility

### Performance Considerations

- Module splitting may slightly increase bundle size
- Use tree-shaking to minimize impact
- Consider code splitting for large modules
- Monitor bundle size in each PR

---

**Current Status:** Documentation Complete, Implementation Not Started  
**Next Action:** Begin Phase 1 when ready to start refactoring  
**Estimated Completion:** 6-8 weeks with 1-2 developers

## Quick Reference

### When to Start This Refactoring

✅ **Start when:**

- CSP fixes are merged and stable
- Team has capacity for sustained effort
- No critical bugs blocking development

❌ **Don't start when:**

- In middle of major feature development
- Close to release deadline
- Team is understaffed

### How to Validate Success

After each phase:

```bash
# Run full verification
npm run verify

# Check bundle size
npm run build
# Look for "chunk size" warnings

# Verify types
npx tsc --noEmit

# Test imports work
grep -r "from '@/lib/api" src/ | wc -l  # Should work
```

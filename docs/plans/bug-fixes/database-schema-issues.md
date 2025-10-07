# Database Schema Issues - 406/400 Errors

**Status:** 🔴 Active Investigation  
**Priority:** P1 High  
**Type:** Bug Fix  
**Estimated Effort:** M (1-2 days)  
**Created:** 2025-10-07  
**Last Updated:** 2025-10-07

## Problem Statement

### What is the issue?

Production and local environments experiencing persistent 406 (Not Acceptable) and 400 (Bad Request) errors from PostgREST/Supabase API calls related to:

1. **recipe_ratings table** - 406 errors when querying with `version_number`
2. **recipe_views table** - 400 errors when attempting to insert view tracking
3. **PGRST116 errors** - Excessive logging of "no rows found" (noise, not critical)

### How does it manifest?

**Browser Console Errors:**

```
127.0.0.1:54321/rest/v1/recipe_ratings?select=*&recipe_id=eq.xxx&version_number=eq.1&user_id=eq.xxx
Failed to load resource: the server responded with a status of 406 (Not Acceptable)

127.0.0.1:54321/rest/v1/recipe_views
Failed to load resource: the server responded with a status of 400 (Bad Request)

❌ [API] Recipe fetch error: {
  code: "PGRST116",
  details: "The result contains 0 rows",
  hint: null,
  message: "Cannot coerce the result to a single JSON object"
}
```

**Frequency:**

- Occurs on every recipe view page load
- Repeats multiple times per page (4-6 failed requests)
- Affects both authenticated and public recipe viewing

### When was it discovered?

- Observed in local development on `fix/csp-and-image-handling` branch
- Errors persist from original `feature/debug-production-csp-errors` branch
- Related to API changes in commit `66ed6ca` (attempted API refactoring)

### Impact Assessment

- **Users Affected:** All users viewing recipes
- **Severity:** High (degrades user experience, console spam)
- **Workaround Available:** Partial - recipes still load, but features broken
- **User-Facing Impact:**
  - Recipe viewing works
  - Rating functionality may be broken
  - View tracking not working
  - Console spam affects debugging

## Root Cause Analysis

### Why does this issue exist?

**1. Schema Mismatch - recipe_ratings table**

The code expects `recipe_ratings` to have a `version_number` column for versioned ratings:

```typescript
// Code expectation (from rating-api.ts)
const { data, error } = await supabase
  .from('recipe_ratings')
  .select('rating, comment')
  .eq('recipe_id', recipeId)
  .eq('user_id', user.id)
  .eq('version_number', versionNumber) // Expects this column!
  .single();
```

**Possible causes:**

- Migration not run to add `version_number` column
- Migration exists but wasn't applied to local database
- Schema divergence between local and production
- Column exists but has different name/type

**2. Schema Mismatch - recipe_views table**

```typescript
// Code attempts to insert view tracking
const { error } = await supabase.from('recipe_views').insert({
  recipe_id: recipeId,
  version_number: versionNumber,
  // ... other fields
});
```

**Possible causes:**

- Table doesn't exist
- Column names don't match expectations
- Required fields missing from insert
- RLS policies blocking insert

**3. Excessive PGRST116 Errors**

These are not bugs, but expected behavior when:

- Checking if a recipe is public (not found = not public)
- Using `.single()` query on empty result set

**Cause:** Logging strategy treats expected "not found" as errors

### Contributing Factors

1. **API Refactoring Partial Implementation**
   - New methods added (`getUserVersionRating`)
   - Schema updates not completed
   - Features half-implemented

2. **Schema Migration Tracking**
   - Unclear which migrations are applied
   - Local/production schema drift
   - No schema validation in CI

3. **Error Handling**
   - Expected "not found" logged as errors
   - Actual schema errors hard to distinguish from expected errors

### Code References

**Problematic queries:**

```typescript
// Location: src/lib/api/features/rating-api.ts:175
async getUserVersionRating(
  recipeId: string,
  versionNumber: number
): Promise<{ rating: number; comment?: string; } | null> {
  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('rating, comment')
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)
    .eq('version_number', versionNumber)  // ⚠️ Column may not exist
    .single();
  // ...
}
```

```typescript
// Location: src/pages/recipe-view-page.tsx:189
await recipeApi.trackVersionView(currentRecipe.id, versionToTrack);
// This method likely tries to insert into recipe_views
```

## Proposed Solution

### High-Level Approach

1. **Audit database schema** - Verify what actually exists
2. **Compare with code expectations** - Identify mismatches
3. **Create/update migrations** - Align schema with code
4. **Update code if needed** - Handle missing features gracefully
5. **Improve error handling** - Distinguish expected vs. unexpected errors

### Technical Details

#### Phase 1: Schema Audit (Investigation)

**Check recipe_ratings table:**

```sql
-- Does version_number column exist?
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'recipe_ratings'
ORDER BY ordinal_position;

-- What does the actual schema look like?
\d recipe_ratings
```

**Check recipe_views table:**

```sql
-- Does table exist?
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'recipe_views';

-- If exists, what's the schema?
\d recipe_views

-- What columns exist?
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'recipe_views'
ORDER BY ordinal_position;
```

**Check migrations:**

```sql
-- What migrations have been applied?
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;
```

#### Phase 2: Identify Missing Migrations

**Expected schema for recipe_ratings:**

```sql
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,  -- ⚠️ This may be missing
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id, version_number)
);
```

**Expected schema for recipe_views:**

```sql
CREATE TABLE IF NOT EXISTS recipe_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Phase 3: Fix Strategy

**Option A: Add Missing Columns (If tables exist)**

```sql
-- Add version_number to recipe_ratings
ALTER TABLE recipe_ratings
ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1;

-- Update unique constraint
ALTER TABLE recipe_ratings
DROP CONSTRAINT IF EXISTS recipe_ratings_recipe_id_user_id_key;

ALTER TABLE recipe_ratings
ADD CONSTRAINT recipe_ratings_recipe_id_user_id_version_unique
UNIQUE(recipe_id, user_id, version_number);
```

**Option B: Create Tables (If they don't exist)**

Create proper migrations with full schema.

**Option C: Make Code Graceful (If features not needed)**

```typescript
// Wrap in try-catch, fail silently
try {
  await ratingApi.getUserVersionRating(recipeId, versionNumber);
} catch (error) {
  // Feature not available yet, that's okay
  console.debug('Version ratings not available:', error);
  return null;
}
```

### Alternatives Considered

1. **Disable the features entirely**
   - Pros: Immediate fix
   - Cons: Loses functionality
   - **Rejected:** Features are valuable

2. **Mock the data**
   - Pros: UI works
   - Cons: Misleading behavior
   - **Rejected:** Not a real fix

3. **Fix schema properly**
   - Pros: Enables features, fixes root cause
   - Cons: Requires migration, testing
   - **CHOSEN:** Proper long-term solution

## Implementation Plan

### Prerequisites

- [ ] Access to Supabase database (local and production)
- [ ] Supabase MCP tools available
- [ ] Ability to create migrations
- [ ] Test database for validation

### Steps

#### Step 1: Schema Audit (30 minutes)

1. **Use Supabase MCP to list tables**

   ```bash
   # Check what tables exist
   mcp_supabase_list_tables
   ```

2. **Execute SQL to check columns**

   ```sql
   -- Check recipe_ratings schema
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'recipe_ratings'
   ORDER BY ordinal_position;

   -- Check recipe_views schema
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'recipe_views'
   ORDER BY ordinal_position;
   ```

3. **Check applied migrations**

   ```bash
   mcp_supabase_list_migrations
   ```

4. **Document findings**
   - Which columns are missing?
   - Which tables don't exist?
   - What migrations are needed?

#### Step 2: Create Migrations (1-2 hours)

Based on audit findings, create migrations for:

**Migration 1: Update recipe_ratings table**

```sql
-- supabase/migrations/YYYYMMDD_add_version_number_to_recipe_ratings.sql

-- Add version_number column if missing
ALTER TABLE recipe_ratings
ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1;

-- Update unique constraint to include version_number
ALTER TABLE recipe_ratings
DROP CONSTRAINT IF EXISTS recipe_ratings_recipe_id_user_id_key;

ALTER TABLE recipe_ratings
ADD CONSTRAINT recipe_ratings_recipe_id_user_id_version_unique
UNIQUE(recipe_id, user_id, version_number);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_version
ON recipe_ratings(recipe_id, version_number);
```

**Migration 2: Create/fix recipe_views table**

```sql
-- supabase/migrations/YYYYMMDD_create_recipe_views_table.sql

CREATE TABLE IF NOT EXISTS recipe_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipe_views_recipe_id
ON recipe_views(recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_views_user_id
ON recipe_views(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipe_views_version
ON recipe_views(recipe_id, version_number);

-- RLS Policies
ALTER TABLE recipe_views ENABLE ROW LEVEL SECURITY;

-- Anyone can track views (for analytics)
CREATE POLICY "Anyone can insert recipe views"
ON recipe_views FOR INSERT
WITH CHECK (true);

-- Users can only see their own views
CREATE POLICY "Users can view their own recipe views"
ON recipe_views FOR SELECT
USING (user_id = auth.uid());

-- Recipe owners can see all views for their recipes
CREATE POLICY "Recipe owners can see all views for their recipes"
ON recipe_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_views.recipe_id
    AND recipes.user_id = auth.uid()
  )
);
```

#### Step 3: Test Migrations (30 minutes)

1. **Apply to local database**

   ```bash
   # Using Supabase MCP
   mcp_supabase_apply_migration
   ```

2. **Verify schema changes**

   ```sql
   -- Verify columns exist
   \d recipe_ratings
   \d recipe_views
   ```

3. **Test queries work**

   ```sql
   -- Test version rating query
   SELECT * FROM recipe_ratings
   WHERE recipe_id = '11111111-1111-1111-1111-111111111113'
   AND version_number = 1
   LIMIT 1;

   -- Test view insert
   INSERT INTO recipe_views (recipe_id, version_number)
   VALUES ('11111111-1111-1111-1111-111111111113', 1)
   RETURNING *;
   ```

4. **Run application tests**

   ```bash
   npm run test:run
   npm run verify
   ```

#### Step 4: Update Code Error Handling (1 hour)

**Improve error handling to distinguish expected vs. unexpected errors:**

```typescript
// src/lib/api/features/rating-api.ts

async getUserVersionRating(
  recipeId: string,
  versionNumber: number
): Promise<{ rating: number; comment?: string; } | null> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) return null;
    const user = authData.user;

    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('rating, comment')
      .eq('recipe_id', recipeId)
      .eq('user_id', user.id)
      .eq('version_number', versionNumber)
      .single();

    // PGRST116 = not found (expected, not an error)
    if (error && error.code === 'PGRST116') {
      return null; // No rating found, that's okay
    }

    // PGRST106 = schema error (unexpected, log it)
    if (error && error.code === 'PGRST106') {
      console.error('❌ Schema error in getUserVersionRating:', {
        error,
        hint: 'Check if version_number column exists in recipe_ratings table',
      });
      return null;
    }

    if (error) {
      console.error('Failed to get user version rating:', error);
      return null;
    }

    return data ? {
      rating: data.rating,
      comment: data.comment,
    } : null;
  } catch (error) {
    console.error('Unexpected error in getUserVersionRating:', error);
    return null;
  }
}
```

#### Step 5: Reduce PGRST116 Noise (30 minutes)

**Update logging to only show unexpected errors:**

```typescript
// src/lib/api.ts (or wherever getPublicRecipe is)

export const getPublicRecipe = async (
  id: string
): Promise<PublicRecipe | null> => {
  // ... validation ...

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  // PGRST116 = not found (expected when recipe is private or doesn't exist)
  if (recipeError?.code === 'PGRST116') {
    // Don't log - this is expected behavior
    return null;
  }

  // Other errors are unexpected
  if (recipeError) {
    console.error('❌ Unexpected error fetching public recipe:', {
      recipeId: id,
      error: recipeError,
    });
    return null;
  }

  // ... rest of function
};
```

### Code Changes

#### Files to Audit

- `supabase/migrations/` - Check for version-related migrations
- `src/lib/api/features/rating-api.ts` - Version rating queries
- `src/lib/api/features/versioning-api.ts` - View tracking
- `src/pages/recipe-view-page.tsx` - Where errors originate

#### Files to Create

- `supabase/migrations/YYYYMMDD_add_version_number_to_recipe_ratings.sql`
- `supabase/migrations/YYYYMMDD_create_recipe_views_table.sql`

#### Files to Modify

- `src/lib/api/features/rating-api.ts` - Better error handling
- `src/lib/api.ts` - Reduce PGRST116 logging
- `src/pages/recipe-view-page.tsx` - Graceful feature degradation

### Testing Strategy

#### Database Tests

- [ ] Verify columns exist after migration
- [ ] Test insert/update/delete operations
- [ ] Verify constraints work correctly
- [ ] Test RLS policies

#### Integration Tests

- [ ] Recipe viewing works without errors
- [ ] Rating submission works (if schema fixed)
- [ ] View tracking works (if schema fixed)
- [ ] No 406/400 errors in console
- [ ] PGRST116 errors only logged in debug mode

#### Manual Testing Checklist

- [ ] **View recipe as authenticated user**
  - [ ] No 406 errors
  - [ ] No 400 errors
  - [ ] Recipe displays correctly
  - [ ] Can rate recipe

- [ ] **View recipe as public (unauthenticated)**
  - [ ] Recipe displays if public
  - [ ] No excessive error logging
  - [ ] View count increments

- [ ] **View recipe with version**
  - [ ] Version-specific rating works
  - [ ] View tracking works
  - [ ] No schema errors

## Investigation Results Template

### Schema Audit Results

**✅ Schema Investigation Complete (2025-10-07)**

**recipe_ratings table:**

```sql
Table: recipe_ratings ✅ EXISTS
Columns:
  - id: UUID (primary key)
  - recipe_id: UUID (foreign key → recipes.id)
  - user_id: UUID (foreign key → auth.users.id)
  - rating: INTEGER (check: 1-5)
  - comment: TEXT (nullable)
  - created_at: TIMESTAMPTZ (default: now())
  - updated_at: TIMESTAMPTZ (nullable, default: now())
  - version_number: INTEGER ✅ EXISTS (nullable, default: 1)

Status: SCHEMA IS CORRECT ✅
```

**recipe_views table:**

```sql
Table: recipe_views ✅ EXISTS
Columns:
  - id: UUID (primary key)
  - recipe_id: UUID (foreign key → recipes.id)
  - user_id: UUID (foreign key → auth.users.id)
  - version_number: INTEGER ✅ EXISTS (nullable, default: 1)
  - viewed_at: TIMESTAMPTZ (nullable, default: now())
  - viewed_minute: TIMESTAMPTZ (nullable)
  - session_id: TEXT (nullable)

Status: SCHEMA IS CORRECT ✅
Rows: 7,679 views tracked
```

**ROOT CAUSE IDENTIFIED:**

The 406 errors are NOT schema issues. They're caused by using `.single()` instead of `.maybeSingle()`:

```typescript
// PROBLEM: .single() returns 406 when 0 rows found
.single();  // ❌ Throws 406 when no rating exists

// SOLUTION: .maybeSingle() returns null when 0 rows found
.maybeSingle();  // ✅ Returns null when no rating exists (no error)
```

**Applied Migrations:**

```
-- Last 10 migrations (to be filled in)
1. migration_name_1
2. migration_name_2
...
```

### Error Analysis

**406 Errors:**

```
Count: XX errors in 1 page load
Queries:
  - Query 1: recipe_ratings with version_number
  - Query 2: ...

Root Cause:
  - ??? (to be determined)
```

**400 Errors:**

```
Count: XX errors in 1 page load
Operations:
  - INSERT into recipe_views
  - ...

Root Cause:
  - ??? (to be determined)
```

## Success Criteria

### Functional Requirements

- [ ] No 406 errors in console
- [ ] No 400 errors in console
- [ ] Recipe viewing works correctly
- [ ] Version ratings work (if feature is enabled)
- [ ] View tracking works (if feature is enabled)
- [ ] PGRST116 errors only appear in debug mode

### Non-Functional Requirements

- [ ] Schema matches code expectations
- [ ] Migrations applied successfully
- [ ] No data loss during migration
- [ ] RLS policies secure
- [ ] Indexes optimize query performance

### Validation Checklist

- [ ] All database tests pass
- [ ] All integration tests pass
- [ ] No console errors during manual testing
- [ ] Migration runs successfully on clean database
- [ ] Rollback plan tested

## Dependencies

### Blocked By

- Schema audit must complete first
- Supabase MCP access required

### Blocks

- Recipe versioning features
- Community rating features
- Analytics and view tracking

### Related Work

- API Refactoring ([api-refactoring.md](./api-refactoring.md)) - These errors stem from partial API refactoring
- CSP Fixes ([csp-and-image-handling.md](./csp-and-image-handling.md)) - Separate issue, already fixed

## Risks & Mitigation

| Risk                         | Probability | Impact | Mitigation                                   |
| ---------------------------- | ----------- | ------ | -------------------------------------------- |
| Data loss during migration   | Low         | High   | Backup before migration, test on local first |
| Schema divergence prod/local | High        | Medium | Document schema, validate in CI              |
| Breaking existing queries    | Medium      | High   | Test all queries after migration             |
| RLS policies too restrictive | Medium      | Medium | Test with different user roles               |
| Performance degradation      | Low         | Medium | Add indexes, monitor query performance       |
| Features still not working   | Medium      | Medium | Graceful degradation in code                 |

## Lessons Learned

### From Original Branch

**What happened:**

- API refactoring added new methods (`getUserVersionRating`)
- Code expected schema changes that weren't made
- Features half-implemented
- Branch became unmergeable due to type errors
- Schema issues got lost in the noise

**What we should have done:**

1. Schema changes FIRST
2. API methods SECOND
3. UI integration LAST
4. Test each layer independently

### Key Insights

1. **Schema and code must stay in sync**
   - Don't write code that expects schema changes
   - Don't deploy schema changes without code updates

2. **Migration tracking is critical**
   - Know what's applied where
   - Validate schema in CI
   - Document expected schema

3. **Error handling matters**
   - Expected errors shouldn't spam console
   - Unexpected errors need clear messages
   - Schema errors need special handling

4. **Feature flags for partial features**
   - Don't deploy half-implemented features
   - Use feature flags to control availability
   - Gracefully degrade when features unavailable

## Timeline

| Phase              | Duration | Start Date | End Date | Status |
| ------------------ | -------- | ---------- | -------- | ------ |
| Schema Audit       | 2 hours  | TBD        | TBD      | ⏳     |
| Migration Creation | 2 hours  | TBD        | TBD      | ⏳     |
| Testing            | 4 hours  | TBD        | TBD      | ⏳     |
| Error Handling     | 2 hours  | TBD        | TBD      | ⏳     |
| Code Review        | 1 day    | TBD        | TBD      | ⏳     |
| Deployment         | 1 hour   | TBD        | TBD      | ⏳     |

**Total Estimated Time:** 1-2 days of active work + review time

## Resources

### Documentation

- [Supabase Schema Management](https://supabase.com/docs/guides/database/tables)
- [PostgREST Error Codes](https://postgrest.org/en/stable/errors.html)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

### References

- Original API refactoring attempt: commit `66ed6ca`
- Related: `recipe_views_ratings_policies` migration exists but may not be complete

### Similar Issues

- Check if there are pending migrations in `supabase/migrations/` folder
- Look for migrations with "rating" or "views" in filename

## Notes

### Implementation Notes

**Critical Questions to Answer:**

1. Does `version_number` column exist in `recipe_ratings`?
2. Does `recipe_views` table exist at all?
3. Are there pending migrations that haven't been applied?
4. Is this a local-only issue or production too?

**Schema Validation Command:**

```bash
# Run diagnostics script (already exists!)
node scripts/diagnose-database-issues.js

# This should tell us exactly what's wrong
```

### Review Notes

Reviewers should verify:

- Migrations are idempotent (safe to run multiple times)
- No data loss during migration
- RLS policies are secure
- Indexes added for performance
- Error handling improved

### Deployment Notes

**Deployment Order:**

1. Apply migrations to production
2. Verify schema changes successful
3. Deploy code changes
4. Monitor for errors
5. Rollback if issues persist

**Rollback Plan:**

```sql
-- Rollback version_number addition
ALTER TABLE recipe_ratings DROP COLUMN IF EXISTS version_number;

-- Restore old constraint
ALTER TABLE recipe_ratings
ADD CONSTRAINT recipe_ratings_recipe_id_user_id_key
UNIQUE(recipe_id, user_id);

-- Drop recipe_views if newly created
DROP TABLE IF EXISTS recipe_views CASCADE;
```

---

**Current Status:** Documented, investigation not started  
**Next Action:** Create branch and begin schema audit  
**Branch:** `fix/database-schema-issues`  
**Assignee:** TBD  
**Reviewer:** TBD

## Quick Start Investigation

```bash
# Create investigation branch
git checkout -b fix/database-schema-issues main

# Run diagnostic script (tells us what's wrong)
node scripts/diagnose-database-issues.js

# Check Supabase schema
# Use Supabase MCP to list tables and check schema

# Document findings in this file (update "Investigation Results" section)

# Create migrations based on findings

# Test locally

# Create PR
```

## Connection to Original Work

This issue stems from commit `66ed6ca` in the `feature/debug-production-csp-errors` branch, which attempted to add:

- `getUserVersionRating` method
- Recipe view tracking
- Versioned rating support

**The problem:** Code was added without corresponding schema changes.

**The solution:** Either:

1. Add the schema changes (enable the features)
2. Remove the code (disable the features)
3. Make code graceful (features optional)

**Recommended:** Option 1 (add schema) - the features are valuable

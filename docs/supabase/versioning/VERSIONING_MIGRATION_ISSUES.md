# Recipe Versioning Migration Issues

## 🚨 Problem Statement

The recipe versioning migration (`20250916160000_add_recipe_versioning.sql`) contains multiple SQL issues that prevent successful database deployment. These issues were discovered during the reviewer comment implementation phase and need to be resolved in the next PR.

## 📋 Current Issues

### 1. **Missing Comment Field Reference**

**Error**: `column rr.comment does not exist (SQLSTATE 42703)`

**Location**: Lines 94 and 117 in versioning migration

```sql
-- Line 94: recipe_version_stats view
COUNT(DISTINCT CASE WHEN rr.comment IS NOT NULL AND rr.comment != '' THEN rr.id END) as version_comment_count,

-- Line 117: recipe_aggregate_stats view
COUNT(DISTINCT CASE WHEN rr.comment IS NOT NULL AND rr.comment != '' THEN rr.id END) as total_comments,
```

**Root Cause**: The `recipe_ratings` table (created in `20250916152713_add_rating_system.sql`) does not include a `comment` field, but the versioning migration assumes it exists.

**Current Schema**:

```sql
CREATE TABLE recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);
```

### 2. **SQL Grouping Error**

**Error**: `subquery uses ungrouped column "r.parent_recipe_id" from outer query (SQLSTATE 42803)`

**Location**: Lines 118-121 in `recipe_aggregate_stats` view

```sql
-- Latest version details subqueries reference ungrouped columns
(SELECT r3.title FROM recipes r3 WHERE r3.parent_recipe_id = COALESCE(r.parent_recipe_id, r.id)
 ORDER BY r3.version_number DESC LIMIT 1) as latest_version_title,
(SELECT r3.creator_rating FROM recipes r3 WHERE r3.parent_recipe_id = COALESCE(r.parent_recipe_id, r.id)
 ORDER BY r3.version_number DESC LIMIT 1) as latest_creator_rating
```

**Root Cause**: PostgreSQL requires all columns referenced in subqueries to be included in the GROUP BY clause or be aggregate functions.

### 3. **Migration Dependencies**

**Issue**: The versioning migration depends on schema elements that may not exist or may be in different states across environments.

**Dependencies**:

- `recipe_ratings` table structure
- Specific column availability (`comment` field)
- Proper foreign key relationships
- RLS policies consistency

## 🎯 Immediate Workaround Applied

**Temporary Fix**: Modified the migration to use placeholder values:

```sql
-- Line 94: Temporary fix
0 as version_comment_count, -- Comments not yet implemented in recipe_ratings

-- Line 117: Temporary fix
0 as total_comments, -- Comments not yet implemented in recipe_ratings
```

**Status**: This allows the image caching optimization to proceed while preserving the versioning migration for proper fixes.

## 📋 Required Solutions for Next PR

### 1. **Add Comment Field to Recipe Ratings**

```sql
-- Option A: Extend existing rating system
ALTER TABLE recipe_ratings ADD COLUMN comment TEXT;

-- Option B: Create separate comments table
CREATE TABLE recipe_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER DEFAULT 1,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. **Fix SQL Grouping Issues**

```sql
-- Fix subquery grouping in recipe_aggregate_stats view
-- Move subqueries to JOIN operations or include required columns in GROUP BY
```

### 3. **Add Proper Migration Testing**

- Test migration rollback scenarios
- Verify cross-environment compatibility
- Add migration dependency validation
- Test with empty vs populated databases

### 4. **Schema Validation Strategy**

```sql
-- Add conditional logic to handle missing fields gracefully
-- Use information_schema to check column existence before referencing
-- Implement progressive migration strategy
```

## 🔧 Recommended Implementation Approach

### Phase 1: Schema Assessment

1. **Audit current database schema** across all environments
2. **Document exact differences** between local, staging, and production
3. **Create schema synchronization strategy**

### Phase 2: Comments System Design

1. **Decide on comments architecture**:
   - Extend `recipe_ratings` with `comment` field, OR
   - Create separate `recipe_comments` table with version awareness
2. **Design proper relationships** with versioning system
3. **Plan RLS policies** for comments

### Phase 3: Migration Fixes

1. **Fix SQL grouping errors** in aggregate views
2. **Add proper error handling** for missing dependencies
3. **Test migration rollback** scenarios
4. **Validate across environments**

### Phase 4: Enhanced Features

1. **Implement full comments system** in UI
2. **Add comment moderation** features
3. **Integrate with notification system**
4. **Add comment analytics** to views

## 🚨 Critical Considerations

### Database Safety

- **NEVER reset production database** - use additive migrations only
- **Test all migrations** on staging before production
- **Implement rollback strategies** for each migration
- **Preserve existing data** during schema changes

### Performance Impact

- **Index comment fields** appropriately for query performance
- **Consider comment pagination** for popular recipes
- **Optimize aggregate views** for large datasets
- **Monitor query performance** after deployment

### User Experience

- **Maintain backward compatibility** during migration
- **Handle graceful degradation** if comments unavailable
- **Preserve existing ratings** during schema changes
- **Test UI behavior** with and without comments

## 📊 Success Criteria

### Technical

- [ ] All migrations apply successfully across environments
- [ ] No data loss during schema changes
- [ ] Proper indexing for performance
- [ ] RLS policies correctly implemented
- [ ] Rollback procedures tested and documented

### Functional

- [ ] Recipe versioning system fully operational
- [ ] Comments system integrated with versioning
- [ ] Analytics views return accurate data
- [ ] UI components handle all data states gracefully

### Performance

- [ ] Query performance meets benchmarks
- [ ] Database constraints optimized
- [ ] Index usage verified
- [ ] No N+1 query issues introduced

## 🔗 Related Files

### Migration Files

- `supabase/migrations/20250916152713_add_rating_system.sql` - Base rating system
- `supabase/migrations/20250916160000_add_recipe_versioning.sql` - Versioning system (needs fixes)

### Application Code

- `src/lib/api.ts` - Recipe and rating API methods
- `src/lib/types.ts` - TypeScript type definitions
- `src/components/recipes/comment-system.tsx` - Comments UI component
- `src/components/recipes/recipe-analytics.tsx` - Analytics display

### Documentation

- `docs/supabase/MIGRATION_BEST_PRACTICES.md` - Migration guidelines
- `docs/quality-assurance/PRE-PR-VERIFICATION-CHECKLIST.md` - QA procedures

---

**Priority**: High - Required for recipe versioning and community engagement features
**Complexity**: Medium - Requires careful SQL design and testing
**Risk**: Medium - Database schema changes require careful validation

**Next PR Focus**: Resolve these migration issues to enable full recipe versioning functionality.

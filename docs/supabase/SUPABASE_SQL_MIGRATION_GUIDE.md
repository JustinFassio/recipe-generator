# Supabase SQL Migration Guide for AI Assistants

**Purpose**: Complete reference for AI assistants when making SQL changes to the Recipe Generator Supabase database  
**Status**: Production Reference Document  
**Last Updated**: January 23, 2025

---

## 🚨 **CRITICAL RULES - NEVER VIOLATE**

### **Migration File Rules**

1. **ONE SQL COMMAND PER MIGRATION FILE** - Supabase migrations run in transactions
2. **NO CONCURRENTLY in migrations** - Use regular CREATE INDEX for local dev
3. **SEPARATE functions and grants** - Each needs its own migration file
4. **ORDER dependencies correctly** - Tables → Functions → Grants → Indexes
5. **NEVER reset databases** - Use additive migrations only

### **Database Safety Rules**

1. **PRESERVE ALL PRODUCTION DATA** - Never use DROP, TRUNCATE, or destructive operations
2. **USE IF NOT EXISTS** - Always check existence before creating objects
3. **ADD ROLLBACK PLANS** - Every migration must be reversible
4. **TEST LOCALLY FIRST** - Always run `supabase db reset` before production
5. **BACKUP BEFORE MAJOR CHANGES** - Document backup strategy

---

## 📋 **Current Database Schema Reference**

### **Core Tables**

```sql
-- profiles: User profiles with preferences
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username citext UNIQUE CHECK (length(username) BETWEEN 3 AND 24),
  full_name text CHECK (length(trim(full_name)) BETWEEN 1 AND 80),
  avatar_url text,
  bio text CHECK (length(bio) <= 500),
  region text,
  language text DEFAULT 'en' NOT NULL,
  units text DEFAULT 'metric' NOT NULL CHECK (units IN ('metric', 'imperial')),
  time_per_meal int CHECK (time_per_meal IS NULL OR time_per_meal BETWEEN 10 AND 120),
  skill_level text DEFAULT 'beginner' NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- user_safety: Health and dietary information (PRIVATE DATA)
CREATE TABLE user_safety (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  allergies text[] DEFAULT '{}' NOT NULL,
  dietary_restrictions text[] DEFAULT '{}' NOT NULL,
  medical_conditions text[] DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- cooking_preferences: User cooking preferences (PUBLIC READ)
CREATE TABLE cooking_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_cuisines text[] DEFAULT '{}' NOT NULL,
  available_equipment text[] DEFAULT '{}' NOT NULL,
  disliked_ingredients text[] DEFAULT '{}' NOT NULL,
  spice_tolerance int DEFAULT 3 CHECK (spice_tolerance BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- recipes: Recipe storage with versioning support
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ingredients text[] NOT NULL DEFAULT '{}',
  instructions text NOT NULL,
  notes text,
  image_url text,
  video_url text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false NOT NULL,
  creator_rating integer CHECK (creator_rating IS NULL OR creator_rating BETWEEN 1 AND 5),
  version_number integer DEFAULT 1 NOT NULL,
  parent_recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  categories text[] DEFAULT '{}' NOT NULL CHECK (array_length(categories, 1) <= 6),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- usernames: Username management (PUBLIC READ)
CREATE TABLE usernames (
  username citext PRIMARY KEY CHECK (length(username) BETWEEN 3 AND 24),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- global_ingredients: Community ingredient catalog
CREATE TABLE global_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category = ANY (ARRAY[
    'proteins', 'fresh_produce', 'flavor_builders', 'cooking_essentials',
    'bakery_grains', 'dairy_cold', 'pantry_staples', 'frozen'
  ])),
  synonyms text[] DEFAULT '{}' NOT NULL,
  usage_count integer DEFAULT 0 NOT NULL,
  is_verified boolean DEFAULT false NOT NULL,
  is_system boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- user_groceries: User shopping lists
CREATE TABLE user_groceries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_name text NOT NULL,
  quantity text,
  unit text,
  category text,
  is_purchased boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

### **Storage Buckets**

```sql
-- Storage bucket configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('avatars', 'avatars', true, 5242880),        -- 5MB limit
  ('recipe-images', 'recipe-images', true, 10485760), -- 10MB limit
  ('recipe-videos', 'recipe-videos', true, 104857600); -- 100MB limit
```

### **Critical Indexes**

```sql
-- Performance-critical indexes (NEVER DROP THESE)
CREATE UNIQUE INDEX idx_profiles_username_lower ON profiles (LOWER(username)) WHERE username IS NOT NULL;
CREATE INDEX idx_user_safety_allergies ON user_safety USING GIN (allergies);
CREATE INDEX idx_cooking_preferences_cuisines ON cooking_preferences USING GIN (preferred_cuisines);
CREATE INDEX idx_recipes_user_public ON recipes (user_id, is_public, created_at DESC);
CREATE INDEX idx_recipes_public_recent ON recipes (created_at DESC) WHERE is_public = true;
CREATE INDEX idx_global_ingredients_normalized_name ON global_ingredients (normalized_name);
CREATE INDEX idx_global_ingredients_category ON global_ingredients (category);
```

---

## 🔧 **Migration File Templates**

### **Table Creation Template**

```sql
-- Migration: YYYYMMDDHHMMSS_create_table_name.sql
BEGIN;

CREATE TABLE IF NOT EXISTS table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Add columns with proper constraints
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Add comment for documentation
COMMENT ON TABLE table_name IS 'Description of table purpose and usage';

COMMIT;
```

### **RLS Policy Template**

```sql
-- Migration: YYYYMMDDHHMMSS_create_table_policies.sql
BEGIN;

-- Users can read their own data
CREATE POLICY "table_name_select_own" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "table_name_insert_own" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own data
CREATE POLICY "table_name_update_own" ON table_name
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own data
CREATE POLICY "table_name_delete_own" ON table_name
  FOR DELETE USING (auth.uid() = user_id);

COMMIT;
```

### **Function Creation Template**

```sql
-- Migration: YYYYMMDDHHMMSS_create_function_name.sql
BEGIN;

CREATE OR REPLACE FUNCTION function_name(p_param1 type1, p_param2 type2)
RETURNS return_type
LANGUAGE plpgsql
SECURITY DEFINER  -- Use DEFINER for admin functions, INVOKER for user functions
SET search_path = public
AS $$
DECLARE
  result_var return_type;
BEGIN
  -- Security check (if needed)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Function logic here

  RETURN result_var;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Function failed: %', SQLERRM;
END;
$$;

-- Add comment
COMMENT ON FUNCTION function_name IS 'Description of function purpose';

COMMIT;
```

### **Grant Permissions Template**

```sql
-- Migration: YYYYMMDDHHMMSS_grant_function_name.sql
BEGIN;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION function_name TO authenticated;

-- Or grant to specific role
-- GRANT EXECUTE ON FUNCTION function_name TO service_role;

COMMIT;
```

### **Index Creation Template**

```sql
-- Migration: YYYYMMDDHHMMSS_create_index_name.sql
BEGIN;

-- Regular index (for migrations)
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name (column_name);

-- Partial index with condition
CREATE INDEX IF NOT EXISTS idx_table_column_partial
ON table_name (column_name)
WHERE condition = true;

-- GIN index for arrays/JSONB
CREATE INDEX IF NOT EXISTS idx_table_array_column
ON table_name USING GIN (array_column);

-- Unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_unique_column
ON table_name (column_name);

COMMIT;
```

---

## 🛡️ **RLS Policy Patterns**

### **Standard User Data Policies**

```sql
-- Own data access (most common pattern)
CREATE POLICY "table_own_data" ON table_name
  FOR ALL USING (auth.uid() = user_id);

-- Public read, own write
CREATE POLICY "table_select_all" ON table_name FOR SELECT USING (true);
CREATE POLICY "table_modify_own" ON table_name FOR ALL USING (auth.uid() = user_id);

-- Public recipes pattern
CREATE POLICY "recipes_select_public" ON recipes FOR SELECT USING (is_public = true);
CREATE POLICY "recipes_select_own" ON recipes FOR SELECT USING (auth.uid() = user_id);
```

### **Storage Bucket Policies**

```sql
-- User-specific folder access
CREATE POLICY "bucket_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'bucket-name' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "bucket_read_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'bucket-name');
```

---

## 📊 **Common Data Patterns**

### **Array Fields (PostgreSQL Arrays)**

```sql
-- Array field with validation
ALTER TABLE table_name ADD COLUMN tags text[] DEFAULT '{}' NOT NULL;

-- Array length constraint
ALTER TABLE table_name ADD CONSTRAINT check_tags_count
  CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10);

-- GIN index for array searches
CREATE INDEX idx_table_tags ON table_name USING GIN (tags);

-- Query patterns
SELECT * FROM table_name WHERE tags @> ARRAY['specific_tag'];  -- Contains
SELECT * FROM table_name WHERE tags && ARRAY['tag1', 'tag2']; -- Overlaps
```

### **JSONB Fields**

```sql
-- JSONB field
ALTER TABLE table_name ADD COLUMN metadata jsonb DEFAULT '{}' NOT NULL;

-- GIN index for JSONB
CREATE INDEX idx_table_metadata ON table_name USING GIN (metadata);

-- Query patterns
SELECT * FROM table_name WHERE metadata @> '{"key": "value"}';
SELECT * FROM table_name WHERE metadata ? 'key_exists';
```

### **Text Search**

```sql
-- Add text search column
ALTER TABLE table_name ADD COLUMN search_vector tsvector;

-- Update trigger for text search
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_table_search_vector
  BEFORE INSERT OR UPDATE ON table_name
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- GIN index for full-text search
CREATE INDEX idx_table_search ON table_name USING GIN (search_vector);
```

---

## ⚡ **Performance Optimization Patterns**

### **Composite Indexes**

```sql
-- Multi-column index (order matters!)
CREATE INDEX idx_recipes_user_public_date
ON recipes (user_id, is_public, created_at DESC);

-- Partial index for common queries
CREATE INDEX idx_recipes_public_recent
ON recipes (created_at DESC)
WHERE is_public = true;
```

### **Materialized Views for Analytics**

```sql
-- Create materialized view
CREATE MATERIALIZED VIEW recipe_stats AS
SELECT
  r.id,
  r.title,
  COUNT(DISTINCT rr.user_id) as total_ratings,
  AVG(rr.rating) as avg_rating,
  COUNT(DISTINCT rv.user_id) as total_views
FROM recipes r
LEFT JOIN recipe_ratings rr ON r.id = rr.recipe_id
LEFT JOIN recipe_views rv ON r.id = rv.recipe_id
WHERE r.is_public = true
GROUP BY r.id, r.title;

-- Index the materialized view
CREATE INDEX idx_recipe_stats_avg_rating ON recipe_stats (avg_rating DESC);

-- Refresh function (call periodically)
REFRESH MATERIALIZED VIEW recipe_stats;
```

---

## 🔄 **Migration Workflow Commands**

### **Development Workflow**

```bash
# Create new migration
npx supabase migration new descriptive_name

# Test locally (ALWAYS DO THIS FIRST)
npx supabase db reset
npx supabase db push

# Check for schema drift
npx supabase db diff

# Apply to production
npx supabase db push --project-ref PROD_REF
```

### **Verification Commands**

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'your_table';

-- Check column exists
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'your_table' AND column_name = 'your_column';

-- Check RLS policies
SELECT policyname, cmd, permissive FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'your_table';

-- Check indexes
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'your_table';

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'your_function';
```

---

## 🚨 **Common Pitfalls & Solutions**

### **Migration Errors**

| Error                                            | Cause                             | Solution                                      |
| ------------------------------------------------ | --------------------------------- | --------------------------------------------- |
| `cannot insert multiple commands`                | Multiple SQL commands in one file | Split into separate migration files           |
| `CREATE INDEX CONCURRENTLY cannot be executed`   | CONCURRENTLY in migration         | Remove CONCURRENTLY, use regular CREATE INDEX |
| `function does not exist`                        | Grant before function creation    | Ensure function migration runs before grant   |
| `column does not exist`                          | Wrong migration order             | Check dependencies, fix order                 |
| `duplicate key value violates unique constraint` | Unique constraint violation       | Use ON CONFLICT or check existing data        |

### **Performance Issues**

```sql
-- Slow queries - add indexes
EXPLAIN ANALYZE SELECT * FROM table_name WHERE column_name = 'value';

-- Array queries - use GIN indexes
CREATE INDEX idx_table_array ON table_name USING GIN (array_column);

-- Text search - use full-text search
CREATE INDEX idx_table_fts ON table_name USING GIN (to_tsvector('english', text_column));

-- Large tables - use partial indexes
CREATE INDEX idx_table_active ON table_name (column) WHERE active = true;
```

---

## 📋 **Pre-Migration Checklist**

### **Before Creating Migration**

- [ ] **One SQL command per file**
- [ ] **No CONCURRENTLY keywords**
- [ ] **Dependencies in correct order**
- [ ] **Descriptive filename** following convention
- [ ] **Rollback plan documented**

### **Before Production Deployment**

- [ ] **Tested locally** with `supabase db reset`
- [ ] **All migrations apply cleanly**
- [ ] **No breaking changes** to existing functionality
- [ ] **Performance impact assessed**
- [ ] **Backup strategy confirmed**

### **After Deployment**

- [ ] **Verify schema changes** applied correctly
- [ ] **Test critical functionality**
- [ ] **Monitor performance metrics**
- [ ] **Document any issues encountered**

---

## 🎯 **Quick Reference Commands**

```bash
# Essential Supabase CLI commands
npx supabase start                    # Start local Supabase
npx supabase status                   # Check service status
npx supabase db reset                 # Reset local database
npx supabase db push                  # Apply migrations
npx supabase migration list           # List migration status
npx supabase db diff                  # Check schema differences
npx supabase link --project-ref REF   # Link to project
```

---

## 🔗 **Related Documentation**

- [`MIGRATION_BEST_PRACTICES.md`](./MIGRATION_BEST_PRACTICES.md) - Detailed migration guidelines
- [`CORE_DATABASE_SCHEMA.md`](./CORE_DATABASE_SCHEMA.md) - Complete schema reference
- [`TROUBLESHOOTING_GUIDE.md`](./TROUBLESHOOTING_GUIDE.md) - Common issues and solutions
- [`SUPABASE_MCP_SERVER.md`](./SUPABASE_MCP_SERVER.md) - AI integration setup

---

**This document serves as the definitive reference for AI assistants making SQL changes to the Recipe Generator Supabase database. Always refer to this guide before creating migrations or modifying database schema.**

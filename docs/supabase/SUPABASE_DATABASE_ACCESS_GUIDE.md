# Supabase Database Access Guide for AI Assistants

**Purpose**: Unified reference for AI assistants to reliably access Recipe Generator Supabase database for troubleshooting and analysis  
**Status**: ✅ **PRODUCTION READY** - Tested and verified working configuration  
**Last Updated**: January 23, 2025

---

## 🎯 **Quick Database Access Commands**

### **For Immediate Troubleshooting (Like Missing Views)**

```sql
-- 1. Check if views exist
SELECT schemaname, viewname FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('recipe_aggregate_stats','recipe_version_stats');

-- 2. Check table structure
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('recipes','recipe_ratings','recipe_views')
ORDER BY table_name, ordinal_position;

-- 3. Check migration status
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;

-- 4. Check all public tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

---

## 🔧 **Current Working MCP Configuration**

### **Updated Setup with Personal Access Token (January 23, 2025)**

**File**: `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=sxvdkipywmjycithdfpp",
        "--access-token=${SUPABASE_ACCESS_TOKEN}"
      ]
    },
    "supabase-local": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
      ]
    }
  }
}
```

### **Environment Setup Required**

Add this to your `~/.zshrc`:

```bash
export SUPABASE_ACCESS_TOKEN="sbp_f281ddf8aa99783bb761ea2cfc357d1b5654f9ec"
```

### **Key Points**

- **Production Access**: Uses Personal Access Token (PAT) via environment variable
- **Local Access**: Direct PostgreSQL connection for local development
- **Authentication**: Modern PAT-based authentication (updated approach)

---

## 📋 **Database Connection Methods**

### **Method 1: MCP Server (Preferred for AI)**

```javascript
// Use these MCP tools for database access:
mcp_supabase_execute_sql({
  query: "SELECT * FROM pg_views WHERE schemaname = 'public';",
});
mcp_supabase_list_tables({ schemas: ['public'] });
```

### **Method 2: Direct SQL Commands (Backup)**

```bash
# If MCP fails, use direct psql connection
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "YOUR_SQL_HERE"

# Or via Supabase CLI
npx supabase db remote --project-ref sxvdkipywmjycithdfpp --execute "YOUR_SQL_HERE"
```

### **Method 3: curl API Calls (Last Resort)**

```bash
# Production API
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmRraXB5d21qeWNpdGhkZnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgyMTMwNSwiZXhwIjoyMDcxMzk3MzA1fQ.hdQpuML-BDFl4CQhsVxUH3tlsuZsrDHf1kO9FAX9dTE" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmRraXB5d21qeWNpdGhkZnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgyMTMwNSwiZXhwIjoyMDcxMzk3MzA1fQ.hdQpuML-BDFl4CQhsVxUH3tlsuZsrDHf1kO9FAX9dTE" \
  "https://sxvdkipywmjycithdfpp.supabase.co/rest/v1/TABLE_NAME?select=*&limit=1"

# Local API
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  "http://127.0.0.1:54321/rest/v1/TABLE_NAME?select=*&limit=1"
```

---

## 🔍 **Database Schema Quick Reference**

### **Core Tables (Always Present)**

```sql
-- profiles: User profiles with preferences
profiles (id, username, full_name, avatar_url, bio, region, language, units, time_per_meal, skill_level, created_at, updated_at)

-- recipes: Recipe storage with versioning
recipes (id, title, ingredients[], instructions, notes, image_url, video_url, user_id, is_public, creator_rating, version_number, parent_recipe_id, categories[], created_at, updated_at)

-- user_safety: Health and dietary information (PRIVATE)
user_safety (user_id, allergies[], dietary_restrictions[], medical_conditions[], created_at, updated_at)

-- cooking_preferences: User cooking preferences (PUBLIC READ)
cooking_preferences (user_id, preferred_cuisines[], available_equipment[], disliked_ingredients[], spice_tolerance, created_at, updated_at)

-- usernames: Username management (PUBLIC READ)
usernames (username, user_id, created_at)

-- global_ingredients: Community ingredient catalog
global_ingredients (id, name, normalized_name, category, synonyms[], usage_count, is_verified, is_system, created_at, updated_at)

-- user_groceries: User shopping lists
user_groceries (id, user_id, ingredient_name, quantity, unit, category, is_purchased, created_at, updated_at)
```

### **Views (May Be Missing - Check First!)**

```sql
-- These views may not exist and cause 404 errors:
recipe_aggregate_stats  -- ⚠️ Often missing, causes explore page 404s
recipe_version_stats    -- ⚠️ May not exist in all environments
recipe_rating_stats     -- ✅ Should exist
profiles_with_geography -- ✅ Should exist
```

### **Storage Buckets**

```sql
-- Storage buckets with file size limits
avatars (5MB limit)
recipe-images (10MB limit)
recipe-videos (100MB limit)
```

---

## 🚨 **Common Troubleshooting Scenarios**

### **Scenario 1: 404 Error on Frontend API Call**

**Symptoms**: Frontend shows 404 error for `/rest/v1/some_view`

**Diagnosis Steps**:

```sql
-- 1. Check if view/table exists
SELECT schemaname, viewname FROM pg_views WHERE viewname = 'some_view';
SELECT table_name FROM information_schema.tables WHERE table_name = 'some_view';

-- 2. If missing, check migrations
SELECT version FROM supabase_migrations.schema_migrations
WHERE version LIKE '%view%' OR version LIKE '%some_view%';

-- 3. Check what frontend is calling
-- Look at src/lib/api.ts and src/pages/ files
```

**Common Fixes**:

- Create missing view with proper migration
- Update frontend to use existing table instead of missing view
- Apply missing migrations that create the view

### **Scenario 2: Migration Applied But View Still Missing**

**Diagnosis Steps**:

```sql
-- Check if migration was actually applied
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;

-- Check for any errors in view definition
SELECT viewname, definition FROM pg_views WHERE viewname = 'missing_view';

-- Check if view depends on missing columns
SELECT column_name FROM information_schema.columns
WHERE table_name IN ('recipes', 'recipe_ratings', 'recipe_views');
```

### **Scenario 3: MCP Server Not Working**

**Quick Fixes**:

1. **Restart Cursor IDE** completely
2. **Check MCP server status** in Cursor IDE bottom panel
3. **Verify configuration** matches the working config above
4. **Test direct API access** using curl commands

**Fallback Options**:

```bash
# Use terminal commands instead
npx supabase status
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT version();"
```

---

## 📊 **Diagnostic Query Library**

### **Schema Investigation**

```sql
-- List all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- List all views
SELECT viewname FROM pg_views WHERE schemaname = 'public' ORDER BY viewname;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'TABLE_NAME' ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'TABLE_NAME';

-- Check RLS policies
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'TABLE_NAME';
```

### **Data Investigation**

```sql
-- Count records in key tables
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'recipes', COUNT(*) FROM recipes
UNION ALL
SELECT 'global_ingredients', COUNT(*) FROM global_ingredients
UNION ALL
SELECT 'user_groceries', COUNT(*) FROM user_groceries;

-- Check public recipes (common issue)
SELECT COUNT(*) as public_recipes FROM recipes WHERE is_public = true;

-- Check recent activity
SELECT table_name, COUNT(*) as recent_count
FROM (
  SELECT 'profiles' as table_name, created_at FROM profiles WHERE created_at > NOW() - INTERVAL '7 days'
  UNION ALL
  SELECT 'recipes', created_at FROM recipes WHERE created_at > NOW() - INTERVAL '7 days'
) recent_activity
GROUP BY table_name;
```

### **Migration Status**

```sql
-- List all applied migrations
SELECT version, applied_at FROM supabase_migrations.schema_migrations
ORDER BY version DESC;

-- Check for recent migrations
SELECT version, applied_at FROM supabase_migrations.schema_migrations
WHERE applied_at > NOW() - INTERVAL '30 days'
ORDER BY applied_at DESC;

-- Find migrations by pattern
SELECT version FROM supabase_migrations.schema_migrations
WHERE version LIKE '%recipe%' OR version LIKE '%view%' OR version LIKE '%aggregate%'
ORDER BY version;
```

---

## ⚡ **Performance Queries**

### **Check Database Health**

```sql
-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Active connections
SELECT COUNT(*) as active_connections FROM pg_stat_activity;
```

---

## 🔧 **Environment Setup Verification**

### **Local Supabase Status**

```bash
# Check if local Supabase is running
npx supabase status

# Expected output should show:
# API URL: http://127.0.0.1:54321
# DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# Studio URL: http://127.0.0.1:54323
```

### **Production Connection Test**

```bash
# Test production database connection
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmRraXB5d21qeWNpdGhkZnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgyMTMwNSwiZXhwIjoyMDcxMzk3MzA1fQ.hdQpuML-BDFl4CQhsVxUH3tlsuZsrDHf1kO9FAX9dTE" \
  "https://sxvdkipywmjycithdfpp.supabase.co/rest/v1/profiles?select=id&limit=1"

# Should return JSON with profile data or empty array
```

---

## 🚀 **Troubleshooting Workflow**

### **Step 1: Verify Database Access**

1. Try MCP server query first
2. If MCP fails, use direct psql
3. If psql fails, check Supabase status

### **Step 2: Identify Root Cause**

1. Run diagnostic queries for the specific issue
2. Check migration status
3. Verify table/view existence
4. Check data presence

### **Step 3: Apply Fix**

1. Create missing migrations if needed
2. Update frontend code if schema changed
3. Reseed data if tables are empty
4. Restart services if configuration changed

### **Step 4: Verify Fix**

1. Test the original failing operation
2. Run smoke tests on related functionality
3. Check for any side effects

---

## 📚 **Related Documentation**

- [`SUPABASE_SQL_MIGRATION_GUIDE.md`](./SUPABASE_SQL_MIGRATION_GUIDE.md) - SQL migration patterns and rules
- [`CORE_DATABASE_SCHEMA.md`](./CORE_DATABASE_SCHEMA.md) - Complete schema reference
- [`MIGRATION_BEST_PRACTICES.md`](./MIGRATION_BEST_PRACTICES.md) - Migration guidelines
- [`TROUBLESHOOTING_GUIDE.md`](./TROUBLESHOOTING_GUIDE.md) - Common issues and solutions

---

## 🎯 **Quick Reference Card**

### **For AI Assistants: When Database Issues Occur**

1. **Use MCP Tools**: `mcp_supabase_execute_sql` for queries
2. **Check View Existence**: Run the diagnostic queries from the "Quick Database Access Commands" section
3. **Follow Troubleshooting Workflow**: Systematically diagnose → fix → verify
4. **Reference This Guide**: All connection details and working configurations are documented here

**This guide consolidates all working solutions and provides reliable database access for any troubleshooting scenario.**

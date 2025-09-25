# Shopping Cart Feature - Database Schema

**Project:** Recipe Generator  
**Feature:** Shopping Cart with AI Assistant  
**Document:** `docs/features/shopping-cart/02-database-schema.md`  
**Author:** AI Assistant  
**Date:** September 2025  
**Status:** Implementation Ready

---

## 🎯 **Schema Overview**

The Shopping Cart feature uses a **minimal database approach** by extending the existing `user_groceries` table with two JSONB columns. This design avoids creating new tables while providing all necessary functionality for multi-source ingredient aggregation and AI-powered shopping assistance.

### **Design Principles**

- **Zero Disruption**: No new tables, no breaking changes to existing schema
- **Flexible Storage**: JSONB columns allow for evolving data structures
- **Performance Optimized**: Leverages PostgreSQL's native JSONB indexing capabilities
- **Data Integrity**: Maintains existing RLS policies and foreign key relationships

---

## 📊 **Current Database Structure**

### **Existing `user_groceries` Table**

```sql
-- Current production table structure (verified via MCP)
CREATE TABLE user_groceries (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    groceries JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Existing RLS policies
ALTER TABLE user_groceries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their groceries"
    ON user_groceries FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);
```

### **Shopping Cart Migration Script**

```sql
-- File: supabase/migrations/YYYYMMDD_add_shopping_cart_columns.sql

BEGIN;

-- Add shopping cart functionality to existing user_groceries table
ALTER TABLE user_groceries
ADD COLUMN IF NOT EXISTS shopping_list JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS shopping_contexts JSONB DEFAULT '{}';

-- Add performance indexes for JSONB operations
CREATE INDEX IF NOT EXISTS idx_user_groceries_shopping_list
    ON user_groceries USING GIN (shopping_list);

CREATE INDEX IF NOT EXISTS idx_user_groceries_shopping_contexts
    ON user_groceries USING GIN (shopping_contexts);

-- Add partial index for active shopping lists
CREATE INDEX IF NOT EXISTS idx_user_groceries_active_shopping
    ON user_groceries (user_id)
    WHERE shopping_list != '{}';

-- Add helpful comments for documentation
COMMENT ON COLUMN user_groceries.shopping_list IS
    'Shopping list status tracking: {"ingredient_name": "pending|purchased"}';

COMMENT ON COLUMN user_groceries.shopping_contexts IS
    'Shopping item contexts: {"ingredient_name": {"sources": [...], "quantities": [...], "notes": "..."}}';

COMMIT;
```

### **Post-Migration Table Structure**

```sql
-- Complete user_groceries table after shopping cart extension
CREATE TABLE user_groceries (
    -- Existing columns
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    groceries JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- New shopping cart columns
    shopping_list JSONB DEFAULT '{}',
    shopping_contexts JSONB DEFAULT '{}'
);
```

---

## 📋 **Data Structure Specifications**

### **Shopping List Column (`shopping_list`)**

**Purpose**: Track shopping list items and their purchase status

**Structure**:

```json
{
  "ingredient_name": "pending|purchased",
  "tomatoes": "pending",
  "cumin": "purchased",
  "poblano_peppers": "pending"
}
```

**Example for Alice's Mexican Shopping**:

```json
{
  "tomatoes": "pending",
  "mexican_oregano": "pending",
  "lime": "purchased",
  "ground_beef": "pending",
  "onions": "pending",
  "cumin": "pending",
  "poblano_peppers": "pending"
}
```

### **Shopping Contexts Column (`shopping_contexts`)**

**Purpose**: Store rich context about each shopping list item including sources, quantities, and notes

**Structure**:

```json
{
  "ingredient_name": {
    "sources": [
      {
        "type": "recipe|ai_chat|groceries_restock|manual",
        "id": "recipe_id_or_chat_id",
        "context": "human_readable_context"
      }
    ],
    "quantities": ["2 cups", "1 lb"],
    "notes": "Additional user notes"
  }
}
```

**Example for Alice's Mexican Shopping Context**:

```json
{
  "tomatoes": {
    "sources": [
      {
        "type": "recipe",
        "id": "22222222-2222-2222-2222-222222222221",
        "context": "Caesar Salad"
      },
      {
        "type": "ai_chat",
        "id": "chat_session_123",
        "context": "AI suggested Mexican side dish"
      }
    ],
    "quantities": ["2 large", "3 medium"],
    "notes": "Need ripe ones for salsa"
  },
  "mexican_oregano": {
    "sources": [
      {
        "type": "manual",
        "context": "AI suggested Mexican staple"
      }
    ],
    "quantities": ["1 container"],
    "notes": "Essential for authentic Mexican cooking - different from regular oregano"
  },
  "cumin": {
    "sources": [
      {
        "type": "groceries_restock",
        "context": "Out of stock - restocking"
      }
    ],
    "quantities": ["1 container"],
    "notes": "For authentic Mexican seasoning"
  }
}
```

---

## 🔍 **Common Query Patterns**

### **Basic Shopping List Operations**

```sql
-- Get user's complete shopping list with contexts
SELECT
    shopping_list,
    shopping_contexts
FROM user_groceries
WHERE user_id = auth.uid();

-- Add item to shopping list (from recipe)
UPDATE user_groceries
SET
    shopping_list = shopping_list || '{"tomatoes": "pending"}'::jsonb,
    shopping_contexts = shopping_contexts || '{
        "tomatoes": {
            "sources": [{"type": "recipe", "id": "recipe_123", "context": "Caesar Salad"}],
            "quantities": ["2 large"]
        }
    }'::jsonb,
    updated_at = NOW()
WHERE user_id = auth.uid();

-- Mark item as purchased
UPDATE user_groceries
SET
    shopping_list = jsonb_set(shopping_list, '{tomatoes}', '"purchased"'),
    updated_at = NOW()
WHERE user_id = auth.uid();

-- Remove all purchased items
UPDATE user_groceries
SET
    shopping_list = (
        SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
        FROM jsonb_each_text(shopping_list)
        WHERE value = 'pending'
    ),
    shopping_contexts = (
        SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
        FROM jsonb_each(shopping_contexts)
        WHERE EXISTS (
            SELECT 1 FROM jsonb_each_text(shopping_list) s
            WHERE s.key = jsonb_each.key AND s.value = 'pending'
        )
    ),
    updated_at = NOW()
WHERE user_id = auth.uid();
```

### **AI Assistant Queries**

```sql
-- Get pending ingredients for cuisine analysis
SELECT
    array_agg(ingredient_name) as pending_ingredients
FROM (
    SELECT key as ingredient_name
    FROM user_groceries,
         jsonb_each_text(shopping_list)
    WHERE user_id = auth.uid()
        AND value = 'pending'
) t;

-- Get shopping items grouped by source type
SELECT
    source_info->>'type' as source_type,
    source_info->>'context' as context,
    array_agg(ingredient_name) as ingredients
FROM user_groceries,
     jsonb_each(shopping_contexts) as contexts(ingredient_name, context_data),
     jsonb_array_elements(context_data->'sources') as source_info
WHERE user_id = auth.uid()
    AND shopping_list ? contexts.ingredient_name
    AND shopping_list ->> contexts.ingredient_name = 'pending'
GROUP BY source_info->>'type', source_info->>'context'
ORDER BY source_type;
```

---

## 🚀 **Migration & Deployment**

### **Pre-Migration Checklist**

- [ ] Backup current `user_groceries` table
- [ ] Test migration on staging environment
- [ ] Verify existing RLS policies work with new columns
- [ ] Confirm application handles empty JSONB defaults

### **Migration Command**

```bash
# Apply migration to staging first
npx supabase db push --project-ref <STAGING_REF>

# Test the migration
npx supabase db reset --project-ref <STAGING_REF>

# Apply to production
npx supabase db push --project-ref sxvdkipywmjycithdfpp
```

### **Rollback Strategy**

```sql
-- File: supabase/migrations/YYYYMMDD_rollback_shopping_cart.sql

BEGIN;

-- Remove indexes first
DROP INDEX IF EXISTS idx_user_groceries_shopping_list;
DROP INDEX IF EXISTS idx_user_groceries_shopping_contexts;
DROP INDEX IF EXISTS idx_user_groceries_active_shopping;

-- Remove columns (data will be lost)
ALTER TABLE user_groceries
DROP COLUMN IF EXISTS shopping_list,
DROP COLUMN IF EXISTS shopping_contexts;

COMMIT;
```

---

## 🔒 **Security & Performance**

### **Row Level Security**

The shopping cart data automatically inherits existing RLS policies:

```sql
-- Existing policy covers new JSONB columns
CREATE POLICY "Users can manage their groceries"
    ON user_groceries FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);
```

### **Data Validation**

```sql
-- Add constraints for data integrity
ALTER TABLE user_groceries
ADD CONSTRAINT check_shopping_list_is_object
    CHECK (jsonb_typeof(shopping_list) = 'object'),
ADD CONSTRAINT check_shopping_contexts_is_object
    CHECK (jsonb_typeof(shopping_contexts) = 'object');

-- Validate shopping status values
CREATE OR REPLACE FUNCTION validate_shopping_status(status_json jsonb)
RETURNS boolean AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1
        FROM jsonb_each_text(status_json)
        WHERE value NOT IN ('pending', 'purchased')
    );
END;
$$ LANGUAGE plpgsql;

ALTER TABLE user_groceries
ADD CONSTRAINT check_valid_shopping_status
    CHECK (validate_shopping_status(shopping_list));
```

---

## 📊 **Storage & Performance Analysis**

### **Storage Estimates**

**Typical Shopping List (18 items)**:

- Shopping List: ~400-600 bytes
- Shopping Contexts: ~2-4 KB
- **Total per user**: ~2.5-4.5 KB additional storage

**For Alice's Mexican Shopping Example**:

```json
// shopping_list: ~180 bytes
{
  "tomatoes": "pending",
  "mexican_oregano": "pending",
  "lime": "purchased",
  "ground_beef": "pending",
  "onions": "pending",
  "cumin": "pending",
  "poblano_peppers": "pending"
}

// shopping_contexts: ~850 bytes
{
  "tomatoes": {
    "sources": [{"type": "recipe", "id": "uuid", "context": "Caesar Salad"}],
    "quantities": ["2 large"],
    "notes": "Need ripe ones for salsa"
  }
  // ... 6 more items
}
```

### **Index Performance**

```sql
-- Test index usage for common queries
EXPLAIN ANALYZE
SELECT shopping_list
FROM user_groceries
WHERE user_id = 'test-uuid'
    AND shopping_list != '{}';

-- Should use: Index Scan using idx_user_groceries_active_shopping
```

---

## 🧪 **Testing Scenarios**

### **Test Data for Alice's Journey**

```sql
-- Insert test shopping list for Alice's Mexican cooking
UPDATE user_groceries
SET
    shopping_list = '{
        "tomatoes": "pending",
        "mexican_oregano": "pending",
        "lime": "purchased",
        "ground_beef": "pending",
        "onions": "pending",
        "cumin": "pending",
        "poblano_peppers": "pending"
    }'::jsonb,
    shopping_contexts = '{
        "tomatoes": {
            "sources": [
                {"type": "recipe", "id": "caesar-salad-id", "context": "Caesar Salad"},
                {"type": "ai_chat", "id": "chat-123", "context": "Mexican side dish"}
            ],
            "quantities": ["2 large", "3 medium"],
            "notes": "Need ripe ones for salsa"
        },
        "mexican_oregano": {
            "sources": [{"type": "manual", "context": "AI suggested Mexican staple"}],
            "quantities": ["1 container"],
            "notes": "Essential for authentic Mexican cooking"
        },
        "cumin": {
            "sources": [{"type": "groceries_restock", "context": "Out of stock"}],
            "quantities": ["1 container"],
            "notes": "For authentic Mexican seasoning"
        }
    }'::jsonb
WHERE user_id = 'alice-baker-uuid';
```

### **Validation Queries**

```sql
-- Test 1: Verify data integrity
SELECT
    user_id,
    jsonb_typeof(shopping_list) as list_type,
    jsonb_typeof(shopping_contexts) as contexts_type,
    jsonb_object_keys(shopping_list) as list_keys,
    jsonb_object_keys(shopping_contexts) as context_keys
FROM user_groceries
WHERE shopping_list != '{}';

-- Test 2: Check for orphaned contexts
SELECT user_id, orphaned_keys
FROM (
    SELECT
        user_id,
        array_agg(context_key) as orphaned_keys
    FROM user_groceries,
         jsonb_object_keys(shopping_contexts) as context_key
    WHERE NOT (shopping_list ? context_key)
    GROUP BY user_id
) t
WHERE array_length(orphaned_keys, 1) > 0;
```

---

## 📝 **Implementation Summary**

This database schema extension provides:

✅ **Minimal Changes**: Only 2 JSONB columns added to existing table  
✅ **Zero Downtime**: Safe migration with default values  
✅ **High Performance**: GIN indexes optimize JSONB queries  
✅ **Data Integrity**: Constraints ensure valid data structure  
✅ **Security**: Inherits existing RLS policies  
✅ **Flexibility**: JSONB allows for future enhancements

**Ready for Implementation**: This schema supports Alice's complete shopping journey from recipe ingredients → AI suggestions → mobile shopping → grocery sync.

---

_This database schema documentation provides the foundation for implementing the Shopping Cart feature with minimal risk and maximum efficiency._

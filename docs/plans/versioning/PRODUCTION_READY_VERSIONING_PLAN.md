# Production-Ready Recipe Versioning System Plan

## Leveraging Supabase Built-in Tools

### 📋 **Executive Summary**

This plan addresses the fundamental architectural flaws in the current recipe versioning system and proposes a production-ready solution using Supabase's built-in versioning capabilities, including temporal tables, RLS policies, database functions, and audit trails.

**Current Problem**: The existing system treats versions as separate recipe entities, causing duplicate displays and complex parent-child traversal logic.

**Solution**: Implement a clean temporal versioning pattern using Supabase's native PostgreSQL features for content versioning, audit trails, and automatic change tracking.

---

## 🎯 **Architecture Overview**

### **Current Broken Architecture**

```
❌ BROKEN: Multiple recipe entries for versions
recipes table:
├── Zucchini Noodles v1 (id: 1, parent_recipe_id: null)
├── Zucchini Noodles v2 (id: 2, parent_recipe_id: 1)
└── Zucchini Noodles v3 (id: 3, parent_recipe_id: 2)

Result: 3 duplicate entries in recipe list
```

### **Target Production Architecture**

```
✅ PRODUCTION: Single recipe + temporal versioning
recipes table:
└── Zucchini Noodles (id: 1, current_version: 3)

recipe_content_versions table:
├── v1: content snapshot + metadata
├── v2: content snapshot + metadata
└── v3: content snapshot + metadata (published)

audit.recipe_audit_log table:
├── CREATE v1: timestamp, user, changes
├── UPDATE v2: timestamp, user, changes
└── PUBLISH v3: timestamp, user, changes
```

---

## 📋 **Phase 1: Temporal Tables & Audit Infrastructure**

### **1.1: Enable Supabase Audit Extensions**

```sql
-- Enable audit logging extension
CREATE EXTENSION IF NOT EXISTS "audit";
CREATE EXTENSION IF NOT EXISTS "temporal_tables";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create audit schema for system logs
CREATE SCHEMA IF NOT EXISTS audit;
```

### **1.2: Implement Temporal Recipe Content Table**

```sql
-- Main temporal versioning table using Supabase best practices
CREATE TABLE recipe_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_name TEXT,
  changelog TEXT,

  -- Full content snapshot (temporal pattern)
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL,
  instructions TEXT NOT NULL,
  notes TEXT,
  setup TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  cooking_time TEXT,
  difficulty TEXT,
  creator_rating INTEGER CHECK (creator_rating >= 1 AND creator_rating <= 5),
  image_url TEXT,

  -- Temporal metadata using Supabase conventions
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ DEFAULT 'infinity',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT false,

  -- Ensure temporal integrity
  UNIQUE(recipe_id, version_number),
  EXCLUDE USING gist (recipe_id WITH =, tstzrange(valid_from, valid_to) WITH &&)
);

-- Add temporal table trigger for automatic versioning
CREATE TRIGGER versioning_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON recipe_content_versions
  FOR EACH ROW EXECUTE FUNCTION versioning(
    'tstzrange(valid_from, valid_to)',
    'audit.recipe_content_versions_history',
    true
  );
```

### **1.3: Automatic Audit Trail**

```sql
-- Create audit log table using Supabase audit pattern
CREATE TABLE audit.recipe_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL,
  version_number INTEGER,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'PUBLISH', 'DELETE')),

  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],

  -- Audit metadata
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_info JSONB, -- IP, user agent, etc.

  -- Supabase RLS context
  rls_context JSONB DEFAULT current_setting('app.current_user_id', true)::jsonb
);

-- Automatic audit trigger
CREATE OR REPLACE FUNCTION audit.log_recipe_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit.recipe_audit_log (
    recipe_id,
    version_number,
    action,
    old_values,
    new_values,
    changed_fields,
    performed_by
  ) VALUES (
    COALESCE(NEW.recipe_id, OLD.recipe_id),
    COALESCE(NEW.version_number, OLD.version_number),
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW),
    CASE WHEN TG_OP = 'UPDATE' THEN
      (SELECT array_agg(key) FROM jsonb_each(to_jsonb(NEW)) WHERE key NOT IN
       (SELECT key FROM jsonb_each(to_jsonb(OLD)) WHERE value = to_jsonb(NEW)->key))
    END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger
CREATE TRIGGER recipe_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON recipe_content_versions
  FOR EACH ROW EXECUTE FUNCTION audit.log_recipe_changes();
```

---

## 📋 **Phase 2: Advanced RLS & Security**

### **2.1: Production-Grade RLS Policies**

```sql
-- Enable RLS on all versioning tables
ALTER TABLE recipe_content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.recipe_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Version visibility with performance optimization
CREATE POLICY "optimized_version_access" ON recipe_content_versions
  FOR SELECT USING (
    -- Use index-friendly conditions first
    (created_by = auth.uid())
    OR
    (is_published = true AND recipe_id IN (
      SELECT id FROM recipes WHERE is_public = true
    ))
  );

-- Policy: Version creation with ownership validation
CREATE POLICY "secure_version_creation" ON recipe_content_versions
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND recipe_id IN (
      SELECT id FROM recipes
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Audit log access (users can only see their own actions)
CREATE POLICY "audit_log_privacy" ON audit.recipe_audit_log
  FOR SELECT USING (performed_by = auth.uid());
```

### **2.2: Advanced Security Functions**

```sql
-- Secure version publishing with atomic operations
CREATE OR REPLACE FUNCTION publish_recipe_version(
  target_recipe_id UUID,
  target_version_number INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, audit
AS $$
DECLARE
  version_record record;
  result JSONB;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM recipes
    WHERE id = target_recipe_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: User does not own recipe';
  END IF;

  -- Get version to publish
  SELECT * INTO version_record
  FROM recipe_content_versions
  WHERE recipe_id = target_recipe_id
    AND version_number = target_version_number
    AND created_by = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version not found or access denied';
  END IF;

  -- Atomic transaction: Update main recipe + mark version published
  BEGIN
    -- Update main recipe with version content
    UPDATE recipes SET
      title = version_record.title,
      ingredients = version_record.ingredients,
      instructions = version_record.instructions,
      notes = version_record.notes,
      setup = version_record.setup,
      categories = version_record.categories,
      cooking_time = version_record.cooking_time,
      difficulty = version_record.difficulty,
      creator_rating = version_record.creator_rating,
      image_url = version_record.image_url,
      current_version_id = version_record.id,
      updated_at = NOW()
    WHERE id = target_recipe_id;

    -- Mark this version as published, others as drafts
    UPDATE recipe_content_versions
    SET is_published = false
    WHERE recipe_id = target_recipe_id;

    UPDATE recipe_content_versions
    SET is_published = true, valid_to = 'infinity'
    WHERE id = version_record.id;

    -- Log the publish action
    INSERT INTO audit.recipe_audit_log (
      recipe_id, version_number, action, new_values, performed_by
    ) VALUES (
      target_recipe_id, target_version_number, 'PUBLISH',
      to_jsonb(version_record), auth.uid()
    );

    result := jsonb_build_object(
      'success', true,
      'published_version', target_version_number,
      'recipe_id', target_recipe_id
    );

    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to publish version: %', SQLERRM;
  END;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION publish_recipe_version(UUID, INTEGER) TO authenticated;
```

---

## 📋 **Phase 3: Supabase Realtime & Subscriptions**

### **3.1: Enable Realtime for Version Changes**

```sql
-- Enable realtime on versioning tables
ALTER PUBLICATION supabase_realtime ADD TABLE recipe_content_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE audit.recipe_audit_log;

-- Create materialized view for real-time version stats
CREATE MATERIALIZED VIEW recipe_version_stats AS
SELECT
  r.id as recipe_id,
  r.title,
  r.user_id,
  COUNT(v.id) as total_versions,
  MAX(v.version_number) as latest_version,
  COUNT(v.id) FILTER (WHERE v.is_published) as published_versions,
  MAX(v.created_at) as last_version_created,
  jsonb_agg(
    jsonb_build_object(
      'version_number', v.version_number,
      'version_name', v.version_name,
      'is_published', v.is_published,
      'created_at', v.created_at
    ) ORDER BY v.version_number DESC
  ) as version_summary
FROM recipes r
LEFT JOIN recipe_content_versions v ON v.recipe_id = r.id
GROUP BY r.id, r.title, r.user_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX ON recipe_version_stats (recipe_id);

-- Function to refresh stats
CREATE OR REPLACE FUNCTION refresh_version_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY recipe_version_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to refresh stats on version changes
CREATE OR REPLACE FUNCTION trigger_refresh_version_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_version_stats();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_stats_on_version_change
  AFTER INSERT OR UPDATE OR DELETE ON recipe_content_versions
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_version_stats();
```

---

## 📋 **Phase 4: Domain Separation & Clean APIs**

### **4.1: Separate Domain APIs**

**Critical Fix: The current `DualRatingDisplay` component violates Single Responsibility Principle by mixing versioning, ratings, and analytics. This creates artificial data coupling and navigation bugs.**

#### **Versioning API (Pure Domain)**

```typescript
// src/lib/api/features/versioning-api.ts - VERSIONING ONLY
export const versioningApi = {
  async getRecipeVersions(recipeId: string): Promise<RecipeVersion[]> {
    const { data, error } = await supabase
      .from('recipe_content_versions')
      .select(
        `
        id, recipe_id, version_number, version_name, changelog,
        title, ingredients, instructions, notes, setup, categories,
        cooking_time, difficulty, image_url,
        created_at, created_by, is_published
      `
      )
      .eq('recipe_id', recipeId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createVersion(
    recipeId: string,
    versionData: CreateVersionData
  ): Promise<RecipeVersion> {
    // Pure version creation - NO RATING LOGIC
    const nextVersionNumber = await this.getNextVersionNumber(recipeId);

    const { data, error } = await supabase
      .from('recipe_content_versions')
      .insert({
        recipe_id: recipeId,
        version_number: nextVersionNumber,
        version_name: versionData.name,
        changelog: versionData.changelog,
        title: versionData.title,
        ingredients: versionData.ingredients,
        instructions: versionData.instructions,
        notes: versionData.notes,
        setup: versionData.setup,
        categories: versionData.categories,
        cooking_time: versionData.cooking_time,
        difficulty: versionData.difficulty,
        image_url: versionData.image_url,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        is_published: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
```

#### **Rating API (Pure Domain)**

```typescript
// src/lib/api/features/rating-api.ts - RATINGS ONLY
export const ratingApi = {
  async getRecipeRating(recipeId: string): Promise<RatingData> {
    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('rating, comment, created_at, user_id')
      .eq('recipe_id', recipeId)
      .is('version_number', null); // Current recipe ratings only

    if (error) throw error;
    return this.aggregateRatings(data);
  },

  async getVersionRating(
    recipeId: string,
    versionNumber: number
  ): Promise<RatingData> {
    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('rating, comment, created_at, user_id')
      .eq('recipe_id', recipeId)
      .eq('version_number', versionNumber);

    if (error) throw error;
    return this.aggregateRatings(data);
  },

  async submitRating(
    recipeId: string,
    versionNumber: number | null,
    rating: number,
    comment?: string
  ): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User must be authenticated to rate');

    const { error } = await supabase.from('recipe_ratings').upsert({
      recipe_id: recipeId,
      version_number: versionNumber,
      user_id: userId,
      rating,
      comment,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  },

  aggregateRatings(ratings: any[]): RatingData {
    if (ratings.length === 0) {
      return { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;
    const distribution = [1, 2, 3, 4, 5].map(
      (star) => ratings.filter((r) => r.rating === star).length
    );

    return { average, count: ratings.length, distribution };
  },
};
```

#### **Analytics API (Pure Domain)**

```typescript
// src/lib/api/features/analytics-api.ts - ANALYTICS ONLY
export const analyticsApi = {
  async trackRecipeView(
    recipeId: string,
    versionNumber?: number
  ): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase.from('recipe_analytics').insert({
      recipe_id: recipeId,
      version_number: versionNumber,
      event_type: 'view',
      user_id: userId,
      metadata: {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
    });

    if (error && error.code !== '23505') {
      // Ignore duplicate entries
      throw error;
    }
  },

  async getRecipeAnalytics(
    recipeId: string,
    versionNumber?: number
  ): Promise<AnalyticsData> {
    const { data, error } = await supabase
      .from('recipe_analytics')
      .select('event_type, created_at, user_id')
      .eq('recipe_id', recipeId)
      .eq('version_number', versionNumber || null);

    if (error) throw error;
    return this.aggregateAnalytics(data);
  },

  aggregateAnalytics(events: any[]): AnalyticsData {
    const views = events.filter((e) => e.event_type === 'view').length;
    const uniqueUsers = new Set(
      events.filter((e) => e.user_id).map((e) => e.user_id)
    ).size;
    const engagementRate = uniqueUsers > 0 ? (views / uniqueUsers) * 100 : 0;

    return {
      views,
      uniqueUsers,
      engagementRate,
      lastViewed: events.length > 0 ? events[0].created_at : null,
    };
  },
};
```

### **4.2: Serverless Edge Functions**

```typescript
// supabase/functions/recipe-versioning/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface VersioningRequest {
  action: 'create' | 'publish' | 'list' | 'get' | 'audit';
  recipe_id: string;
  version_number?: number;
  version_data?: {
    name: string;
    changelog: string;
    content_changes: Record<string, any>;
  };
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: VersioningRequest = await req.json();

    switch (body.action) {
      case 'create':
        return await createVersion(supabase, user.id, body);
      case 'publish':
        return await publishVersion(supabase, user.id, body);
      case 'list':
        return await listVersions(supabase, user.id, body);
      case 'audit':
        return await getAuditTrail(supabase, user.id, body);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

async function createVersion(
  supabase: any,
  userId: string,
  body: VersioningRequest
) {
  // Use the secure database function
  const { data, error } = await supabase.rpc('create_recipe_version', {
    target_recipe_id: body.recipe_id,
    version_name: body.version_data?.name,
    changelog: body.version_data?.changelog,
    content_changes: body.version_data?.content_changes,
  });

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      version: data,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

async function publishVersion(
  supabase: any,
  userId: string,
  body: VersioningRequest
) {
  // Use the secure publish function
  const { data, error } = await supabase.rpc('publish_recipe_version', {
    target_recipe_id: body.recipe_id,
    target_version_number: body.version_number,
  });

  if (error) throw error;

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getAuditTrail(
  supabase: any,
  userId: string,
  body: VersioningRequest
) {
  const { data, error } = await supabase
    .from('audit.recipe_audit_log')
    .select('*')
    .eq('recipe_id', body.recipe_id)
    .eq('performed_by', userId)
    .order('performed_at', { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({
      audit_trail: data,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

### **4.2: Frontend Integration with Supabase Realtime**

```typescript
// src/lib/api/features/production-versioning-api.ts
import { supabase } from '../../supabase';
import type { RecipeVersion } from '../../types';

export class ProductionVersioningAPI {
  private realtimeSubscription: any = null;

  // Subscribe to real-time version changes
  subscribeToVersionChanges(
    recipeId: string,
    callback: (payload: any) => void
  ) {
    this.realtimeSubscription = supabase
      .channel(`recipe-versions-${recipeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipe_content_versions',
          filter: `recipe_id=eq.${recipeId}`,
        },
        callback
      )
      .subscribe();

    return this.realtimeSubscription;
  }

  // Create version using Edge Function
  async createVersion(
    recipeId: string,
    versionData: {
      name: string;
      changelog: string;
      content_changes: Record<string, any>;
    }
  ): Promise<RecipeVersion> {
    const { data, error } = await supabase.functions.invoke(
      'recipe-versioning',
      {
        body: {
          action: 'create',
          recipe_id: recipeId,
          version_data: versionData,
        },
      }
    );

    if (error) throw error;
    return data.version;
  }

  // Publish version using secure database function
  async publishVersion(recipeId: string, versionNumber: number): Promise<void> {
    const { data, error } = await supabase.rpc('publish_recipe_version', {
      target_recipe_id: recipeId,
      target_version_number: versionNumber,
    });

    if (error) throw error;
    return data;
  }

  // Get versions with caching
  async getVersions(recipeId: string): Promise<RecipeVersion[]> {
    const { data, error } = await supabase
      .from('recipe_content_versions')
      .select(
        `
        *,
        audit_log:audit.recipe_audit_log(
          action,
          performed_at,
          performed_by,
          changed_fields
        )
      `
      )
      .eq('recipe_id', recipeId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get audit trail
  async getAuditTrail(recipeId: string): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke(
      'recipe-versioning',
      {
        body: {
          action: 'audit',
          recipe_id: recipeId,
        },
      }
    );

    if (error) throw error;
    return data.audit_trail;
  }

  // Cleanup subscriptions
  unsubscribe() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
  }
}
```

---

## 📋 **Phase 5: Migration Strategy**

### **5.1: Zero-Downtime Migration**

```sql
-- Migration script: 20250918_production_versioning_system.sql

-- Step 1: Create new schema alongside existing
-- (All the tables and functions from previous phases)

-- Step 2: Migrate existing data
WITH recipe_families AS (
  -- Find original recipes (those without parent)
  SELECT
    id as original_id,
    title, ingredients, instructions, notes, setup, categories,
    cooking_time, difficulty, creator_rating, image_url, user_id, created_at
  FROM recipes
  WHERE parent_recipe_id IS NULL
),
version_data AS (
  -- Get all versions in each family
  SELECT
    rf.original_id as recipe_id,
    COALESCE(r.version_number, 1) as version_number,
    rv.version_name,
    rv.changelog,
    r.title, r.ingredients, r.instructions, r.notes, r.setup, r.categories,
    r.cooking_time, r.difficulty, r.creator_rating, r.image_url,
    r.user_id as created_by,
    r.created_at,
    (r.version_number = (
      SELECT MAX(r2.version_number)
      FROM recipes r2
      WHERE COALESCE(r2.parent_recipe_id, r2.id) = rf.original_id
    )) as is_latest
  FROM recipe_families rf
  LEFT JOIN recipes r ON (
    r.id = rf.original_id OR
    find_original_recipe_id(r.id) = rf.original_id
  )
  LEFT JOIN recipe_versions rv ON rv.version_recipe_id = r.id
)
INSERT INTO recipe_content_versions (
  recipe_id, version_number, version_name, changelog,
  title, ingredients, instructions, notes, setup, categories,
  cooking_time, difficulty, creator_rating, image_url,
  created_by, created_at, is_published
)
SELECT
  recipe_id, version_number, version_name, changelog,
  title, ingredients, instructions, notes, setup, categories,
  cooking_time, difficulty, creator_rating, image_url,
  created_by, created_at, is_latest
FROM version_data;

-- Step 3: Update main recipes table to point to latest versions
UPDATE recipes r SET
  current_version_id = v.id
FROM recipe_content_versions v
WHERE v.recipe_id = r.id
  AND v.is_published = true;

-- Step 4: Clean up old versioning columns (after validation)
-- ALTER TABLE recipes DROP COLUMN version_number;
-- ALTER TABLE recipes DROP COLUMN parent_recipe_id;
-- ALTER TABLE recipes DROP COLUMN is_version;
-- DROP TABLE recipe_versions;
```

### **5.2: Rollback Strategy**

```sql
-- Rollback script (if needed)
-- 1. Restore from backup
-- 2. Re-apply old schema
-- 3. Migrate data back to old format

-- This is why we keep old columns during migration phase
```

---

## 📋 **Phase 6: Performance & Monitoring**

### **6.1: Performance Optimization**

```sql
-- Advanced indexing strategy
CREATE INDEX CONCURRENTLY idx_recipe_versions_recipe_published
  ON recipe_content_versions (recipe_id, is_published, version_number DESC);

CREATE INDEX CONCURRENTLY idx_recipe_versions_user_recent
  ON recipe_content_versions (created_by, created_at DESC);

CREATE INDEX CONCURRENTLY idx_audit_log_recipe_time
  ON audit.recipe_audit_log (recipe_id, performed_at DESC);

-- Partitioning for large audit logs
CREATE TABLE audit.recipe_audit_log_y2025m01 PARTITION OF audit.recipe_audit_log
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Auto-partition function
CREATE OR REPLACE FUNCTION audit.create_monthly_partition()
RETURNS void AS $$
DECLARE
  start_date date;
  end_date date;
  table_name text;
BEGIN
  start_date := date_trunc('month', CURRENT_DATE);
  end_date := start_date + interval '1 month';
  table_name := 'recipe_audit_log_y' || to_char(start_date, 'YYYY') || 'm' || to_char(start_date, 'MM');

  EXECUTE format('CREATE TABLE IF NOT EXISTS audit.%I PARTITION OF audit.recipe_audit_log FOR VALUES FROM (%L) TO (%L)',
    table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

### **6.2: Monitoring & Alerting**

```sql
-- Performance monitoring view
CREATE VIEW admin.versioning_performance_stats AS
SELECT
  'recipe_content_versions' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE created_at > NOW() - interval '24 hours') as rows_last_24h,
  AVG(pg_column_size(title) + pg_column_size(ingredients) + pg_column_size(instructions)) as avg_row_size,
  MAX(version_number) as max_version_number
FROM recipe_content_versions
UNION ALL
SELECT
  'recipe_audit_log' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE performed_at > NOW() - interval '24 hours') as rows_last_24h,
  AVG(pg_column_size(old_values) + pg_column_size(new_values)) as avg_row_size,
  NULL as max_version_number
FROM audit.recipe_audit_log;

-- Alert function for excessive version creation
CREATE OR REPLACE FUNCTION admin.check_version_abuse()
RETURNS TABLE(user_id UUID, recipe_count BIGINT, version_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.created_by,
    COUNT(DISTINCT v.recipe_id) as recipe_count,
    COUNT(*) as version_count
  FROM recipe_content_versions v
  WHERE v.created_at > NOW() - interval '1 hour'
  GROUP BY v.created_by
  HAVING COUNT(*) > 50; -- Alert if user creates >50 versions in 1 hour
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📋 **Phase 7: Testing & Validation**

### **7.1: Comprehensive Test Suite**

```typescript
// tests/versioning/production-versioning.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { ProductionVersioningAPI } from '@/lib/api/features/production-versioning-api';
import { supabase } from '@/lib/supabase';

describe('Production Versioning System', () => {
  let api: ProductionVersioningAPI;
  let testRecipeId: string;
  let testUserId: string;

  beforeEach(async () => {
    api = new ProductionVersioningAPI();
    // Create test recipe and user
    const { data: recipe } = await supabase
      .from('recipes')
      .insert({
        title: 'Test Recipe',
        ingredients: ['test ingredient'],
        instructions: 'test instructions',
        user_id: testUserId,
      })
      .select()
      .single();
    testRecipeId = recipe.id;
  });

  afterEach(async () => {
    api.unsubscribe();
    // Cleanup test data
    await supabase.from('recipes').delete().eq('id', testRecipeId);
  });

  test('creates version with audit trail', async () => {
    const version = await api.createVersion(testRecipeId, {
      name: 'Test Version',
      changelog: 'Added test changes',
      content_changes: { title: 'Updated Test Recipe' },
    });

    expect(version.version_number).toBe(1);
    expect(version.version_name).toBe('Test Version');

    // Check audit trail
    const auditTrail = await api.getAuditTrail(testRecipeId);
    expect(auditTrail).toHaveLength(1);
    expect(auditTrail[0].action).toBe('CREATE');
  });

  test('publishes version atomically', async () => {
    // Create version first
    const version = await api.createVersion(testRecipeId, {
      name: 'Test Version',
      changelog: 'Test changes',
      content_changes: { title: 'Updated Title' },
    });

    // Publish it
    await api.publishVersion(testRecipeId, version.version_number);

    // Verify main recipe was updated
    const { data: recipe } = await supabase
      .from('recipes')
      .select('title, current_version_id')
      .eq('id', testRecipeId)
      .single();

    expect(recipe.title).toBe('Updated Title');
    expect(recipe.current_version_id).toBe(version.id);
  });

  test('real-time subscriptions work', async () => {
    let receivedUpdate = false;

    api.subscribeToVersionChanges(testRecipeId, (payload) => {
      receivedUpdate = true;
      expect(payload.eventType).toBe('INSERT');
    });

    await api.createVersion(testRecipeId, {
      name: 'Real-time Test',
      changelog: 'Testing subscriptions',
      content_changes: {},
    });

    // Wait for real-time event
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(receivedUpdate).toBe(true);
  });

  test('prevents unauthorized access', async () => {
    // Try to create version for recipe owned by different user
    const { data: otherRecipe } = await supabase
      .from('recipes')
      .insert({
        title: 'Other User Recipe',
        ingredients: ['test'],
        instructions: 'test',
        user_id: 'different-user-id',
      })
      .select()
      .single();

    await expect(
      api.createVersion(otherRecipe.id, {
        name: 'Unauthorized',
        changelog: 'Should fail',
        content_changes: {},
      })
    ).rejects.toThrow('Access denied');
  });
});
```

### **7.2: Load Testing**

```typescript
// tests/versioning/load-test.ts
import { test } from 'vitest';
import { ProductionVersioningAPI } from '@/lib/api/features/production-versioning-api';

test('handles concurrent version creation', async () => {
  const api = new ProductionVersioningAPI();
  const promises = [];

  // Create 100 concurrent versions
  for (let i = 0; i < 100; i++) {
    promises.push(
      api.createVersion(testRecipeId, {
        name: `Concurrent Version ${i}`,
        changelog: `Change ${i}`,
        content_changes: { title: `Title ${i}` },
      })
    );
  }

  const results = await Promise.allSettled(promises);
  const successful = results.filter((r) => r.status === 'fulfilled');

  expect(successful.length).toBe(100);

  // Verify version numbers are sequential and unique
  const versions = await api.getVersions(testRecipeId);
  const versionNumbers = versions.map((v) => v.version_number).sort();

  for (let i = 0; i < versionNumbers.length - 1; i++) {
    expect(versionNumbers[i + 1]).toBe(versionNumbers[i] + 1);
  }
});
```

---

## 📋 **Production Deployment Checklist**

### **Pre-Deployment**

- [ ] All migrations tested on staging environment
- [ ] Performance benchmarks meet requirements
- [ ] Security audit completed
- [ ] Backup strategy verified
- [ ] Rollback plan tested

### **Deployment**

- [ ] Enable maintenance mode
- [ ] Run database migrations
- [ ] Deploy Edge Functions
- [ ] Update application code
- [ ] Verify real-time subscriptions
- [ ] Run smoke tests
- [ ] Disable maintenance mode

### **Post-Deployment**

- [ ] Monitor performance metrics
- [ ] Check error rates
- [ ] Verify audit logs
- [ ] Test version creation/publishing
- [ ] Validate real-time updates
- [ ] Document any issues

---

## 📊 **Success Metrics**

### **Technical KPIs**

- **Query Performance**: Version queries < 100ms
- **Audit Coverage**: 100% of version changes logged
- **Data Integrity**: Zero data loss during migrations
- **Real-time Latency**: Updates propagate < 500ms
- **Security**: Zero unauthorized access attempts succeed

### **Business KPIs**

- **User Experience**: Single recipe entries in lists
- **Version Adoption**: Users create versions regularly
- **System Reliability**: 99.9% uptime
- **Performance**: No user-reported slowdowns

---

## 🔗 **Related Documentation**

- [Supabase Temporal Tables Guide](https://supabase.com/docs/guides/database/temporal-tables)
- [PostgreSQL Audit Trail Patterns](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

---

**Status**: Ready for Implementation  
**Priority**: Critical - Fixes fundamental architecture flaw  
**Estimated Timeline**: 2-3 weeks  
**Risk Level**: Medium - Requires careful migration planning

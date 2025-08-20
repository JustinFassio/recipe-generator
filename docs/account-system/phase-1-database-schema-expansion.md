# Phase 1: Database Schema Expansion Plan

## Overview

**Feature-First Implementation**: Extend the existing user system with essential personalization data using atomic, incremental migrations. Each sub-phase delivers a complete, testable feature following established codebase patterns.

## Current Schema Analysis

```sql
-- Existing profiles table (from 20250115000000_user_accounts.sql)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username citext UNIQUE CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  full_name text CHECK (length(trim(full_name)) BETWEEN 1 AND 80),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Feature-First Implementation Strategy

### Phase 1A: Essential Profile Extensions (Week 1)

**Atomic Feature**: Basic user personalization
**Goal**: Add core personalization fields to existing profiles table

```sql
-- 20250117000000_profiles_basic_preferences.sql
-- Extend existing profiles table with essential fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS units text DEFAULT 'metric'
  CHECK (units IN ('metric', 'imperial'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS time_per_meal int
  CHECK (time_per_meal BETWEEN 10 AND 120);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skill_level text DEFAULT 'beginner'
  CHECK (skill_level IN ('beginner', 'intermediate', 'advanced'));
```

### Phase 1B: Safety-Critical Data (Week 2)

**Atomic Feature**: User safety and dietary restrictions
**Goal**: Add allergy and dietary restriction management

```sql
-- 20250118000000_user_safety.sql
-- Single table for safety-critical data
CREATE TABLE user_safety (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  allergies text[] DEFAULT '{}',
  dietary_restrictions text[] DEFAULT '{}',
  medical_conditions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_safety ENABLE ROW LEVEL SECURITY;

-- Self-access only policy
CREATE POLICY "user_safety_self_access" ON user_safety
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER user_safety_set_updated_at
  BEFORE UPDATE ON user_safety
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
```

### Phase 1C: Cooking Preferences (Week 3)

**Atomic Feature**: Cuisine and equipment preferences
**Goal**: Add cooking-specific preference management

```sql
-- 20250119000000_cooking_preferences.sql
-- Single table for cooking preferences
CREATE TABLE cooking_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_cuisines text[] DEFAULT '{}',
  available_equipment text[] DEFAULT '{}',
  disliked_ingredients text[] DEFAULT '{}',
  spice_tolerance int DEFAULT 3 CHECK (spice_tolerance BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS and policies (same pattern)
ALTER TABLE cooking_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cooking_preferences_self_access" ON cooking_preferences
  FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER cooking_preferences_set_updated_at
  BEFORE UPDATE ON cooking_preferences
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
```

## Implementation Steps

### Phase 1A Implementation (Week 1)

```sql
-- 20250117000000_profiles_basic_preferences.sql
-- Extend existing profiles table with essential fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS units text DEFAULT 'metric'
  CHECK (units IN ('metric', 'imperial'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS time_per_meal int
  CHECK (time_per_meal BETWEEN 10 AND 120);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skill_level text DEFAULT 'beginner'
  CHECK (skill_level IN ('beginner', 'intermediate', 'advanced'));
```

### Phase 1B Implementation (Week 2)

```sql
-- 20250118000000_user_safety.sql
-- Complete safety table implementation
CREATE TABLE user_safety (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  allergies text[] DEFAULT '{}',
  dietary_restrictions text[] DEFAULT '{}',
  medical_conditions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_safety ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_safety_self_access" ON user_safety
  FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER user_safety_set_updated_at
  BEFORE UPDATE ON user_safety
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
```

### Phase 1C Implementation (Week 3)

```sql
-- 20250119000000_cooking_preferences.sql
-- Complete cooking preferences implementation
CREATE TABLE cooking_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_cuisines text[] DEFAULT '{}',
  available_equipment text[] DEFAULT '{}',
  disliked_ingredients text[] DEFAULT '{}',
  spice_tolerance int DEFAULT 3 CHECK (spice_tolerance BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cooking_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cooking_preferences_self_access" ON cooking_preferences
  FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER cooking_preferences_set_updated_at
  BEFORE UPDATE ON cooking_preferences
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
```

## Updated TypeScript Types

### Phase 1A: Extended Profile Type

```typescript
// src/lib/supabase.ts - Extend existing Profile type
export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  // NEW: Basic preferences (Phase 1A)
  region: string | null;
  language: string | null;
  units: string | null;
  time_per_meal: number | null;
  skill_level: string | null;
  created_at: string;
  updated_at: string;
};
```

### Phase 1B: Safety Data Type

```typescript
// NEW: Safety data type (Phase 1B)
export type UserSafety = {
  user_id: string;
  allergies: string[];
  dietary_restrictions: string[];
  medical_conditions: string[];
  created_at: string;
  updated_at: string;
};
```

### Phase 1C: Cooking Preferences Type

```typescript
// NEW: Cooking preferences type (Phase 1C)
export type CookingPreferences = {
  user_id: string;
  preferred_cuisines: string[];
  available_equipment: string[];
  disliked_ingredients: string[];
  spice_tolerance: number | null;
  created_at: string;
  updated_at: string;
};
```

## Key Design Principles

### ✅ **Feature-First Compliance**

1. **Atomic Features**: Each phase delivers one complete, testable feature
2. **Incremental Delivery**: 3 separate migrations = 3 independent releases
3. **Clear Rollback**: Each phase can be rolled back independently

### ✅ **Follows Established Patterns**

1. **Consistent Data Types**: Uses `text[]` arrays like recipes table
2. **Standard RLS Policies**: Same pattern as existing auth system
3. **Proven Triggers**: Uses `moddatetime` like existing tables
4. **Naming Conventions**: Follows profiles/usernames pattern

### ✅ **Simplified & Maintainable**

1. **No Complex JSONB**: Sticks to simple arrays and primitives
2. **Single Responsibility**: Each table has clear, focused purpose
3. **Type-Safe**: Clear TypeScript interfaces for all data
4. **Performance Optimized**: Uses proven PostgreSQL patterns

### ✅ **Scalable Architecture**

1. **Easy Extension**: Can add fields to existing tables
2. **Clear Evolution**: Each phase builds logically on previous
3. **Future-Proof**: Architecture supports additional features

## Implementation Timeline

### Week 1: Phase 1A (Basic Preferences)

- **Deliverable**: Extend profiles table with region, units, skill level
- **UI Components**: Basic profile settings form
- **Testing**: Ensure existing users unaffected

### Week 2: Phase 1B (Safety Data)

- **Deliverable**: User safety table with allergies and dietary restrictions
- **UI Components**: Safety preferences form with validation
- **Testing**: Safety data persistence and retrieval

### Week 3: Phase 1C (Cooking Preferences)

- **Deliverable**: Cooking preferences table with cuisines and equipment
- **UI Components**: Cooking preferences form
- **Testing**: Complete profile system integration

## Success Metrics

### Technical Success

- ✅ All migrations run without errors
- ✅ Existing users unaffected
- ✅ TypeScript types compile cleanly
- ✅ RLS policies work correctly

### Feature Success

- ✅ Each phase delivers working functionality
- ✅ UI components work independently
- ✅ Data persists correctly
- ✅ No breaking changes between phases

This approach maintains the current clean architecture while following feature-first/atomic component principles and adding essential personalization data for AI recipe generation.

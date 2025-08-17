# Phase 1: Database Schema Expansion Plan

## Overview

Extend the existing user system with essential personalization data while maintaining the current clean architecture. Focus on safety-critical data first, then add personalization layers.

## Current Schema

```sql
-- Existing tables
profiles (id, username, full_name, avatar_url, created_at, updated_at)
usernames (username, user_id, created_at)
```

## New Schema Design

### 1. Core Profile Extension

**Extend existing `profiles` table** - Keep it simple, add essential fields:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS:
- region text,
- language text DEFAULT 'en',
- units text DEFAULT 'metric',
- time_per_meal text CHECK (time_per_meal IN ('10-20', '20-40', '40-60')),
- skill_level text CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
- budget text CHECK (budget IN ('low', 'medium', 'high'))
```

### 2. Safety-Critical Data

**New table: `user_safety`** - Allergies and dietary restrictions:

```sql
CREATE TABLE user_safety (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  allergies text[], -- ['peanut', 'tree_nut', 'milk', 'egg', 'wheat', 'soy', 'fish', 'shellfish', 'sesame']
  other_allergens text[],
  intolerances text[], -- ['lactose', 'gluten', 'fructose']
  dietary_pattern text[] DEFAULT ['omnivore'], -- ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher']
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 3. Health Context

**New table: `user_health`** - Basic health information:

```sql
CREATE TABLE user_health (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  health_concerns text[], -- ['diabetes', 'hypertension', 'celiac', 'ibs', 'pregnancy']
  medications text[], -- ['warfarin', 'metformin']
  sodium_limit_mg int,
  protein_g_per_kg numeric,
  fiber_g_per_day int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 4. Preferences

**New table: `user_preferences`** - Cultural and cooking preferences:

```sql
CREATE TABLE user_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  cuisines text[], -- ['mexican', 'italian', 'indian', 'chinese']
  spice_level int CHECK (spice_level BETWEEN 0 AND 5),
  disliked_ingredients text[],
  equipment text[], -- ['oven', 'stove', 'microwave', 'air_fryer', 'instant_pot']
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 5. Household Members

**New table: `household_members`** - Family members with restrictions:

```sql
CREATE TABLE household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  age_band text CHECK (age_band IN ('child', 'teen', 'adult', 'senior')),
  restrictions jsonb, -- {allergies: [], diet: ['vegetarian']}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Implementation Steps

### Step 1: Create Migration File

```sql
-- 20250117000000_user_personalization.sql
-- Add new columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS units text DEFAULT 'metric';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS time_per_meal text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skill_level text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget text;

-- Add constraints
ALTER TABLE profiles ADD CONSTRAINT profiles_time_per_meal_check
  CHECK (time_per_meal IS NULL OR time_per_meal IN ('10-20', '20-40', '40-60'));
ALTER TABLE profiles ADD CONSTRAINT profiles_skill_level_check
  CHECK (skill_level IS NULL OR skill_level IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE profiles ADD CONSTRAINT profiles_budget_check
  CHECK (budget IS NULL OR budget IN ('low', 'medium', 'high'));

-- Create new tables
CREATE TABLE user_safety (...);
CREATE TABLE user_health (...);
CREATE TABLE user_preferences (...);
CREATE TABLE household_members (...);

-- Add RLS policies
ALTER TABLE user_safety ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Create policies (self-only access)
CREATE POLICY "user_safety_self_access" ON user_safety FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_health_self_access" ON user_health FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_preferences_self_access" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "household_members_self_access" ON household_members FOR ALL USING (auth.uid() = user_id);
```

### Step 2: Update TypeScript Types

```typescript
// src/lib/supabase.ts - Add new types
export type UserSafety = {
  user_id: string;
  allergies: string[];
  other_allergens: string[];
  intolerances: string[];
  dietary_pattern: string[];
  created_at: string;
  updated_at: string;
};

export type UserHealth = {
  user_id: string;
  health_concerns: string[];
  medications: string[];
  sodium_limit_mg: number | null;
  protein_g_per_kg: number | null;
  fiber_g_per_day: number | null;
  created_at: string;
  updated_at: string;
};

export type UserPreferences = {
  user_id: string;
  cuisines: string[];
  spice_level: number | null;
  disliked_ingredients: string[];
  equipment: string[];
  created_at: string;
  updated_at: string;
};

export type HouseholdMember = {
  id: string;
  user_id: string;
  nickname: string;
  age_band: string;
  restrictions: Record<string, any>;
  created_at: string;
  updated_at: string;
};
```

### Step 3: Update Profile Type

```typescript
// Extend existing Profile type
export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  region: string | null;
  language: string | null;
  units: string | null;
  time_per_meal: string | null;
  skill_level: string | null;
  budget: string | null;
  created_at: string;
  updated_at: string;
};
```

## Key Design Principles

1. **Minimal Complexity**: Only essential fields, no over-engineering
2. **Backward Compatible**: Existing users continue working
3. **Safety First**: Allergies and health data get priority
4. **Simple Relationships**: One-to-one for core data, one-to-many for household
5. **Consistent Patterns**: Follow existing table structure and naming

## Data Flow

- User signs up → Basic profile created (existing flow)
- User visits settings → Progressive data collection
- Safety data collected first (allergies, dietary restrictions)
- Health and preferences added incrementally
- Household members added as needed

This approach maintains the current clean architecture while adding the essential personalization data needed for AI recipe generation.

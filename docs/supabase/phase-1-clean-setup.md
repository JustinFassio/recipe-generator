# Phase 1: Clean Supabase Setup (Bulletproof Version)

**GOAL**: Get basic authentication working with zero errors, then add features one by one.

---

## 🚨 Prerequisites

1. **Clean Supabase Project**: Delete everything in your current database
2. **Environment Variables**: Already set up (✅ Done)
3. **No Database Tables**: We'll create them step by step

---

## Step 1: Complete Database Reset

**Run in Supabase Dashboard → SQL Editor:**

```sql
-- NUCLEAR RESET: Remove everything
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Drop all functions in public schema
    FOR r IN (SELECT proname FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE nspname = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || ' CASCADE';
    END LOOP;

    -- Clean storage buckets
    DELETE FROM storage.buckets WHERE id IN ('avatars', 'recipe-images');

    -- Clean migration history
    DELETE FROM supabase_migrations.schema_migrations WHERE version LIKE '202501%';
END $$;

-- Confirm clean state
SELECT 'Database is clean' as status;
```

**Expected Result**: `Database is clean`

---

## Step 2: Test Basic Authentication

**Your app should now work with:**

- ✅ Login/Signup (no profile creation)
- ✅ No console errors
- ✅ Basic navigation

**Test this before continuing!**

---

## Step 3: Add Core Extensions

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS moddatetime;

SELECT 'Extensions enabled' as status;
```

---

## Step 4: Create Basic Profiles Table

```sql
-- Minimal profiles table - just what we need for auth
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-update trigger
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

SELECT 'Basic profiles table created' as status;
```

**Test**: Create a new account → Should work without errors

---

## Step 5: Add Recipes Table (Core App Functionality)

```sql
-- Recipes table - needed for main app functionality
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ingredients text[] NOT NULL DEFAULT '{}',
  instructions text NOT NULL,
  notes text,
  image_url text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "recipes_select_public" ON recipes FOR SELECT USING (is_public = true);
CREATE POLICY "recipes_select_own" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recipes_insert_own" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes_update_own" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recipes_delete_own" ON recipes FOR DELETE USING (auth.uid() = user_id);

-- Auto-update trigger
CREATE TRIGGER recipes_set_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

SELECT 'Recipes table created' as status;
```

**Test**: Navigate to recipes page → Should work without errors

---

## Step 6: Re-enable Profile Functionality

Only after Steps 1-5 work perfectly:

1. **Uncomment** `src/lib/user-preferences.ts`
2. **Delete** `src/lib/user-preferences-temp-fix.ts`
3. **Test** profile page

---

## Step 7: Add Profile Extensions (One at a time)

### 7A: Profile Preferences

```sql
-- Add profile preference columns
ALTER TABLE profiles ADD COLUMN bio text CHECK (length(bio) <= 500);
ALTER TABLE profiles ADD COLUMN region text;
ALTER TABLE profiles ADD COLUMN language text DEFAULT 'en' NOT NULL;
ALTER TABLE profiles ADD COLUMN units text DEFAULT 'metric' NOT NULL CHECK (units IN ('metric', 'imperial'));
ALTER TABLE profiles ADD COLUMN time_per_meal int CHECK (time_per_meal IS NULL OR time_per_meal BETWEEN 10 AND 120);
ALTER TABLE profiles ADD COLUMN skill_level text DEFAULT 'beginner' NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced'));

SELECT 'Profile preferences added' as status;
```

**Test**: Profile info form → Should save/load correctly

### 7B: User Safety Table

```sql
CREATE TABLE user_safety (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  allergies text[] DEFAULT '{}' NOT NULL,
  dietary_restrictions text[] DEFAULT '{}' NOT NULL,
  medical_conditions text[] DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_safety ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_safety_own_data" ON user_safety FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER user_safety_set_updated_at
  BEFORE UPDATE ON user_safety
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

SELECT 'User safety table created' as status;
```

**Test**: Safety section → Should save/load correctly

### 7C: Cooking Preferences Table

```sql
CREATE TABLE cooking_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_cuisines text[] DEFAULT '{}' NOT NULL,
  available_equipment text[] DEFAULT '{}' NOT NULL,
  disliked_ingredients text[] DEFAULT '{}' NOT NULL,
  spice_tolerance int DEFAULT 3 CHECK (spice_tolerance BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE cooking_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cooking_preferences_select_all" ON cooking_preferences FOR SELECT USING (true);
CREATE POLICY "cooking_preferences_modify_own" ON cooking_preferences FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER cooking_preferences_set_updated_at
  BEFORE UPDATE ON cooking_preferences
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

SELECT 'Cooking preferences table created' as status;
```

**Test**: Cooking section → Should save/load correctly

---

## ✅ Success Criteria

After each step:

- ✅ No console errors
- ✅ App loads without hanging
- ✅ Authentication works
- ✅ Each new feature works before adding the next

---

## 🚨 If Something Breaks

**STOP** → Go back to the last working step → Debug that specific issue

**Don't add more complexity until the current step works perfectly.**

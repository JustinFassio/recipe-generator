# Phase 1: Core Database Setup

**Timeline**: Day 1  
**Deliverable**: Complete database foundation for profile modularization system

---

## 🎯 Objective

Set up the core database tables and security policies to support the completed profile modularization components. This is a clean implementation following the existing MVP patterns.

---

## 📋 Implementation Steps

### Step 1: Core Tables Setup

#### Migration 1: `20250120000001_create_profiles_table.sql`

```sql
-- Create extended profiles table with all needed fields
BEGIN;

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username citext UNIQUE CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  full_name text CHECK (length(trim(full_name)) BETWEEN 1 AND 80),
  avatar_url text,
  bio text CHECK (length(bio) <= 500),

  -- Profile preferences (from ProfileInfoForm component)
  region text,
  language text DEFAULT 'en' NOT NULL,
  units text DEFAULT 'metric' NOT NULL CHECK (units IN ('metric', 'imperial')),
  time_per_meal int CHECK (time_per_meal IS NULL OR time_per_meal BETWEEN 10 AND 120),
  skill_level text DEFAULT 'beginner' NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies: users can read all profiles (for social features), but only update their own
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-update timestamp trigger
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

COMMIT;
```

#### Migration 2: `20250120000002_create_user_safety_table.sql`

```sql
-- Create user_safety table (supports AllergiesField, DietaryRestrictionsField, MedicalConditionsField)
BEGIN;

CREATE TABLE user_safety (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  allergies text[] DEFAULT '{}' NOT NULL,
  dietary_restrictions text[] DEFAULT '{}' NOT NULL,
  medical_conditions text[] DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS - safety data is private to user only
ALTER TABLE user_safety ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_safety_own_data" ON user_safety
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER user_safety_set_updated_at
  BEFORE UPDATE ON user_safety
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

COMMIT;
```

#### Migration 3: `20250120000003_create_cooking_preferences_table.sql`

```sql
-- Create cooking_preferences table (supports PreferredCuisinesField, EquipmentField, SpiceToleranceField, DislikedIngredientsField)
BEGIN;

CREATE TABLE cooking_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_cuisines text[] DEFAULT '{}' NOT NULL,
  available_equipment text[] DEFAULT '{}' NOT NULL,
  disliked_ingredients text[] DEFAULT '{}' NOT NULL,
  spice_tolerance int DEFAULT 3 CHECK (spice_tolerance BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS - cooking preferences can be public for social features
ALTER TABLE cooking_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cooking_preferences_select_all" ON cooking_preferences FOR SELECT USING (true);
CREATE POLICY "cooking_preferences_modify_own" ON cooking_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER cooking_preferences_set_updated_at
  BEFORE UPDATE ON cooking_preferences
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

COMMIT;
```

### Step 2: Storage Setup

#### Migration 4: `20250120000004_create_storage_buckets.sql`

```sql
-- Create storage buckets for avatars and recipe images
BEGIN;

-- Avatar storage (supports AvatarCard component)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 5242880) -- 5MB limit
ON CONFLICT (id) DO NOTHING;

-- Recipe images storage (existing functionality)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recipe-images', 'recipe-images', true, 10485760) -- 10MB limit
ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
CREATE POLICY "avatar_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatar_read_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatar_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatar_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Recipe images policies
CREATE POLICY "recipe_images_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recipe-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "recipe_images_read_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');

CREATE POLICY "recipe_images_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'recipe-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "recipe_images_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recipe-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMIT;
```

### Step 3: Username Management

#### Migration 5: `20250120000005_create_username_system.sql`

```sql
-- Create username management system (supports ProfileInfoForm username functionality)
BEGIN;

CREATE TABLE usernames (
  username citext PRIMARY KEY CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS - usernames are public for availability checking
ALTER TABLE usernames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usernames_select_all" ON usernames FOR SELECT USING (true);
CREATE POLICY "usernames_insert_own" ON usernames FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usernames_update_own" ON usernames FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usernames_delete_own" ON usernames FOR DELETE USING (auth.uid() = user_id);

-- Atomic username update function (supports useUsernameAvailability hook)
CREATE OR REPLACE FUNCTION update_username_atomic(
  p_user_id uuid,
  p_new_username citext
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: can only update own username';
  END IF;

  -- Update profiles table
  UPDATE profiles
  SET username = p_new_username, updated_at = now()
  WHERE id = p_user_id;

  -- Update or insert into usernames table
  INSERT INTO usernames (username, user_id)
  VALUES (p_new_username, p_user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET username = EXCLUDED.username;

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'username_already_taken';
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_username_atomic TO authenticated;

COMMIT;
```

---

## 🚀 Deployment

### Using Supabase CLI

```bash
# Initialize and link to your project
supabase init
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations in order
supabase db push

# Verify deployment
supabase db diff
```

### Manual Deployment

Run the SQL migrations in order through the Supabase dashboard SQL editor.

---

## ✅ Verification Checklist

### Database Structure

- [ ] `profiles` table exists with all columns
- [ ] `user_safety` table exists
- [ ] `cooking_preferences` table exists
- [ ] `usernames` table exists
- [ ] Storage buckets created (`avatars`, `recipe-images`)

### Security Policies

- [ ] RLS enabled on all tables
- [ ] Users can only modify their own data
- [ ] Public read access where appropriate
- [ ] Storage policies restrict file access properly

### Functionality Tests

- [ ] User can sign up and profile is created
- [ ] Profile preferences can be saved and loaded
- [ ] Safety data can be saved and loaded
- [ ] Cooking preferences can be saved and loaded
- [ ] Username availability checking works
- [ ] Avatar upload works

---

## 🎯 Component Mapping

This database setup directly supports these profile components:

**Basic Components:**

- `AvatarCard` → `profiles.avatar_url` + `avatars` storage bucket
- `BioCard` → `profiles.bio`
- `ProfileInfoForm` → `profiles` table + `usernames` table + `update_username_atomic()`

**Safety Components:**

- `AllergiesField` → `user_safety.allergies`
- `DietaryRestrictionsField` → `user_safety.dietary_restrictions`
- `MedicalConditionsField` → `user_safety.medical_conditions`

**Cooking Components:**

- `PreferredCuisinesField` → `cooking_preferences.preferred_cuisines`
- `EquipmentField` → `cooking_preferences.available_equipment`
- `SpiceToleranceField` → `cooking_preferences.spice_tolerance`
- `DislikedIngredientsField` → `cooking_preferences.disliked_ingredients`

**Account Components:**

- `EmailCard` → Built-in Supabase auth
- `PasswordCard` → Built-in Supabase auth

---

## 🔄 Next Steps

After Phase 1 completion:

1. Test all profile components with real database
2. Validate security policies
3. Move to Phase 2: Recipe Media Enhancement

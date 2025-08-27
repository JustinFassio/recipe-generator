# Core Database Schema Reference

**Last Updated**: August 26, 2024  
**Purpose**: Quick reference for all database tables, fields, and options to prevent future migration issues

---

## 📋 **Complete Database Schema**

### **1. `profiles` Table**

**Purpose**: User profiles with basic preferences and information

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username citext UNIQUE CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
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
```

**Field Options:**

- `units`: 'metric', 'imperial'
- `skill_level`: 'beginner', 'intermediate', 'advanced'
- `time_per_meal`: 10-120 minutes
- `language`: Default 'en'

---

### **2. `user_safety` Table**

**Purpose**: Health and dietary safety information

```sql
CREATE TABLE user_safety (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  allergies text[] DEFAULT '{}' NOT NULL,
  dietary_restrictions text[] DEFAULT '{}' NOT NULL,
  medical_conditions text[] DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Field Options:**

**`allergies` (text[]):**

- 'Peanuts'
- 'Tree Nuts'
- 'Milk'
- 'Eggs'
- 'Fish'
- 'Shellfish'
- 'Soy'
- 'Wheat'
- 'Sesame'
- 'Sulfites'
- Custom values allowed

**`dietary_restrictions` (text[]):**

- 'Vegetarian'
- 'Vegan'
- 'Pescatarian'
- 'Keto'
- 'Paleo'
- 'Low Carb'
- 'Low Fat'
- 'Low Sodium'
- 'Gluten-Free'
- 'Dairy-Free'
- 'Halal'
- 'Kosher'
- Custom values allowed

**`medical_conditions` (text[]):**

- 'Diabetes'
- 'High Blood Pressure'
- 'Heart Disease'
- 'Kidney Disease'
- 'Liver Disease'
- 'Celiac Disease'
- 'IBS'
- 'GERD'
- Custom values allowed

---

### **3. `cooking_preferences` Table**

**Purpose**: User cooking preferences and equipment

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
```

**Field Options:**

**`preferred_cuisines` (text[]):**

- 'American'
- 'Italian'
- 'Mexican'
- 'Chinese'
- 'Japanese'
- 'Indian'
- 'Thai'
- 'French'
- 'Mediterranean'
- 'Greek'
- 'Korean'
- 'Vietnamese'
- 'Spanish'
- 'Middle Eastern'
- 'German'
- Custom values allowed

**`available_equipment` (text[]):**

- 'Oven'
- 'Stovetop'
- 'Microwave'
- 'Air Fryer'
- 'Slow Cooker'
- 'Pressure Cooker'
- 'Rice Cooker'
- 'Blender'
- 'Food Processor'
- 'Stand Mixer'
- 'Grill'
- 'Cast Iron Pan'
- 'Non-stick Pan'
- 'Wok'
- 'Dutch Oven'
- Custom values allowed

**`disliked_ingredients` (text[]):**

- Custom input only (no predefined options)

**`spice_tolerance` (int):**

- Range: 1-5
- Default: 3
- 1 = Very mild
- 5 = Very hot

---

### **4. `usernames` Table**

**Purpose**: Username management and availability tracking

```sql
CREATE TABLE usernames (
  username citext PRIMARY KEY CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

**Field Options:**

- `username`: 3-24 characters, lowercase letters, numbers, underscores only
- `user_id`: Unique reference to profiles table

---

### **5. `recipes` Table**

**Purpose**: Recipe storage and management

```sql
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
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Field Options:**

- `ingredients`: Custom text array
- `is_public`: true/false
- `image_url`: Optional image URL
- `video_url`: Optional video URL

---

## 🔒 **Security Policies (RLS)**

### **Profiles Table**

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### **User Safety Table**

```sql
ALTER TABLE user_safety ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_safety_own_data" ON user_safety FOR ALL USING (auth.uid() = user_id);
```

### **Cooking Preferences Table**

```sql
ALTER TABLE cooking_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cooking_preferences_select_all" ON cooking_preferences FOR SELECT USING (true);
CREATE POLICY "cooking_preferences_modify_own" ON cooking_preferences FOR ALL USING (auth.uid() = user_id);
```

### **Usernames Table**

```sql
ALTER TABLE usernames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usernames_select_all" ON usernames FOR SELECT USING (true);
CREATE POLICY "usernames_insert_own" ON usernames FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usernames_update_own" ON usernames FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usernames_delete_own" ON usernames FOR DELETE USING (auth.uid() = user_id);
```

### **Recipes Table**

```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes_select_public" ON recipes FOR SELECT USING (is_public = true);
CREATE POLICY "recipes_select_own" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recipes_insert_own" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes_update_own" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recipes_delete_own" ON recipes FOR DELETE USING (auth.uid() = user_id);
```

---

## 🗄️ **Storage Buckets**

### **Avatars Bucket**

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 5242880); -- 5MB limit
```

### **Recipe Images Bucket**

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recipe-images', 'recipe-images', true, 10485760); -- 10MB limit
```

### **Recipe Videos Bucket**

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recipe-videos', 'recipe-videos', true, 104857600); -- 100MB limit
```

---

## 📊 **Indexes for Performance**

```sql
-- Username performance
CREATE UNIQUE INDEX CONCURRENTLY idx_profiles_username_lower
ON profiles (LOWER(username))
WHERE username IS NOT NULL;

-- Array-based queries for user preferences
CREATE INDEX CONCURRENTLY idx_user_safety_allergies
ON user_safety USING GIN (allergies);

CREATE INDEX CONCURRENTLY idx_user_safety_dietary_restrictions
ON user_safety USING GIN (dietary_restrictions);

CREATE INDEX CONCURRENTLY idx_cooking_preferences_cuisines
ON cooking_preferences USING GIN (preferred_cuisines);

CREATE INDEX CONCURRENTLY idx_cooking_preferences_equipment
ON cooking_preferences USING GIN (available_equipment);

CREATE INDEX CONCURRENTLY idx_cooking_preferences_disliked
ON cooking_preferences USING GIN (disliked_ingredients);

-- Profile lookup optimization
CREATE INDEX CONCURRENTLY idx_profiles_region
ON profiles (region)
WHERE region IS NOT NULL;

-- Recipe queries
CREATE INDEX CONCURRENTLY idx_recipes_user_public
ON recipes (user_id, is_public, created_at DESC);

CREATE INDEX CONCURRENTLY idx_recipes_public_recent
ON recipes (created_at DESC)
WHERE is_public = true;
```

---

## 🔧 **Database Functions**

### **Username Availability Check**

```sql
CREATE OR REPLACE FUNCTION is_username_available(p_username citext)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS(
    SELECT 1 FROM usernames
    WHERE username = p_username
  );
END;
$$;
```

### **Atomic Username Update**

```sql
CREATE OR REPLACE FUNCTION update_username_atomic(
  p_user_id uuid,
  p_new_username citext
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  username_exists boolean;
  result json;
BEGIN
  -- Security check - ensure user can only update their own username
  IF auth.uid() != p_user_id THEN
    result := json_build_object('success', false, 'error', 'unauthorized');
    RETURN result;
  END IF;

  -- Check if username is already taken by another user
  SELECT EXISTS(
    SELECT 1 FROM usernames
    WHERE username = p_new_username AND user_id != p_user_id
  ) INTO username_exists;

  IF username_exists THEN
    result := json_build_object('success', false, 'error', 'username_already_taken');
    RETURN result;
  END IF;

  -- Update the user's username in profiles table
  UPDATE profiles
  SET username = p_new_username, updated_at = NOW()
  WHERE id = p_user_id;

  -- Update or insert into usernames table
  INSERT INTO usernames (username, user_id)
  VALUES (p_new_username, p_user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET username = EXCLUDED.username, updated_at = NOW();

  IF FOUND THEN
    result := json_build_object('success', true);
  ELSE
    result := json_build_object('success', false, 'error', 'user_not_found');
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'error', SQLERRM);
    RETURN result;
END;
$$;
```

### **Complete User Profile Function**

```sql
CREATE OR REPLACE FUNCTION get_complete_user_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}';
  profile_data jsonb;
  safety_data jsonb;
  cooking_data jsonb;
BEGIN
  -- Security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: can only access own profile data';
  END IF;

  -- Get profile data
  SELECT to_jsonb(p) INTO profile_data
  FROM profiles p
  WHERE p.id = p_user_id;

  -- Get safety data
  SELECT to_jsonb(us) INTO safety_data
  FROM user_safety us
  WHERE us.user_id = p_user_id;

  -- Get cooking preferences
  SELECT to_jsonb(cp) INTO cooking_data
  FROM cooking_preferences cp
  WHERE cp.user_id = p_user_id;

  -- Combine results
  result := jsonb_build_object(
    'profile', profile_data,
    'safety', safety_data,
    'cooking', cooking_data
  );

  RETURN result;
END;
$$;
```

---

## 🚨 **Common Issues & Fixes**

### **Issue: "table doesn't exist"**

**Solution**: Check if migration was applied. Run:

```bash
npx supabase db push
```

### **Issue: "multiple SQL commands"**

**Solution**: Split migration into separate files with one command each.

### **Issue: "column doesn't exist"**

**Solution**: Check this schema reference for correct column names and types.

### **Issue: "permission denied"**

**Solution**: Ensure RLS policies are properly configured and user is authenticated.

---

## ✅ **Verification Commands**

### **Check Table Structure**

```sql
-- List all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check specific table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

### **Check RLS Policies**

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### **Check Functions**

```sql
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

### **Check Indexes**

```sql
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 📝 **Migration Best Practices**

1. **One SQL command per migration file**
2. **Use `IF NOT EXISTS` for safety**
3. **Test migrations locally first**
4. **Backup before applying to production**
5. **Use `CONCURRENTLY` for indexes on large tables**
6. **Always include RLS policies**
7. **Add appropriate constraints and validation**

---

**This file should be updated whenever the database schema changes.**

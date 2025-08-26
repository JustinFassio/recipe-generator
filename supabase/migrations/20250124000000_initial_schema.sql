-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Create profiles table
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
  skill_level text DEFAULT 'beginner' NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert', 'chef')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create recipes table
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ingredients text[] NOT NULL DEFAULT '{}',
  instructions text NOT NULL,
  notes text,
  image_url text,
  categories text[] DEFAULT '{}',
  cooking_time text CHECK (cooking_time IN ('quick', 'medium', 'long')),
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Recipes policies
CREATE POLICY "recipes_select_public" ON recipes FOR SELECT USING (is_public = true);
CREATE POLICY "recipes_select_own" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recipes_insert_own" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes_update_own" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recipes_delete_own" ON recipes FOR DELETE USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_recipes_categories_gin ON recipes USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_recipes_cooking_time ON recipes(cooking_time);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);

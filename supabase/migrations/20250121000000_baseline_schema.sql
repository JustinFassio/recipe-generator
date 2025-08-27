-- Baseline Schema Migration
-- This migration creates the complete database schema for Recipe Generator
-- Based on docs/supabase/CORE_DATABASE_SCHEMA.md

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

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
  skill_level text DEFAULT 'beginner' NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create user_safety table
CREATE TABLE user_safety (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  allergies text[] DEFAULT '{}' NOT NULL,
  dietary_restrictions text[] DEFAULT '{}' NOT NULL,
  medical_conditions text[] DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create cooking_preferences table
CREATE TABLE cooking_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_cuisines text[] DEFAULT '{}' NOT NULL,
  available_equipment text[] DEFAULT '{}' NOT NULL,
  disliked_ingredients text[] DEFAULT '{}' NOT NULL,
  spice_tolerance int DEFAULT 3 CHECK (spice_tolerance BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create usernames table
CREATE TABLE usernames (
  username citext PRIMARY KEY CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create recipes table
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

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 5242880) -- 5MB limit
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recipe-images', 'recipe-images', true, 10485760) -- 10MB limit
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recipe-videos', 'recipe-videos', true, 104857600) -- 100MB limit
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_safety ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE usernames ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- User safety policies
CREATE POLICY "user_safety_own_data" ON user_safety FOR ALL USING (auth.uid() = user_id);

-- Cooking preferences policies
CREATE POLICY "cooking_preferences_select_all" ON cooking_preferences FOR SELECT USING (true);
CREATE POLICY "cooking_preferences_modify_own" ON cooking_preferences FOR ALL USING (auth.uid() = user_id);

-- Usernames policies
CREATE POLICY "usernames_select_all" ON usernames FOR SELECT USING (true);
CREATE POLICY "usernames_insert_own" ON usernames FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usernames_update_own" ON usernames FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usernames_delete_own" ON usernames FOR DELETE USING (auth.uid() = user_id);

-- Recipes policies
CREATE POLICY "recipes_select_public" ON recipes FOR SELECT USING (is_public = true);
CREATE POLICY "recipes_select_own" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recipes_insert_own" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes_update_own" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recipes_delete_own" ON recipes FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for avatars
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

-- Storage policies for recipe images
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

-- Storage policies for recipe videos
CREATE POLICY "recipe_videos_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recipe-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "recipe_videos_read_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-videos');

CREATE POLICY "recipe_videos_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'recipe-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "recipe_videos_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recipe-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes for performance
CREATE UNIQUE INDEX idx_profiles_username_lower
ON profiles (LOWER(username))
WHERE username IS NOT NULL;

CREATE INDEX idx_user_safety_allergies
ON user_safety USING GIN (allergies);

CREATE INDEX idx_user_safety_dietary_restrictions
ON user_safety USING GIN (dietary_restrictions);

CREATE INDEX idx_cooking_preferences_cuisines
ON cooking_preferences USING GIN (preferred_cuisines);

CREATE INDEX idx_cooking_preferences_equipment
ON cooking_preferences USING GIN (available_equipment);

CREATE INDEX idx_cooking_preferences_disliked
ON cooking_preferences USING GIN (disliked_ingredients);

CREATE INDEX idx_profiles_region
ON profiles (region)
WHERE region IS NOT NULL;

CREATE INDEX idx_recipes_user_public
ON recipes (user_id, is_public, created_at DESC);

CREATE INDEX idx_recipes_public_recent
ON recipes (created_at DESC)
WHERE is_public = true;

-- Create auto-update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER user_safety_set_updated_at
  BEFORE UPDATE ON user_safety
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER cooking_preferences_set_updated_at
  BEFORE UPDATE ON cooking_preferences
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER recipes_set_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

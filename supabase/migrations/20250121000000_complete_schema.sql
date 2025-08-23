-- Complete Recipe Generator Database Schema
-- This creates ALL required tables for the application to work properly

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Create profiles table (user profiles with preferences)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username citext UNIQUE CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  full_name text CHECK (length(trim(full_name)) BETWEEN 1 AND 80),
  avatar_url text,
  bio text CHECK (length(bio) <= 500),
  
  -- Profile preferences (Phase 1A)
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
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  ingredients jsonb NOT NULL CHECK (jsonb_array_length(ingredients) > 0),
  instructions text NOT NULL CHECK (length(trim(instructions)) > 0),
  notes text,
  image_url text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create user_safety table (Phase 1B)
CREATE TABLE user_safety (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  allergies text[] DEFAULT '{}' NOT NULL,
  dietary_restrictions text[] DEFAULT '{}' NOT NULL,
  medical_conditions text[] DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create cooking_preferences table (Phase 1C)
CREATE TABLE cooking_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_cuisines text[] DEFAULT '{}' NOT NULL,
  available_equipment text[] DEFAULT '{}' NOT NULL,
  disliked_ingredients text[] DEFAULT '{}' NOT NULL,
  spice_tolerance int CHECK (spice_tolerance IS NULL OR spice_tolerance BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create usernames table for username management
CREATE TABLE usernames (
  username citext PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();

CREATE TRIGGER set_updated_at_recipes
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();

CREATE TRIGGER set_updated_at_user_safety
  BEFORE UPDATE ON user_safety
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();

CREATE TRIGGER set_updated_at_cooking_preferences
  BEFORE UPDATE ON cooking_preferences
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_safety ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE usernames ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_read_public" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Recipes policies
CREATE POLICY "recipes_read_public" ON recipes
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "recipes_insert_own" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recipes_update_own" ON recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "recipes_delete_own" ON recipes
  FOR DELETE USING (auth.uid() = user_id);

-- User safety policies (completely private)
CREATE POLICY "user_safety_own_data" ON user_safety
  FOR ALL USING (auth.uid() = user_id);

-- Cooking preferences policies (public read, private write)
CREATE POLICY "cooking_preferences_read_public" ON cooking_preferences
  FOR SELECT USING (true);

CREATE POLICY "cooking_preferences_insert_own" ON cooking_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cooking_preferences_update_own" ON cooking_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cooking_preferences_delete_own" ON cooking_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Usernames policies
CREATE POLICY "usernames_read_public" ON usernames
  FOR SELECT USING (true);

CREATE POLICY "usernames_insert_own" ON usernames
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usernames_delete_own" ON usernames
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('recipe-images', 'recipe-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

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

COMMIT;


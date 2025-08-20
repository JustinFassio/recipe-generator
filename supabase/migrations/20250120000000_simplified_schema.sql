/*
# Simplified Database Schema

This migration creates a clean, straightforward database schema for the Recipe Generator app.
It consolidates essential tables and policies into a simple, maintainable structure.

## Tables:
1. `profiles` - User profile data
2. `recipes` - Recipe data with public/private visibility
3. `usernames` - Username registry for atomic operations
4. `account_events` - Audit trail (optional)

## Features:
- Simple RLS policies
- Public/private recipe visibility
- Username management
- Clean data relationships
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- 1) PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username citext UNIQUE CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  full_name text CHECK (length(trim(full_name)) BETWEEN 1 AND 80),
  avatar_url text,
  bio text,
  -- Basic preferences
  region text,
  language text,
  units text,
  time_per_meal integer,
  skill_level text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles (created_at);

-- Auto-update timestamp
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- 2) RECIPES TABLE
CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  ingredients text[] NOT NULL,
  instructions text NOT NULL,
  notes text,
  image_url text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS recipes_user_id_idx ON public.recipes (user_id);
CREATE INDEX IF NOT EXISTS recipes_is_public_created_idx ON public.recipes (is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS recipes_created_at_idx ON public.recipes (created_at DESC);

-- Auto-update timestamp
DROP TRIGGER IF EXISTS recipes_set_updated_at ON public.recipes;
CREATE TRIGGER recipes_set_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- 3) USERNAMES TABLE (for atomic operations)
CREATE TABLE IF NOT EXISTS public.usernames (
  username citext PRIMARY KEY CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 4) RESERVED USERNAMES
CREATE TABLE IF NOT EXISTS public.reserved_usernames (
  username citext PRIMARY KEY,
  reason text DEFAULT 'system reserved',
  created_at timestamptz DEFAULT now()
);

-- Insert common reserved usernames
INSERT INTO public.reserved_usernames (username, reason) VALUES
  ('admin', 'system reserved'),
  ('support', 'system reserved'),
  ('api', 'system reserved'),
  ('www', 'system reserved'),
  ('mail', 'system reserved'),
  ('root', 'system reserved'),
  ('system', 'system reserved'),
  ('bot', 'system reserved'),
  ('null', 'system reserved'),
  ('undefined', 'system reserved'),
  ('anonymous', 'system reserved'),
  ('guest', 'system reserved'),
  ('user', 'system reserved'),
  ('users', 'system reserved'),
  ('profile', 'system reserved'),
  ('profiles', 'system reserved'),
  ('account', 'system reserved'),
  ('accounts', 'system reserved'),
  ('recipe', 'system reserved'),
  ('recipes', 'system reserved')
ON CONFLICT (username) DO NOTHING;

-- 5) ROW LEVEL SECURITY POLICIES

-- PROFILES POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "profiles_read_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- Anyone can read profiles (needed for public recipe authors)
CREATE POLICY "profiles_read_public" ON public.profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RECIPES POLICIES
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "recipes_read_own" ON public.recipes;
DROP POLICY IF EXISTS "recipes_read_public" ON public.recipes;
DROP POLICY IF EXISTS "recipes_read_public_auth" ON public.recipes;
DROP POLICY IF EXISTS "recipes_insert_own" ON public.recipes;
DROP POLICY IF EXISTS "recipes_update_own" ON public.recipes;
DROP POLICY IF EXISTS "recipes_delete_own" ON public.recipes;

-- Users can read their own recipes
CREATE POLICY "recipes_read_own" ON public.recipes
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can read public recipes
CREATE POLICY "recipes_read_public" ON public.recipes
  FOR SELECT USING (is_public = true);

-- Users can create their own recipes
CREATE POLICY "recipes_insert_own" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own recipes
CREATE POLICY "recipes_update_own" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own recipes
CREATE POLICY "recipes_delete_own" ON public.recipes
  FOR DELETE USING (auth.uid() = user_id);

-- USERNAMES POLICIES
ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "usernames_read_public" ON public.usernames;
DROP POLICY IF EXISTS "usernames_manage_own" ON public.usernames;

-- Anyone can read usernames (to check availability)
CREATE POLICY "usernames_read_public" ON public.usernames
  FOR SELECT USING (true);

-- Users can manage their own usernames
CREATE POLICY "usernames_manage_own" ON public.usernames
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RESERVED USERNAMES POLICIES
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "reserved_usernames_read_public" ON public.reserved_usernames;

-- Anyone can read reserved usernames
CREATE POLICY "reserved_usernames_read_public" ON public.reserved_usernames
  FOR SELECT USING (true);

-- 6) AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7) HELPER FUNCTIONS

-- Check if username is available
CREATE OR REPLACE FUNCTION public.is_username_available(check_username text)
RETURNS boolean AS $$
BEGIN
  -- Check if username is reserved
  IF EXISTS (SELECT 1 FROM public.reserved_usernames WHERE username = lower(check_username)) THEN
    RETURN false;
  END IF;
  
  -- Check if username is already taken
  IF EXISTS (SELECT 1 FROM public.usernames WHERE username = lower(check_username)) THEN
    RETURN false;
  END IF;
  
  -- Check basic format requirements
  IF NOT (check_username ~ '^[a-z0-9_]{3,24}$') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic username update function
CREATE OR REPLACE FUNCTION public.update_username_atomic(p_user_id uuid, p_new_username text)
RETURNS void AS $$
BEGIN
  -- Check if username is available
  IF NOT public.is_username_available(p_new_username) THEN
    RAISE EXCEPTION 'username_already_taken';
  END IF;
  
  -- Update profile username
  UPDATE public.profiles 
  SET username = p_new_username 
  WHERE id = p_user_id;
  
  -- Update usernames table
  INSERT INTO public.usernames (username, user_id)
  VALUES (p_new_username, p_user_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET username = p_new_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) STORAGE BUCKETS

-- Recipe images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Avatar bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES

-- Recipe images: anyone can read, owner can manage
CREATE POLICY "recipe_images_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');

CREATE POLICY "recipe_images_manage_own" ON storage.objects
  FOR ALL USING (
    bucket_id = 'recipe-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  ) WITH CHECK (
    bucket_id = 'recipe-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatars: anyone can read, owner can manage
CREATE POLICY "avatars_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_manage_own" ON storage.objects
  FOR ALL USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  ) WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

/*
# User Account System Migration

This migration creates the foundation for user accounts with profiles and usernames,
designed to be future-proof for the "Friend Bubbles" sharing feature.

## Tables Created:
1. `profiles` - User profile data (public-readable for mentions/bubbles)
2. `usernames` - Username registry for atomic reservation and case-insensitive uniqueness

## Features:
- Auto-profile creation on user signup
- Case-insensitive username uniqueness
- RLS policies for secure data access
- Future-ready for sharing features
*/

-- Enable citext extension for case-insensitive uniqueness
CREATE EXTENSION IF NOT EXISTS citext;

-- Enable moddatetime extension for automatic updated_at triggers
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- 1) PROFILES TABLE
-- One row per auth.users.id with public-readable safe fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username citext UNIQUE CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  full_name text CHECK (length(trim(full_name)) BETWEEN 1 AND 80),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);

-- Keep updated_at fresh automatically
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- 2) USERNAMES TABLE
-- Optional helper for atomic username reservation and quick lookups
CREATE TABLE IF NOT EXISTS public.usernames (
  username citext PRIMARY KEY CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 3) RLS POLICIES
-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Read: anyone can read safe profile fields (needed for mentions, bubbles, etc.)
CREATE POLICY "profiles_read_safe" ON public.profiles
  FOR SELECT USING (true);

-- Update: only the owner can update their profile
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Insert: only for yourself (enforced by trigger, but good to be explicit)
CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Delete: only owner (though cascade should handle this)
CREATE POLICY "profiles_self_delete" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- USERNAMES POLICIES
-- Read: public (to check availability)
CREATE POLICY "usernames_read_public" ON public.usernames
  FOR SELECT USING (true);

-- Write: owner only (for all operations)
CREATE POLICY "usernames_write_self" ON public.usernames
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4) AUTO-CREATE PROFILE ON SIGNUP
-- This trigger automatically creates a profile when a new user signs up
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

-- 5) RESERVED USERNAMES
-- Create a table to store reserved usernames that users cannot claim
CREATE TABLE IF NOT EXISTS public.reserved_usernames (
  username citext PRIMARY KEY,
  reason text DEFAULT 'system reserved',
  created_at timestamptz DEFAULT now()
);

-- Insert common reserved usernames
INSERT INTO public.reserved_usernames (username, reason) VALUES
  ('admin', 'system reserved'),
  ('administrator', 'system reserved'),
  ('support', 'system reserved'),
  ('help', 'system reserved'),
  ('api', 'system reserved'),
  ('www', 'system reserved'),
  ('mail', 'system reserved'),
  ('email', 'system reserved'),
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
  ('recipes', 'system reserved'),
  ('bubble', 'system reserved'),
  ('bubbles', 'system reserved')
ON CONFLICT (username) DO NOTHING;

-- Enable RLS on reserved usernames (read-only for everyone)
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reserved_usernames_read_only" ON public.reserved_usernames
  FOR SELECT USING (true);

-- 6) AVATAR STORAGE BUCKET
-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- AVATAR STORAGE POLICIES
-- Anyone can read avatars (they're public)
CREATE POLICY "avatars_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Only the owner can manage their avatar (stored under their user_id folder)
CREATE POLICY "avatars_manage_own" ON storage.objects
  FOR ALL 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 7) HELPER FUNCTIONS
-- Function to check if a username is available (not taken or reserved)
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

-- 8) UPDATE RECIPES TABLE (if it exists)
-- Add relationship to profiles for better data integrity
-- (This preserves existing recipes but adds the profile relationship)
DO $$
BEGIN
  -- Check if recipes table exists before modifying it
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recipes') THEN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'recipes_user_profile_fk'
    ) THEN
      ALTER TABLE recipes 
      ADD CONSTRAINT recipes_user_profile_fk 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Create index for faster user recipe lookups
    CREATE INDEX IF NOT EXISTS recipes_user_id_idx ON recipes (user_id);
  END IF;
END $$;

-- 9) ACCOUNT EVENTS TABLE (for audit trail)
-- Lightweight audit log for account-related events
CREATE TABLE IF NOT EXISTS public.account_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'profile_created',
    'username_claimed',
    'username_changed',
    'profile_updated',
    'avatar_updated',
    'email_changed',
    'password_changed'
  )),
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Index for efficient user event queries
CREATE INDEX IF NOT EXISTS account_events_user_id_created_at_idx 
ON public.account_events (user_id, created_at DESC);

-- Index for event type queries
CREATE INDEX IF NOT EXISTS account_events_type_created_at_idx 
ON public.account_events (event_type, created_at DESC);

-- Enable RLS on account events
ALTER TABLE public.account_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own events
CREATE POLICY "account_events_self_read" ON public.account_events
  FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert events (will be done via Edge Functions)
-- No insert policy here - will be handled by service role

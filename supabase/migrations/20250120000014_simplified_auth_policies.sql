/*
# Simplified Auth Policies for Pre-MVP

This migration simplifies the Row Level Security policies to ensure
stable authentication and prevent infinite loops during development.

## Changes:
1. Simplified profiles policies
2. Simplified recipes policies  
3. Removed complex username policies
4. Ensured basic CRUD operations work for authenticated users
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "profiles_read_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

DROP POLICY IF EXISTS "recipes_read_own" ON public.recipes;
DROP POLICY IF EXISTS "recipes_read_public" ON public.recipes;
DROP POLICY IF EXISTS "recipes_read_public_auth" ON public.recipes;
DROP POLICY IF EXISTS "recipes_insert_own" ON public.recipes;
DROP POLICY IF EXISTS "recipes_update_own" ON public.recipes;
DROP POLICY IF EXISTS "recipes_delete_own" ON public.recipes;

DROP POLICY IF EXISTS "usernames_read_public" ON public.usernames;
DROP POLICY IF EXISTS "usernames_manage_own" ON public.usernames;

DROP POLICY IF EXISTS "reserved_usernames_read_public" ON public.reserved_usernames;

-- SIMPLIFIED PROFILES POLICIES
-- Users can read all profiles (needed for public recipe authors)
CREATE POLICY "profiles_read_all" ON public.profiles
  FOR SELECT USING (true);

-- Users can manage their own profile
CREATE POLICY "profiles_manage_own" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- SIMPLIFIED RECIPES POLICIES
-- Users can read their own recipes
CREATE POLICY "recipes_read_own" ON public.recipes
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can read public recipes
CREATE POLICY "recipes_read_public" ON public.recipes
  FOR SELECT USING (is_public = true);

-- Users can manage their own recipes
CREATE POLICY "recipes_manage_own" ON public.recipes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SIMPLIFIED USERNAMES POLICIES
-- Anyone can read usernames (to check availability)
CREATE POLICY "usernames_read_all" ON public.usernames
  FOR SELECT USING (true);

-- Users can manage their own usernames
CREATE POLICY "usernames_manage_own" ON public.usernames
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SIMPLIFIED RESERVED USERNAMES POLICIES
-- Anyone can read reserved usernames
CREATE POLICY "reserved_usernames_read_all" ON public.reserved_usernames
  FOR SELECT USING (true);

-- Log the simplification
DO $$
BEGIN
  RAISE NOTICE 'Simplified RLS policies for pre-MVP stability';
END $$;

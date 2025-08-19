/*
# Recipe Sharing Controls

This migration updates RLS policies to allow users to control recipe sharing
and enables the Explore feed to show all public recipes from all users.
*/

-- Drop existing policies that restrict public recipe viewing
DROP POLICY IF EXISTS "Anyone can view public recipes" ON public.recipes;
DROP POLICY IF EXISTS "Anonymous users can view public recipes" ON public.recipes;

-- Create new policy that allows all users (including anonymous) to view public recipes
CREATE POLICY "Anyone can view public recipes"
  ON public.recipes
  FOR SELECT
  TO public
  USING (is_public = true);

-- Ensure authenticated users can view their own recipes (private and public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND policyname = 'Users can view their own recipes'
  ) THEN
    CREATE POLICY "Users can view their own recipes"
      ON public.recipes
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure users can update their own recipes (including sharing status)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND policyname = 'Users can update their own recipes'
  ) THEN
    CREATE POLICY "Users can update their own recipes"
      ON public.recipes
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure users can create their own recipes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND policyname = 'Users can create their own recipes'
  ) THEN
    CREATE POLICY "Users can create their own recipes"
      ON public.recipes
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure users can delete their own recipes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND policyname = 'Users can delete their own recipes'
  ) THEN
    CREATE POLICY "Users can delete their own recipes"
      ON public.recipes
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

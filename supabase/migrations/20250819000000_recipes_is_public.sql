/*
# Recipes Visibility: Explicit is_public Model

This migration introduces `is_public` to recipes and updates RLS policies to make
recipes private-by-default, with explicit public visibility via `is_public = true`.
*/

-- 1) Schema change: add is_public flag
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- 2) RLS policies
-- Enable RLS (should already be enabled, but safe to ensure)
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing public image-based policy if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND policyname = 'Anyone can view recipes with images'
  ) THEN
    DROP POLICY "Anyone can view recipes with images" ON public.recipes;
  END IF;
END $$;

-- Ensure owner read policy exists
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

-- Public read policy via explicit flag (anon only, not all public)
CREATE POLICY IF NOT EXISTS "Anonymous users can view public recipes"
  ON public.recipes
  FOR SELECT
  TO anon
  USING (is_public = true);

-- Keep existing owner-only write policies if not present
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

-- 3) Optional: index to support public feed queries
CREATE INDEX IF NOT EXISTS recipes_is_public_created_idx
  ON public.recipes (is_public, created_at DESC);



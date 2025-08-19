/*
# Fix RLS Policies for Recipe Creation

This migration fixes the RLS policies to allow authenticated users to create recipes
by setting the user_id to their own ID.
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create their own recipes" ON public.recipes;

-- Create a new INSERT policy that allows authenticated users to create recipes
CREATE POLICY "Users can create their own recipes"
  ON public.recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also ensure the UPDATE policy allows users to update their own recipes
DROP POLICY IF EXISTS "Users can update their own recipes" ON public.recipes;

CREATE POLICY "Users can update their own recipes"
  ON public.recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure the DELETE policy allows users to delete their own recipes
DROP POLICY IF EXISTS "Users can delete their own recipes" ON public.recipes;

CREATE POLICY "Users can delete their own recipes"
  ON public.recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix RLS policies for recipe_content_versions to work with authenticated users
-- This ensures version data is accessible when users are properly authenticated

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view recipe versions" ON recipe_content_versions;
DROP POLICY IF EXISTS "Users can create versions of own recipes" ON recipe_content_versions;
DROP POLICY IF EXISTS "Users can update own versions" ON recipe_content_versions;
DROP POLICY IF EXISTS "Users can delete own versions" ON recipe_content_versions;

-- Create comprehensive RLS policies that work with the clean schema

-- Allow users to view versions of recipes they own or that are public
CREATE POLICY "Users can view recipe versions" ON recipe_content_versions
  FOR SELECT USING (
    -- User created this version
    created_by = auth.uid() 
    OR 
    -- User owns the recipe this version belongs to
    recipe_id IN (
      SELECT id FROM recipes WHERE user_id = auth.uid()
    )
    OR
    -- Recipe is public (anyone can view public recipe versions)
    recipe_id IN (
      SELECT id FROM recipes WHERE is_public = true
    )
  );

-- Allow users to create versions of recipes they own
CREATE POLICY "Users can create versions of own recipes" ON recipe_content_versions
  FOR INSERT WITH CHECK (
    created_by = auth.uid() 
    AND 
    recipe_id IN (
      SELECT id FROM recipes WHERE user_id = auth.uid()
    )
  );

-- Allow users to update their own versions
CREATE POLICY "Users can update own versions" ON recipe_content_versions
  FOR UPDATE USING (
    created_by = auth.uid()
  );

-- Allow users to delete their own versions
CREATE POLICY "Users can delete own versions" ON recipe_content_versions
  FOR DELETE USING (
    created_by = auth.uid()
  );

-- Ensure RLS is enabled
ALTER TABLE recipe_content_versions ENABLE ROW LEVEL SECURITY;

-- Add helpful comment
COMMENT ON TABLE recipe_content_versions IS 'Stores historical snapshots of recipe versions. RLS ensures users can only access versions of recipes they own or that are public.';

-- Add public policy for viewing recipes with images (for auth page showcase)
-- Run this in your Supabase SQL Editor

CREATE POLICY "Anyone can view recipes with images"
  ON recipes
  FOR SELECT
  TO public
  USING (image_url IS NOT NULL);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'recipes';

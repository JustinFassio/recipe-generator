-- Fix RLS policies for recipe_views and recipe_ratings tables
-- These policies were missing proper WITH CHECK clauses for INSERT operations

-- Fix recipe_views INSERT policy
DROP POLICY IF EXISTS "Users can insert their own views" ON recipe_views;
CREATE POLICY "Users can insert their own views" ON recipe_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix recipe_ratings INSERT policy  
DROP POLICY IF EXISTS "Users can insert their own ratings" ON recipe_ratings;
CREATE POLICY "Users can insert their own ratings" ON recipe_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE recipe_views IS 'Tracks recipe views for analytics. RLS ensures users can only insert views for themselves.';
COMMENT ON TABLE recipe_ratings IS 'Stores recipe ratings and comments. RLS ensures users can only manage their own ratings.';

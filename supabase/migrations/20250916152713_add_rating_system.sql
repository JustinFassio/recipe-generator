-- Rating System Migration
-- Adds creator rating to recipes and creates community rating system

-- Add creator rating to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS creator_rating INTEGER CHECK (creator_rating >= 1 AND creator_rating <= 5);

-- Create community ratings table  
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, user_id) -- One rating per user per recipe
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON recipe_ratings(user_id);

-- Enable RLS on recipe_ratings table
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read all recipe ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON recipe_ratings;

-- RLS Policy: Users can read all ratings
CREATE POLICY "Users can read all recipe ratings" ON recipe_ratings
FOR SELECT USING (true);

-- RLS Policy: Users can insert their own ratings
CREATE POLICY "Users can insert their own ratings" ON recipe_ratings
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own ratings
CREATE POLICY "Users can update their own ratings" ON recipe_ratings
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings" ON recipe_ratings
FOR DELETE USING (auth.uid() = user_id);

-- Create a view for easy recipe rating aggregation
CREATE OR REPLACE VIEW recipe_rating_stats AS
SELECT 
  r.id as recipe_id,
  r.title,
  r.creator_rating,
  COUNT(rr.rating) as community_rating_count,
  AVG(rr.rating)::NUMERIC(3,2) as community_rating_average,
  r.is_public,
  r.created_at
FROM recipes r
LEFT JOIN recipe_ratings rr ON r.id = rr.recipe_id
GROUP BY r.id, r.title, r.creator_rating, r.is_public, r.created_at;


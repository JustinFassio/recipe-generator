-- Fix column name mismatch in recipe_views table
-- The old migration references 'viewed_date' but the actual column is 'viewed_at'

-- Drop the problematic index if it exists (it shouldn't, but just in case)
DROP INDEX IF EXISTS idx_recipe_views_viewed_date;

-- Create the correct index on the actual column name
CREATE INDEX IF NOT EXISTS idx_recipe_views_viewed_at ON recipe_views(viewed_at);

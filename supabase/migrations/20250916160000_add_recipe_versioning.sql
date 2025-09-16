-- Recipe Versioning System Migration
-- Adds versioning support with version-aware ratings and views

-- Add versioning columns to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS parent_recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_version BOOLEAN DEFAULT FALSE;

-- Recipe versions tracking table
CREATE TABLE IF NOT EXISTS recipe_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_name VARCHAR(100), -- e.g., "Added more spices", "Gluten-free version"
  changelog TEXT, -- What changed in this version
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(original_recipe_id, version_number)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_recipe_versions_original ON recipe_versions(original_recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_versions_version ON recipe_versions(version_recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_parent ON recipes(parent_recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_version_number ON recipes(version_number);

-- Update recipe_ratings to include version awareness
ALTER TABLE recipe_ratings ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_version ON recipe_ratings(recipe_id, version_number);

-- Recipe views with version tracking (only logged-in users)
CREATE TABLE IF NOT EXISTS recipe_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER DEFAULT 1,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Only logged in users
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  UNIQUE(recipe_id, version_number, user_id, DATE(viewed_at))
);

-- Create indexes for recipe views
CREATE INDEX IF NOT EXISTS idx_recipe_views_recipe_version ON recipe_views(recipe_id, version_number);
CREATE INDEX IF NOT EXISTS idx_recipe_views_user ON recipe_views(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_date ON recipe_views(viewed_at);

-- Enable RLS on new tables
ALTER TABLE recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipe_versions
CREATE POLICY "Users can read all recipe versions" ON recipe_versions
FOR SELECT USING (true);

CREATE POLICY "Users can insert versions of their own recipes" ON recipe_versions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM recipes 
    WHERE recipes.id = recipe_versions.original_recipe_id 
    AND recipes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update versions of their own recipes" ON recipe_versions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM recipes 
    WHERE recipes.id = recipe_versions.original_recipe_id 
    AND recipes.user_id = auth.uid()
  )
);

-- RLS Policies for recipe_views
CREATE POLICY "Users can read all recipe views" ON recipe_views
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own views" ON recipe_views
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enhanced stats view with version awareness
CREATE OR REPLACE VIEW recipe_version_stats AS
SELECT 
  r.id as recipe_id,
  r.title,
  r.version_number,
  r.creator_rating,
  r.user_id as owner_id,
  COUNT(DISTINCT rr.id) as version_rating_count,
  AVG(rr.rating)::NUMERIC(3,2) as version_avg_rating,
  COUNT(DISTINCT rv.id) as version_view_count,
  COUNT(DISTINCT CASE WHEN rr.comment IS NOT NULL AND rr.comment != '' THEN rr.id END) as version_comment_count,
  r.is_public,
  r.created_at,
  r.updated_at,
  r.parent_recipe_id,
  r.is_version
FROM recipes r
LEFT JOIN recipe_ratings rr ON r.id = rr.recipe_id AND rr.version_number = r.version_number
LEFT JOIN recipe_views rv ON r.id = rv.recipe_id AND rv.version_number = r.version_number
WHERE r.is_public = true
GROUP BY r.id, r.title, r.version_number, r.creator_rating, r.user_id, r.is_public, r.created_at, r.updated_at, r.parent_recipe_id, r.is_version;

-- Aggregate stats across all versions of a recipe
CREATE OR REPLACE VIEW recipe_aggregate_stats AS
SELECT 
  COALESCE(r.parent_recipe_id, r.id) as original_recipe_id,
  r.title as original_title,
  r.user_id as owner_id,
  COUNT(DISTINCT CASE WHEN r2.id IS NOT NULL THEN r2.version_number ELSE r.version_number END) as total_versions,
  MAX(CASE WHEN r2.id IS NOT NULL THEN r2.version_number ELSE r.version_number END) as latest_version,
  COUNT(DISTINCT rr.id) as total_ratings,
  AVG(rr.rating)::NUMERIC(3,2) as aggregate_avg_rating,
  COUNT(DISTINCT rvw.id) as total_views,
  COUNT(DISTINCT CASE WHEN rr.comment IS NOT NULL AND rr.comment != '' THEN rr.id END) as total_comments,
  MAX(COALESCE(r2.updated_at, r.updated_at)) as last_updated,
  -- Latest version details
  (SELECT r3.title FROM recipes r3 WHERE r3.parent_recipe_id = COALESCE(r.parent_recipe_id, r.id) 
   ORDER BY r3.version_number DESC LIMIT 1) as latest_version_title,
  (SELECT r3.creator_rating FROM recipes r3 WHERE r3.parent_recipe_id = COALESCE(r.parent_recipe_id, r.id) 
   ORDER BY r3.version_number DESC LIMIT 1) as latest_creator_rating
FROM recipes r
LEFT JOIN recipes r2 ON r2.parent_recipe_id = COALESCE(r.parent_recipe_id, r.id) AND r2.is_version = true
LEFT JOIN recipe_ratings rr ON (COALESCE(r2.id, r.id) = rr.recipe_id)
LEFT JOIN recipe_views rvw ON (COALESCE(r2.id, r.id) = rvw.recipe_id)
WHERE r.is_public = true AND (r.parent_recipe_id IS NULL OR r.parent_recipe_id = r.id)
GROUP BY COALESCE(r.parent_recipe_id, r.id), r.title, r.user_id;

-- Update existing recipes to have version_number = 1 if NULL
UPDATE recipes SET version_number = 1 WHERE version_number IS NULL;

-- Create a function to get the next version number for a recipe
CREATE OR REPLACE FUNCTION get_next_version_number(original_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 
     FROM recipes 
     WHERE parent_recipe_id = original_id OR id = original_id), 
    2
  );
END;
$$ LANGUAGE plpgsql;

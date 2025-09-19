-- Production State Sync Migration
-- This migration ensures the codebase matches the current production database state
-- Production was fixed with an emergency SQL fix that created the recipe_content_versions table

-- This migration is designed to be idempotent and safe to run on any environment
-- It creates the table structure that currently exists in production

-- CRITICAL: Add missing current_version_id column to recipes table
-- This column tracks which version is currently published/active
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS current_version_id UUID;

-- Create the recipe_content_versions table (core versioning table)
CREATE TABLE IF NOT EXISTS recipe_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  version_name TEXT,
  changelog TEXT,
  
  -- Full recipe content snapshot
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT NOT NULL DEFAULT '',
  notes TEXT,
  setup TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  cooking_time TEXT,
  difficulty TEXT,
  creator_rating INTEGER CHECK (creator_rating >= 1 AND creator_rating <= 5),
  image_url TEXT,
  
  -- Version metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT true,
  
  -- Ensure unique version numbers per recipe
  UNIQUE(recipe_id, version_number)
);

-- Create essential indexes for performance
-- Note: Composite (recipe_id, version_number) index handles recipe_id-only queries efficiently
CREATE INDEX IF NOT EXISTS idx_recipe_content_versions_recipe_version ON recipe_content_versions(recipe_id, version_number);
CREATE INDEX IF NOT EXISTS idx_recipe_content_versions_created_at ON recipe_content_versions(created_at);

-- Enable Row Level Security
ALTER TABLE recipe_content_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies that match production
DROP POLICY IF EXISTS "recipe_content_versions_select_policy" ON recipe_content_versions;
DROP POLICY IF EXISTS "recipe_content_versions_insert_policy" ON recipe_content_versions;
DROP POLICY IF EXISTS "recipe_content_versions_update_policy" ON recipe_content_versions;

CREATE POLICY "recipe_content_versions_select_policy" 
ON recipe_content_versions FOR SELECT USING (true);

CREATE POLICY "recipe_content_versions_insert_policy" 
ON recipe_content_versions FOR INSERT WITH CHECK (
  recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
);

CREATE POLICY "recipe_content_versions_update_policy" 
ON recipe_content_versions FOR UPDATE USING (
  recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
) WITH CHECK (
  recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
);

-- Create essential versioning functions
CREATE OR REPLACE FUNCTION get_next_version_number_for_recipe(target_recipe_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 
     FROM recipe_content_versions 
     WHERE recipe_id = target_recipe_id), 
    1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- Populate Version 0 for existing recipes (idempotent)
-- This matches what was done in the production emergency fix
INSERT INTO recipe_content_versions (
  recipe_id, 
  version_number, 
  version_name,
  title, 
  ingredients, 
  instructions, 
  notes,
  setup,
  categories,
  cooking_time,
  difficulty,
  creator_rating,
  image_url,
  created_by,
  is_published
)
SELECT 
  r.id as recipe_id,
  0 as version_number,
  'Original Recipe' as version_name,
  r.title,
  COALESCE(r.ingredients, '{}') as ingredients,
  COALESCE(r.instructions, '') as instructions,
  r.notes,
  COALESCE(r.setup, '{}') as setup,
  COALESCE(r.categories, '{}') as categories,
  r.cooking_time,
  r.difficulty,
  r.creator_rating,
  r.image_url,
  r.user_id as created_by,
  r.is_public as is_published
FROM recipes r
WHERE NOT EXISTS (
  SELECT 1 FROM recipe_content_versions rcv 
  WHERE rcv.recipe_id = r.id AND rcv.version_number = 0
)
ON CONFLICT (recipe_id, version_number) DO NOTHING;

-- Update recipes table to link to their Version 0 content
-- This sets current_version_id to point to the Version 0 record
UPDATE recipes SET current_version_id = (
  SELECT rcv.id 
  FROM recipe_content_versions rcv 
  WHERE rcv.recipe_id = recipes.id AND rcv.version_number = 0
)
WHERE current_version_id IS NULL;

-- Add foreign key constraint for current_version_id (after data is populated)
-- Note: Using a separate statement to ensure compatibility across PostgreSQL versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_recipes_current_version'
    ) THEN
        ALTER TABLE recipes ADD CONSTRAINT fk_recipes_current_version 
            FOREIGN KEY (current_version_id) REFERENCES recipe_content_versions(id);
    END IF;
END $$;

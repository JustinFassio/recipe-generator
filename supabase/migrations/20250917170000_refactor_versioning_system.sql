-- Phase 1: Database Schema Redesign
-- Complete refactor of the versioning system to use proper historical state pattern
-- This fixes the fundamental issue of duplicate recipe display

-- Step 1.1: Create New Clean Versioning Table
CREATE TABLE recipe_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_name TEXT,
  changelog TEXT,
  
  -- Full recipe content snapshot (all fields from recipes table)
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL,
  instructions TEXT NOT NULL,
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
  is_published BOOLEAN DEFAULT false,
  
  -- Ensure unique version numbers per recipe
  UNIQUE(recipe_id, version_number)
);

-- Step 1.2: Add Performance Indexes
CREATE INDEX idx_recipe_content_versions_recipe_id ON recipe_content_versions(recipe_id);
CREATE INDEX idx_recipe_content_versions_published ON recipe_content_versions(recipe_id, is_published);
CREATE INDEX idx_recipe_content_versions_number ON recipe_content_versions(recipe_id, version_number);
CREATE INDEX idx_recipe_content_versions_created_by ON recipe_content_versions(created_by);

-- Step 1.3: Add Row Level Security
ALTER TABLE recipe_content_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions of their own recipes or public recipes
CREATE POLICY "Users can view recipe versions" ON recipe_content_versions
  FOR SELECT USING (
    -- User owns the recipe
    recipe_id IN (
      SELECT id FROM recipes WHERE user_id = auth.uid()
    )
    OR
    -- Recipe is public
    recipe_id IN (
      SELECT id FROM recipes WHERE is_public = true
    )
  );

-- Policy: Users can create versions of their own recipes
CREATE POLICY "Users can create versions of own recipes" ON recipe_content_versions
  FOR INSERT WITH CHECK (
    recipe_id IN (
      SELECT id FROM recipes WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Policy: Users can update their own versions
CREATE POLICY "Users can update own versions" ON recipe_content_versions
  FOR UPDATE USING (
    created_by = auth.uid()
  );

-- Policy: Users can delete their own versions
CREATE POLICY "Users can delete own versions" ON recipe_content_versions
  FOR DELETE USING (
    created_by = auth.uid()
  );

-- Step 1.4: Add Helper Functions
CREATE OR REPLACE FUNCTION get_recipe_versions(target_recipe_id UUID)
RETURNS TABLE (
  id UUID,
  recipe_id UUID,
  version_number INTEGER,
  version_name TEXT,
  changelog TEXT,
  title TEXT,
  ingredients TEXT[],
  instructions TEXT,
  notes TEXT,
  setup TEXT[],
  categories TEXT[],
  cooking_time TEXT,
  difficulty TEXT,
  creator_rating INTEGER,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  is_published BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    id, recipe_id, version_number, version_name, changelog,
    title, ingredients, instructions, notes, setup, categories,
    cooking_time, difficulty, creator_rating, image_url,
    created_at, created_by, is_published
  FROM recipe_content_versions 
  WHERE recipe_content_versions.recipe_id = target_recipe_id
  ORDER BY version_number DESC;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_recipe_versions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recipe_versions(UUID) TO anon;

-- Step 1.5: Add Current Version Tracking to Main Table
-- Add column to track which version is currently published
ALTER TABLE recipes ADD COLUMN current_version_id UUID;

-- Add foreign key constraint (will be populated in Phase 2)
-- ALTER TABLE recipes ADD CONSTRAINT fk_recipes_current_version 
--   FOREIGN KEY (current_version_id) REFERENCES recipe_content_versions(id);

COMMENT ON TABLE recipe_content_versions IS 'Stores complete content snapshots for each recipe version. Main recipes table contains only current/published content.';
COMMENT ON COLUMN recipe_content_versions.recipe_id IS 'Reference to the main recipe entity';
COMMENT ON COLUMN recipe_content_versions.version_number IS 'Sequential version number starting from 1';
COMMENT ON COLUMN recipe_content_versions.is_published IS 'Whether this version is the current published version';
COMMENT ON COLUMN recipes.current_version_id IS 'Reference to the currently published version';

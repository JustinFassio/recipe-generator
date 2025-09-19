-- Add description field to recipes table for Phase 0 of AI Image Generation
-- This field will store rich recipe descriptions that serve dual purposes:
-- 1. User-facing descriptions for better recipe discovery
-- 2. AI image generation prompts for enhanced visual content

-- Add description column to recipes table
ALTER TABLE recipes 
ADD COLUMN description text;

-- Add description column to recipe_versions table (for versioning system)
ALTER TABLE recipe_versions 
ADD COLUMN description text;

-- Add comment for documentation
COMMENT ON COLUMN recipes.description IS 'Rich recipe description for user display and AI image generation prompts';
COMMENT ON COLUMN recipe_versions.description IS 'Rich recipe description snapshot for version history';

-- Update the updated_at timestamp for existing recipes to reflect schema change
UPDATE recipes SET updated_at = now() WHERE description IS NULL;

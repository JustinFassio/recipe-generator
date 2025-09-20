-- Add description field to recipes table for Phase 0 of AI Image Generation
-- This field will store rich recipe descriptions that serve dual purposes:
-- 1. User-facing descriptions for better recipe discovery
-- 2. AI image generation prompts for enhanced visual content

-- Add description column to recipes table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'description'
    ) THEN
        ALTER TABLE recipes ADD COLUMN description text;
    END IF;
END $$;

-- Add description column to recipe_versions table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_versions' AND column_name = 'description'
    ) THEN
        ALTER TABLE recipe_versions ADD COLUMN description text;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN recipes.description IS 'Rich recipe description for user display and AI image generation prompts';
COMMENT ON COLUMN recipe_versions.description IS 'Rich recipe description snapshot for version history';

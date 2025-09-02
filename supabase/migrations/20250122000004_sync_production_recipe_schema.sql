-- Sync production recipe schema with local development
-- This migration adds the missing setup column to production
-- while preserving existing cooking_time and difficulty columns

BEGIN;

-- Add setup column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'setup'
    ) THEN
        ALTER TABLE recipes ADD COLUMN setup text[] DEFAULT '{}' NOT NULL;
        
        -- Add comment to explain the setup field
        COMMENT ON COLUMN recipes.setup IS 'Array of setup/prep-ahead instructions (e.g., soak beans overnight, marinate chicken)';
        
        RAISE NOTICE 'Added setup column to recipes table';
    ELSE
        RAISE NOTICE 'Setup column already exists in recipes table';
    END IF;
END $$;

-- Ensure categories column exists and has proper constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'categories'
    ) THEN
        ALTER TABLE recipes ADD COLUMN categories text[] DEFAULT '{}';
        RAISE NOTICE 'Added categories column to recipes table';
    END IF;
    
    -- Add GIN index for categories if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'recipes' 
        AND indexname = 'idx_recipes_categories_gin'
    ) THEN
        CREATE INDEX idx_recipes_categories_gin ON recipes USING GIN (categories);
        RAISE NOTICE 'Added GIN index for categories';
    END IF;
END $$;

-- Verify the final schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recipes' 
ORDER BY ordinal_position;

COMMIT;

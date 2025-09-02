-- Final production schema synchronization
-- This migration adds the remaining cooking_time and difficulty columns
-- to complete the production database schema

BEGIN;

-- Add cooking_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'cooking_time'
    ) THEN
        ALTER TABLE recipes ADD COLUMN cooking_time text;
        
        -- Add comment to explain the cooking_time field
        COMMENT ON COLUMN recipes.cooking_time IS 'Cooking time category: quick, medium, or long';
        
        RAISE NOTICE 'Added cooking_time column to recipes table';
    ELSE
        RAISE NOTICE 'Cooking_time column already exists in recipes table';
    END IF;
END $$;

-- Add difficulty column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'difficulty'
    ) THEN
        ALTER TABLE recipes ADD COLUMN difficulty text;
        
        -- Add comment to explain the difficulty field
        COMMENT ON COLUMN recipes.difficulty IS 'Difficulty level: beginner, intermediate, or advanced';
        
        RAISE NOTICE 'Added difficulty column to recipes table';
    ELSE
        RAISE NOTICE 'Difficulty column already exists in recipes table';
    END IF;
END $$;

-- Add cooking_time constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'recipes_cooking_time_check'
    ) THEN
        ALTER TABLE recipes 
        ADD CONSTRAINT recipes_cooking_time_check 
        CHECK (cooking_time IS NULL OR cooking_time = ANY (ARRAY['quick', 'medium', 'long']));
        RAISE NOTICE 'Added cooking_time constraint';
    END IF;
END $$;

-- Add difficulty constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'recipes_difficulty_check'
    ) THEN
        ALTER TABLE recipes 
        ADD CONSTRAINT recipes_difficulty_check 
        CHECK (difficulty IS NULL OR difficulty = ANY (ARRAY['beginner', 'intermediate', 'advanced']));
        RAISE NOTICE 'Added difficulty constraint';
    END IF;
END $$;

-- Add missing indexes if they don't exist
DO $$ 
BEGIN
    -- Add cooking_time index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'recipes' 
        AND indexname = 'idx_recipes_cooking_time'
    ) THEN
        CREATE INDEX idx_recipes_cooking_time ON recipes USING btree (cooking_time);
        RAISE NOTICE 'Added cooking_time index';
    END IF;
    
    -- Add difficulty index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'recipes' 
        AND indexname = 'idx_recipes_difficulty'
    ) THEN
        CREATE INDEX idx_recipes_difficulty ON recipes USING btree (difficulty);
        RAISE NOTICE 'Added difficulty index';
    END IF;
    
    -- Add other missing indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'recipes' 
        AND indexname = 'idx_recipes_created_at'
    ) THEN
        CREATE INDEX idx_recipes_created_at ON recipes USING btree (created_at);
        RAISE NOTICE 'Added created_at index';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'recipes' 
        AND indexname = 'idx_recipes_is_public'
    ) THEN
        CREATE INDEX idx_recipes_is_public ON recipes USING btree (is_public);
        RAISE NOTICE 'Added is_public index';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'recipes' 
        AND indexname = 'idx_recipes_user_id'
    ) THEN
        CREATE INDEX idx_recipes_user_id ON recipes USING btree (user_id);
        RAISE NOTICE 'Added user_id index';
    END IF;
END $$;

-- Verify the final schema
SELECT 
    'Final schema sync completed successfully' as status,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name = 'setup' THEN 1 END) as has_setup,
    COUNT(CASE WHEN column_name = 'categories' THEN 1 END) as has_categories,
    COUNT(CASE WHEN column_name = 'cooking_time' THEN 1 END) as has_cooking_time,
    COUNT(CASE WHEN column_name = 'difficulty' THEN 1 END) as has_difficulty
FROM information_schema.columns 
WHERE table_name = 'recipes';

COMMIT;

-- Complete production schema synchronization
-- This migration adds missing triggers, RLS policies, and constraints
-- to make production database fully compatible with the application

BEGIN;

-- 1. Add missing triggers for auto-updating timestamps
DO $$ 
BEGIN
    -- Add moddatetime extension if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'moddatetime'
    ) THEN
        CREATE EXTENSION IF NOT EXISTS moddatetime;
    END IF;
    
    -- Add trigger for profiles table
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_set_updated_at'
    ) THEN
        CREATE TRIGGER profiles_set_updated_at
            BEFORE UPDATE ON profiles
            FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
        RAISE NOTICE 'Added updated_at trigger to profiles table';
    END IF;
    
    -- Add trigger for recipes table
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'recipes_set_updated_at'
    ) THEN
        CREATE TRIGGER recipes_set_updated_at
            BEFORE UPDATE ON recipes
            FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
        RAISE NOTICE 'Added updated_at trigger to recipes table';
    END IF;
END $$;

-- 2. Add missing RLS policies for recipes table
DO $$ 
BEGIN
    -- Enable RLS on recipes table if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'recipes' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on recipes table';
    END IF;
    
    -- Add RLS policies if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' 
        AND policyname = 'Users can view their own recipes'
    ) THEN
        CREATE POLICY "Users can view their own recipes" ON recipes
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE 'Added SELECT policy for recipes';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' 
        AND policyname = 'Users can insert their own recipes'
    ) THEN
        CREATE POLICY "Users can insert their own recipes" ON recipes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Added INSERT policy for recipes';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' 
        AND policyname = 'Users can update their own recipes'
    ) THEN
        CREATE POLICY "Users can update their own recipes" ON recipes
            FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE 'Added UPDATE policy for recipes';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' 
        AND policyname = 'Users can delete their own recipes'
    ) THEN
        CREATE POLICY "Users can delete their own recipes" ON recipes
            FOR DELETE USING (auth.uid() = user_id);
        RAISE NOTICE 'Added DELETE policy for recipes';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' 
        AND policyname = 'Public recipes are viewable by everyone'
    ) THEN
        CREATE POLICY "Public recipes are viewable by everyone" ON recipes
            FOR SELECT USING (is_public = true);
        RAISE NOTICE 'Added public SELECT policy for recipes';
    END IF;
END $$;

-- 3. Add missing constraints and indexes
DO $$ 
BEGIN
    -- Add category count constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_category_count'
    ) THEN
        ALTER TABLE recipes 
        ADD CONSTRAINT check_category_count 
        CHECK (array_length(categories, 1) IS NULL OR array_length(categories, 1) <= 6);
        RAISE NOTICE 'Added category count constraint';
    END IF;
    
    -- Make categories NOT NULL if it isn't already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'categories' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE recipes ALTER COLUMN categories SET NOT NULL;
        RAISE NOTICE 'Made categories column NOT NULL';
    END IF;
    
    -- Add missing indexes if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'recipes' 
        AND indexname = 'idx_recipes_categories_gin'
    ) THEN
        CREATE INDEX idx_recipes_categories_gin ON recipes USING GIN (categories);
        RAISE NOTICE 'Added GIN index for categories';
    END IF;
END $$;

-- 4. Verify the final schema
SELECT 
    'Schema sync completed successfully' as status,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name = 'setup' THEN 1 END) as has_setup,
    COUNT(CASE WHEN column_name = 'categories' THEN 1 END) as has_categories,
    COUNT(CASE WHEN column_name = 'cooking_time' THEN 1 END) as has_cooking_time,
    COUNT(CASE WHEN column_name = 'difficulty' THEN 1 END) as has_difficulty
FROM information_schema.columns 
WHERE table_name = 'recipes';

COMMIT;

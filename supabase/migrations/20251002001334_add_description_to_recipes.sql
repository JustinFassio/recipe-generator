-- Add description column to recipes table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE recipes ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add description column to recipe_content_versions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_content_versions' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE recipe_content_versions ADD COLUMN description TEXT;
    END IF;
END $$;

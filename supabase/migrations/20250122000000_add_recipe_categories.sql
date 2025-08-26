-- Add categories column to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Add GIN index for performance (enables efficient array operations)
CREATE INDEX IF NOT EXISTS idx_recipes_categories_gin 
ON recipes USING GIN (categories);

-- Add constraint to ensure categories are not null
ALTER TABLE recipes 
ALTER COLUMN categories SET NOT NULL;

-- Add constraint to limit number of categories (max 6 categories)
-- NOTE: The maximum number of categories (6) must be kept in sync with the application layer
ALTER TABLE recipes 
ADD CONSTRAINT check_category_count 
CHECK (array_length(categories, 1) IS NULL OR array_length(categories, 1) <= 6);

-- Update RLS policies to include categories
DROP POLICY IF EXISTS "Users can view their own recipes" ON recipes;
CREATE POLICY "Users can view their own recipes" ON recipes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recipes" ON recipes;
CREATE POLICY "Users can insert their own recipes" ON recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
CREATE POLICY "Users can update their own recipes" ON recipes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;
CREATE POLICY "Users can delete their own recipes" ON recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Public recipes policy (unchanged)
DROP POLICY IF EXISTS "Public recipes are viewable by everyone" ON recipes;
CREATE POLICY "Public recipes are viewable by everyone" ON recipes
    FOR SELECT USING (is_public = true);

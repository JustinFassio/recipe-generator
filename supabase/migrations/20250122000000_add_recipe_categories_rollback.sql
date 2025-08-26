-- Rollback migration for recipe categories
-- Remove GIN index
DROP INDEX IF EXISTS idx_recipes_categories_gin;

-- Remove constraint
ALTER TABLE recipes 
DROP CONSTRAINT IF EXISTS check_category_length;

-- Remove categories column
ALTER TABLE recipes 
DROP COLUMN IF EXISTS categories;

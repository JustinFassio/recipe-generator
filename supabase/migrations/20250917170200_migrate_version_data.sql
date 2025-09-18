-- Phase 2: Data Migration Strategy
-- Migrate existing broken version data into the new clean schema

-- Step 2.1: Migrate existing version data to new schema
-- First, identify the original recipe (oldest one) for the Zucchini family
-- Migrate the Zucchini Noodles family data
-- Insert Version 1 (Original Recipe)
INSERT INTO recipe_content_versions (
  recipe_id, version_number, version_name, changelog,
  title, ingredients, instructions, notes, setup, categories,
  cooking_time, difficulty, creator_rating, image_url,
  created_by, created_at, is_published
)
SELECT 
  id as recipe_id,
  1 as version_number,
  'Original Recipe' as version_name,
  'Initial version of the recipe' as changelog,
  title, ingredients, instructions, notes, setup, categories,
  cooking_time, difficulty, creator_rating, image_url,
  user_id as created_by, created_at,
  true as is_published  -- Original is the current published version
FROM recipes 
WHERE id = '11111111-1111-1111-1111-111111111120';

-- Insert Version 2 with metadata from recipe_versions table
INSERT INTO recipe_content_versions (
  recipe_id, version_number, version_name, changelog,
  title, ingredients, instructions, notes, setup, categories,
  cooking_time, difficulty, creator_rating, image_url,
  created_by, created_at, is_published
)
SELECT 
  rv.original_recipe_id as recipe_id,
  rv.version_number,
  rv.version_name,
  rv.changelog,
  r.title, r.ingredients, r.instructions, r.notes, r.setup, r.categories,
  r.cooking_time, r.difficulty, r.creator_rating, r.image_url,
  r.user_id as created_by, rv.created_at,
  false as is_published  -- Versions are drafts by default
FROM recipe_versions rv
JOIN recipes r ON r.id = rv.version_recipe_id
WHERE rv.version_recipe_id = 'd9ad21c8-66ca-4be0-89b5-e72c32f1e2bb';

-- Insert Version 3 with metadata from recipe_versions table  
INSERT INTO recipe_content_versions (
  recipe_id, version_number, version_name, changelog,
  title, ingredients, instructions, notes, setup, categories,
  cooking_time, difficulty, creator_rating, image_url,
  created_by, created_at, is_published
)
SELECT 
  '11111111-1111-1111-1111-111111111120'::UUID as recipe_id,  -- Point to the true original
  rv.version_number,
  rv.version_name,
  rv.changelog,
  r.title, r.ingredients, r.instructions, r.notes, r.setup, r.categories,
  r.cooking_time, r.difficulty, r.creator_rating, r.image_url,
  r.user_id as created_by, rv.created_at,
  false as is_published  -- Versions are drafts by default
FROM recipe_versions rv
JOIN recipes r ON r.id = rv.version_recipe_id
WHERE rv.version_recipe_id = 'a000b8f1-ac14-411a-8e8c-e8825e515e0c';

-- Step 2.2: Update main recipes table with latest version content
-- For now, keep the original as the published version
-- The current_version_id will point to the Version 1 entry
UPDATE recipes SET
  current_version_id = (
    SELECT id FROM recipe_content_versions 
    WHERE recipe_id = recipes.id AND version_number = 1
  )
WHERE id = '11111111-1111-1111-1111-111111111120';

-- Step 2.3: Remove duplicate recipe entries (keep only the original)
-- Delete the version 2 and version 3 recipe entries from main table
DELETE FROM recipes 
WHERE id IN ('d9ad21c8-66ca-4be0-89b5-e72c32f1e2bb', 'a000b8f1-ac14-411a-8e8c-e8825e515e0c');

-- Step 2.4: Clean up old recipe_versions table entries for migrated data
DELETE FROM recipe_versions 
WHERE version_recipe_id IN ('d9ad21c8-66ca-4be0-89b5-e72c32f1e2bb', 'a000b8f1-ac14-411a-8e8c-e8825e515e0c');

-- Verification queries
SELECT 'Phase 2 Migration Results:' as status;

-- Check main recipes table (should have only 1 Zucchini Noodles entry)
SELECT 'Main recipes table:' as check_type, title, COUNT(*) as count
FROM recipes 
WHERE title LIKE '%Zucchini Noodles%'
GROUP BY title;

-- Check version table (should have 3 versions)
SELECT 'Version table:' as check_type, COUNT(*) as version_count
FROM recipe_content_versions 
WHERE recipe_id = '11111111-1111-1111-1111-111111111120';

-- Check that current_version_id is set
SELECT 'Current version tracking:' as check_type, 
       CASE WHEN current_version_id IS NOT NULL THEN 'SET' ELSE 'NOT SET' END as status
FROM recipes 
WHERE id = '11111111-1111-1111-1111-111111111120';

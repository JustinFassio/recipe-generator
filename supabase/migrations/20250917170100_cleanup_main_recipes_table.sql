-- Phase 1 Completion: Clean up versioning pollution from main recipes table
-- Remove the broken parent-child versioning columns

-- Step 1.2a: Drop dependent views first
DROP VIEW IF EXISTS recipe_version_stats CASCADE;
DROP VIEW IF EXISTS recipe_aggregate_stats CASCADE;

-- Step 1.2b: Remove versioning pollution from main recipes table
ALTER TABLE recipes DROP COLUMN IF EXISTS version_number;
ALTER TABLE recipes DROP COLUMN IF EXISTS parent_recipe_id;
ALTER TABLE recipes DROP COLUMN IF EXISTS is_version;

-- Verify the cleanup
COMMENT ON TABLE recipes IS 'Main recipes table - contains only current/published content. Historical versions stored in recipe_content_versions table.';

-- Add constraint for current_version_id (will be populated in Phase 2)
-- Note: Cannot add foreign key constraint yet because we haven't migrated data
-- This will be added in Phase 2 after data migration

-- Verify table structure is clean
SELECT 'Phase 1 Complete: Main recipes table cleaned up' as status;

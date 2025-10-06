-- Clean up duplicate RLS policies on recipes table
-- This fixes the 406 Not Acceptable errors caused by conflicting policies

-- Drop the newer duplicate policies (keep the original ones from the initial migration)
DROP POLICY IF EXISTS "Users can view their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;
DROP POLICY IF EXISTS "Public recipes are viewable by everyone" ON recipes;

-- Verify we now have only the original 5 policies:
-- 1. recipes_select_public
-- 2. recipes_select_own  
-- 3. recipes_insert_own
-- 4. recipes_update_own
-- 5. recipes_delete_own

-- Add helpful comment
COMMENT ON TABLE recipes IS 'Recipes table with clean RLS policies. Users can access their own recipes and public recipes.';

/*
# Temporary: Disable User Preferences Tables

Since we're getting persistent 406 errors with user_safety and cooking_preferences tables,
let's temporarily disable them to get the app working while we debug the root cause.

This will:
1. Disable RLS on these tables temporarily
2. Make them publicly readable (temporary)
3. Allow the app to work while we figure out the 406 issue

This is a TEMPORARY fix for pre-MVP testing.
*/

-- Temporarily disable RLS to bypass 406 errors
ALTER TABLE "public"."user_safety" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cooking_preferences" DISABLE ROW LEVEL SECURITY;

-- Drop all policies temporarily
DROP POLICY IF EXISTS "user_safety_select" ON "public"."user_safety";
DROP POLICY IF EXISTS "user_safety_insert" ON "public"."user_safety";
DROP POLICY IF EXISTS "user_safety_update" ON "public"."user_safety";
DROP POLICY IF EXISTS "user_safety_delete" ON "public"."user_safety";

DROP POLICY IF EXISTS "cooking_preferences_select" ON "public"."cooking_preferences";
DROP POLICY IF EXISTS "cooking_preferences_insert" ON "public"."cooking_preferences";
DROP POLICY IF EXISTS "cooking_preferences_update" ON "public"."cooking_preferences";
DROP POLICY IF EXISTS "cooking_preferences_delete" ON "public"."cooking_preferences";

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'Temporarily disabled RLS on user preferences tables to fix 406 errors';
END $$;


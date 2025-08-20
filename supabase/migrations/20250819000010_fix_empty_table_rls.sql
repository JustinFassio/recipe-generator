/*
# Fix Empty Table RLS Issue

The 406 errors happen because:
1. User creates account
2. User tries to access preferences (which don't exist yet)
3. RLS policies can't handle empty results properly
4. PostgREST returns 406 instead of empty array

This migration fixes the RLS policies to handle empty tables correctly.
*/

-- Drop the debug policies
DROP POLICY IF EXISTS "user_safety_debug_access" ON "public"."user_safety";
DROP POLICY IF EXISTS "cooking_preferences_debug_access" ON "public"."cooking_preferences";
DROP POLICY IF EXISTS "user_safety_self_write" ON "public"."user_safety";
DROP POLICY IF EXISTS "cooking_preferences_self_write" ON "public"."cooking_preferences";

-- Create proper policies that handle empty tables
-- Allow users to SELECT their own records (returns empty array if none exist)
CREATE POLICY "user_safety_select" ON "public"."user_safety"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cooking_preferences_select" ON "public"."cooking_preferences"
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to INSERT their initial records
CREATE POLICY "user_safety_insert" ON "public"."user_safety"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cooking_preferences_insert" ON "public"."cooking_preferences"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own records
CREATE POLICY "user_safety_update" ON "public"."user_safety"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cooking_preferences_update" ON "public"."cooking_preferences"
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to DELETE their own records (optional)
CREATE POLICY "user_safety_delete" ON "public"."user_safety"
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "cooking_preferences_delete" ON "public"."cooking_preferences"
  FOR DELETE USING (auth.uid() = user_id);

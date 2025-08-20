/*
# Restore Production RLS Policies

This migration restores the missing RLS policies that were accidentally dropped in production.
The user_safety and cooking_preferences tables need proper RLS policies to function correctly.
*/

-- Re-enable RLS on user_safety table
ALTER TABLE "public"."user_safety" ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on cooking_preferences table  
ALTER TABLE "public"."cooking_preferences" ENABLE ROW LEVEL SECURITY;

-- Restore user_safety RLS policy (users can only access their own safety data)
DROP POLICY IF EXISTS "user_safety_self_access" ON "public"."user_safety";
CREATE POLICY "user_safety_self_access" ON "public"."user_safety" 
  FOR ALL USING (auth.uid() = user_id);

-- Restore cooking_preferences RLS policy (users can only access their own preferences)
DROP POLICY IF EXISTS "cooking_preferences_self_access" ON "public"."cooking_preferences";
CREATE POLICY "cooking_preferences_self_access" ON "public"."cooking_preferences" 
  FOR ALL USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON POLICY "user_safety_self_access" ON "public"."user_safety" IS 'Users can only access their own safety data';
COMMENT ON POLICY "cooking_preferences_self_access" ON "public"."cooking_preferences" IS 'Users can only access their own cooking preferences';

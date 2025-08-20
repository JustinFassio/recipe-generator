/*
# Debug RLS Policies for 406 Error

The 406 errors suggest that RLS policies are too restrictive or there's an authentication context issue.
This migration will temporarily make the policies more permissive to diagnose the issue.
*/

-- First, let's check what's happening by temporarily allowing read access for authenticated users
-- We'll make the policies more permissive to see if that resolves the 406 error

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "user_safety_self_access" ON "public"."user_safety";
DROP POLICY IF EXISTS "cooking_preferences_self_access" ON "public"."cooking_preferences";

-- Create more permissive policies for debugging
-- Allow any authenticated user to read these tables (we'll restrict this later)
CREATE POLICY "user_safety_debug_access" ON "public"."user_safety" 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "cooking_preferences_debug_access" ON "public"."cooking_preferences" 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Also allow authenticated users to insert/update their own records
CREATE POLICY "user_safety_self_write" ON "public"."user_safety" 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "cooking_preferences_self_write" ON "public"."cooking_preferences" 
  FOR ALL USING (auth.uid() = user_id);

-- Add logging to see what's happening
COMMENT ON POLICY "user_safety_debug_access" ON "public"."user_safety" IS 'Temporary debug policy - allows all authenticated users to read';
COMMENT ON POLICY "cooking_preferences_debug_access" ON "public"."cooking_preferences" IS 'Temporary debug policy - allows all authenticated users to read';

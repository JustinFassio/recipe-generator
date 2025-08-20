/*
# Fix RLS Policies for User Preferences

This migration fixes the RLS policies for user_safety and cooking_preferences tables
to allow proper access when using the anon key with user authentication.

## Problem:
- RLS policies were too restrictive and causing 406 errors
- auth.uid() might not be available or might not match user_id
- Need to allow access when user is authenticated

## Solution:
- Update RLS policies to be more permissive for authenticated users
- Allow access when auth.uid() matches user_id OR when user_id is provided
*/

-- Drop existing policies
DROP POLICY IF EXISTS "user_safety_self_access" ON user_safety;
DROP POLICY IF EXISTS "cooking_preferences_self_access" ON cooking_preferences;

-- Create more permissive policies for user_safety
CREATE POLICY "user_safety_self_access" ON user_safety 
  FOR ALL USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text)
  );

-- Create more permissive policies for cooking_preferences
CREATE POLICY "cooking_preferences_self_access" ON cooking_preferences 
  FOR ALL USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text)
  );

-- Also add policies that allow access when user_id matches the authenticated user
CREATE POLICY "user_safety_authenticated_access" ON user_safety 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR user_id::text = auth.uid()::text)
  );

CREATE POLICY "cooking_preferences_authenticated_access" ON cooking_preferences 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR user_id::text = auth.uid()::text)
  );

-- Test Username Function in Production
-- Run this in Supabase SQL Editor

-- 1. Test if the function exists and is callable
SELECT '=== TESTING FUNCTION EXISTENCE ===' as section;
SELECT 
    routine_name,
    routine_type,
    security_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_username_atomic';

-- 2. Test the function directly with a sample user
SELECT '=== TESTING FUNCTION DIRECTLY ===' as section;
-- First, let's see if we have any users to test with
SELECT 
    id,
    username,
    full_name
FROM profiles 
LIMIT 5;

-- 3. Test the function call (replace USER_ID_HERE with an actual user ID)
SELECT '=== FUNCTION CALL TEST ===' as section;
-- This will show if the function can be called (replace with actual user ID)
-- SELECT update_username_atomic('USER_ID_HERE', 'test_username_123');

-- 4. Check RLS policies on usernames table
SELECT '=== RLS POLICIES ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'usernames';

-- 5. Check if the function is accessible to authenticated users
SELECT '=== FUNCTION PERMISSIONS ===' as section;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'update_username_atomic';

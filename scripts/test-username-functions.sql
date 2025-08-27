-- Test Username Functions in Local Database
-- Run this in Supabase SQL Editor at http://127.0.0.1:54323

-- First, let's check if the functions exist
SELECT '=== FUNCTION VERIFICATION ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_username_available', 'claim_username_atomic', 'update_username_atomic')
ORDER BY routine_name;

-- Check if we have any test users
SELECT '=== TEST USERS ===' as section;
SELECT 
    id,
    email,
    username,
    created_at
FROM auth.users 
LIMIT 5;

-- Check profiles table
SELECT '=== PROFILES ===' as section;
SELECT 
    id,
    username,
    full_name,
    created_at
FROM profiles 
LIMIT 5;

-- Check usernames table
SELECT '=== USERNAMES ===' as section;
SELECT 
    username,
    user_id,
    created_at
FROM usernames 
LIMIT 5;

-- Test the is_username_available function
SELECT '=== TESTING is_username_available ===' as section;
SELECT 
    'testuser1' as username,
    is_username_available('testuser1') as is_available;

-- Test the update_username_atomic function (this will fail without auth context)
SELECT '=== TESTING update_username_atomic (will fail without auth) ===' as section;
-- This will fail because we're not authenticated, but it shows the function exists
SELECT update_username_atomic('00000000-0000-0000-0000-000000000000', 'testuser2');

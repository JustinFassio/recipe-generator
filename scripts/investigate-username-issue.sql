-- Investigate Username Saving Issue in Production
-- Run this in Supabase SQL Editor

-- 1. Check if the usernames table exists
SELECT '=== CHECKING TABLES ===' as section;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'usernames')
ORDER BY table_name;

-- 2. Check if the update_username_atomic function exists
SELECT '=== CHECKING FUNCTIONS ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_username_atomic', 'claim_username_atomic', 'is_username_available')
ORDER BY routine_name;

-- 3. Check the structure of the usernames table
SELECT '=== USERNAMES TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'usernames'
ORDER BY ordinal_position;

-- 4. Check the structure of the profiles table
SELECT '=== PROFILES TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Check current data in usernames table
SELECT '=== USERNAMES TABLE DATA ===' as section;
SELECT 
    username,
    user_id,
    created_at,
    updated_at
FROM usernames
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check profiles with usernames
SELECT '=== PROFILES WITH USERNAMES ===' as section;
SELECT 
    id,
    username,
    full_name,
    created_at,
    updated_at
FROM profiles
WHERE username IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- 7. Check for any RLS policies on usernames table
SELECT '=== RLS POLICIES ON USERNAMES ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'usernames';

-- 8. Check function permissions
SELECT '=== FUNCTION PERMISSIONS ===' as section;
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_username_atomic';

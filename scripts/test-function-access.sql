-- Test Function Access
-- Run this in Supabase SQL Editor

-- 1. List all functions with similar names
SELECT '=== ALL USERNAME FUNCTIONS ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%username%'
ORDER BY routine_name;

-- 2. Check if there are multiple signatures for the same function
SELECT '=== FUNCTION SIGNATURES ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.oid
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'update_username_atomic';

-- 3. Try to call the function with explicit casting
SELECT '=== FUNCTION CALL TEST ===' as section;
-- Get a test user ID
SELECT 
    id as test_user_id,
    username as current_username
FROM profiles 
LIMIT 1;

-- 4. Check if the function is exposed via PostgREST
SELECT '=== POSTGREST EXPOSURE ===' as section;
-- This will show if the function is accessible via REST API
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_username_atomic'
AND security_type = 'INVOKER';

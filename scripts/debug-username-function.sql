-- Debug Username Function in Production
-- Run this in Supabase SQL Editor

-- 1. Check if the function exists
SELECT '=== FUNCTION EXISTENCE ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type,
    security_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_username_atomic';

-- 2. Check function parameters
SELECT '=== FUNCTION PARAMETERS ===' as section;
SELECT 
    parameter_name,
    parameter_mode,
    data_type,
    parameter_default
FROM information_schema.parameters 
WHERE specific_schema = 'public' 
AND specific_name = 'update_username_atomic'
ORDER BY ordinal_position;

-- 3. Check function permissions
SELECT '=== FUNCTION PERMISSIONS ===' as section;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'update_username_atomic';

-- 4. Test the function directly (replace USER_ID with actual user ID)
SELECT '=== DIRECT FUNCTION TEST ===' as section;
-- First, get a user ID to test with
SELECT 
    id,
    username,
    full_name
FROM profiles 
LIMIT 1;

-- 5. Check if the function is callable by authenticated users
SELECT '=== FUNCTION CALLABILITY ===' as section;
SELECT 
    has_function_privilege('authenticated', 'update_username_atomic(uuid, citext)', 'EXECUTE') as authenticated_can_execute,
    has_function_privilege('anon', 'update_username_atomic(uuid, citext)', 'EXECUTE') as anon_can_execute;

-- 6. Check the function definition
SELECT '=== FUNCTION DEFINITION ===' as section;
SELECT 
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'update_username_atomic' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

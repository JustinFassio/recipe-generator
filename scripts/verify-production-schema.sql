-- Production Schema Verification Script
-- Run this in Supabase SQL Editor to verify current state before migration reset

-- Check tables exist
SELECT '=== TABLES VERIFICATION ===' as section;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check functions exist
SELECT '=== FUNCTIONS VERIFICATION ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_username_available', 'claim_username_atomic', 'update_username_atomic', 'update_updated_at_column')
ORDER BY routine_name;

-- Check RLS policies
SELECT '=== RLS POLICIES VERIFICATION ===' as section;
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check storage buckets
SELECT '=== STORAGE BUCKETS VERIFICATION ===' as section;
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
ORDER BY id;

-- Check storage policies
SELECT '=== STORAGE POLICIES VERIFICATION ===' as section;
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
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- Check indexes
SELECT '=== INDEXES VERIFICATION ===' as section;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check triggers
SELECT '=== TRIGGERS VERIFICATION ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check extensions
SELECT '=== EXTENSIONS VERIFICATION ===' as section;
SELECT 
    extname,
    extversion
FROM pg_extension
ORDER BY extname;

-- Sample data verification (safe - no sensitive data)
SELECT '=== SAMPLE DATA VERIFICATION ===' as section;
SELECT 
    'profiles' as table_name,
    COUNT(*) as row_count
FROM profiles
UNION ALL
SELECT 
    'usernames' as table_name,
    COUNT(*) as row_count
FROM usernames
UNION ALL
SELECT 
    'recipes' as table_name,
    COUNT(*) as row_count
FROM recipes
UNION ALL
SELECT 
    'user_safety' as table_name,
    COUNT(*) as row_count
FROM user_safety
UNION ALL
SELECT 
    'cooking_preferences' as table_name,
    COUNT(*) as row_count
FROM cooking_preferences
UNION ALL
SELECT 
    'recipe_categories' as table_name,
    COUNT(*) as row_count
FROM recipe_categories;

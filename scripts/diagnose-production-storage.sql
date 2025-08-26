-- Comprehensive Production Storage Diagnostic
-- Run this in Supabase SQL Editor

-- 1. Check what buckets actually exist
SELECT '=== EXISTING BUCKETS ===' as section;
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
ORDER BY name;

-- 2. Check all storage policies
SELECT '=== STORAGE POLICIES ===' as section;
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- 3. Check current user context
SELECT '=== CURRENT USER CONTEXT ===' as section;
SELECT 
    current_user,
    session_user,
    current_setting('role'),
    current_setting('request.jwt.claims', true)::json->>'role' as jwt_role,
    current_setting('request.jwt.claims', true)::json->>'sub' as user_id;

-- 4. Test upload with detailed error reporting
SELECT '=== UPLOAD TEST ===' as section;

-- Try to upload a test file
DO $$
DECLARE
    test_file_name text;
    upload_result record;
BEGIN
    test_file_name := 'test-upload-' || extract(epoch from now()) || '.jpg';
    
    -- Try to insert into storage.objects
    BEGIN
        INSERT INTO storage.objects (
            bucket_id,
            name,
            owner,
            metadata
        ) VALUES (
            'recipe-images',
            test_file_name,
            auth.uid(),
            '{"mimetype": "image/jpeg", "size": 1024}'::jsonb
        );
        
        RAISE NOTICE 'SUCCESS: Upload test passed for file: %', test_file_name;
        
        -- Clean up the test file
        DELETE FROM storage.objects WHERE name = test_file_name;
        RAISE NOTICE 'CLEANUP: Test file deleted';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Upload test failed - %: %', SQLSTATE, SQLERRM;
    END;
END $$;

-- 5. Check if recipe-images bucket has any files
SELECT '=== EXISTING FILES IN RECIPE-IMAGES ===' as section;
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'recipe-images'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check bucket permissions
SELECT '=== BUCKET PERMISSIONS ===' as section;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'objects' 
AND table_schema = 'storage'
ORDER BY grantee, privilege_type;

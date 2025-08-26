-- Test Upload Permissions in Production
-- Run this in Supabase SQL Editor

-- 1. Check current user context
SELECT 
    current_user,
    session_user,
    current_setting('role'),
    current_setting('request.jwt.claims', true)::json->>'role' as jwt_role;

-- 2. Test if we can insert into storage.objects (simulate upload)
-- This will fail if RLS policies are blocking uploads
INSERT INTO storage.objects (
    bucket_id,
    name,
    owner,
    metadata
) VALUES (
    'recipe-images',
    'test-upload-' || extract(epoch from now()) || '.jpg',
    auth.uid(),
    '{"mimetype": "image/jpeg", "size": 1024}'::jsonb
) ON CONFLICT (bucket_id, name) DO NOTHING;

-- 3. Check if the test file was created
SELECT 
    name,
    bucket_id,
    owner,
    created_at
FROM storage.objects 
WHERE bucket_id = 'recipe-images' 
AND name LIKE 'test-upload-%'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Clean up test files
DELETE FROM storage.objects 
WHERE bucket_id = 'recipe-images' 
AND name LIKE 'test-upload-%';

-- 5. Check RLS policy definitions for storage.objects
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%insert%' OR policyname LIKE '%upload%';

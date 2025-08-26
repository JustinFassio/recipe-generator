-- Check Storage Buckets & Policies in Production
-- Run this in Supabase SQL Editor

-- 1. Check if storage buckets exist
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE name IN ('recipe-images', 'avatars');

-- 2. Check storage policies on storage.objects
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
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 3. Check if recipe-images bucket has any files
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'recipe-images'
LIMIT 10;

-- 4. Check bucket permissions for authenticated users
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'objects' 
AND table_schema = 'storage'
AND grantee = 'authenticated';

-- 5. Check if RLS is enabled on storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Test Avatar URL and Profile Data
-- Run this in Supabase SQL Editor

-- 1. Check current profile data
SELECT '=== CURRENT PROFILE DATA ===' as section;
SELECT 
    id,
    username,
    avatar_url,
    created_at,
    updated_at
FROM profiles 
WHERE avatar_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- 2. Test avatar URL generation for a specific user
SELECT '=== TEST AVATAR URL GENERATION ===' as section;
-- Replace 'USER_ID_HERE' with an actual user ID from the profiles table
SELECT 
    storage.foldername(name) as folder_structure,
    name as file_name,
    bucket_id,
    owner,
    metadata,
    created_at
FROM storage.objects 
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if avatar files exist in storage
SELECT '=== AVATAR FILES IN STORAGE ===' as section;
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    metadata->>'mimetype' as mime_type,
    metadata->>'size' as file_size
FROM storage.objects 
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC;

-- 4. Test public URL generation
SELECT '=== PUBLIC URL TEST ===' as section;
-- This will show the format of public URLs
SELECT 
    name,
    'https://sxvdkipywmjcitdhfpp.supabase.co/storage/v1/object/public/avatars/' || name as public_url
FROM storage.objects 
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC
LIMIT 5;

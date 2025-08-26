-- Check Profile Avatar URLs vs Storage Files
-- Run this in Supabase SQL Editor

-- 1. Check profiles with avatar URLs
SELECT '=== PROFILES WITH AVATAR URLS ===' as section;
SELECT 
    id,
    username,
    avatar_url,
    created_at,
    updated_at
FROM profiles 
WHERE avatar_url IS NOT NULL
ORDER BY updated_at DESC;

-- 2. Check if the avatar URLs in profiles match actual storage files
SELECT '=== AVATAR URL VALIDATION ===' as section;
SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url as profile_avatar_url,
    CASE 
        WHEN s.name IS NOT NULL THEN '✅ FILE EXISTS'
        ELSE '❌ FILE MISSING'
    END as file_status,
    s.name as storage_file_name,
    s.created_at as file_created_at
FROM profiles p
LEFT JOIN storage.objects s ON (
    s.bucket_id = 'avatars' 
    AND s.name = REPLACE(p.avatar_url, 'https://sxvdkipywmjcitdhfpp.supabase.co/storage/v1/object/public/avatars/', '')
)
WHERE p.avatar_url IS NOT NULL
ORDER BY p.updated_at DESC;

-- 3. Check for orphaned storage files (files without profile entries)
SELECT '=== ORPHANED STORAGE FILES ===' as section;
SELECT 
    s.name as storage_file_name,
    s.owner as file_owner,
    s.created_at as file_created_at,
    CASE 
        WHEN p.id IS NOT NULL THEN '✅ PROFILE EXISTS'
        ELSE '❌ NO PROFILE'
    END as profile_status,
    p.username
FROM storage.objects s
LEFT JOIN profiles p ON s.owner = p.id
WHERE s.bucket_id = 'avatars'
ORDER BY s.created_at DESC;

-- Fix Avatar URLs to Use Correct Production Domain
-- This migration fixes existing avatar URLs that may have incorrect domains

-- Update any avatar URLs that don't use the correct production domain
UPDATE profiles 
SET 
    avatar_url = REPLACE(
        avatar_url, 
        'http://127.0.0.1:54321', 
        'https://sxvdkipywmjcitdhfpp.supabase.co'
    ),
    updated_at = NOW()
WHERE avatar_url LIKE '%127.0.0.1:54321%';

-- Also fix any URLs that might have localhost
UPDATE profiles 
SET 
    avatar_url = REPLACE(
        avatar_url, 
        'http://localhost:54321', 
        'https://sxvdkipywmjcitdhfpp.supabase.co'
    ),
    updated_at = NOW()
WHERE avatar_url LIKE '%localhost:54321%';

-- Verify the fix
SELECT '=== AVATAR URL FIX VERIFICATION ===' as section;
SELECT 
    id,
    username,
    avatar_url,
    updated_at
FROM profiles 
WHERE avatar_url IS NOT NULL
ORDER BY updated_at DESC;

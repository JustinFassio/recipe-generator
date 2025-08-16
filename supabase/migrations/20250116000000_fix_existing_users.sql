/*
# Fix Existing Users Migration

This migration addresses the issue where existing users are stuck in a loading state
after the auth system update. It ensures all existing users have profile entries
and clears any invalid sessions.

## Issues Fixed:
1. Existing users without profile entries
2. Invalid refresh tokens causing infinite loading
3. Missing username entries for existing users
*/

-- 1) CREATE MISSING PROFILES FOR EXISTING USERS
-- This ensures all existing auth.users have corresponding profile entries
INSERT INTO public.profiles (id, full_name, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2) CREATE MISSING USERNAME ENTRIES FOR EXISTING USERS
-- This ensures all users with usernames have entries in the usernames table
INSERT INTO public.usernames (username, user_id, created_at)
SELECT 
  p.username,
  p.id,
  p.created_at
FROM public.profiles p
LEFT JOIN public.usernames u ON p.username = u.username
WHERE p.username IS NOT NULL 
  AND u.username IS NULL
ON CONFLICT (username) DO NOTHING;

-- 3) CLEAR INVALID REFRESH TOKENS
-- This removes any refresh tokens that might be causing authentication issues
-- Note: This will force users to sign in again, but it's better than being stuck
-- The auth.refresh_tokens table doesn't have an expires_at column, so we'll just clear old tokens
DELETE FROM auth.refresh_tokens 
WHERE created_at < (now() - interval '30 days');

-- 4) UPDATE ANY NULL USERNAMES WITH GENERATED ONES
-- For users without usernames, generate a temporary one based on their email
UPDATE public.profiles 
SET username = 'user_' || substr(id::text, 1, 8)
WHERE username IS NULL 
  AND id IN (
    SELECT id FROM auth.users 
    WHERE email IS NOT NULL
  );

-- 5) INSERT GENERATED USERNAMES INTO USERNAMES TABLE
INSERT INTO public.usernames (username, user_id, created_at)
SELECT 
  p.username,
  p.id,
  p.created_at
FROM public.profiles p
LEFT JOIN public.usernames u ON p.username = u.username
WHERE p.username IS NOT NULL 
  AND u.username IS NULL
  AND p.username LIKE 'user_%'
ON CONFLICT (username) DO NOTHING;

-- 6) ADD INDEX FOR BETTER PERFORMANCE
-- This helps with profile lookups during auth state changes
CREATE INDEX IF NOT EXISTS profiles_id_username_idx ON public.profiles (id, username);

-- 7) LOG THE FIXES APPLIED
-- Create a temporary table to log what was fixed
CREATE TEMP TABLE migration_log AS
SELECT 
  'profiles_created' as action,
  COUNT(*) as count
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.created_at >= (now() - interval '1 minute');

INSERT INTO migration_log (action, count)
SELECT 
  'usernames_created',
  COUNT(*)
FROM public.usernames u
WHERE u.created_at >= (now() - interval '1 minute');

INSERT INTO migration_log (action, count)
SELECT 
  'tokens_cleared',
  COUNT(*)
FROM auth.refresh_tokens 
WHERE created_at < (now() - interval '30 days');

-- Display the migration results
SELECT * FROM migration_log;

-- Clean up
DROP TABLE migration_log;

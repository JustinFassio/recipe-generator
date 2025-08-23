-- Check current RLS policies on profiles table
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
WHERE tablename = 'profiles';

-- Check if RLS is enabled on profiles table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check if the current user can access profiles
SELECT 
    auth.uid() as current_user_id,
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid()) as has_profile;

-- Fix Storage Policies for Production
-- This migration fixes the storage permissions without resetting the database

-- 1. Grant proper permissions to storage.objects
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO service_role;

-- 2. Drop existing problematic policies (including the ones we're about to create)
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own recipe images" ON storage.objects;

-- 3. Create new storage policies for recipe-images bucket
-- Policy for uploading images (any authenticated user can upload to recipe-images)
CREATE POLICY "Allow authenticated users to upload recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recipe-images');

-- Policy for viewing images (public access to recipe images)
CREATE POLICY "Allow public access to recipe images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');

-- Policy for updating images (users can update their own images)
CREATE POLICY "Allow users to update their own recipe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'recipe-images' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'recipe-images' AND auth.uid() = owner);

-- Policy for deleting images (users can delete their own images)
CREATE POLICY "Allow users to delete their own recipe images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'recipe-images' AND auth.uid() = owner);

-- 4. Create policies for avatars bucket
-- Policy for uploading avatars (users can upload to their own folder)
CREATE POLICY "Allow users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for viewing avatars (public access)
CREATE POLICY "Allow public access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy for updating avatars (users can update their own avatars)
CREATE POLICY "Allow users to update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

-- Policy for deleting avatars (users can delete their own avatars)
CREATE POLICY "Allow users to delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner);

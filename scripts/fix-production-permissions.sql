-- Fix Production Storage Permissions
-- Run this in Supabase SQL Editor

-- 1. Grant INSERT permissions to authenticated users on storage.objects
GRANT INSERT ON storage.objects TO authenticated;

-- 2. Grant SELECT permissions to authenticated users on storage.objects
GRANT SELECT ON storage.objects TO authenticated;

-- 3. Grant UPDATE permissions to authenticated users on storage.objects
GRANT UPDATE ON storage.objects TO authenticated;

-- 4. Grant DELETE permissions to authenticated users on storage.objects
GRANT DELETE ON storage.objects TO authenticated;

-- 5. Grant SELECT permissions to anon users on storage.objects (for public access)
GRANT SELECT ON storage.objects TO anon;

-- 6. Grant INSERT permissions to service_role on storage.objects
GRANT INSERT ON storage.objects TO service_role;

-- 7. Grant SELECT permissions to service_role on storage.objects
GRANT SELECT ON storage.objects TO service_role;

-- 8. Grant UPDATE permissions to service_role on storage.objects
GRANT UPDATE ON storage.objects TO service_role;

-- 9. Grant DELETE permissions to service_role on storage.objects
GRANT DELETE ON storage.objects TO service_role;

-- 10. Verify the permissions were granted
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'objects' 
AND table_schema = 'storage'
ORDER BY grantee, privilege_type;

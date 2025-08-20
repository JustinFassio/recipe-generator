/*
# Cleanup Production Seed Data

This migration removes seed/demo data from production that shouldn't be there.
We want production to be clean with only real user-generated content.

This removes:
- Demo recipes (Avocado Toast, Caesar Salad, etc.)
- Demo users (alice@example.com, bob@example.com, cora@example.com)
- Any associated demo profiles/preferences

This is safe to run and will only affect demo/seed data.
*/

-- Remove seed recipes (identifiable by their fixed UUIDs)
DELETE FROM public.recipes 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222', 
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

-- Remove seed user profiles and preferences (if they exist)
DELETE FROM public.user_safety 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('alice@example.com', 'bob@example.com', 'cora@example.com')
);

DELETE FROM public.cooking_preferences 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('alice@example.com', 'bob@example.com', 'cora@example.com')
);

DELETE FROM public.profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('alice@example.com', 'bob@example.com', 'cora@example.com')
);

DELETE FROM public.usernames 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('alice@example.com', 'bob@example.com', 'cora@example.com')
);

-- Remove seed users from auth.users (this will cascade delete everything else)
DELETE FROM auth.users 
WHERE email IN ('alice@example.com', 'bob@example.com', 'cora@example.com');

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Production seed data cleanup completed';
END $$;

# Supabase Database Deployment Guide

## Overview

This guide implements the database schema expansion plan from `docs/account-system/phase-1-database-schema-expansion.md`.

## Migration Files Created

1. `20250115000000_user_accounts.sql` - Base profiles and usernames tables
2. `20250117000000_profiles_basic_preferences.sql` - Phase 1A: Basic preferences
3. `20250118000000_user_safety.sql` - Phase 1B: Safety-critical data
4. `20250119000000_cooking_preferences.sql` - Phase 1C: Cooking preferences
5. `20250120000000_storage_buckets.sql` - Storage buckets and policies

## Deployment Steps

### Option 1: Using Supabase CLI (Recommended)

```bash
# Initialize Supabase project (if not already done)
supabase init

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Run all migrations
supabase db push

# Verify deployment
supabase db diff
```

### Option 2: Manual Deployment via Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run each migration file in order:
   - Copy the contents of each `.sql` file
   - Paste into SQL Editor
   - Execute one by one in chronological order

## Verification Steps

### 1. Check Tables Exist

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'usernames', 'user_safety', 'cooking_preferences');
```

### 2. Verify Profile Structure

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

### 3. Test RLS Policies

```sql
-- This should work (returns your own data)
SELECT * FROM user_safety WHERE user_id = auth.uid();

-- This should return empty (can't see other users' data)
SELECT * FROM user_safety WHERE user_id != auth.uid();
```

### 4. Test Storage Buckets

```sql
SELECT name, public, file_size_limit FROM storage.buckets
WHERE id IN ('avatars', 'recipe-images');
```

## Application Integration

### Profile Components Supported

**Basic Profile (`ProfileInfoForm`):**

- ✅ `profiles.region` - Geographic region
- ✅ `profiles.language` - User language preference
- ✅ `profiles.units` - Measurement units (metric/imperial)
- ✅ `profiles.time_per_meal` - Cooking time preference
- ✅ `profiles.skill_level` - Cooking skill level

**Safety Components:**

- ✅ `AllergiesField` → `user_safety.allergies`
- ✅ `DietaryRestrictionsField` → `user_safety.dietary_restrictions`
- ✅ `MedicalConditionsField` → `user_safety.medical_conditions`

**Cooking Components:**

- ✅ `PreferredCuisinesField` → `cooking_preferences.preferred_cuisines`
- ✅ `EquipmentField` → `cooking_preferences.available_equipment`
- ✅ `SpiceToleranceField` → `cooking_preferences.spice_tolerance`
- ✅ `DislikedIngredientsField` → `cooking_preferences.disliked_ingredients`

**Avatar Component:**

- ✅ `AvatarCard` → `profiles.avatar_url` + `avatars` storage bucket

### Existing Code Compatibility

**No changes needed for:**

- ✅ `src/lib/types.ts` - Already has all required types
- ✅ `src/lib/auth.ts` - `updateProfile()` already supports new fields
- ✅ `src/lib/user-preferences.ts` - Functions already implemented
- ✅ Profile hooks - All profile hooks already use correct field names

## Rollback Procedures

If you need to rollback any migration:

```sql
-- Rollback storage buckets
DROP POLICY IF EXISTS "avatar_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "avatar_read_all" ON storage.objects;
-- ... (other policies)
DELETE FROM storage.buckets WHERE id IN ('avatars', 'recipe-images');

-- Rollback cooking preferences
DROP TABLE IF EXISTS cooking_preferences CASCADE;

-- Rollback user safety
DROP TABLE IF EXISTS user_safety CASCADE;

-- Rollback basic preferences
ALTER TABLE profiles DROP COLUMN IF EXISTS region;
ALTER TABLE profiles DROP COLUMN IF EXISTS language;
ALTER TABLE profiles DROP COLUMN IF EXISTS units;
ALTER TABLE profiles DROP COLUMN IF EXISTS time_per_meal;
ALTER TABLE profiles DROP COLUMN IF EXISTS skill_level;

-- Rollback user accounts (CAREFUL - this removes all user data)
DROP TABLE IF EXISTS usernames CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

## Success Criteria

After deployment, verify:

- [ ] All tables exist with correct structure
- [ ] RLS policies prevent cross-user data access
- [ ] Storage buckets allow file uploads
- [ ] Profile components can save and load data
- [ ] Username availability checking works
- [ ] No existing functionality is broken

## Next Steps

1. Deploy the migrations
2. Test profile functionality in your application
3. Verify all profile components work with real database
4. Consider adding performance indexes if needed
5. Set up monitoring for database performance


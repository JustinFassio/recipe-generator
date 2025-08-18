# Production Issue: Missing Database Tables

## Problem Description

New users are experiencing issues when signing in because the required database tables (`profiles`, `user_safety`, `cooking_preferences`) don't exist in the production database. This causes 404 errors and prevents users from accessing the application properly.

## Root Cause

The database migrations have not been run in production. The application expects these tables to exist:

- `profiles` - User profile data
- `user_safety` - User allergies and dietary restrictions
- `cooking_preferences` - User cooking preferences

## Immediate Fix Applied

I've updated the code to handle missing tables gracefully:

### 1. AuthProvider.tsx

- Added fallback profile creation when tables don't exist
- Returns temporary profile object to prevent app crashes
- Added error code `PGRST205` handling for missing tables

### 2. user-preferences.ts

- Added graceful handling for missing `user_safety` and `cooking_preferences` tables
- Returns null instead of throwing errors when tables don't exist
- Added user-friendly error messages for update operations

## Permanent Fix Required

The database migrations need to be run in production. Here's how to do it:

### Option 1: Using Supabase CLI (Recommended)

1. **Login to Supabase CLI:**

   ```bash
   supabase login
   ```

2. **Link to your production project:**

   ```bash
   supabase link --project-ref oyjwduxjeyoazwoskqve
   ```

3. **Run the migrations:**
   ```bash
   supabase db push
   ```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration files in order:
   - `20250115000000_user_accounts.sql`
   - `20250117000000_profiles_basic_preferences.sql`
   - `20250118000000_user_safety.sql`
   - `20250119000000_cooking_preferences.sql`

### Option 3: Manual SQL Execution

If you prefer to run the migrations manually, execute these SQL files in order:

1. **User Accounts Migration** (`20250115000000_user_accounts.sql`)
   - Creates `profiles` table
   - Creates `usernames` table
   - Sets up RLS policies
   - Creates auto-profile creation trigger

2. **Basic Preferences Migration** (`20250117000000_profiles_basic_preferences.sql`)
   - Adds region, language, units, time_per_meal, skill_level to profiles

3. **User Safety Migration** (`20250118000000_user_safety.sql`)
   - Creates `user_safety` table for allergies and dietary restrictions

4. **Cooking Preferences Migration** (`20250119000000_cooking_preferences.sql`)
   - Creates `cooking_preferences` table for cuisine and equipment preferences

## Verification

After running the migrations, you can verify they worked by:

1. **Checking the tables exist:**

   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('profiles', 'user_safety', 'cooking_preferences');
   ```

2. **Testing user signup:**
   - Create a new user account
   - Verify the profile is automatically created
   - Check that the user can access the application without errors

## Impact

- **Before fix:** New users get 404 errors and can't use the application
- **After immediate fix:** Users can sign in but with limited functionality
- **After migrations:** Full functionality restored

## Notes

- The immediate fix allows users to sign in and use basic features
- Profile data will be lost until migrations are run
- User safety and cooking preferences won't be saved until tables exist
- Consider running migrations during low-traffic periods

## Files Modified

- `src/contexts/AuthProvider.tsx` - Added graceful table missing handling
- `src/lib/user-preferences.ts` - Added graceful table missing handling
- `src/lib/auth-utils.ts` - Already had profile creation logic

## Next Steps

1. Run the database migrations in production
2. Test with a new user account
3. Monitor for any remaining issues
4. Consider adding database migration status checks to the application

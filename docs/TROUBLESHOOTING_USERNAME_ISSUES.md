# Username Issues Troubleshooting Guide

## Problem Description

Users report different behavior between local and production environments:

- **Production**: Shows "Claim Username" interface
- **Local**: Shows "Current Username" and "Change Username" interface
- **Issue**: After successfully claiming a username, the "Current Username" field doesn't display

## Root Cause Analysis

### 1. Environment Differences

**Local Environment**:

- Uses `scripts/seed-users.ts` to create users with pre-set usernames
- All seeded users have usernames: `alice`, `bob`, `cora`, `david`, `emma`, `frank`
- UI shows "Current Username" because `profile.username` exists

**Production Environment**:

- Users sign up with email/password only
- No username is set during signup
- UI shows "Claim Username" because `profile.username` is null

### 2. UI Logic

The `ProfileInfoForm` component shows different interfaces based on `currentUsername`:

```typescript
{/* Current Username */}
{currentUsername && (
  <div className="form-control">
    <label className="label">
      <span className="label-text">Current Username</span>
    </label>
    <InlineIconInput
      icon={AtSign}
      value={currentUsername}
      onChange={() => {}} // disabled
      disabled={true}
    />
  </div>
)}

{/* New Username */}
<div className="form-control">
  <label className="label">
    <span className="label-text">
      {currentUsername ? 'Change Username' : 'Claim Username'}
    </span>
  </label>
  // ... input field
</div>
```

### 3. Profile Cache Issue

After claiming a username, the profile cache might not be clearing properly, causing the UI to not update.

## Troubleshooting Steps

### Step 1: Verify Current State

Run the debug script to check your environment:

```bash
# Local
npx tsx scripts/debug-username.ts

# Production (set production environment variables first)
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
npx tsx scripts/debug-username.ts
```

### Step 2: Check User's Username Status

```sql
-- Check if user has a username
SELECT id, username, full_name FROM profiles WHERE id = 'user-id-here';

-- Check usernames table
SELECT username, user_id FROM usernames WHERE user_id = 'user-id-here';
```

### Step 3: Test Username Claiming

1. **Clear user's username** (for testing):

   ```sql
   UPDATE profiles SET username = NULL WHERE id = 'user-id-here';
   DELETE FROM usernames WHERE user_id = 'user-id-here';
   ```

2. **Sign in and verify** "Claim Username" interface appears

3. **Claim a username** and verify:
   - Success message appears
   - "Current Username" field shows the new username
   - "Change Username" field appears for future changes

### Step 4: Debug Profile Cache

If the "Current Username" doesn't appear after claiming:

1. **Check browser console** for errors
2. **Clear browser cache** and refresh
3. **Sign out and sign back in** to force profile refresh
4. **Check network tab** for failed API calls

### Step 5: Verify Database Functions

Test the RPC functions directly:

```sql
-- Test username availability
SELECT is_username_available('testuser');

-- Test username update (replace with actual user ID)
SELECT update_username_atomic('user-id-here', 'newusername');
```

## Common Issues and Solutions

### Issue 1: Profile Cache Not Clearing

**Symptoms**: Username claimed successfully but UI doesn't update

**Solution**: The `refreshProfile()` function should clear the cache:

```typescript
// In useUsernameAvailability.ts
if (success) {
  // Clear username state after successful claim
  setUsername('');
  setIsAvailable(null);

  // Refresh profile to get updated data
  await refreshProfile(); // This should clear cache and fetch new data
}
```

**Debug**: Add logging to verify cache clearing:

```typescript
// In AuthProvider.tsx refreshProfile function
console.log('Clearing cache for user:', user.id);
profileCache.current.delete(user.id);
```

### Issue 2: RLS Policies Blocking Updates

**Symptoms**: Username claim fails with permission errors

**Solution**: Verify RLS policies allow users to update their own profiles:

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
```

### Issue 3: Database Function Errors

**Symptoms**: Username claim fails with database errors

**Solution**: Check function definitions and test manually:

```sql
-- Test function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%username%';

-- Test function parameters
SELECT parameter_name, parameter_mode, data_type
FROM information_schema.parameters
WHERE specific_name LIKE '%username%';
```

## Testing Checklist

### Local Environment Test

- [ ] User without username shows "Claim Username"
- [ ] User with username shows "Current Username" and "Change Username"
- [ ] Claiming username updates UI immediately
- [ ] Changing username works correctly
- [ ] Username availability checking works

### Production Environment Test

- [ ] New user signup shows "Claim Username"
- [ ] Claiming username works without errors
- [ ] UI updates to show "Current Username" after claim
- [ ] No console errors during the process
- [ ] Profile data persists after page refresh

## Environment Setup for Testing

### Create Test User Without Username

```bash
# Clear existing username
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
UPDATE profiles SET username = NULL WHERE full_name = 'Alice Baker';
DELETE FROM usernames WHERE username = 'a_baker';
"
```

### Verify Test State

```bash
# Check user has no username
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT id, username, full_name FROM profiles WHERE full_name = 'Alice Baker';
"
```

## Prevention

1. **Always test both scenarios**: users with and without usernames
2. **Use the debug script** when investigating issues
3. **Clear profile cache** after username updates
4. **Test in both local and production** environments
5. **Monitor console errors** during username operations

## Related Files

- `src/components/profile/basic/ProfileInfoForm.tsx` - UI logic
- `src/hooks/profile/useUsernameAvailability.ts` - Username management
- `src/contexts/AuthProvider.tsx` - Profile caching
- `src/lib/auth.ts` - Username API functions
- `scripts/debug-username.ts` - Debugging script
- `scripts/seed-users.ts` - Local user setup

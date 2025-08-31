# Production vs Local UI Differences - Troubleshooting Guide

## Problem Statement

The user reports that the Account/Profile UI behaves differently between production and local environments:

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

### 2. UI Logic Flow

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

## Investigation Steps

### Step 1: Verify Current Local State

```bash
# Check what users exist and their username status
npx tsx scripts/debug-username.ts

# Check specific user's profile
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT id, username, full_name, created_at, updated_at
FROM profiles
WHERE full_name LIKE '%Alice%' OR full_name LIKE '%Justin%';
"
```

### Step 2: Test Production-Like Scenario

```bash
# Clear a user's username to simulate production
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
UPDATE profiles SET username = NULL WHERE full_name = 'Alice Baker';
DELETE FROM usernames WHERE username = 'a_baker';
"

# Verify the change
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT id, username, full_name FROM profiles WHERE full_name = 'Alice Baker';
"
```

### Step 3: Test Username Claiming Flow

1. **Sign in as Alice** (`alice@example.com` / `Password123!`)
2. **Navigate to Profile page**
3. **Verify you see "Claim Username"** (not "Current Username")
4. **Test claiming a username** and verify the UI updates correctly

### Step 4: Debug Profile Cache Issues

If the "Current Username" doesn't appear after claiming:

```bash
# Check browser console for errors
# Look for:
# - Profile refresh errors
# - Database function errors
# - Cache clearing issues
```

## Potential Issues and Solutions

### Issue 1: Profile Cache Not Clearing

**Symptoms**: Username claimed successfully but UI doesn't update

**Debug Steps**:

1. Check browser console for profile refresh errors
2. Verify `refreshProfile()` is being called
3. Check if profile cache is being cleared

**Solution**: The recent fix added a delay after profile refresh:

```typescript
// Force a small delay to ensure the profile update is processed
await new Promise((resolve) => setTimeout(resolve, 100));
```

### Issue 2: Database Function Errors

**Symptoms**: Username claim fails or doesn't persist

**Debug Steps**:

1. Check browser network tab for failed API calls
2. Verify database function is working:
   ```sql
   SELECT update_username_atomic('user-id-here', 'testusername');
   ```

### Issue 3: RLS Policy Issues

**Symptoms**: Permission errors in production

**Debug Steps**:

1. Check if RLS policies are different between environments
2. Verify user permissions in production

### Issue 4: Environment Variables

**Symptoms**: Different behavior due to configuration

**Debug Steps**:

1. Check if environment variables are different
2. Verify Supabase configuration
3. Check if different database schemas are being used

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

## Debugging Tools

### 1. Database Debug Script

```bash
# Run the debug script to check environment
npx tsx scripts/debug-username.ts
```

### 2. Browser Console Debugging

Add these console logs to debug:

```typescript
// In useUsernameAvailability.ts
console.log('🔄 Username claimed successfully, refreshing profile...');
await refreshProfile();
console.log('✅ Profile refresh completed');

// In AuthProvider.tsx
console.log('🗑️ Clearing profile cache for user:', user.id);
console.log('📊 Profile data fetched:', {
  id: profileData.id,
  username: profileData.username,
  fullName: profileData.full_name,
});
```

### 3. Network Tab Analysis

Check browser network tab for:

- Failed API calls
- Profile refresh requests
- Database function calls

## Expected Behavior

### Correct Flow

1. **User without username**:
   - Shows "Claim Username" field
   - User types desired username
   - System checks availability
   - User clicks "Update Profile"
   - Success message appears
   - UI updates to show "Current Username" and "Change Username"

2. **User with username**:
   - Shows "Current Username" (read-only)
   - Shows "Change Username" field
   - User can change to new username
   - System validates and updates

### Incorrect Flow (Current Issue)

1. **User claims username successfully**
2. **Success message appears**
3. **UI still shows "Claim Username" instead of "Current Username"**
4. **Profile cache not updating properly**

## Resolution Strategy

### Phase 1: Reproduce Issue Locally

1. Clear a user's username
2. Test the claiming flow
3. Verify if the issue occurs locally

### Phase 2: Debug Production

1. Check production logs
2. Verify database state
3. Compare environment configurations

### Phase 3: Implement Fix

1. Identify the root cause
2. Implement appropriate fix
3. Test in both environments

## Related Files

- `src/components/profile/basic/ProfileInfoForm.tsx` - UI logic
- `src/hooks/profile/useUsernameAvailability.ts` - Username management
- `src/contexts/AuthProvider.tsx` - Profile caching
- `src/lib/auth.ts` - Username API functions
- `scripts/debug-username.ts` - Debugging script
- `scripts/seed-users.ts` - Local user setup

## Next Steps

1. **Reproduce the issue locally** by clearing a user's username
2. **Test the claiming flow** and observe the behavior
3. **Add debugging logs** to track the profile refresh process
4. **Compare with production** to identify differences
5. **Implement fixes** based on findings

---

**Branch**: `troubleshoot/production-local-ui-differences`  
**Created**: January 2025  
**Status**: 🔍 INVESTIGATING

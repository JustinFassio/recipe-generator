# Troubleshooting Guide

## Issues Resolved

### ✅ AuthWrapper Reference Error
**Problem**: `Uncaught ReferenceError: AuthWrapper is not defined`

**Solution**: 
- Removed the old `auth-wrapper.tsx` file
- Updated `App.tsx` to use the new `AuthProvider` and `ProtectedRoute` components
- Clear browser cache and restart development server

### ✅ Database Table Missing (404 Errors)
**Problem**: `Failed to load resource: the server responded with a status of 404 (Not Found)`

**Solution**: 
- Applied database migrations using `supabase db reset`
- Created tables: `profiles`, `usernames`, `account_events`, `reserved_usernames`
- Added proper RLS policies and database functions

### ✅ Migration Errors
**Problem**: `cannot insert multiple commands into a prepared statement`

**Solution**:
- Split complex migrations into smaller files
- Made recipes table modifications conditional
- Separated function creation from permissions

## Current Status

### ✅ Database Schema
- All tables created successfully
- RLS policies applied
- Database functions for username claiming working
- Avatar storage bucket configured

### ✅ Authentication System
- AuthProvider context implemented
- Protected routes working
- Sign up/sign in forms enhanced
- Profile management page created

## Next Steps

1. **Restart Development Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   # or
   yarn dev
   ```

2. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or open Developer Tools > Network tab > check "Disable cache"

3. **Test Authentication Flow**
   - Visit http://localhost:5174
   - Should redirect to `/auth/signin`
   - Try creating a new account
   - Test profile management at `/profile`

## Verification Steps

### Check Database Tables
```bash
supabase db studio
```
Navigate to http://localhost:54323 and verify these tables exist:
- `profiles`
- `usernames` 
- `account_events`
- `reserved_usernames`

### Test API Calls
Open browser console and run:
```javascript
// Check if user account system is working
console.log('Auth state:', window.location.pathname);
```

### Test Username Availability
1. Sign up for a new account
2. Go to Profile page
3. Try claiming a username
4. Should see real-time availability checking

## Common Issues

### Browser Caching
If you still see AuthWrapper errors:
1. Clear all browser data for localhost
2. Restart development server
3. Hard refresh the page

### Database Connection
If you see 404 errors:
1. Check `supabase status` shows all services running
2. Verify environment variables in `.env.local`:
   ```
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### Profile Loading Issues
If profiles don't load:
1. Check browser console for errors
2. Verify user is authenticated
3. Check RLS policies in Supabase Studio

## Success Indicators

You'll know everything is working when:
- ✅ No console errors
- ✅ Redirect to `/auth/signin` when not logged in
- ✅ Can create new account with full name
- ✅ Profile page loads with user info
- ✅ Username claiming works with availability check
- ✅ Avatar upload functions properly
- ✅ Header shows user dropdown with profile info

## Need Help?

If issues persist:
1. Check the browser console for specific error messages
2. Review Supabase logs in the Studio
3. Verify all migrations applied successfully
4. Test database functions directly in SQL editor

# 🔧 Cache Fix Instructions

The AuthWrapper error is caused by browser/dev server caching. Follow these steps **in order**:

## Step 1: Complete Server Reset

```bash
# In your terminal, run this script:
./reset-dev.sh
```

**Or manually:**

```bash
# Kill all dev servers
pkill -f "vite\|dev"

# Clear all caches
rm -rf node_modules/.vite .vite dist

# Wait 3 seconds
sleep 3

# Start fresh
npm run dev
```

## Step 2: Browser Cache Clear

1. **Close ALL browser tabs** with localhost:5174
2. **Clear browser cache completely**:
   - Chrome: Settings > Privacy > Clear browsing data > "All time" > Check "Cached images and files"
   - Firefox: Settings > Privacy > Clear Data > Check "Cached Web Content"
   - Safari: Develop > Empty Caches

## Step 3: Hard Refresh

1. Open **new browser tab**
2. Go to `http://localhost:5174`
3. **Hard refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
4. Open Developer Tools (F12)
5. Check console for debug messages

## Step 4: Verify Success

You should see these console messages:

```
🚀 New App component loaded - no AuthWrapper references!
🔐 AuthProvider initialized - replacing old AuthWrapper
```

**If you still see AuthWrapper errors:**

## Step 5: Nuclear Option (if needed)

```bash
# Stop everything
pkill -f "vite\|supabase"

# Clear EVERYTHING
rm -rf node_modules/.vite .vite dist
rm -rf .next .turbo

# Restart Supabase
supabase stop
supabase start

# Restart dev server
npm run dev
```

## Step 6: Browser Incognito Mode

If cache clearing doesn't work:

1. Open **Incognito/Private browsing window**
2. Go to `http://localhost:5174`
3. This bypasses all cache

## Expected Behavior After Fix

✅ **Success indicators:**

- Console shows: "🚀 New App component loaded"
- Console shows: "🔐 AuthProvider initialized"
- Page redirects to `/auth/signin`
- No "AuthWrapper is not defined" errors
- Profile fetching works (may show migration warning initially)

❌ **If still failing:**

- Check if multiple dev servers are running: `ps aux | grep vite`
- Verify App.tsx has the debug console.log
- Try different browser entirely
- Check for any IDE/editor caching

## Database Verification

Visit: http://localhost:54323 (Supabase Studio)
Verify these tables exist:

- `profiles`
- `usernames`
- `account_events`
- `reserved_usernames`

## Final Test

1. Create new account at `/auth/signin`
2. Should redirect to `/recipes`
3. Click profile dropdown in header
4. Go to "Account Settings"
5. Try claiming a username

**Everything working?** ✅ Remove the debug console.log statements from App.tsx and AuthProvider.tsx

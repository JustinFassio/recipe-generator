# Production Environment Setup Guide

## 🚨 Current Issue: Missing Environment Variables

The production deployment is failing because environment variables are not configured. This guide will help you fix this issue.

## 🔧 Quick Fix

### For Vercel (Recommended)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Select your recipe-generator project**
3. **Go to Settings → Environment Variables**
4. **Add these variables:**

```
VITE_SUPABASE_URL=https://sxvdkipywmjycithdfpp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmRraXB5d21qeWNpdGhkZnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MjEzMDUsImV4cCI6MjA3MTM5NzMwNX0.FyAyRGm7rmSsvhOpFBND4S-jc57NwDV0KwZaY3gD08k
```

5. **Set Environment to "Production"**
6. **Click "Save"**
7. **Redeploy your application**

### For Other Platforms

#### Netlify

- Go to Site Settings → Environment Variables
- Add the same variables above

#### Railway

- Go to Variables tab
- Add the same variables above

#### Render

- Go to Environment section
- Add the same variables above

## 🔍 Verification Steps

After adding environment variables:

1. **Redeploy your application**
2. **Check the browser console** - should no longer show environment variable errors
3. **Test authentication** - sign up/sign in should work
4. **Test profile functionality** - should save and load data correctly

## 🐛 Common Issues

### Issue: Still getting "ERR_NAME_NOT_RESOLVED"

- **Cause**: Environment variables not properly set or pointing to wrong Supabase project
- **Solution**:
  1. Double-check the variable names (must start with `VITE_`)
  2. Verify the Supabase URL matches your actual project
  3. Check for project ID mismatches (e.g., `sxvdkipywmjycithdfpp` vs `oyjwduxjeyoazwoskqve`)

### Issue: Different Supabase project in production vs development

- **Cause**: Production environment variables point to a different Supabase project
- **Solution**:
  1. Check your Vercel environment variables
  2. Update to match your local `.env.local` values
  3. Ensure both URL and anon key are from the same project

### Issue: "Failed to fetch" errors

- **Cause**: Supabase URL or key is incorrect
- **Solution**: Verify the values match your `.env.local` file

### Issue: Build fails

- **Cause**: Environment variables missing during build
- **Solution**: Ensure variables are set for "Production" environment

## 📋 Environment Variables Reference

| Variable                 | Value                                      | Required | Security Note                                          |
| ------------------------ | ------------------------------------------ | -------- | ------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | `https://sxvdkipywmjycithdfpp.supabase.co` | ✅ Yes   | Public URL                                             |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  | ✅ Yes   | **Safe to expose** - Anonymous key for client-side use |

### 🔒 Security Notes

**VITE_SUPABASE_ANON_KEY is SAFE to expose publicly:**

- ✅ **Designed for client-side use** - Supabase creates this key specifically for browser applications
- ✅ **Limited permissions** - Only has access defined by Row Level Security (RLS) policies
- ✅ **No admin access** - Cannot bypass security policies
- ✅ **Standard practice** - All Supabase client applications work this way

**⚠️ What to keep private:**

- `SUPABASE_SERVICE_ROLE_KEY` - This should NEVER be exposed to the browser
- Database passwords
- API keys with admin privileges

## 🚀 After Setup

Once environment variables are configured:

1. ✅ Authentication will work
2. ✅ Profile data will save/load
3. ✅ Database operations will function
4. ✅ All Phase 1 features will be available

## 📞 Support

If you continue to have issues:

1. Check the browser console for specific error messages
2. Verify your Supabase project is active
3. Ensure the database schema has been deployed (see `supabase/DEPLOYMENT_GUIDE.md`)

---

**Note**: Environment variables in `.env` and `.env.local` files are only available in development. Production deployments require explicit configuration in the hosting platform.

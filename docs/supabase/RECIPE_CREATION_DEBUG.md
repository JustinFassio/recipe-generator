# Recipe Creation Debug Guide

**Date**: August 23, 2025  
**Issue**: Recipe creation failing silently  
**Status**: 🔍 INVESTIGATING

---

## 🐛 **Problem Description**

When creating a recipe through the UI:

1. User fills out recipe form
2. Clicks "Save Recipe"
3. No error message appears
4. Recipe is not saved to database
5. User is redirected but recipe doesn't exist

---

## 🔍 **Debugging Steps**

### **1. Check Browser Console**

Open browser developer tools (F12) and check the Console tab for any errors when creating a recipe.

**Expected Errors**:

- Authentication errors
- Database constraint violations
- RLS policy violations
- Network errors

### **2. Check Network Tab**

In browser developer tools, go to the Network tab and:

1. Create a recipe
2. Look for failed requests to `/rest/v1/recipes`
3. Check the response status and error details

### **3. Test Direct API Call**

Test recipe creation directly using curl:

```bash
# Get current user's auth token from browser
# Replace YOUR_AUTH_TOKEN with the actual token

curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "title": "Test Recipe",
    "ingredients": ["ingredient 1", "ingredient 2"],
    "instructions": "Test instructions",
    "is_public": false
  }' \
  "http://127.0.0.1:54321/rest/v1/recipes"
```

### **4. Check User Authentication**

Verify the user is properly authenticated:

```bash
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  "http://127.0.0.1:54321/rest/v1/profiles?select=*"
```

### **5. Check Database Constraints**

Verify the recipe table structure and constraints:

```bash
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  "http://127.0.0.1:54321/rest/v1/recipes?select=*&limit=1"
```

---

## 🔧 **Potential Issues**

### **1. Authentication Issues**

- User not properly authenticated
- Auth token expired
- RLS policies blocking access

### **2. Database Schema Issues**

- Missing required fields
- Constraint violations
- Data type mismatches

### **3. API Issues**

- Network connectivity problems
- Supabase service issues
- CORS issues

### **4. Form Validation Issues**

- Form data not properly formatted
- Missing required fields
- Validation errors not displayed

---

## 🧪 **Testing with Seed Users**

To test recipe creation with known working users:

1. **Login as Alice**:

   ```
   Email: alice@example.com
   Password: Password123!
   ```

2. **Create a recipe** and check if it works

3. **Compare with your user** to identify differences

---

## 📋 **Debug Checklist**

- [ ] Browser console shows no errors
- [ ] Network requests are successful (200 status)
- [ ] User is properly authenticated
- [ ] Form data is valid
- [ ] Database constraints are satisfied
- [ ] RLS policies allow the operation
- [ ] API functions are working correctly

---

## ✅ **Resolution**

**Root Cause**: User account was lost during database reset (`supabase db reset`)

**Solution**: Recipe creation and sharing works perfectly with seed users (Alice, Bob, Cora)

**Verification**:

- ✅ Recipe creation works with Alice's account
- ✅ Recipe sharing toggle works correctly
- ✅ All API functions are working properly
- ✅ Database schema and RLS policies are correct

## 🚀 **Next Steps**

1. **Use seed users** for testing recipe features
2. **Recreate your account** if you want to use your own user
3. **Consider improving AuthProvider** to handle database resets better

---

## 📝 **Notes**

- The recipe creation flow involves multiple steps (form validation, API call, database insert)
- Errors can occur at any step and may not be properly displayed
- The issue might be specific to certain users or data combinations
- RLS policies might be blocking operations for some users

**Status**: ✅ **RESOLVED - Database Reset Issue**

# Local vs Production Environment Analysis

## 🔍 **Current State Analysis**

Based on the investigation, here's how the local environment is set up and why it works correctly:

### **✅ Local Environment Setup (Working)**

#### **Database Structure**

```sql
-- Profiles table
SELECT id, username, full_name FROM profiles WHERE full_name = 'Alice Baker';
-- Result: username = 'a_baker'

-- Usernames table
SELECT username, user_id FROM usernames WHERE username = 'a_baker';
-- Result: username = 'a_baker', user_id = 'c1591796-d234-4f9c-bc24-f57f53557397'
```

#### **UI Logic Flow**

1. **Profile Data Fetch**: `AuthProvider.fetchProfile()` queries `profiles` table
2. **Username Display**: `profile.username` is passed as `currentUsername` to `ProfileInfoForm`
3. **UI Rendering**:

   ```typescript
   // Shows "Current Username" because currentUsername exists
   {currentUsername && (
     <div className="form-control">
       <label>Current Username</label>
       <InlineIconInput value={currentUsername} disabled={true} />
     </div>
   )}

   // Shows "Change Username" because currentUsername exists
   <span>{currentUsername ? 'Change Username' : 'Claim Username'}</span>
   ```

#### **Data Flow**

```
Database (profiles.username = 'a_baker')
    ↓
AuthProvider.fetchProfile()
    ↓
profile.username = 'a_baker'
    ↓
ProfileInfoForm.currentUsername = 'a_baker'
    ↓
UI shows "Current Username: a_baker" + "Change Username"
```

### **❌ Production Environment Setup (Issue)**

#### **Expected Database Structure**

```sql
-- New user signup creates profile with NULL username
INSERT INTO profiles (id, username, full_name) VALUES (?, NULL, ?);

-- No entry in usernames table initially
SELECT * FROM usernames WHERE user_id = ?;
-- Result: No rows found
```

#### **Expected UI Logic Flow**

1. **Profile Data Fetch**: `AuthProvider.fetchProfile()` queries `profiles` table
2. **Username Display**: `profile.username` is `NULL`, so `currentUsername` is `null`
3. **UI Rendering**:

   ```typescript
   // Hides "Current Username" because currentUsername is null
   {currentUsername && ( ... )} // This condition is false

   // Shows "Claim Username" because currentUsername is null
   <span>{currentUsername ? 'Change Username' : 'Claim Username'}</span>
   ```

#### **Expected Data Flow**

```
Database (profiles.username = NULL)
    ↓
AuthProvider.fetchProfile()
    ↓
profile.username = null
    ↓
ProfileInfoForm.currentUsername = null
    ↓
UI shows "Claim Username" (no "Current Username" section)
```

## 🔧 **Key Differences Identified**

### **1. Database State**

| Environment    | profiles.username | usernames table | UI Behavior                  |
| -------------- | ----------------- | --------------- | ---------------------------- |
| **Local**      | `'a_baker'`       | Has entry       | Shows "Current Username"     |
| **Production** | `NULL`            | No entry        | Should show "Claim Username" |

### **2. User Creation Process**

| Environment    | Process                 | Username Status       |
| -------------- | ----------------------- | --------------------- |
| **Local**      | `scripts/seed-users.ts` | Pre-set usernames     |
| **Production** | User signup             | No username initially |

### **3. UI Logic Dependencies**

```typescript
// The UI logic depends entirely on profile.username from the database
currentUsername={profile.username}

// If profile.username is NULL → currentUsername is null → "Claim Username"
// If profile.username has value → currentUsername has value → "Current Username"
```

## 🚨 **Root Cause Analysis**

### **The Issue**

The user reports that in production:

1. User successfully claims username
2. Success message appears
3. **UI still shows "Claim Username" instead of "Current Username"**

### **Potential Causes**

#### **1. Profile Cache Not Updating**

- **Symptom**: `profile.username` remains `NULL` after username claim
- **Debug**: Check if `refreshProfile()` is called and succeeds
- **Fix**: Ensure profile cache is cleared and fresh data fetched

#### **2. Database Function Not Working**

- **Symptom**: Username claim appears successful but doesn't persist
- **Debug**: Check if `update_username_atomic()` function works in production
- **Fix**: Verify database function permissions and logic

#### **3. RLS Policy Issues**

- **Symptom**: Permission errors preventing username updates
- **Debug**: Check if user has permission to update username
- **Fix**: Verify RLS policies are correct in production

#### **4. Environment Variable Differences**

- **Symptom**: Different Supabase configuration
- **Debug**: Compare environment variables between local and production
- **Fix**: Ensure consistent configuration

## 🧪 **Testing Strategy**

### **Phase 1: Reproduce Locally**

```bash
# Clear Alice's username to simulate production
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
UPDATE profiles SET username = NULL WHERE full_name = 'Alice Baker';
DELETE FROM usernames WHERE username = 'a_baker';
"

# Verify the change
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT id, username, full_name FROM profiles WHERE full_name = 'Alice Baker';
"
```

### **Phase 2: Test Username Claiming**

1. Sign in as Alice (`alice@example.com` / `Password123!`)
2. Navigate to Profile page
3. Verify you see "Claim Username" (not "Current Username")
4. Test claiming a username and watch console logs
5. Verify UI updates to show "Current Username"

### **Phase 3: Debug Production**

1. Check production database state
2. Verify database functions work
3. Check RLS policies
4. Compare environment configurations

## 📊 **Expected vs Actual Behavior**

### **Expected (Working) Flow**

```
1. User without username → UI shows "Claim Username"
2. User claims username → Database updates
3. Profile refresh → profile.username = new_username
4. UI update → Shows "Current Username" + "Change Username"
```

### **Actual (Broken) Flow**

```
1. User without username → UI shows "Claim Username" ✅
2. User claims username → Database updates ✅
3. Profile refresh → profile.username still NULL ❌
4. UI update → Still shows "Claim Username" ❌
```

## 🔍 **Debugging Commands**

### **Local Environment**

```bash
# Check current state
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT p.id, p.username, p.full_name, u.username as username_record
FROM profiles p
LEFT JOIN usernames u ON p.id = u.user_id
WHERE p.full_name = 'Alice Baker';
"

# Test database function
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT update_username_atomic('c1591796-d234-4f9c-bc24-f57f53557397', 'testusername');
"
```

### **Production Environment**

```bash
# Check production database state (if accessible)
# Compare with local state
# Verify database functions work
# Check RLS policies
```

## 🎯 **Next Steps**

1. **Test the local simulation** to verify the issue can be reproduced
2. **Add more debugging logs** to track the exact failure point
3. **Compare production database state** with local
4. **Implement fixes** based on findings

---

**Status**: 🔍 INVESTIGATING  
**Branch**: `troubleshoot/production-local-ui-differences`  
**Created**: January 2025

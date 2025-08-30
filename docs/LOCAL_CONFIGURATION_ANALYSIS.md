# Local Configuration Analysis

## 🔍 **Local Environment Configuration**

### **Database Schema**

#### **Profiles Table**

```sql
Table "public.profiles"
Column          | Type                        | Nullable | Default
----------------+----------------------------+----------+------------------
id              | uuid                        | not null |
username        | citext                      |          |
full_name       | text                        |          |
avatar_url      | text                        |          |
bio             | text                        |          |
region          | text                        |          |
language        | text                        | not null | 'en'::text
units           | text                        | not null | 'metric'::text
time_per_meal   | integer                     |          |
skill_level     | text                        | not null | 'beginner'::text
created_at      | timestamp with time zone    | not null | now()
updated_at      | timestamp with time zone    | not null | now()

Indexes:
- "profiles_pkey" PRIMARY KEY, btree (id)
- "profiles_username_key" UNIQUE CONSTRAINT, btree (username)

Check constraints:
- "profiles_bio_check" CHECK (length(bio) <= 500)
- "profiles_full_name_check" CHECK (length(TRIM(BOTH FROM full_name)) >= 1 AND length(TRIM(BOTH FROM full_name)) <= 80)
- "profiles_skill_level_check" CHECK (skill_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'expert'::text, 'chef'::text]))
- "profiles_time_per_meal_check" CHECK (time_per_meal IS NULL OR time_per_meal >= 10 AND time_per_meal <= 120)
- "profiles_units_check" CHECK (units = ANY (ARRAY['metric'::text, 'imperial'::text]))
- "profiles_username_check" CHECK (length(username::text) >= 3 AND length(username::text) <= 24 AND username ~ '^[a-z0-9_]+$'::citext)

Foreign-key constraints:
- "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE

Policies:
- "profiles_insert_own" FOR INSERT WITH CHECK ((auth.uid() = id))
- "profiles_select_all" FOR SELECT USING (true)
- "profiles_update_own" FOR UPDATE USING ((auth.uid() = id))
```

#### **Usernames Table**

```sql
Table "public.usernames"
Column    | Type                     | Nullable | Default
----------+--------------------------+----------+----------
username  | citext                   | not null |
user_id   | uuid                     | not null |
created_at| timestamp with time zone | not null | now()

Indexes:
- "usernames_pkey" PRIMARY KEY, btree (username)
- "usernames_user_id_key" UNIQUE CONSTRAINT, btree (user_id)

Check constraints:
- "usernames_username_check" CHECK (length(username::text) >= 3 AND length(username::text) <= 24 AND username ~ '^[a-z0-9_]+$'::citext)

Foreign-key constraints:
- "usernames_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE

Policies:
- "usernames_delete_own" FOR DELETE USING ((auth.uid() = user_id))
- "usernames_insert_own" FOR INSERT WITH CHECK ((auth.uid() = user_id))
- "usernames_select_all" FOR SELECT USING (true)
- "usernames_update_own" FOR UPDATE USING ((auth.uid() = user_id))
```

### **Database Functions**

#### **update_username_atomic Function**

```sql
Function: update_username_atomic(p_user_id uuid, p_new_username citext)
Returns: boolean
Language: plpgsql
Security: DEFINER
Access: postgres=X/postgres, anon=X/postgres, authenticated=X/postgres, service_role=X/postgres

Source Code:
DECLARE
  username_exists boolean;
BEGIN
  -- Check if username is already taken by another user
  SELECT EXISTS(
    SELECT 1 FROM usernames
    WHERE username = p_new_username AND user_id != p_user_id
  ) INTO username_exists;

  IF username_exists THEN
    RETURN false;
  END IF;

  -- Update the user's username in profiles table
  UPDATE profiles
  SET username = p_new_username
  WHERE id = p_user_id;

  -- Update or insert into usernames table
  INSERT INTO usernames (username, user_id)
  VALUES (p_new_username, p_user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET username = EXCLUDED.username;

  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
```

### **RLS Policies**

#### **Profiles Table Policies**

1. **profiles_select_all**: `SELECT USING (true)` - Allows all users to read profiles
2. **profiles_insert_own**: `INSERT WITH CHECK ((auth.uid() = id))` - Users can only insert their own profile
3. **profiles_update_own**: `UPDATE USING ((auth.uid() = id))` - Users can only update their own profile

#### **Usernames Table Policies**

1. **usernames_select_all**: `SELECT USING (true)` - Allows all users to read usernames
2. **usernames_insert_own**: `INSERT WITH CHECK ((auth.uid() = user_id))` - Users can only insert their own username
3. **usernames_update_own**: `UPDATE USING ((auth.uid() = user_id))` - Users can only update their own username
4. **usernames_delete_own**: `DELETE USING ((auth.uid() = user_id))` - Users can only delete their own username

### **Environment Configuration**

#### **Local Environment Variables**

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_OPENAI_API_KEY=sk-proj-...
VITE_OPENAI_MODEL=gpt-4o-mini
```

#### **Local Supabase Configuration**

```bash
API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long

anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## 🎯 **Key Findings for Production Comparison**

### **1. Database Schema Differences to Check**

- **Profiles table**: Check if `username` column exists and has the same constraints
- **Usernames table**: Check if table exists and has the same structure
- **Indexes**: Verify unique constraints on username fields
- **Foreign key relationships**: Ensure proper relationships between tables

### **2. Database Function Differences to Check**

- **update_username_atomic**: Verify function exists and has same logic
- **Function permissions**: Check if function is accessible to authenticated users
- **Function security**: Verify SECURITY DEFINER vs INVOKER settings

### **3. RLS Policy Differences to Check**

- **Profiles policies**: Verify users can update their own profiles
- **Usernames policies**: Verify users can insert/update their own usernames
- **Policy conditions**: Check if `auth.uid() = id` conditions are correct

### **4. Environment Configuration Differences to Check**

- **API endpoints**: Compare local vs production Supabase URLs
- **API keys**: Verify different keys for different environments
- **Database connections**: Check if production uses different connection strings

## 🔧 **Testing Commands for Production**

### **1. Database Schema Verification**

```sql
-- Check if profiles table exists and has username column
\d profiles

-- Check if usernames table exists
\d usernames

-- Check if update_username_atomic function exists
\df update_username_atomic
```

### **2. RLS Policy Verification**

```sql
-- Check profiles policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Check usernames policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'usernames';
```

### **3. Function Testing**

```sql
-- Test update_username_atomic function
SELECT update_username_atomic('test-user-id', 'test_username');

-- Check if username was updated
SELECT * FROM profiles WHERE id = 'test-user-id';
SELECT * FROM usernames WHERE user_id = 'test-user-id';
```

## 📋 **Production Investigation Checklist**

- [ ] Verify profiles table schema matches local
- [ ] Verify usernames table exists and has correct structure
- [ ] Verify update_username_atomic function exists and works
- [ ] Verify RLS policies allow user updates
- [ ] Verify environment variables are correctly set
- [ ] Verify API endpoints are accessible
- [ ] Test username claiming flow in production
- [ ] Compare API responses between local and production
- [ ] Check for any environment-specific configurations
- [ ] Verify database permissions and roles

## 🎯 **Expected Production Configuration**

Based on local configuration, production should have:

1. **Same database schema** with identical constraints and indexes
2. **Same database functions** with identical logic and permissions
3. **Same RLS policies** allowing users to update their own data
4. **Different environment variables** pointing to production Supabase instance
5. **Same application logic** but different API endpoints

## 📝 **Next Steps**

1. **Access production database** to verify schema and functions
2. **Compare RLS policies** between local and production
3. **Test database functions** in production environment
4. **Check environment variables** in production deployment
5. **Compare API responses** between environments
6. **Document any differences** found
7. **Create resolution plan** for any discrepancies

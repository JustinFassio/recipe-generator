# Supabase Migration Best Practices

**Last Updated**: August 26, 2024  
**Purpose**: Prevent the migration issues we just encountered and ensure smooth database deployments

---

## 🚨 **Critical Rules (Never Break These)**

### **Rule 1: One SQL Command Per Migration File**

**What we learned**: Supabase migrations run in transactions, and PostgreSQL has strict limitations.

**✅ CORRECT**:

```sql
-- 20250121000001_create_function.sql
CREATE OR REPLACE FUNCTION my_function() RETURNS void AS $$
BEGIN
  -- function body
END;
$$ LANGUAGE plpgsql;
```

**❌ WRONG**:

```sql
-- 20250121000001_functions_and_grants.sql
CREATE OR REPLACE FUNCTION my_function() RETURNS void AS $$
BEGIN
  -- function body
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION my_function() TO authenticated; -- SECOND COMMAND!
```

### **Rule 2: No CONCURRENTLY in Migrations**

**What we learned**: `CREATE INDEX CONCURRENTLY` cannot run in transactions.

**✅ CORRECT** (for local dev):

```sql
CREATE INDEX idx_profiles_username ON profiles (username);
```

**❌ WRONG**:

```sql
CREATE INDEX CONCURRENTLY idx_profiles_username ON profiles (username);
```

**Note**: Use `CONCURRENTLY` only in production via manual SQL execution, not in migrations.

### **Rule 3: Separate Functions and Grants**

**What we learned**: Each function and each grant must be in separate files.

**✅ CORRECT Structure**:

```
20250121000001_create_function.sql     # Function only
20250121000002_grant_function.sql      # Grant only
```

**❌ WRONG Structure**:

```
20250121000001_function_and_grant.sql  # Both in one file
```

---

## 📋 **Migration File Naming Convention**

### **Format**: `YYYYMMDDHHMMSS_descriptive_name.sql`

**Examples**:

- `20250121000000_baseline_schema.sql`
- `20250121000001_create_profiles_table.sql`
- `20250121000002_add_user_safety_table.sql`
- `20250121000003_create_username_function.sql`
- `20250121000004_grant_username_function.sql`

### **Naming Guidelines**:

- Use descriptive names that explain what the migration does
- Use lowercase with underscores
- Be specific about the operation (create, add, modify, grant, etc.)
- Include the table/function name in the filename

---

## 🔧 **Migration Types and Structure**

### **1. Table Creation Migrations**

```sql
-- 20250121000001_create_profiles_table.sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username citext UNIQUE,
  full_name text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (one per migration file)
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
```

### **2. Function Creation Migrations**

```sql
-- 20250121000002_create_username_function.sql
CREATE OR REPLACE FUNCTION is_username_available(p_username citext)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS(
    SELECT 1 FROM usernames
    WHERE username = p_username
  );
END;
$$;
```

### **3. Grant Permission Migrations**

```sql
-- 20250121000003_grant_username_function.sql
GRANT EXECUTE ON FUNCTION is_username_available TO authenticated;
```

### **4. Index Creation Migrations**

```sql
-- 20250121000004_create_username_index.sql
CREATE INDEX idx_profiles_username_lower
ON profiles (LOWER(username))
WHERE username IS NOT NULL;
```

### **5. Policy Creation Migrations**

```sql
-- 20250121000005_profiles_select_policy.sql
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
```

---

## 🚀 **Migration Workflow**

### **Step 1: Plan Your Changes**

1. **List all operations** you need to perform
2. **Count SQL commands** - each needs its own file
3. **Order dependencies** - tables before functions, functions before grants
4. **Name files** following the convention

### **Step 2: Create Migration Files**

```bash
# Example: Adding a new table with functions and policies
npx supabase migration new create_user_preferences_table
npx supabase migration new create_preferences_function
npx supabase migration new grant_preferences_function
npx supabase migration new create_preferences_policies
```

### **Step 3: Test Locally**

```bash
# Always test locally first
npx supabase db reset
npx supabase db push
```

### **Step 4: Deploy to Production**

```bash
# Only after local testing passes
npx supabase db push
```

---

## 🔍 **Common Migration Patterns**

### **Adding a New Table with Full Setup**

**Files needed**:

1. `create_table.sql` - Table definition
2. `enable_rls.sql` - Enable RLS
3. `create_policy_1.sql` - First policy
4. `create_policy_2.sql` - Second policy
5. `create_index.sql` - Indexes
6. `create_function.sql` - Functions
7. `grant_function.sql` - Grants

### **Adding a New Function**

**Files needed**:

1. `create_function.sql` - Function definition
2. `grant_function.sql` - Grant permissions

### **Modifying Existing Table**

**Files needed**:

1. `add_column.sql` - Add new column
2. `update_existing_data.sql` - Update existing rows (if needed)
3. `create_index.sql` - Index for new column (if needed)

---

## 🚨 **Troubleshooting Common Issues**

### **Issue: "cannot insert multiple commands into a prepared statement"**

**Cause**: Multiple SQL commands in one migration file
**Solution**: Split into separate migration files

### **Issue: "CREATE INDEX CONCURRENTLY cannot be executed within a pipeline"**

**Cause**: Using CONCURRENTLY in migration
**Solution**: Remove CONCURRENTLY for local dev, use regular CREATE INDEX

### **Issue: "function does not exist"**

**Cause**: Trying to grant permissions before function exists
**Solution**: Ensure function migration runs before grant migration

### **Issue: "table does not exist"**

**Cause**: Trying to create policies/indexes before table exists
**Solution**: Ensure table migration runs before dependent migrations

---

## 📊 **Migration Checklist**

Before creating a migration:

- [ ] **One SQL command per file**
- [ ] **No CONCURRENTLY keywords**
- [ ] **Dependencies in correct order** (tables → functions → grants)
- [ ] **Descriptive filename** following convention
- [ ] **Test locally** with `supabase db reset`
- [ ] **Verify functionality** after migration
- [ ] **Document changes** in commit message

Before deploying to production:

- [ ] **All local tests pass**
- [ ] **Migration order is correct**
- [ ] **No breaking changes** to existing functionality
- [ ] **Backup production** (if major changes)
- [ ] **Test in staging** (if available)

---

## 🎯 **Quick Reference Commands**

### **Create New Migration**

```bash
npx supabase migration new descriptive_name
```

### **Reset Local Database**

```bash
npx supabase db reset
```

### **Apply Migrations**

```bash
npx supabase db push
```

### **Check Migration Status**

```bash
npx supabase migration list
```

### **Check for Schema Differences**

```bash
npx supabase db diff
```

---

## 📝 **Example: Complete Feature Migration**

**Goal**: Add user preferences table with functions

**Migration Files**:

```
20250121000001_create_user_preferences_table.sql
20250121000002_enable_preferences_rls.sql
20250121000003_create_preferences_select_policy.sql
20250121000004_create_preferences_insert_policy.sql
20250121000005_create_preferences_update_policy.sql
20250121000006_create_preferences_index.sql
20250121000007_create_get_preferences_function.sql
20250121000008_grant_get_preferences_function.sql
```

**Testing**:

```bash
npx supabase db reset
# Verify all migrations apply successfully
# Test the new functionality
# Deploy to production
```

---

## 🚀 **Best Practices Summary**

1. **Always use one SQL command per migration file**
2. **Never use CONCURRENTLY in migrations**
3. **Separate functions and grants into different files**
4. **Test locally before deploying**
5. **Use descriptive filenames**
6. **Order dependencies correctly**
7. **Document your changes**
8. **Follow the naming convention**

**Remember**: It's better to have 10 small, focused migration files than 1 large, complex file that breaks everything.

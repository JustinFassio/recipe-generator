# Supabase Troubleshooting Guide

**Last Updated**: August 26, 2024  
**Purpose**: Quick solutions to common Supabase issues we've encountered

---

## 🚨 **Critical Issues & Solutions**

### **Issue 1: "cannot insert multiple commands into a prepared statement"**

**Symptoms**:

- Migration fails during `supabase db reset`
- Error occurs at specific statement number
- Multiple SQL commands in one migration file

**Root Cause**: Supabase migrations run in transactions, and PostgreSQL requires one command per prepared statement.

**Immediate Fix**:

1. **Identify the problematic migration file**
2. **Count the SQL commands** in the file
3. **Split into separate files** - one command per file
4. **Rename files** to maintain order

**Example Fix**:

```bash
# Before: 20250121000001_functions.sql (contains 3 commands)
CREATE OR REPLACE FUNCTION func1() RETURNS void AS $$ ... $$;
CREATE OR REPLACE FUNCTION func2() RETURNS void AS $$ ... $$;
GRANT EXECUTE ON FUNCTION func1() TO authenticated;

# After: Split into 3 files
20250121000001_create_func1.sql
20250121000002_create_func2.sql
20250121000003_grant_func1.sql
```

**Prevention**: Always use one SQL command per migration file.

---

### **Issue 2: "CREATE INDEX CONCURRENTLY cannot be executed within a pipeline"**

**Symptoms**:

- Migration fails during index creation
- Error mentions "pipeline" or "transaction"

**Root Cause**: `CONCURRENTLY` indexes cannot run in transactions (which migrations use).

**Immediate Fix**:

1. **Remove `CONCURRENTLY`** from all index creation statements
2. **Use regular `CREATE INDEX`** for local development
3. **Apply `CONCURRENTLY` indexes manually** in production if needed

**Example Fix**:

```sql
-- Before (WRONG)
CREATE INDEX CONCURRENTLY idx_profiles_username ON profiles (username);

-- After (CORRECT)
CREATE INDEX idx_profiles_username ON profiles (username);
```

**Prevention**: Never use `CONCURRENTLY` in migration files.

---

### **Issue 3: "function does not exist" or "table does not exist"**

**Symptoms**:

- Migration fails when trying to grant permissions
- Error mentions missing function or table

**Root Cause**: Dependencies not in correct order (trying to grant permissions before function exists).

**Immediate Fix**:

1. **Check migration order** - functions must come before grants
2. **Ensure table migrations** run before function migrations
3. **Verify file naming** follows timestamp order

**Example Fix**:

```bash
# Wrong order
20250121000001_grant_function.sql    # Tries to grant before function exists
20250121000002_create_function.sql   # Function created after grant

# Correct order
20250121000001_create_function.sql   # Function created first
20250121000002_grant_function.sql    # Grant after function exists
```

**Prevention**: Always order migrations: tables → functions → grants → indexes.

---

### **Issue 4: "Key (user_id) is not present in table 'profiles'**

**Symptoms**:

- Seed script fails during user creation
- Foreign key constraint violation

**Root Cause**: Trying to insert into dependent table before parent table has the record.

**Immediate Fix**:

1. **Use `upsert` instead of `update`** in seed scripts
2. **Ensure proper order** of operations
3. **Check foreign key relationships**

**Example Fix**:

```typescript
// Before (WRONG)
const { error } = await admin.from('profiles').update(updates).eq('id', userId);

// After (CORRECT)
const { error } = await admin
  .from('profiles')
  .upsert({ id: userId, ...updates });
```

**Prevention**: Always use `upsert` for seed scripts to handle existing data.

---

## 🔧 **Database Reset Issues**

### **Issue: Migration History Corruption**

**Symptoms**:

- `supabase db reset` fails with migration errors
- Migration list shows inconsistencies

**Solution**:

1. **Stop Supabase services**
2. **Delete local database** (if safe)
3. **Recreate migration files** following best practices
4. **Reset migration history**

```bash
# Nuclear option (use carefully)
npx supabase stop
npx supabase start
npx supabase db reset
```

### **Issue: Port Conflicts**

**Symptoms**:

- Supabase services won't start
- Port already in use errors

**Solution**:

```bash
# Check what's using the ports
lsof -i :54321  # API port
lsof -i :54322  # Database port
lsof -i :54323  # Studio port

# Kill conflicting processes
kill -9 <PID>

# Or use different ports
npx supabase start --port 54324
```

---

## 🚀 **Development Workflow Issues**

### **Issue: Environment Variables Not Set**

**Symptoms**:

- Seed script fails with "Missing SUPABASE_SERVICE_ROLE_KEY"
- API calls fail with authentication errors

**Solution**:

```bash
# Get service role key
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n')

# Set environment variables
export SUPABASE_URL=http://127.0.0.1:54321
export SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Run seed script
npm run seed
```

### **Issue: App Can't Connect to Database**

**Symptoms**:

- App shows connection errors
- Console shows Supabase client errors

**Solution**:

1. **Verify Supabase is running**
2. **Check environment variables**
3. **Verify database is accessible**

```bash
# Check Supabase status
npx supabase status

# Test database connection
curl -H "apikey: $(npx supabase status | sed -n 's/^anon key: //p' | tr -d '\n')" \
  "http://127.0.0.1:54321/rest/v1/profiles?select=*&limit=1"
```

---

## 📊 **Verification Commands**

### **Check Database Health**

```bash
# Verify Supabase is running
npx supabase status

# Check migration status
npx supabase migration list

# Verify schema
npx supabase db diff

# Test database connection
npx supabase db reset
```

### **Check Application Health**

```bash
# Start development server
npm run dev

# Test seed script
npm run seed

# Run tests
npm test
```

---

## 🎯 **Quick Recovery Procedures**

### **Complete Reset (Nuclear Option)**

```bash
# 1. Stop everything
npx supabase stop
npm run dev -- --kill

# 2. Clean start
npx supabase start
npx supabase db reset

# 3. Seed data
npm run seed

# 4. Start app
npm run dev
```

### **Migration Recovery**

```bash
# 1. Check current state
npx supabase migration list

# 2. Reset if needed
npx supabase db reset

# 3. Verify migrations apply
npx supabase db push
```

### **Seed Data Recovery**

```bash
# 1. Get service role key
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n')

# 2. Set environment
export SUPABASE_URL=http://127.0.0.1:54321
export SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# 3. Run seed
npm run seed
```

---

## 🚨 **Emergency Procedures**

### **When Everything is Broken**

1. **Document the error** - take screenshots, copy error messages
2. **Check this troubleshooting guide** for the specific error
3. **Try the quick recovery procedures**
4. **If still broken, use nuclear option**
5. **Recreate from clean state** following best practices

### **When Migrations Are Corrupted**

1. **Backup any important data** (if any)
2. **Delete all migration files** except the baseline
3. **Recreate migrations** following the best practices guide
4. **Test locally** before deploying
5. **Document what went wrong** to prevent recurrence

---

## 📝 **Prevention Checklist**

**Before Creating Migrations**:

- [ ] **One SQL command per file**
- [ ] **No CONCURRENTLY keywords**
- [ ] **Proper file naming** with timestamps
- [ ] **Dependencies in correct order**

**Before Deploying**:

- [ ] **Test locally** with `supabase db reset`
- [ ] **Verify all migrations apply**
- [ ] **Test seed script**
- [ ] **Check application functionality**

**After Deployment**:

- [ ] **Verify production database**
- [ ] **Test critical functionality**
- [ ] **Monitor for errors**
- [ ] **Document any issues**

---

**Remember**: When in doubt, start fresh with a clean database and follow the best practices guide. It's faster to rebuild correctly than to debug complex migration issues.

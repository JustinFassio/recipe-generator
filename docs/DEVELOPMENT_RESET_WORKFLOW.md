# Development Reset Workflow

**GOAL**: Eliminate manual database troubleshooting by providing automated, bulletproof reset procedures.

---

## 🚀 Quick Reset Commands

### **One-Command Full Reset**

```bash
npm run reset
```

This is the **recommended** way to reset your development environment. It handles everything automatically.

### **Alternative Reset Options**

```bash
# Database-only reset (keeps dev server running)
npm run db:fresh

# Just restart the dev server (no database changes)
npm run dev:restart

# Check database status
npm run db:status

# Verify database state
npm run db:verify
```

---

## 🔧 What the Reset Script Does

The `npm run reset` command performs these steps automatically:

1. **Kills all running processes** (dev server, Supabase)
2. **Clears caches** (Vite, build artifacts)
3. **Checks prerequisites** (Node.js, psql)
4. **Starts Supabase** services
5. **Waits for services** to be ready (with retry logic)
6. **Resets database** (applies all migrations)
7. **Sets up environment** (service role key, URLs)
8. **Seeds database** (users, recipes with categories)
9. **Verifies database state** (recipe count, categories, users)
10. **Starts dev server** on port 5174

---

## 📊 Expected Results After Reset

### **Database State**

- ✅ **6 test users** with full profiles
- ✅ **21 recipes** with comprehensive categories
- ✅ **8 public recipes** and 13 private recipes
- ✅ **All recipes have categories** (100% coverage)

### **Test Accounts**

```
alice@example.com (Password123!) - Vegetarian home cook
bob@example.com (Password123!) - Grill enthusiast
cora@example.com (Password123!) - Bold flavors lover
david@example.com (Password123!) - Baker/gluten-free
emma@example.com (Password123!) - Health-conscious
frank@example.com (Password123!) - Spice lover
```

### **Services**

- ✅ **App**: http://localhost:5174
- ✅ **Supabase Studio**: http://localhost:54323
- ✅ **Database**: PostgreSQL on port 54322

---

## 🛠️ Available Scripts

### **Database Management**

```bash
npm run db:status      # Check Supabase status
npm run db:start       # Start Supabase services
npm run db:stop        # Stop Supabase services
npm run db:reset       # Reset database (migrations only)
npm run db:fresh       # Full database reset + seed
npm run db:backup      # Create database backup
npm run db:verify      # Verify database state
```

### **Development Server**

```bash
npm run dev            # Start dev server
npm run dev:fresh      # Reset DB + start dev server
npm run dev:kill       # Kill all dev processes
npm run dev:restart    # Restart dev server only
```

### **Data Management**

```bash
npm run seed           # Seed database with test data
npm run reset          # Full environment reset
```

---

## 🚨 When to Use Each Command

### **Use `npm run reset` when:**

- Starting development for the first time
- After pulling new migrations
- When database is in an unknown state
- When you want a completely fresh environment
- When troubleshooting database issues

### **Use `npm run db:fresh` when:**

- You want to reset database but keep dev server running
- Testing database changes
- You're in the middle of development and just need fresh data

### **Use `npm run dev:restart` when:**

- Dev server is stuck or not responding
- You've made code changes and want to restart
- Port conflicts or other server issues

### **Use `npm run db:verify` when:**

- Checking if database is properly seeded
- Verifying category data is present
- Debugging data-related issues

---

## 🔍 Troubleshooting

### **Reset Script Fails**

If `npm run reset` fails:

1. **Check prerequisites**:

   ```bash
   node --version  # Should be 18+
   npx --version   # Should be available
   ```

2. **Manual cleanup**:

   ```bash
   # Kill all processes
   pkill -f "vite\|dev\|supabase" 2>/dev/null || true

   # Clear caches
   rm -rf node_modules/.vite .vite dist

   # Try again
   npm run reset
   ```

3. **Nuclear option** (if still failing):

   ```bash
   # Stop everything
   npm run db:stop

   # Remove Supabase data (WARNING: destroys all local data)
   rm -rf ~/.supabase

   # Start fresh
   npm run reset
   ```

### **Database Verification Fails**

If `npm run db:verify` shows issues:

1. **Check if Supabase is running**:

   ```bash
   npm run db:status
   ```

2. **Check database connection**:

   ```bash
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1;"
   ```

3. **Re-seed if needed**:
   ```bash
   npm run seed
   ```

### **Dev Server Won't Start**

If the dev server fails to start:

1. **Check port conflicts**:

   ```bash
   lsof -i :5174
   ```

2. **Kill conflicting processes**:

   ```bash
   npm run dev:kill
   ```

3. **Try different port**:
   ```bash
   npm run dev -- --port 5175
   ```

---

## 📝 Best Practices

### **Before Resetting**

1. **Save any important work** (commits, stashes)
2. **Note any custom data** you want to preserve
3. **Check if you're in the right branch**

### **After Resetting**

1. **Verify the app loads** at http://localhost:5174
2. **Test login** with one of the test accounts
3. **Check that recipes display** with categories
4. **Verify category filtering** works

### **During Development**

1. **Use `npm run db:fresh`** for quick database resets
2. **Use `npm run dev:restart`** for server issues
3. **Use `npm run db:verify`** to check database state
4. **Commit frequently** to avoid losing work

---

## 🎯 Why This Workflow Exists

### **Problems This Solves**

- ❌ Manual database troubleshooting
- ❌ Inconsistent development environments
- ❌ Broken functionality after resets
- ❌ Time wasted on setup issues
- ❌ "Works on my machine" problems

### **Benefits**

- ✅ **Consistent environment** every time
- ✅ **No manual troubleshooting** required
- ✅ **Complete test data** with categories
- ✅ **Fast reset** (under 2 minutes)
- ✅ **Verification built-in** to catch issues
- ✅ **Clear error messages** when things go wrong

---

## 🚀 Quick Reference

```bash
# 🎯 RECOMMENDED: Full reset (use this most of the time)
npm run reset

# 🔄 Quick database reset (keep dev server)
npm run db:fresh

# 🔄 Restart dev server only
npm run dev:restart

# 🔍 Check database state
npm run db:verify

# 📊 Check Supabase status
npm run db:status
```

**Remember**: Use `npm run reset` as your go-to command for any database or environment issues. It's designed to be bulletproof and will get you back to a working state quickly.

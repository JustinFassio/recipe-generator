# Supabase Database Implementation Plan

## Overview

Clean implementation of the Recipe Generator's Supabase database to support the completed profile modularization system. This is a fresh build - no emergency fixes needed.

## Current Status: Ready for Clean Implementation

The profile modularization is complete with all components built. Now we implement the database layer that supports this architecture.

## Implementation Phases

### Phase 1: Core Database Setup (Day 1)

**File**: `phase-1-core-database-setup.md`

- Set up basic tables: profiles, user_safety, cooking_preferences
- Implement Row Level Security policies
- Create storage buckets for avatars

### Phase 2: Recipe Media Enhancement (Day 2)

**File**: `phase-2-recipe-media-enhancement.md`

- Add video support to recipes (simple approach)
- Enhance storage buckets and policies
- Update API for video uploads

### Phase 3: Performance & Testing (Day 3)

**File**: `phase-3-performance-testing.md`

- Add strategic database indexes
- Create testing infrastructure for Phase 4 profile tests
- Performance validation

## Success Metrics

- ✅ Profile system fully functional with database persistence
- ✅ Recipe storage with image and video support
- ✅ Authentication and authorization working
- ✅ Performance targets met (<200ms profile loads)
- ✅ Testing infrastructure ready for Phase 4

## Architecture Principles

- **Keep it Simple**: Follow existing MVP patterns
- **Feature-Complete**: Support all profile modularization components
- **Performance-Ready**: Strategic indexing without over-optimization
- **Test-Enabled**: Support comprehensive testing infrastructure

Each phase builds on the previous and can be deployed independently.

---

## 📚 **Documentation Index**

### **Core References**

- [`CORE_DATABASE_SCHEMA.md`](./CORE_DATABASE_SCHEMA.md) - Complete database schema reference
- [`MIGRATION_BEST_PRACTICES.md`](./MIGRATION_BEST_PRACTICES.md) - Migration guidelines and rules
- [`TROUBLESHOOTING_GUIDE.md`](./TROUBLESHOOTING_GUIDE.md) - Quick solutions to common issues

### **Implementation Guides**

- [`phase-1-core-database-setup.md`](./phase-1-core-database-setup.md) - Core database setup
- [`phase-1-clean-setup.md`](./phase-1-clean-setup.md) - Bulletproof setup guide
- [`phase-2-recipe-media-enhancement.md`](./phase-2-recipe-media-enhancement.md) - Video support
- [`phase-3-performance-testing.md`](./phase-3-performance-testing.md) - Performance optimization

### **Historical Documentation**

- [`COMPREHENSIVE_AUDIT_REPORT.md`](./COMPREHENSIVE_AUDIT_REPORT.md) - Production audit results
- [`MIGRATION_HISTORY_RESET_COMPLETE.md`](./MIGRATION_HISTORY_RESET_COMPLETE.md) - Migration reset documentation

---

## 🚨 **Critical Lessons Learned**

### **Migration Rules (Never Break These)**

1. **One SQL command per migration file** - Supabase migrations run in transactions
2. **No CONCURRENTLY in migrations** - Use regular CREATE INDEX for local dev
3. **Separate functions and grants** - Each needs its own migration file
4. **Order dependencies correctly** - Tables → Functions → Grants → Indexes

### **Common Pitfalls**

- ❌ Multiple commands in one migration file
- ❌ Using CONCURRENTLY in migrations
- ❌ Combining functions and grants
- ❌ Wrong migration order
- ❌ Using UPDATE instead of UPSERT in seed scripts

### **Best Practices**

- ✅ Test locally with `supabase db reset` before deploying
- ✅ Use descriptive migration filenames
- ✅ Follow the naming convention: `YYYYMMDDHHMMSS_descriptive_name.sql`
- ✅ Document all changes
- ✅ Keep migrations atomic and focused

---

## 🚀 **Quick Start Commands**

### **Local Development**

```bash
# Start Supabase
npx supabase start

# Reset database (applies all migrations)
npx supabase db reset

# Seed test data
npm run seed

# Start development server
npm run dev
```

### **Migration Management**

```bash
# Create new migration
npx supabase migration new descriptive_name

# Check migration status
npx supabase migration list

# Apply migrations to production
npx supabase db push

# Check for schema differences
npx supabase db diff
```

### **Troubleshooting**

```bash
# Complete reset (nuclear option)
npx supabase stop
npx supabase start
npx supabase db reset

# Check Supabase status
npx supabase status

# Test database connection
curl -H "apikey: $(npx supabase status | sed -n 's/^anon key: //p' | tr -d '\n')" \
  "http://127.0.0.1:54321/rest/v1/profiles?select=*&limit=1"
```

---

## 📊 **Current Database State**

### **Tables**

- ✅ `profiles` - User profiles with preferences
- ✅ `user_safety` - Health and dietary information
- ✅ `cooking_preferences` - User cooking preferences
- ✅ `usernames` - Username management
- ✅ `recipes` - Recipe storage with media support

### **Functions**

- ✅ `is_username_available()` - Username availability check
- ✅ `update_username_atomic()` - Atomic username updates
- ✅ `claim_username_atomic()` - Username claiming

### **Security**

- ✅ Row Level Security (RLS) on all tables
- ✅ Proper policies for data access
- ✅ Storage bucket policies for file uploads

### **Performance**

- ✅ Strategic indexes for common queries
- ✅ GIN indexes for array-based searches
- ✅ Optimized for profile loading and recipe queries

---

## 🎯 **Next Steps**

1. **Follow the migration best practices** for any new database changes
2. **Use the troubleshooting guide** if issues arise
3. **Reference the core schema** for any schema questions
4. **Test locally** before deploying to production
5. **Document any new issues** and solutions

**Remember**: It's better to have 10 small, focused migration files than 1 large, complex file that breaks everything.

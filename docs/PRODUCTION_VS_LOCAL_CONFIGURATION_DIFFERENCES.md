# Production vs Local Configuration Differences

## 🔍 **Investigation Plan**

### **Phase 1: Database Configuration Differences**

#### **1. Database Schema Comparison**

```bash
# Local Database Schema
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\d profiles"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\d usernames"

# Production Database Schema (if accessible)
# Compare the table structures, constraints, and indexes
```

#### **2. Database Functions Comparison**

```bash
# Local Database Functions
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\df update_username_atomic"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\df claim_username_atomic"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\df is_username_available"

# Production Database Functions (if accessible)
# Compare function definitions and permissions
```

#### **3. RLS Policies Comparison**

```bash
# Local RLS Policies
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename IN ('profiles', 'usernames');"

# Production RLS Policies (if accessible)
# Compare policy definitions and permissions
```

### **Phase 2: Environment Configuration Differences**

#### **1. Environment Variables**

```bash
# Local Environment
cat .env.local
cat .env

# Production Environment Variables (check in deployment platform)
# Compare:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - Database connection strings
```

#### **2. Supabase Configuration**

```bash
# Local Supabase Status
npx supabase status

# Production Supabase Configuration
# Check in Supabase dashboard:
# - Project settings
# - API settings
# - Database settings
# - Auth settings
```

### **Phase 3: Application Configuration Differences**

#### **1. Build Configuration**

```bash
# Local Build
npm run build

# Production Build
# Check if there are different build configurations
# - Environment-specific builds
# - Different API endpoints
# - Different feature flags
```

#### **2. Runtime Configuration**

```bash
# Local Runtime
# Check browser console for:
# - API endpoints being called
# - Environment variables
# - Feature flags

# Production Runtime
# Check browser console for:
# - API endpoints being called
# - Environment variables
# - Feature flags
```

## 🎯 **Specific Areas to Investigate**

### **1. Database Function Behavior**

- **Local**: Functions work correctly
- **Production**: Functions may have different behavior
- **Investigation**: Test the same function calls in both environments

### **2. Profile Cache Behavior**

- **Local**: Profile cache refreshes correctly
- **Production**: Profile cache may not refresh properly
- **Investigation**: Compare cache invalidation logic

### **3. RLS Policy Differences**

- **Local**: RLS policies allow profile updates
- **Production**: RLS policies may be more restrictive
- **Investigation**: Compare policy definitions

### **4. API Endpoint Differences**

- **Local**: Uses local Supabase instance
- **Production**: Uses production Supabase instance
- **Investigation**: Compare API responses

## 🔧 **Testing Strategy**

### **1. Create Test Scripts**

```bash
# Test database functions locally
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT update_username_atomic('test-user-id', 'test_username');"

# Test profile queries locally
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT * FROM profiles WHERE id = 'test-user-id';"
```

### **2. Compare API Responses**

```bash
# Local API Response
curl -X GET "http://localhost:54321/rest/v1/profiles?select=*&id=eq.test-user-id" \
  -H "apikey: your-local-anon-key" \
  -H "Authorization: Bearer your-local-token"

# Production API Response (if accessible)
curl -X GET "https://your-project.supabase.co/rest/v1/profiles?select=*&id=eq.test-user-id" \
  -H "apikey: your-production-anon-key" \
  -H "Authorization: Bearer your-production-token"
```

### **3. Environment Simulation**

```bash
# Simulate production environment locally
# 1. Clear all usernames from local database
# 2. Test the complete flow
# 3. Compare behavior with production
```

## 📋 **Checklist for Investigation**

- [ ] Compare database schemas
- [ ] Compare database functions
- [ ] Compare RLS policies
- [ ] Compare environment variables
- [ ] Compare Supabase configurations
- [ ] Compare API responses
- [ ] Test database functions in both environments
- [ ] Test profile cache behavior in both environments
- [ ] Compare build configurations
- [ ] Compare runtime configurations

## 🎯 **Expected Outcomes**

1. **Identify specific configuration differences** between local and production
2. **Understand why the UI behaves differently** in each environment
3. **Create a plan to align configurations** or handle differences appropriately
4. **Document the findings** for future reference

## 📝 **Next Steps**

1. **Start with database schema comparison** (easiest to investigate)
2. **Move to environment configuration** (may require deployment platform access)
3. **Test specific scenarios** in both environments
4. **Document findings** and create resolution plan

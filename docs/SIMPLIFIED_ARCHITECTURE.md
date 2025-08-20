# Simplified Supabase Architecture

## Overview

This document outlines the simplified, straightforward connection between the frontend and Supabase backend for the Recipe Generator app.

## Architecture Summary

### **1. Client Configuration (`src/lib/supabase.ts`)**

- **Simple Setup**: Single Supabase client with basic auth configuration
- **Environment Variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Error Handling**: Basic validation for missing environment variables
- **Types**: Re-exported from centralized types file

### **2. Data Types (`src/lib/types.ts`)**

- **Centralized**: All TypeScript interfaces in one location
- **Core Types**: Recipe, Profile, Username, AuthError, etc.
- **Consistent**: Standardized error handling and response types

### **3. API Layer (`src/lib/api.ts`)**

- **Clean Operations**: Simple CRUD operations for recipes
- **Error Handling**: Consistent error handling with descriptive messages
- **Separation of Concerns**: Recipe parsing logic extracted to separate module

### **4. Recipe Parsing (`src/lib/recipe-parser.ts`)**

- **Dedicated Module**: Handles complex JSON and markdown parsing
- **Flexible**: Supports multiple input formats
- **Maintainable**: Clear separation from API operations

### **5. Authentication (`src/lib/auth.ts`)**

- **Streamlined**: Simplified auth operations with consistent error handling
- **Helper Functions**: Reusable error creation and validation
- **Type Safety**: Uses centralized types for better consistency

### **6. React Hooks (`src/hooks/use-recipes.ts`)**

- **TanStack Query**: Efficient caching and state management
- **Consistent**: Uses centralized types and API layer
- **User Feedback**: Toast notifications for all operations

## Database Schema

### **Core Tables**

#### **profiles**

```sql
- id (uuid, primary key)
- username (citext, unique)
- full_name (text)
- avatar_url (text)
- bio (text)
- region, language, units, time_per_meal, skill_level (preferences)
- created_at, updated_at (timestamps)
```

#### **recipes**

```sql
- id (uuid, primary key)
- title (text, required)
- ingredients (text[], required)
- instructions (text, required)
- notes (text)
- image_url (text)
- user_id (uuid, foreign key)
- is_public (boolean, default false)
- created_at, updated_at (timestamps)
```

#### **usernames**

```sql
- username (citext, primary key)
- user_id (uuid, unique, foreign key)
- created_at (timestamp)
```

### **Security Policies**

#### **Profiles**

- **Read**: Public (for recipe authors)
- **Write**: Owner only

#### **Recipes**

- **Read**: Owner + public recipes (for all users)
- **Write**: Owner only

#### **Usernames**

- **Read**: Public (for availability checks)
- **Write**: Owner only

## Data Flow

### **1. Recipe Operations**

```
Frontend → API Layer → Supabase → Database
     ↑                                    ↓
     ← React Query Cache ← Response ←────┘
```

### **2. Authentication**

```
Frontend → Auth Utils → Supabase Auth → Database
     ↑                                        ↓
     ← User Session ← Auth Response ←────────┘
```

### **3. Recipe Parsing**

```
AI Response → Recipe Parser → Structured Data → API Layer → Database
```

## Key Simplifications

### **1. Removed Complexity**

- ❌ Complex environment variable validation
- ❌ Redundant type definitions
- ❌ Mixed concerns in API layer
- ❌ Inconsistent error handling
- ❌ Complex RLS policies

### **2. Added Clarity**

- ✅ Centralized type definitions
- ✅ Separated parsing logic
- ✅ Consistent error handling
- ✅ Simple, clear RLS policies
- ✅ Straightforward API operations

### **3. Improved Maintainability**

- ✅ Single source of truth for types
- ✅ Clear separation of concerns
- ✅ Consistent patterns across modules
- ✅ Simplified database schema
- ✅ Easy to understand data flow

## Environment Setup

### **Required Variables**

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Local Development**

```bash
# Start Supabase locally
supabase start

# Reset database (applies migrations)
supabase db reset

# Stop Supabase
supabase stop
```

## Best Practices

### **1. Error Handling**

- Use consistent error types (`AuthError`)
- Provide descriptive error messages
- Log errors for debugging
- Show user-friendly toast notifications

### **2. Type Safety**

- Import types from `src/lib/types.ts`
- Use TypeScript interfaces for all data structures
- Validate data at API boundaries

### **3. Performance**

- Use React Query for caching
- Implement proper indexes on database
- Optimize queries with selective field selection

### **4. Security**

- RLS policies on all tables
- Validate user permissions
- Sanitize user inputs
- Use parameterized queries

## Troubleshooting

### **Common Issues**

1. **Missing Environment Variables**
   - Check `.env` file
   - Verify variable names match exactly
   - Ensure variables are prefixed with `VITE_`

2. **Authentication Errors**
   - Verify Supabase URL and key
   - Check RLS policies
   - Ensure user is authenticated

3. **Database Connection Issues**
   - Verify Supabase is running
   - Check network connectivity
   - Review migration status

### **Debug Tools**

- Supabase Studio: `http://localhost:54323`
- Database logs: `supabase logs`
- Client logs: Browser developer tools

## Migration Guide

### **From Old Architecture**

1. Update imports to use `src/lib/types`
2. Replace direct Supabase calls with API layer
3. Update error handling to use consistent patterns
4. Test all CRUD operations

### **Database Migration**

1. Run the simplified schema migration
2. Verify RLS policies are working
3. Test user authentication flow
4. Validate recipe operations

This simplified architecture provides a clean, maintainable foundation for the Recipe Generator app while preserving all essential functionality.

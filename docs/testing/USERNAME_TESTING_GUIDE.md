# Username Testing Guide

**Last Updated**: August 27, 2024  
**Purpose**: Comprehensive testing suite for username functionality to ensure reliability and prevent regressions

---

## 🧪 **Test Suite Overview**

The username functionality has a comprehensive testing suite covering:

1. **Unit Tests** - Individual function testing
2. **Hook Tests** - React hook behavior testing
3. **Component Tests** - UI component integration testing
4. **Database Tests** - Real database function testing
5. **E2E Tests** - Complete user workflow testing

---

## 🚀 **Quick Start**

### **Run All Username Tests**

```bash
npm run test:username
```

### **Run Individual Test Suites**

```bash
# Unit tests for auth functions
npm test src/__tests__/lib/username-functions.test.ts

# Hook tests
npm test src/__tests__/hooks/useUsernameAvailability.test.ts

# Component tests
npm test src/__tests__/components/profile/ProfileInfoForm-username.test.ts

# Database integration tests
npm test src/__tests__/database/username-functions.test.ts

# E2E workflow tests
npm test src/__tests__/e2e/username-workflow.test.ts
```

---

## 📋 **Test Categories**

### **1. Unit Tests (`username-functions.test.ts`)**

**Purpose**: Test individual auth functions in isolation

**Coverage**:

- ✅ `checkUsernameAvailability()` function
- ✅ `claimUsername()` function
- ✅ Input validation (format, length, characters)
- ✅ Error handling (RPC errors, exceptions)
- ✅ Success/failure responses

**Key Test Scenarios**:

```typescript
// Username availability checking
- Valid username returns available
- Taken username returns unavailable
- Invalid format returns error
- Too short/long returns error
- RPC errors handled gracefully

// Username claiming
- Successful claim returns success
- Already taken returns error
- Unauthorized access blocked
- Invalid format rejected
- User not found handled
```

### **2. Hook Tests (`useUsernameAvailability.test.ts`)**

**Purpose**: Test React hook behavior and state management

**Coverage**:

- ✅ Input sanitization (lowercase, valid characters)
- ✅ Debounced availability checking (500ms delay)
- ✅ State management (loading, available, error)
- ✅ Timeout cleanup
- ✅ Username claiming workflow

**Key Test Scenarios**:

```typescript
// Input handling
- Sanitizes to lowercase
- Removes invalid characters
- Debounces checking (500ms)
- Clears previous timeouts

// State management
- Shows loading during check
- Updates available/unavailable state
- Handles errors gracefully
- Clears state after successful claim
```

### **3. Component Tests (`ProfileInfoForm-username.test.ts`)**

**Purpose**: Test UI component behavior and user interactions

**Coverage**:

- ✅ Current username display
- ✅ Username change field
- ✅ Availability feedback (icons, messages)
- ✅ Form submission
- ✅ Accessibility features

**Key Test Scenarios**:

```typescript
// Display logic
- Shows current username when exists
- Shows "Claim Username" when no current username
- Shows "Change Username" when current exists
- Disabled current username field

// Visual feedback
- Success icon for available usernames
- Error icon for taken usernames
- Loading spinner during check
- Border color changes
- Helper text messages

// Form behavior
- Submits username changes
- Disables button during submission
- Shows loading state
- Handles validation errors
```

### **4. Database Tests (`username-functions.test.ts`)**

**Purpose**: Test actual database functions with real database

**Coverage**:

- ✅ `is_username_available()` database function
- ✅ `update_username_atomic()` database function
- ✅ Database constraints and validation
- ✅ Uniqueness enforcement
- ✅ Error handling

**Key Test Scenarios**:

```typescript
// Function behavior
- Returns true for available usernames
- Returns false for taken usernames
- Successfully claims available usernames
- Fails for already taken usernames
- Handles non-existent users

// Database constraints
- Enforces length limits (3-24 chars)
- Enforces character constraints (lowercase, numbers, _)
- Enforces uniqueness across users
- Updates both profiles and usernames tables
```

### **5. E2E Tests (`username-workflow.test.ts`)**

**Purpose**: Test complete user workflows from UI to database

**Coverage**:

- ✅ Complete username change workflow
- ✅ Real-time availability checking
- ✅ Form submission and validation
- ✅ Error handling and user feedback
- ✅ Integration with profile page

**Key Test Scenarios**:

```typescript
// Complete workflows
- User types username → sees availability → submits → success
- User types taken username → sees error → tries different → success
- User submits invalid username → sees validation error
- User changes username → sees updated display

// Integration testing
- Profile page loads with current username
- Form submission updates database
- UI reflects database changes
- Error states handled gracefully
```

---

## 🔧 **Test Setup Requirements**

### **Prerequisites**

1. **Supabase Running**: `npx supabase start`
2. **Environment Variables**: Service role key available
3. **Database Functions**: All username functions created
4. **Test Data**: Seed users available (optional)

### **Environment Setup**

```bash
# Start Supabase
npx supabase start

# Set environment variables (automated by test script)
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p')

# Run tests
npm run test:username
```

---

## 📊 **Test Coverage Areas**

### **Functionality Coverage**

- ✅ Username availability checking
- ✅ Username claiming/updating
- ✅ Input validation and sanitization
- ✅ Error handling and user feedback
- ✅ Database constraints and uniqueness
- ✅ UI state management
- ✅ Form submission workflow

### **Edge Cases Covered**

- ✅ Empty usernames
- ✅ Invalid characters
- ✅ Too short/long usernames
- ✅ Already taken usernames
- ✅ Network errors
- ✅ Database errors
- ✅ Unauthorized access
- ✅ Non-existent users

### **User Experience Coverage**

- ✅ Real-time availability feedback
- ✅ Loading states
- ✅ Success/error messages
- ✅ Form validation
- ✅ Accessibility features
- ✅ Responsive behavior

---

## 🚨 **Common Test Failures & Solutions**

### **Database Tests Failing**

**Symptoms**: Database integration tests fail
**Solutions**:

```bash
# Check Supabase is running
npx supabase status

# Restart Supabase
npx supabase stop
npx supabase start

# Check database functions exist
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%username%';"
```

### **Mock Tests Failing**

**Symptoms**: Unit/hook tests fail
**Solutions**:

```bash
# Clear test cache
npm test -- --clearCache

# Check mock setup
# Ensure all dependencies are properly mocked
```

### **E2E Tests Failing**

**Symptoms**: Component integration tests fail
**Solutions**:

```bash
# Check component props
# Ensure all required props are passed
# Verify mock data matches expected format
```

---

## 🔄 **Continuous Integration**

### **Pre-commit Hooks**

The test suite can be integrated into pre-commit hooks:

```bash
# Add to package.json scripts
"pre-commit": "npm run test:username"

# Or run specific test categories
"pre-commit:username": "npm test src/__tests__/lib/username-functions.test.ts"
```

### **CI Pipeline Integration**

```yaml
# Example GitHub Actions step
- name: Test Username Functions
  run: |
    npm run test:username
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## 📈 **Test Maintenance**

### **Adding New Tests**

1. **Identify the test category** (unit, hook, component, database, e2e)
2. **Create test file** in appropriate directory
3. **Follow naming convention**: `*.test.ts` or `*.test.tsx`
4. **Add to test script** if needed

### **Updating Existing Tests**

1. **Update test data** when schema changes
2. **Update mocks** when dependencies change
3. **Update expectations** when behavior changes
4. **Run full suite** to ensure no regressions

### **Test Data Management**

```bash
# Reset test database
npx supabase db reset

# Seed test data
npm run seed

# Clean up test users
# (handled automatically by test cleanup)
```

---

## 🎯 **Best Practices**

### **Test Organization**

- ✅ Group related tests in describe blocks
- ✅ Use descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Clean up after each test

### **Mock Strategy**

- ✅ Mock external dependencies
- ✅ Use realistic mock data
- ✅ Test error conditions
- ✅ Verify mock interactions

### **Database Testing**

- ✅ Use isolated test data
- ✅ Clean up after tests
- ✅ Test both success and failure paths
- ✅ Verify database state changes

### **Component Testing**

- ✅ Test user interactions
- ✅ Verify visual feedback
- ✅ Test accessibility features
- ✅ Mock complex dependencies

---

## 📝 **Test Documentation**

### **Test Reports**

The test script provides detailed reports:

```bash
npm run test:username
# Outputs:
# - Test suite results
# - Pass/fail counts
# - Error details
# - Performance metrics
```

### **Coverage Reports**

```bash
npm run test:coverage
# Generates coverage report for all tests
```

---

**Remember**: These tests ensure the username functionality remains reliable and prevents regressions when making changes to the codebase.

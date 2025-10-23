# Pre-PR Verification Checklist for AI Agents

**Purpose**: This checklist is designed for AI agents to run comprehensive diagnostics before code changes are committed, ensuring the automated Pre-PR Verification System has the best chance of success.

**Usage**: Run through this checklist systematically before suggesting any code changes or before the user commits code.

---

## 🔍 **Pre-Change Diagnostics**

### **1. Project Health Assessment**

- [ ] **Check current test status**: `npm run test:run`
- [ ] **Run critical path tests**: `npm run test:critical`
- [ ] **Verify linting status**: `npm run lint`
- [ ] **Check formatting**: `npm run format:check`
- [ ] **TypeScript compilation**: `npx tsc --noEmit`
- [ ] **Build verification**: `npm run build`
- [ ] **Security audit**: `npm audit`
- [ ] **Security scan for secrets**: `grep -r "SERVICE_ROLE_KEY\|SECRET_KEY" src/ --exclude-dir=node_modules`
- [ ] **Environment variable exposure check**: Verify no service keys in client-accessible code

### **2. Code Quality Baseline**

- [ ] **Test coverage report**: `npm run test:coverage`
- [ ] **Identify uncovered files/functions**
- [ ] **Check for existing linting errors**
- [ ] **Review TypeScript strict mode compliance**
- [ ] **Verify Prettier formatting consistency**

---

## 🛠️ **Change Implementation Guidelines**

### **3. Code Structure Standards**

- [ ] **File organization**: Follow existing patterns in `src/` structure
- [ ] **Import organization**: Group imports (React, external, internal, relative)
- [ ] **Component structure**: Use functional components with TypeScript
- [ ] **Hook usage**: Follow React hooks rules and custom hook patterns
- [ ] **Type definitions**: Use proper TypeScript interfaces and types

### **4. Testing Requirements**

- [ ] **Component tests**: Create tests for new React components
- [ ] **Hook tests**: Test custom hooks with `renderHook`
- [ ] **Utility tests**: Test pure functions and utilities
- [ ] **Integration tests**: Test component interactions
- [ ] **Critical path tests**: Ensure core recipe functionality works
- [ ] **Mock external dependencies**: Supabase, React Query, Router

### **5. Code Quality Standards**

- [ ] **ESLint compliance**: No unused variables, proper naming
- [ ] **TypeScript strict mode**: No `any` types, proper interfaces
- [ ] **Prettier formatting**: Consistent code style
- [ ] **Accessibility**: Proper ARIA labels, semantic HTML
- [ ] **Performance**: Avoid unnecessary re-renders, optimize imports
- [ ] **Security compliance**: No service keys in client code, proper environment variable usage
- [ ] **Secret management**: Verify only anon keys in client-accessible files

---

## 🎯 **Critical Path Testing Requirements**

### **5.1 Recipe Functionality Tests**

- [ ] **Recipe CRUD Operations**: Test create, read, update operations
- [ ] **Database Schema Integrity**: Verify all required tables and columns exist
- [ ] **Recipe Versioning**: Test version creation and management
- [ ] **API Endpoint Structure**: Validate API client methods and imports
- [ ] **Parser Functionality**: Test recipe text parsing with fallback mechanisms
- [ ] **Error Handling**: Test graceful failure modes and edge cases

### **5.2 Critical Path Commands**

```bash
# Run critical path tests (essential before any deployment)
npm run test:critical

# Run comprehensive pre-deployment validation
npm run test:pre-deploy

# Run critical path tests with verbose output for debugging
npm run test:critical -- --reporter=verbose
```

### **5.3 Critical Path Test Coverage**

- [ ] **Environment Configuration**: API keys and database connections
- [ ] **Recipe Creation**: End-to-end recipe creation workflow
- [ ] **Recipe Retrieval**: Database query and data retrieval
- [ ] **Recipe Updates**: Update operations and versioning
- [ ] **Database Relationships**: Foreign keys and constraints
- [ ] **Error Scenarios**: Invalid data and missing resources
- [ ] **Fallback Mechanisms**: Graceful degradation when AI services unavailable

### **5.4 Production Deployment Validation**

- [ ] **Schema Validation**: Verify production database has all required tables
- [ ] **Migration Status**: Ensure all migrations applied successfully
- [ ] **API Connectivity**: Test Supabase connection and authentication
- [ ] **Core Functionality**: Recipe creation, parsing, and saving work end-to-end
- [ ] **Version Management**: Recipe versioning system operational

---

## 🧪 **Testing Implementation Checklist**

### **6. Test File Structure**

```typescript
// Required test file structure
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentName } from '@/components/path/component';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interactions', () => {
    // Test implementation
  });
});
```

### **7. Test Coverage Requirements**

- [ ] **Component rendering**: Test that components render without errors
- [ ] **Props handling**: Test component behavior with different props
- [ ] **User interactions**: Test clicks, form submissions, navigation
- [ ] **Error states**: Test error handling and loading states
- [ ] **Edge cases**: Test boundary conditions and error scenarios

### **8. Mocking Strategy**

```typescript
// Required mocks in src/test/setup.ts
- Supabase client and auth
- React Query hooks
- React Router navigation
- External API calls
- Browser APIs (matchMedia, ResizeObserver, etc.)
```

---

## 🔧 **Pre-Commit Verification**

### **9. Automated Checks**

- [ ] **Run full verification**: `npm run verify`
- [ ] **Run pre-deployment tests**: `npm run test:pre-deploy`
- [ ] **Run critical path tests**: `npm run test:critical`
- [ ] **Quick verification**: `npm run verify:quick`
- [ ] **Test coverage check**: Ensure thresholds are met
- [ ] **Build verification**: Confirm production build succeeds
- [ ] **Security scan**: Check for vulnerabilities

### **10. Manual Quality Checks**

- [ ] **Code review**: Review for logical errors and edge cases
- [ ] **Performance review**: Check for memory leaks or performance issues
- [ ] **Accessibility review**: Ensure keyboard navigation and screen reader support
- [ ] **Browser compatibility**: Test in different browsers if applicable
- [ ] **Mobile responsiveness**: Verify mobile layout and interactions

---

## 📋 **File-Specific Guidelines**

### **11. Component Files**

```typescript
// Required structure for React components
import { useState, useEffect } from 'react';
import { ComponentProps } from '@/types';
import { useCustomHook } from '@/hooks/use-custom-hook';

interface ComponentNameProps {
  // Define props interface
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // Component implementation
  return (
    // JSX with proper accessibility attributes
  );
}
```

### **12. Hook Files**

```typescript
// Required structure for custom hooks
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

export function useCustomHook(param: string) {
  // Hook implementation with proper error handling
  return {
    data,
    isLoading,
    error,
    mutate,
  };
}
```

### **13. Utility Files**

```typescript
// Required structure for utility functions
import { z } from 'zod';

export const utilitySchema = z.object({
  // Define schema
});

export function utilityFunction(input: string): string {
  // Pure function implementation
  return processedInput;
}
```

---

## 🚨 **Common Issues to Avoid**

### **14. Testing Pitfalls**

- [ ] **Avoid testing implementation details**: Focus on behavior, not internals
- [ ] **Don't test third-party libraries**: Mock them instead
- [ ] **Avoid flaky tests**: Use proper async handling and mocks
- [ ] **Don't skip error cases**: Test error scenarios thoroughly
- [ ] **Avoid testing multiple concerns**: One test per behavior

### **15. Code Quality Issues**

- [ ] **No unused imports**: Remove all unused imports
- [ ] **No console.log statements**: Remove debugging code
- [ ] **No hardcoded values**: Use constants or configuration
- [ ] **No magic numbers**: Use named constants
- [ ] **No commented-out code**: Remove or implement
- [ ] **No service keys in client code**: Verify SUPABASE_SERVICE_ROLE_KEY not exposed
- [ ] **No secrets in test files**: Ensure test utilities don't expose production secrets

### **16. TypeScript Issues**

- [ ] **No `any` types**: Use proper type definitions
- [ ] **No implicit any**: Explicitly type all parameters
- [ ] **No unused variables**: Remove or use all declared variables
- [ ] **Proper interface definitions**: Use interfaces for object shapes
- [ ] **Generic type usage**: Use generics where appropriate

---

## 🔒 **Security Validation Requirements**

### **16.1 Secret Scanning**

- [ ] **Scan for service keys**: `grep -r "SERVICE_ROLE_KEY\|SECRET_KEY" src/ --exclude-dir=node_modules`
- [ ] **Check environment variable usage**: Verify only safe env vars in client code
- [ ] **Validate test file security**: Ensure test utilities don't expose production secrets
- [ ] **Review database client configuration**: Confirm only anon keys in client-accessible code

### **16.2 Environment Variable Security**

- [ ] **Client-safe variables only**: Only `VITE_*` and `SUPABASE_ANON_KEY` in client code
- [ ] **Service keys isolated**: `SUPABASE_SERVICE_ROLE_KEY` only in server-side code
- [ ] **Test environment separation**: Test files use mock data, not production secrets
- [ ] **Build-time validation**: Ensure secrets not bundled in client builds

### **16.3 Database Security**

- [ ] **Anon key only**: Database clients use only anon keys for security
- [ ] **No admin operations**: Client code cannot perform admin operations
- [ ] **Proper RLS**: Row Level Security policies protect data access
- [ ] **Service role isolation**: Service role only used in server-side functions

---

## 🔄 **Post-Change Verification**

### **17. Final Checks**

- [ ] **All tests pass**: `npm run test:run`
- [ ] **Critical path tests pass**: `npm run test:critical`
- [ ] **No linting errors**: `npm run lint`
- [ ] **Formatting is correct**: `npm run format:check`
- [ ] **TypeScript compiles**: `npx tsc --noEmit`
- [ ] **Build succeeds**: `npm run build`
- [ ] **Coverage maintained**: Check coverage report

### **18. Documentation Updates**

- [ ] **Update README**: If adding new features or changing setup
- [ ] **Update component documentation**: Add JSDoc comments
- [ ] **Update test documentation**: Document test patterns
- [ ] **Update API documentation**: If changing interfaces

---

## 📊 **Success Metrics**

### **19. Quality Indicators**

- [ ] **Test coverage > 80%**: For new code
- [ ] **Zero linting errors**: Clean codebase
- [ ] **Zero TypeScript errors**: Type safety
- [ ] **Build time < 30 seconds**: Performance
- [ ] **Test execution time < 10 seconds**: Fast feedback

### **20. Maintenance Indicators**

- [ ] **No security vulnerabilities**: Clean npm audit
- [ ] **Up-to-date dependencies**: Regular updates
- [ ] **Consistent code style**: Prettier compliance
- [ ] **Clear error messages**: User-friendly errors
- [ ] **Proper error handling**: Graceful failures

---

## 🆘 **Troubleshooting Guide**

### **21. Common Failures**

```bash
# Test failures
npm run test:run -- --reporter=verbose

# Critical path test failures
npm run test:critical -- --reporter=verbose

# Pre-deployment validation failures
npm run test:pre-deploy

# Linting errors
npm run lint -- --fix

# TypeScript errors
npx tsc --noEmit --pretty

# Build failures
npm run build -- --debug
```

### **22. Debugging Steps**

1. **Check error messages**: Read full error output
2. **Verify dependencies**: Ensure all packages are installed
3. **Check TypeScript version**: Ensure compatibility
4. **Review recent changes**: Identify what broke
5. **Check environment**: Verify Node.js version and OS compatibility

---

## 📝 **Checklist Usage Instructions**

### **For AI Agents:**

1. **Before making changes**: Run sections 1-2 (including critical path tests)
2. **During implementation**: Follow sections 3-8 (with critical path validation)
3. **Before committing**: Complete sections 9-16 (mandatory critical path tests)
4. **After changes**: Verify sections 17-20 (final critical path validation)
5. **If issues arise**: Use section 21-22 (including critical path debugging)

**⚠️ CRITICAL**: Always run `npm run test:critical` before any production deployment!

### **For Human Developers:**

1. **Use as a manual checklist** before pushing code
2. **Reference during code reviews**
3. **Use for onboarding new team members**
4. **Reference when troubleshooting issues**

---

**Last Updated**: September 2025  
**Version**: 2.0  
**Status**: ✅ ACTIVE

**Version 2.0 Changes**:

- Added critical path testing requirements (`npm run test:critical`)
- Added pre-deployment validation (`npm run test:pre-deploy`)
- Enhanced production deployment validation
- Added recipe functionality test coverage requirements

---

_This checklist ensures that all code changes meet the project's quality standards and that critical recipe functionality is validated before reaching the automated Pre-PR Verification System._

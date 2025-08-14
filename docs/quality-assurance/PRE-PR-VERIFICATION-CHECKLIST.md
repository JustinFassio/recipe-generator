# Pre-PR Verification Checklist for AI Agents

**Purpose**: This checklist is designed for AI agents to run comprehensive diagnostics before code changes are committed, ensuring the automated Pre-PR Verification System has the best chance of success.

**Usage**: Run through this checklist systematically before suggesting any code changes or before the user commits code.

---

## 🔍 **Pre-Change Diagnostics**

### **1. Project Health Assessment**
- [ ] **Check current test status**: `npm run test:run`
- [ ] **Verify linting status**: `npm run lint`
- [ ] **Check formatting**: `npm run format:check`
- [ ] **TypeScript compilation**: `npx tsc --noEmit`
- [ ] **Build verification**: `npm run build`
- [ ] **Security audit**: `npm audit`

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
- [ ] **Mock external dependencies**: Supabase, React Query, Router

### **5. Code Quality Standards**
- [ ] **ESLint compliance**: No unused variables, proper naming
- [ ] **TypeScript strict mode**: No `any` types, proper interfaces
- [ ] **Prettier formatting**: Consistent code style
- [ ] **Accessibility**: Proper ARIA labels, semantic HTML
- [ ] **Performance**: Avoid unnecessary re-renders, optimize imports

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
    mutate
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

### **16. TypeScript Issues**
- [ ] **No `any` types**: Use proper type definitions
- [ ] **No implicit any**: Explicitly type all parameters
- [ ] **No unused variables**: Remove or use all declared variables
- [ ] **Proper interface definitions**: Use interfaces for object shapes
- [ ] **Generic type usage**: Use generics where appropriate

---

## 🔄 **Post-Change Verification**

### **17. Final Checks**
- [ ] **All tests pass**: `npm run test:run`
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
1. **Before making changes**: Run sections 1-2
2. **During implementation**: Follow sections 3-8
3. **Before committing**: Complete sections 9-16
4. **After changes**: Verify sections 17-20
5. **If issues arise**: Use section 21-22

### **For Human Developers:**
1. **Use as a manual checklist** before pushing code
2. **Reference during code reviews**
3. **Use for onboarding new team members**
4. **Reference when troubleshooting issues**

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: ✅ ACTIVE

---

*This checklist ensures that all code changes meet the project's quality standards before reaching the automated Pre-PR Verification System.*

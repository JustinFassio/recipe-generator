# AI Agent Quick Reference Guide

**For AI agents working on the Recipe Generator project**

---

## 🚀 **Quick Start Commands**

```bash
# Health check - run this first
npm run verify:quick

# Run tests
npm run test:run

# Check linting
npm run lint

# Format code
npm run format

# Full verification
npm run verify
```

---

## 📋 **Before Making Changes**

1. **Check current status**:

   ```bash
   npm run test:run && npm run lint && npm run format:check
   ```

2. **Review existing patterns**:
   - Check `src/__tests__/` for test examples
   - Review `src/components/` for component patterns
   - Examine `src/hooks/` for hook patterns

3. **Understand the tech stack**:
   - React 18 + TypeScript
   - Supabase for backend
   - TanStack Query for state management
   - Vitest + React Testing Library for testing

---

## 🧪 **Testing Requirements**

### **New Components Must Have Tests**

```typescript
// src/__tests__/components/your-component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YourComponent } from '@/components/your-component';

describe('YourComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### **New Hooks Must Have Tests**

```typescript
// src/__tests__/hooks/use-your-hook.test.ts
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useYourHook } from '@/hooks/use-your-hook';

describe('useYourHook', () => {
  it('should return expected structure', () => {
    const { result } = renderHook(() => useYourHook());
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
  });
});
```

---

## 🔧 **Code Standards**

### **Component Structure**

```typescript
import { useState } from 'react';
import type { ComponentProps } from '@/types';

interface ComponentNameProps {
  prop1: string;
  prop2?: number;
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  const [state, setState] = useState('');

  return (
    <div>
      {/* JSX with proper accessibility */}
    </div>
  );
}
```

### **Hook Structure**

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export function useCustomHook(param: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['key', param],
    queryFn: () => fetchData(param),
  });

  return { data, isLoading, error };
}
```

---

## 🚨 **Common Issues to Fix**

### **Linting Errors**

- Remove unused imports
- Fix TypeScript strict mode violations
- Remove console.log statements
- Use proper naming conventions

### **Test Failures**

- Mock external dependencies properly
- Use proper async/await patterns
- Test user interactions, not implementation details
- Ensure proper cleanup in beforeEach/afterEach

### **TypeScript Errors**

- No `any` types - use proper interfaces
- Explicit typing for all parameters
- Proper generic usage
- No implicit any

---

## 📁 **File Organization**

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── feature/        # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── pages/              # Page components
├── __tests__/          # Test files (mirror src structure)
└── test/               # Test setup and utilities
```

---

## 🔍 **Verification Checklist**

Before suggesting any changes, ensure:

- [ ] **Tests pass**: `npm run test:run`
- [ ] **No linting errors**: `npm run lint`
- [ ] **Proper formatting**: `npm run format:check`
- [ ] **TypeScript compiles**: `npx tsc --noEmit`
- [ ] **Build succeeds**: `npm run build`
- [ ] **Coverage maintained**: Check test coverage

---

## 🆘 **When Things Go Wrong**

### **Test Failures**

```bash
# Get detailed test output
npm run test:run -- --reporter=verbose

# Run specific test file
npm run test:run src/__tests__/path/to/test.test.ts
```

### **Linting Issues**

```bash
# Auto-fix what can be fixed
npm run lint -- --fix

# Check specific file
npm run lint src/path/to/file.ts
```

### **TypeScript Issues**

```bash
# Get detailed type errors
npx tsc --noEmit --pretty

# Check specific file
npx tsc --noEmit src/path/to/file.ts
```

---

## 📚 **Reference Documentation**

- **Full Pre-PR Verification**: `docs/PRE-PR-VERIFICATION.md`
- **Detailed Checklist**: `docs/PRE-PR-VERIFICATION-CHECKLIST.md`
- **Project README**: `README.md`
- **Test Examples**: `src/__tests__/`

---

**Remember**: Always run `npm run verify:quick` before and after making changes to ensure the automated verification system will succeed.

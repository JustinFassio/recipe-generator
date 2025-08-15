# DaisyUI Input Migration Plan

**Phased approach to replace shadcn/ui Input components with DaisyUI**

---

## 🎯 **Overview**

This document outlines a strategic 4-phase plan to migrate from shadcn/ui Input components to DaisyUI input components throughout the Recipe Generator application. The migration will be done incrementally to minimize risk and ensure consistency.

## 📊 **Current Input Usage Analysis**

### **Input Components Found**

| File                                     | Component | Usage Count | Priority | Context                |
| ---------------------------------------- | --------- | ----------- | -------- | ---------------------- |
| `src/pages/recipes-page.tsx`             | Input     | 1           | High     | Search functionality   |
| `src/components/auth/auth-form.tsx`      | Input     | 4           | High     | Email/password fields  |
| `src/components/recipes/recipe-form.tsx` | Input     | 3           | Medium   | Recipe title, servings |
| `src/components/chat/ChatInterface.tsx`  | Input     | 1           | Medium   | Chat message input     |

### **Current shadcn/ui Input Styling**

```typescript
// Current shadcn/ui Input classes
'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';
```

### **DaisyUI Input Mapping**

| shadcn/ui Style | DaisyUI Equivalent | Notes                    |
| --------------- | ------------------ | ------------------------ |
| `border-input`  | `input-bordered`   | Standard bordered input  |
| `h-9`           | `input-md`         | Medium height (default)  |
| `h-8`           | `input-sm`         | Small height             |
| `h-10`          | `input-lg`         | Large height             |
| `h-6`           | `input-xs`         | Extra small height       |
| Error states    | `input-error`      | Validation error styling |
| Success states  | `input-success`    | Validation success       |

## 🚀 **Migration Phases**

### **Phase 1: Foundation & Testing** (Week 1)

#### **Objectives**

- Set up migration infrastructure
- Create input mapping utilities
- Test migration on low-risk components
- Establish patterns and best practices

#### **Tasks**

**1.1 Create Input Migration Utility**

```typescript
// src/lib/input-migration.ts
export const createDaisyUIInputClasses = (
  variant?:
    | 'default'
    | 'bordered'
    | 'ghost'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'info'
    | 'success'
    | 'warning'
    | 'error',
  size?: 'xs' | 'sm' | 'md' | 'lg',
  className?: string
): string => {
  const baseClasses = 'input';
  const variantClasses =
    variant === 'default' || !variant ? 'input-bordered' : `input-${variant}`;
  const sizeClasses = size === 'md' || !size ? '' : `input-${size}`;
  const additionalClasses = className || '';

  return `${baseClasses} ${variantClasses} ${sizeClasses} ${additionalClasses}`.trim();
};
```

**1.2 Create Migration Test Component**

```typescript
// src/components/ui/input-migration-test.tsx
import React from 'react';
import { Input } from './input';
import { createDaisyUIInputClasses } from '@/lib/input-migration';

interface InputMigrationTestProps {
  variant?: 'default' | 'bordered' | 'ghost' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

export const InputMigrationTest: React.FC<InputMigrationTestProps> = ({
  variant = 'default',
  size = 'md',
  placeholder = 'Enter text...',
  type = 'text',
  disabled = false,
  ...props
}) => {
  const daisyUIClasses = createDaisyUIInputClasses(variant, size);

  return (
    <input
      type={type}
      className={daisyUIClasses}
      placeholder={placeholder}
      disabled={disabled}
      {...props}
    />
  );
};
```

**1.3 Test Input Variants**

```typescript
// Test all input variants and sizes
const InputTestPage = () => {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Input Migration Test</h2>

      <div className="space-y-2">
        <h3>Input Variants</h3>
        <input className={createDaisyUIInputClasses('bordered')} placeholder="Bordered Input" />
        <input className={createDaisyUIInputClasses('ghost')} placeholder="Ghost Input" />
        <input className={createDaisyUIInputClasses('primary')} placeholder="Primary Input" />
        <input className={createDaisyUIInputClasses('error')} placeholder="Error Input" />
        <input className={createDaisyUIInputClasses('success')} placeholder="Success Input" />
      </div>

      <div className="space-y-2">
        <h3>Input Sizes</h3>
        <input className={createDaisyUIInputClasses('bordered', 'xs')} placeholder="Extra Small" />
        <input className={createDaisyUIInputClasses('bordered', 'sm')} placeholder="Small" />
        <input className={createDaisyUIInputClasses('bordered', 'md')} placeholder="Medium" />
        <input className={createDaisyUIInputClasses('bordered', 'lg')} placeholder="Large" />
      </div>
    </div>
  );
};
```

#### **Success Criteria**

- [ ] Input migration utility created and tested
- [ ] Test component renders all variants correctly
- [ ] Visual regression tests pass
- [ ] No console errors or warnings

#### **Rollback Plan**

- Keep original shadcn/ui Input component intact
- Use feature flag to switch between implementations
- Revert test changes if issues arise

---

### **Phase 2: Core Page Components** (Week 2)

#### **Objectives**

- Migrate high-priority page components
- Ensure consistent user experience
- Update tests to reflect new input structure

#### **Tasks**

**2.1 Migrate Recipes Page Search**

```typescript
// src/pages/recipes-page.tsx
// BEFORE
<Input
  placeholder="Search recipes, ingredients, or instructions..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="pl-10"
/>

// AFTER
<input
  type="text"
  placeholder="Search recipes, ingredients, or instructions..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className={`${createDaisyUIInputClasses('bordered')} pl-10`}
/>
```

**2.2 Migrate Auth Form Inputs**

```typescript
// src/components/auth/auth-form.tsx
// BEFORE
<Input
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>

// AFTER
<input
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className={createDaisyUIInputClasses('bordered')}
  required
/>
```

**2.3 Update Tests**

```typescript
// Update input selection logic for DaisyUI classes
it('should handle search input changes', () => {
  render(<RecipesPage />);

  const searchInput = screen.getByPlaceholderText(/search recipes/i);
  fireEvent.change(searchInput, { target: { value: 'pizza' } });

  expect(searchInput).toHaveValue('pizza');
});
```

#### **Success Criteria**

- [ ] All page components migrated successfully
- [ ] Visual consistency maintained
- [ ] All tests updated and passing
- [ ] No accessibility regressions

#### **Rollback Plan**

- Feature flag for page-level input switching
- A/B testing capability for user experience validation
- Quick revert scripts for each page

---

### **Phase 3: Form Components** (Week 3)

#### **Objectives**

- Migrate form-specific components
- Ensure form functionality remains intact
- Update component documentation

#### **Tasks**

**3.1 Migrate Recipe Form Inputs**

```typescript
// src/components/recipes/recipe-form.tsx
// BEFORE
<Input
  id="title"
  placeholder="Enter recipe title..."
  {...register('title')}
/>

// AFTER
<input
  id="title"
  type="text"
  placeholder="Enter recipe title..."
  className={createDaisyUIInputClasses('bordered')}
  {...register('title')}
/>
```

**3.2 Migrate Chat Interface Input**

```typescript
// src/components/chat/ChatInterface.tsx
// BEFORE
<Input
  placeholder="Type your message..."
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  onKeyPress={handleKeyPress}
  disabled={isLoading}
/>

// AFTER
<input
  type="text"
  placeholder="Type your message..."
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  onKeyPress={handleKeyPress}
  disabled={isLoading}
  className={createDaisyUIInputClasses('bordered')}
/>
```

**3.3 Add Validation States**

```typescript
// Enhanced input with validation states
const getInputClasses = (hasError: boolean, isValid: boolean) => {
  if (hasError) return createDaisyUIInputClasses('error');
  if (isValid) return createDaisyUIInputClasses('success');
  return createDaisyUIInputClasses('bordered');
};

<input
  className={getInputClasses(!!errors.title, !!watch('title') && !errors.title)}
  {...register('title')}
/>
```

#### **Success Criteria**

- [ ] Recipe form inputs fully migrated
- [ ] Chat interface functionality preserved
- [ ] All form validations working
- [ ] Component documentation updated

#### **Rollback Plan**

- Component-level feature flags
- Preserve original Input imports as fallback
- Component-specific rollback scripts

---

### **Phase 4: Cleanup & Optimization** (Week 4)

#### **Objectives**

- Remove unused shadcn/ui Input component
- Optimize bundle size
- Finalize migration documentation
- Performance testing

#### **Tasks**

**4.1 Remove Unused Dependencies**

```bash
# Remove shadcn/ui Input component
rm src/components/ui/input.tsx

# Update imports across the codebase
# Remove Input imports from all files
```

**4.2 Update Import Statements**

```typescript
// Remove these imports from all files
import { Input } from '@/components/ui/input';

// Replace with DaisyUI classes directly
import { createDaisyUIInputClasses } from '@/lib/input-migration';
```

**4.3 Bundle Size Optimization**

```bash
# Analyze bundle size impact
npm run build
npm run analyze

# Remove unused CSS from shadcn/ui input styles
```

**4.4 Performance Testing**

```typescript
// Add performance benchmarks for input interactions
const InputPerformanceTest = () => {
  const [value, setValue] = useState('');

  return (
    <div>
      <input
        className={createDaisyUIInputClasses('bordered')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Performance test input"
      />
    </div>
  );
};
```

#### **Success Criteria**

- [ ] shadcn/ui Input component removed
- [ ] Bundle size reduced or maintained
- [ ] Performance benchmarks met
- [ ] Documentation complete and accurate

#### **Rollback Plan**

- Git branch preservation for complete rollback
- Dependency restoration scripts
- Performance monitoring alerts

---

## 🧪 **Testing Strategy**

### **Visual Regression Testing**

```typescript
// Add visual regression tests for input states
describe('Input Visual States', () => {
  it('should render bordered input correctly', () => {
    render(<input className={createDaisyUIInputClasses('bordered')} placeholder="Test" />);
    expect(screen.getByPlaceholderText('Test')).toHaveClass('input', 'input-bordered');
  });

  it('should render disabled input correctly', () => {
    render(<input className={createDaisyUIInputClasses('bordered')} disabled placeholder="Test" />);
    expect(screen.getByPlaceholderText('Test')).toBeDisabled();
  });
});
```

### **Accessibility Testing**

```typescript
// Ensure accessibility is maintained
describe('Input Accessibility', () => {
  it('should have proper labels', () => {
    render(
      <div>
        <label htmlFor="test-input">Test Label</label>
        <input id="test-input" className={createDaisyUIInputClasses('bordered')} />
      </div>
    );
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('should be keyboard navigable', () => {
    render(<input className={createDaisyUIInputClasses('bordered')} placeholder="Test" />);
    const input = screen.getByPlaceholderText('Test');
    input.focus();
    expect(input).toHaveFocus();
  });
});
```

### **Integration Testing**

```typescript
// Test input interactions in real components
describe('Recipe Search Integration', () => {
  it('should filter recipes on input change', () => {
    render(<RecipesPage />);

    const searchInput = screen.getByPlaceholderText(/search recipes/i);
    fireEvent.change(searchInput, { target: { value: 'pizza' } });

    // Verify filtering logic works
    expect(searchInput).toHaveValue('pizza');
  });
});
```

## 📊 **Success Metrics**

### **Technical Metrics**

- **Bundle Size**: Maintain or reduce current size
- **Performance**: No regression in input interaction speed
- **Accessibility**: Maintain WCAG 2.1 AA compliance
- **Test Coverage**: 100% of migrated components tested

### **User Experience Metrics**

- **Visual Consistency**: No visual regressions
- **Interaction Feedback**: Proper focus/hover states
- **Validation States**: Clear error/success indicators
- **Responsive Design**: Works on all screen sizes

### **Development Metrics**

- **Code Maintainability**: Reduced complexity
- **Developer Experience**: Faster component development
- **Documentation Quality**: Complete and accurate guides
- **Migration Time**: Completed within 4 weeks

## 🚨 **Risk Mitigation**

### **High-Risk Scenarios**

**1. Form Validation Issues**

- **Mitigation**: Comprehensive form testing
- **Fallback**: Preserve original Input component as backup

**2. Accessibility Regressions**

- **Mitigation**: Automated accessibility testing
- **Fallback**: Maintain ARIA attributes and labels

**3. Performance Degradation**

- **Mitigation**: Performance benchmarking before/after
- **Fallback**: Gradual rollout with monitoring

**4. Test Failures**

- **Mitigation**: Update tests incrementally with components
- **Fallback**: Maintain test suite compatibility during migration

### **Rollback Procedures**

```bash
# Quick rollback script
#!/bin/bash
# rollback-inputs.sh

echo "Rolling back input migration..."

# Restore original Input component
git checkout HEAD~1 -- src/components/ui/input.tsx

# Restore original imports
find src -name "*.tsx" -exec sed -i '' 's/className="input/import { Input } from "@/components\/ui\/input";/g' {} \;

echo "Rollback complete. Please test thoroughly."
```

## 📅 **Timeline Summary**

| Week       | Phase           | Focus                    | Deliverables                          |
| ---------- | --------------- | ------------------------ | ------------------------------------- |
| **Week 1** | Foundation      | Infrastructure & Testing | Migration utilities, test components  |
| **Week 2** | Core Pages      | High-priority pages      | Recipes page, auth form migrated      |
| **Week 3** | Form Components | Form-specific components | Recipe form, chat interface migrated  |
| **Week 4** | Cleanup         | Optimization & removal   | Input component removed, docs updated |

## 🎯 **Post-Migration Benefits**

### **Immediate Benefits**

- **Reduced Bundle Size**: Eliminate shadcn/ui Input dependencies
- **Simplified Styling**: Semantic DaisyUI classes
- **Better Theming**: Consistent with DaisyUI theme system
- **Improved Performance**: Fewer CSS classes to process

### **Long-term Benefits**

- **Easier Maintenance**: Single styling system
- **Better Developer Experience**: Intuitive class names
- **Enhanced Customization**: DaisyUI theme flexibility
- **Future-Proof**: DaisyUI's active development

---

**Next Steps**: Begin Phase 1 by creating the migration utilities and testing on low-risk components.

For questions or issues during migration, refer to the [DaisyUI Integration Guide](daisyui-integration-guide.md) and [Troubleshooting Guide](troubleshooting.md).

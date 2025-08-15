# DaisyUI Button Migration Plan

**Phased approach to replace shadcn/ui Button components with DaisyUI**

---

## 🎯 **Overview**

This document outlines a strategic 4-phase plan to migrate from shadcn/ui Button components to DaisyUI button components throughout the Recipe Generator application. The migration will be done incrementally to minimize risk and ensure consistency.

## 📊 **Current Button Usage Analysis**

### **Button Components Found**

| File                                     | Component        | Usage Count | Priority    |
| ---------------------------------------- | ---------------- | ----------- | ----------- |
| `src/pages/chat-recipe-page.tsx`         | Button           | 2           | High        |
| `src/pages/recipes-page.tsx`             | Button           | 4           | High        |
| `src/pages/add-recipe-page.tsx`          | Button           | 3           | High        |
| `src/components/recipes/recipe-card.tsx` | Button           | 4           | Medium      |
| `src/components/recipes/recipe-form.tsx` | Button           | 5           | Medium      |
| `src/components/ui/carousel.tsx`         | Button           | 2           | Low         |
| `src/components/ui/theme-toggle.tsx`     | button (DaisyUI) | 1           | ✅ Complete |

### **Current shadcn/ui Button Variants**

```typescript
// Current variants in use
variant: {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
}

size: {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-10 rounded-md px-8',
  icon: 'h-9 w-9',
}
```

### **DaisyUI Button Mapping**

| shadcn/ui Variant | DaisyUI Equivalent  | Notes                  |
| ----------------- | ------------------- | ---------------------- |
| `default`         | `btn btn-primary`   | Primary action buttons |
| `destructive`     | `btn btn-error`     | Delete/danger actions  |
| `outline`         | `btn btn-outline`   | Secondary actions      |
| `secondary`       | `btn btn-secondary` | Alternative actions    |
| `ghost`           | `btn btn-ghost`     | Subtle actions         |
| `link`            | `btn btn-link`      | Text-only actions      |

| shadcn/ui Size | DaisyUI Equivalent | Notes             |
| -------------- | ------------------ | ----------------- |
| `default`      | `btn`              | Standard size     |
| `sm`           | `btn btn-sm`       | Small buttons     |
| `lg`           | `btn btn-lg`       | Large buttons     |
| `icon`         | `btn btn-circle`   | Icon-only buttons |

## 🚀 **Migration Phases**

### **Phase 1: Foundation & Testing** (Week 1)

#### **Objectives**

- Set up migration infrastructure
- Create button mapping utilities
- Test migration on low-risk components
- Establish patterns and best practices

#### **Tasks**

**1.1 Create Button Migration Utility**

```typescript
// src/lib/button-migration.ts
export const mapButtonVariant = (variant?: string): string => {
  switch (variant) {
    case 'default':
      return 'btn btn-primary';
    case 'destructive':
      return 'btn btn-error';
    case 'outline':
      return 'btn btn-outline';
    case 'secondary':
      return 'btn btn-secondary';
    case 'ghost':
      return 'btn btn-ghost';
    case 'link':
      return 'btn btn-link';
    default:
      return 'btn btn-primary';
  }
};

export const mapButtonSize = (size?: string): string => {
  switch (size) {
    case 'sm':
      return 'btn-sm';
    case 'lg':
      return 'btn-lg';
    case 'icon':
      return 'btn-circle';
    default:
      return '';
  }
};

export const createDaisyUIButtonClasses = (
  variant?: string,
  size?: string,
  className?: string
): string => {
  const variantClass = mapButtonVariant(variant);
  const sizeClass = mapButtonSize(size);
  return `${variantClass} ${sizeClass} ${className || ''}`.trim();
};
```

**1.2 Create Migration Test Component**

```typescript
// src/components/ui/button-migration-test.tsx
import React from 'react';
import { Button } from './button';
import { createDaisyUIButtonClasses } from '@/lib/button-migration';

interface ButtonMigrationTestProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  onClick?: () => void;
}

export const ButtonMigrationTest: React.FC<ButtonMigrationTestProps> = ({
  variant = 'default',
  size = 'default',
  children,
  onClick,
  ...props
}) => {
  const daisyUIClasses = createDaisyUIButtonClasses(variant, size);

  return (
    <button className={daisyUIClasses} onClick={onClick} {...props}>
      {children}
    </button>
  );
};
```

**1.3 Migrate Low-Risk Components**

- **Target**: `src/components/ui/carousel.tsx` (2 buttons)
- **Risk**: Low (internal UI component)
- **Approach**: Direct replacement with DaisyUI classes

```typescript
// BEFORE
<Button variant="outline" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2">
  <ChevronLeft className="h-4 w-4" />
</Button>

// AFTER
<button className="btn btn-outline btn-circle absolute left-2 top-1/2 -translate-y-1/2">
  <ChevronLeft className="h-4 w-4" />
</button>
```

#### **Success Criteria**

- [ ] Button migration utility created and tested
- [ ] Carousel component migrated successfully
- [ ] Visual regression tests pass
- [ ] No console errors or warnings

#### **Rollback Plan**

- Keep original shadcn/ui Button component intact
- Use feature flag to switch between implementations
- Revert carousel changes if issues arise

---

### **Phase 2: Core Page Components** (Week 2)

#### **Objectives**

- Migrate high-priority page components
- Ensure consistent user experience
- Update tests to reflect new button structure

#### **Tasks**

**2.1 Migrate Chat Recipe Page**

```typescript
// src/pages/chat-recipe-page.tsx
// BEFORE
<Button variant="ghost" onClick={handleBackToChat}>
  <ArrowLeft className="h-4 w-4 mr-2" />
  Back to Chat
</Button>

// AFTER
<button className="btn btn-ghost" onClick={handleBackToChat}>
  <ArrowLeft className="h-4 w-4 mr-2" />
  Back to Chat
</button>
```

**2.2 Migrate Recipes Page**

```typescript
// src/pages/recipes-page.tsx
// BEFORE
<Button onClick={() => window.location.reload()}>
  <RefreshCw className="h-4 w-4 mr-2" />
  Refresh
</Button>

// AFTER
<button className="btn btn-primary" onClick={() => window.location.reload()}>
  <RefreshCw className="h-4 w-4 mr-2" />
  Refresh
</button>
```

**2.3 Migrate Add Recipe Page**

```typescript
// src/pages/add-recipe-page.tsx
// BEFORE
<Button variant="ghost" onClick={handleCancel} className="mb-4">
  <ArrowLeft className="h-4 w-4 mr-2" />
  Cancel
</Button>

// AFTER
<button className="btn btn-ghost mb-4" onClick={handleCancel}>
  <ArrowLeft className="h-4 w-4 mr-2" />
  Cancel
</button>
```

**2.4 Update Tests**

```typescript
// src/__tests__/components/recipes/recipe-card.test.tsx
// Update button selection logic for DaisyUI classes
it('should call onView when view button is clicked', () => {
  render(<RecipeCard recipe={mockRecipe} onView={mockOnView} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

  // Find button by DaisyUI classes instead of role
  const viewButton = screen.getByRole('button', { name: /view/i });
  fireEvent.click(viewButton);

  expect(mockOnView).toHaveBeenCalledWith(mockRecipe.id);
});
```

#### **Success Criteria**

- [ ] All page components migrated successfully
- [ ] Visual consistency maintained
- [ ] All tests updated and passing
- [ ] No accessibility regressions

#### **Rollback Plan**

- Feature flag for page-level button switching
- A/B testing capability for user experience validation
- Quick revert scripts for each page

---

### **Phase 3: Recipe Components** (Week 3)

#### **Objectives**

- Migrate recipe-specific components
- Ensure form functionality remains intact
- Update component documentation

#### **Tasks**

**3.1 Migrate Recipe Card Component**

```typescript
// src/components/recipes/recipe-card.tsx
// BEFORE
<Button variant="ghost" size="sm" onClick={() => onView(recipe.id)}>
  <Eye className="h-4 w-4" />
</Button>

// AFTER
<button className="btn btn-ghost btn-sm" onClick={() => onView(recipe.id)}>
  <Eye className="h-4 w-4" />
</button>
```

**3.2 Migrate Recipe Form Component**

```typescript
// src/components/recipes/recipe-form.tsx
// BEFORE
<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={() => setShowImageUpload(true)}
>
  <Upload className="h-4 w-4 mr-2" />
  Upload Image
</Button>

// AFTER
<button
  type="button"
  className="btn btn-outline btn-sm"
  onClick={() => setShowImageUpload(true)}
>
  <Upload className="h-4 w-4 mr-2" />
  Upload Image
</button>
```

**3.3 Update Component Props**

```typescript
// Update component interfaces to remove shadcn/ui dependencies
interface RecipeCardProps {
  recipe: Recipe;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  // Remove Button-specific props
}
```

**3.4 Update Storybook Stories** (if applicable)

```typescript
// Update component stories to use DaisyUI buttons
export const Default: Story = {
  args: {
    recipe: mockRecipe,
    onView: action('view'),
    onEdit: action('edit'),
    onDelete: action('delete'),
  },
};
```

#### **Success Criteria**

- [ ] Recipe card component fully migrated
- [ ] Recipe form functionality preserved
- [ ] All form validations working
- [ ] Component documentation updated

#### **Rollback Plan**

- Component-level feature flags
- Preserve original Button imports as fallback
- Component-specific rollback scripts

---

### **Phase 4: Cleanup & Optimization** (Week 4)

#### **Objectives**

- Remove unused shadcn/ui Button component
- Optimize bundle size
- Finalize migration documentation
- Performance testing

#### **Tasks**

**4.1 Remove Unused Dependencies**

```bash
# Remove shadcn/ui Button component
rm src/components/ui/button.tsx

# Update imports across the codebase
# Remove Button imports from all files
```

**4.2 Update Import Statements**

```typescript
// Remove these imports from all files
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';

// Replace with DaisyUI classes directly
```

**4.3 Bundle Size Optimization**

```bash
# Analyze bundle size impact
npm run build
npm run analyze

# Remove unused CSS from shadcn/ui button styles
```

**4.4 Performance Testing**

```typescript
// Add performance benchmarks
const ButtonPerformanceTest = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button className="btn btn-primary" onClick={() => setCount(c => c + 1)}>
        Clicked {count} times
      </button>
    </div>
  );
};
```

**4.5 Final Documentation Update**

```markdown
# Update component documentation

- Remove Button component references
- Add DaisyUI button usage examples
- Update migration guide with lessons learned
```

#### **Success Criteria**

- [ ] shadcn/ui Button component removed
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
// Add visual regression tests for button states
describe('Button Visual States', () => {
  it('should render primary button correctly', () => {
    render(<button className="btn btn-primary">Primary Button</button>);
    expect(screen.getByRole('button')).toHaveClass('btn', 'btn-primary');
  });

  it('should render disabled button correctly', () => {
    render(<button className="btn btn-primary" disabled>Disabled Button</button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### **Accessibility Testing**

```typescript
// Ensure accessibility is maintained
describe('Button Accessibility', () => {
  it('should have proper ARIA labels', () => {
    render(<button className="btn btn-primary" aria-label="Save recipe">Save</button>);
    expect(screen.getByLabelText('Save recipe')).toBeInTheDocument();
  });

  it('should be keyboard navigable', () => {
    render(<button className="btn btn-primary">Click me</button>);
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});
```

### **Integration Testing**

```typescript
// Test button interactions in real components
describe('Recipe Card Button Integration', () => {
  it('should handle view button click', () => {
    const mockOnView = jest.fn();
    render(<RecipeCard recipe={mockRecipe} onView={mockOnView} />);

    const viewButton = screen.getByRole('button', { name: /view/i });
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockRecipe.id);
  });
});
```

## 📊 **Success Metrics**

### **Technical Metrics**

- **Bundle Size**: Maintain or reduce current size
- **Performance**: No regression in button interaction speed
- **Accessibility**: Maintain WCAG 2.1 AA compliance
- **Test Coverage**: 100% of migrated components tested

### **User Experience Metrics**

- **Visual Consistency**: No visual regressions
- **Interaction Feedback**: Proper hover/focus states
- **Loading States**: Consistent loading indicators
- **Error Handling**: Proper error state styling

### **Development Metrics**

- **Code Maintainability**: Reduced complexity
- **Developer Experience**: Faster component development
- **Documentation Quality**: Complete and accurate guides
- **Migration Time**: Completed within 4 weeks

## 🚨 **Risk Mitigation**

### **High-Risk Scenarios**

**1. Visual Inconsistencies**

- **Mitigation**: Comprehensive visual regression testing
- **Fallback**: Feature flags for component-level rollback

**2. Accessibility Regressions**

- **Mitigation**: Automated accessibility testing
- **Fallback**: Preserve original Button component as backup

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
# rollback-buttons.sh

echo "Rolling back button migration..."

# Restore original Button component
git checkout HEAD~1 -- src/components/ui/button.tsx

# Restore original imports
find src -name "*.tsx" -exec sed -i '' 's/className="btn/import { Button } from "@/components\/ui\/button";/g' {} \;

echo "Rollback complete. Please test thoroughly."
```

## 📅 **Timeline Summary**

| Week       | Phase             | Focus                      | Deliverables                             |
| ---------- | ----------------- | -------------------------- | ---------------------------------------- |
| **Week 1** | Foundation        | Infrastructure & Testing   | Migration utilities, carousel migration  |
| **Week 2** | Core Pages        | High-priority pages        | Chat, recipes, add recipe pages migrated |
| **Week 3** | Recipe Components | Recipe-specific components | Recipe card, form components migrated    |
| **Week 4** | Cleanup           | Optimization & removal     | Button component removed, docs updated   |

## 🎯 **Post-Migration Benefits**

### **Immediate Benefits**

- **Reduced Bundle Size**: Eliminate shadcn/ui Button dependencies
- **Simplified Styling**: Semantic DaisyUI classes
- **Better Theming**: Consistent with DaisyUI theme system
- **Improved Performance**: Fewer CSS classes to process

### **Long-term Benefits**

- **Easier Maintenance**: Single styling system
- **Better Developer Experience**: Intuitive class names
- **Enhanced Customization**: DaisyUI theme flexibility
- **Future-Proof**: DaisyUI's active development

---

**Next Steps**: Begin Phase 1 by creating the migration utilities and testing on the carousel component.

For questions or issues during migration, refer to the [DaisyUI Integration Guide](daisyui-integration-guide.md) and [Troubleshooting Guide](troubleshooting.md).

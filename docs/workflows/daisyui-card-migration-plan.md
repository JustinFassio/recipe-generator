# DaisyUI Card Migration Plan

**Phased approach to replace shadcn/ui Card components with DaisyUI**

---

## ✅ **MIGRATION STATUS: COMPLETE**

**Card migration has been successfully completed!** All shadcn/ui Card components have been replaced with DaisyUI card classes throughout the application.

### **Migration Summary**

- **Start Date**: January 2025
- **Completion Date**: January 2025
- **Components Migrated**: 12+ components across 8 files
- **shadcn/ui Card Components**: Removed from codebase
- **Bundle Size Impact**: Reduced (shadcn/ui Card dependencies eliminated)

### **Files Successfully Migrated**

- `src/pages/recipes-page.tsx` - 2 cards (empty state, loading)
- `src/pages/recipe-view-page.tsx` - 3 cards (loading, content, empty)
- `src/components/recipes/recipe-card.tsx` - 1 card (recipe display)
- `src/components/recipes/recipe-form.tsx` - 4 cards (details, ingredients, instructions, notes)
- `src/components/recipes/parse-recipe-form.tsx` - 1 card (form container)
- `src/components/auth/auth-form.tsx` - 1 card (form container)
- `src/components/chat/ChatInterface.tsx` - 2 cards (messages)
- `src/components/chat/PersonaSelector.tsx` - 1 card (persona selection)
- `src/components/recipes/recipe-view.tsx` - 4 cards (header, ingredients, instructions, notes)

### **Migration Utility**

The `src/lib/card-migration.ts` utility continues to be used by all migrated components, providing consistent DaisyUI card class generation.

---

## 🎯 **Overview**

This document outlines the strategic plan that was used to migrate from shadcn/ui Card components to DaisyUI card components throughout the Recipe Generator application. The migration was completed incrementally to minimize risk and ensure consistency.

## 📊 **Current Card Usage Analysis**

### **Card Components Found**

| File                                           | Component                                                 | Usage Count | Priority |
| ---------------------------------------------- | --------------------------------------------------------- | ----------- | -------- |
| `src/components/recipes/parse-recipe-form.tsx` | Card, CardContent, CardHeader, CardTitle                  | 1           | High     |
| `src/components/recipes/recipe-view.tsx`       | Card, CardContent, CardHeader, CardTitle                  | 1           | High     |
| `src/components/recipes/recipe-card.tsx`       | Card, CardContent, CardHeader, CardTitle                  | 1           | High     |
| `src/pages/recipes-page.tsx`                   | Card, CardContent                                         | 1           | High     |
| `src/components/chat/ChatInterface.tsx`        | Card, CardContent                                         | 1           | High     |
| `src/components/chat/PersonaSelector.tsx`      | Card, CardContent                                         | 1           | Medium   |
| `src/pages/recipe-view-page.tsx`               | Card, CardContent                                         | 1           | Medium   |
| `src/components/auth/auth-form.tsx`            | Card, CardContent, CardHeader, CardTitle, CardDescription | 1           | Medium   |

### **Current shadcn/ui Card Structure**

```typescript
// Current Card components
Card: 'rounded-xl border bg-card text-card-foreground shadow';
CardHeader: 'flex flex-col space-y-1.5 p-6';
CardTitle: 'font-semibold leading-none tracking-tight';
CardDescription: 'text-sm text-muted-foreground';
CardContent: 'p-6 pt-0';
CardFooter: 'flex items-center p-6 pt-0';
```

### **DaisyUI Card Mapping**

| shadcn/ui Component | DaisyUI Equivalent         | Notes               |
| ------------------- | -------------------------- | ------------------- |
| `Card`              | `card`                     | Base card container |
| `CardHeader`        | `card-body`                | Header content area |
| `CardTitle`         | `card-title`               | Card title styling  |
| `CardDescription`   | `text-sm opacity-70`       | Description text    |
| `CardContent`       | `card-body`                | Main content area   |
| `CardFooter`        | `card-actions justify-end` | Footer with actions |

| shadcn/ui Variant | DaisyUI Equivalent     | Notes                  |
| ----------------- | ---------------------- | ---------------------- |
| `default`         | `card card-bordered`   | Standard bordered card |
| `compact`         | `card card-compact`    | Reduced padding        |
| `normal`          | `card card-normal`     | Standard padding       |
| `side`            | `card card-side`       | Horizontal layout      |
| `image-full`      | `card card-image-full` | Image overlay          |

## 🚀 **Migration Phases**

### **Phase 1: Foundation & Testing** ✅

#### **Objectives**

- Set up migration infrastructure
- Create card mapping utilities
- Test migration on low-risk components
- Establish patterns and best practices

#### **Tasks**

**1.1 Create Card Migration Utility** ✅

```typescript
// src/lib/card-migration.ts
export const createDaisyUICardClasses = (
  variant?: string,
  className?: string
): string => {
  const baseClasses = 'card';
  const variantClasses = mapCardVariant(variant);
  const additionalClasses = className || '';

  return `${baseClasses} ${variantClasses} ${additionalClasses}`.trim();
};

export const mapCardVariant = (variant?: string): string => {
  switch (variant) {
    case 'bordered':
      return 'card-bordered';
    case 'compact':
      return 'card-compact';
    case 'normal':
      return 'card-normal';
    case 'side':
      return 'card-side';
    case 'image-full':
      return 'card-image-full';
    default:
      return 'card-bordered';
  }
};
```

**1.2 Create Migration Test Component** ✅

```typescript
// src/components/ui/card-migration-test.tsx
export const CardMigrationTest: React.FC<CardMigrationProps> = ({
  variant = 'bordered',
  children,
  className,
  ...props
}) => {
  const daisyUIClasses = createDaisyUICardClasses(variant, className);

  return (
    <div className={daisyUIClasses} {...props}>
      {children}
    </div>
  );
};
```

**1.3 Test Page Created** ✅

- Route: `/card-test`
- Comprehensive testing of all card variants
- Interactive functionality validation
- Visual consistency verification

#### **Success Criteria**

- [x] Card migration utility created and tested
- [x] Test component implemented successfully
- [x] All card variants tested
- [x] No console errors or warnings

---

### **Phase 2: Core Recipe Components** (Next)

#### **Objectives**

- Migrate high-priority recipe components
- Ensure consistent user experience
- Update tests to reflect new card structure

#### **Tasks**

**2.1 Migrate Recipe Card Component**

```typescript
// src/components/recipes/recipe-card.tsx
// BEFORE
<Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg">
  <CardHeader className="pb-3">
    <CardTitle className="line-clamp-2 text-lg font-semibold">
      {recipe.title}
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-0">
    {/* content */}
  </CardContent>
</Card>

// AFTER
<div className="card card-bordered group overflow-hidden transition-all duration-200 hover:shadow-lg">
  <div className="card-body pb-3">
    <h3 className="card-title line-clamp-2 text-lg font-semibold">
      {recipe.title}
    </h3>
  </div>
  <div className="card-body pt-0">
    {/* content */}
  </div>
</div>
```

**2.2 Migrate Recipe View Component**

```typescript
// src/components/recipes/recipe-view.tsx
// BEFORE
<Card>
  <CardHeader className="pb-4">
    <CardTitle className="mb-4 text-2xl font-bold lg:text-3xl">
      {recipe.title}
    </CardTitle>
  </CardHeader>
</Card>

// AFTER
<div className="card card-bordered">
  <div className="card-body pb-4">
    <h3 className="card-title mb-4 text-2xl font-bold lg:text-3xl">
      {recipe.title}
    </h3>
  </div>
</div>
```

**2.3 Migrate Parse Recipe Form**

```typescript
// src/components/recipes/parse-recipe-form.tsx
// BEFORE
<Card>
  <CardHeader>
    <CardTitle className="flex items-center space-x-2">
      <Wand2 className="h-5 w-5 text-orange-500" />
      <span>Parse Recipe</span>
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* form content */}
  </CardContent>
</Card>

// AFTER
<div className="card card-bordered">
  <div className="card-body">
    <h3 className="card-title flex items-center space-x-2">
      <Wand2 className="h-5 w-5 text-orange-500" />
      <span>Parse Recipe</span>
    </h3>
  </div>
  <div className="card-body">
    {/* form content */}
  </div>
</div>
```

#### **Success Criteria**

- [ ] All recipe components migrated successfully
- [ ] Visual consistency maintained
- [ ] All tests updated and passing
- [ ] No accessibility regressions

---

### **Phase 3: Page Components** (Next)

#### **Objectives**

- Migrate page-level card components
- Ensure consistent user experience
- Update component documentation

#### **Tasks**

**3.1 Migrate Recipes Page**

```typescript
// src/pages/recipes-page.tsx
// BEFORE
<Card>
  <CardContent>
    <div className="text-center">
      <p className="text-gray-500">No recipes found</p>
    </div>
  </CardContent>
</Card>

// AFTER
<div className="card card-bordered">
  <div className="card-body">
    <div className="text-center">
      <p className="text-gray-500">No recipes found</p>
    </div>
  </div>
</div>
```

**3.2 Migrate Chat Interface**

```typescript
// src/components/chat/ChatInterface.tsx
// BEFORE
<Card className={`max-w-[80%] ${
  message.role === 'user'
    ? 'bg-green-500 text-white'
    : 'bg-white'
}`}>
  <CardContent className="p-3">
    {/* message content */}
  </CardContent>
</Card>

// AFTER
<div className={`card card-bordered max-w-[80%] ${
  message.role === 'user'
    ? 'bg-green-500 text-white'
    : 'bg-white'
}`}>
  <div className="card-body p-3">
    {/* message content */}
  </div>
</div>
```

**3.3 Migrate Auth Form**

```typescript
// src/components/auth/auth-form.tsx
// BEFORE
<Card className="w-full max-w-md">
  <CardHeader className="text-center">
    <CardTitle className="text-2xl font-bold">Recipe Generator</CardTitle>
    <CardDescription>
      Your digital cookbook for collecting and organizing recipes
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* form content */}
  </CardContent>
</Card>

// AFTER
<div className="card card-bordered w-full max-w-md">
  <div className="card-body text-center">
    <h3 className="card-title text-2xl font-bold">Recipe Generator</h3>
    <p className="text-sm opacity-70">
      Your digital cookbook for collecting and organizing recipes
    </p>
  </div>
  <div className="card-body">
    {/* form content */}
  </div>
</div>
```

#### **Success Criteria**

- [ ] All page components migrated successfully
- [ ] Visual consistency maintained
- [ ] All functionality preserved
- [ ] Component documentation updated

---

### **Phase 4: Cleanup & Optimization** (Final)

#### **Objectives**

- Remove unused shadcn/ui Card component
- Optimize bundle size
- Finalize migration documentation
- Performance testing

#### **Tasks**

**4.1 Remove Unused Dependencies**

```bash
# Remove shadcn/ui Card component
rm src/components/ui/card.tsx

# Update imports across the codebase
# Remove Card imports from all files
```

**4.2 Update Import Statements**

```typescript
// Remove these imports from all files
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

// Replace with DaisyUI classes directly
import { createDaisyUICardClasses } from '@/lib/card-migration';
```

**4.3 Bundle Size Optimization**

```bash
# Analyze bundle size impact
npm run build
npm run analyze

# Remove unused CSS from shadcn/ui card styles
```

**4.4 Performance Testing**

```typescript
// Add performance benchmarks
const CardPerformanceTest = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card card-bordered">
          <div className="card-body">
            <h3 className="card-title">Card {i + 1}</h3>
            <p>Performance test card</p>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### **Success Criteria**

- [ ] shadcn/ui Card component removed
- [ ] Bundle size reduced or maintained
- [ ] Performance benchmarks met
- [ ] Documentation complete and accurate

---

## 🧪 **Testing Strategy**

### **Visual Regression Testing**

```typescript
// Add visual regression tests for card states
describe('Card Visual States', () => {
  it('should render bordered card correctly', () => {
    render(<div className="card card-bordered">Card Content</div>);
    expect(screen.getByText('Card Content')).toHaveClass('card', 'card-bordered');
  });

  it('should render compact card correctly', () => {
    render(<div className="card card-compact">Compact Card</div>);
    expect(screen.getByText('Compact Card')).toHaveClass('card', 'card-compact');
  });
});
```

### **Accessibility Testing**

```typescript
// Ensure accessibility is maintained
describe('Card Accessibility', () => {
  it('should have proper semantic structure', () => {
    render(
      <div className="card card-bordered">
        <div className="card-body">
          <h3 className="card-title">Card Title</h3>
          <p>Card content</p>
        </div>
      </div>
    );
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
```

### **Integration Testing**

```typescript
// Test card interactions in real components
describe('Recipe Card Integration', () => {
  it('should handle card click', () => {
    const mockOnClick = jest.fn();
    render(<RecipeCard recipe={mockRecipe} onClick={mockOnClick} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith(mockRecipe.id);
  });
});
```

## 📊 **Success Metrics**

### **Technical Metrics**

- **Bundle Size**: Maintain or reduce current size
- **Performance**: No regression in card rendering speed
- **Accessibility**: Maintain WCAG 2.1 AA compliance
- **Test Coverage**: 100% of migrated components tested

### **User Experience Metrics**

- **Visual Consistency**: No visual regressions
- **Interaction Feedback**: Proper hover/focus states
- **Responsive Design**: Consistent across all screen sizes
- **Loading States**: Proper loading indicators

### **Development Metrics**

- **Code Maintainability**: Reduced complexity
- **Developer Experience**: Faster component development
- **Documentation Quality**: Complete and accurate guides
- **Migration Time**: Completed efficiently

## 🚨 **Risk Mitigation**

### **High-Risk Scenarios**

**1. Visual Inconsistencies**

- **Mitigation**: Comprehensive visual regression testing
- **Fallback**: Feature flags for component-level rollback

**2. Layout Breaking Changes**

- **Mitigation**: DaisyUI cards have different structure (card-body vs card-header/content)
- **Fallback**: Preserve original Card component as backup

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
# rollback-cards.sh

echo "Rolling back card migration..."

# Restore original Card component
git checkout HEAD~1 -- src/components/ui/card.tsx

# Restore original imports
find src -name "*.tsx" -exec sed -i '' 's/className="card/import { Card } from "@/components\/ui\/card";/g' {} \;

echo "Rollback complete. Please test thoroughly."
```

## 📅 **Timeline Summary**

| Phase       | Focus             | Deliverables                            | Status      |
| ----------- | ----------------- | --------------------------------------- | ----------- |
| **Phase 1** | Foundation        | Migration utilities, test components    | ✅ Complete |
| **Phase 2** | Recipe Components | Recipe card, view, parse components     | ✅ Complete |
| **Phase 3** | Page Components   | Recipes page, chat interface, auth form | ✅ Complete |
| **Phase 4** | Cleanup           | Card component removed, docs updated    | ✅ Complete |

## 🎯 **Post-Migration Benefits**

### **Immediate Benefits**

- **Reduced Bundle Size**: Eliminate shadcn/ui Card dependencies
- **Simplified Styling**: Semantic DaisyUI classes
- **Better Theming**: Consistent with DaisyUI theme system
- **Improved Performance**: Fewer CSS classes to process

### **Long-term Benefits**

- **Easier Maintenance**: Single styling system
- **Better Developer Experience**: Intuitive class names
- **Enhanced Customization**: DaisyUI theme flexibility
- **Future-Proof**: DaisyUI's active development

---

**Migration Complete**: All Card components have been successfully migrated to DaisyUI. The migration utility remains available for future use and consistency.

For reference during future migrations, see the [DaisyUI Integration Guide](daisyui-integration-guide.md) and [Troubleshooting Guide](troubleshooting.md).

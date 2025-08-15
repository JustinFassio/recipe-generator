# DaisyUI Skeleton Migration Plan

**Phased approach to replace shadcn/ui Skeleton components with DaisyUI**

---

## 🎯 **Overview**

This document outlines a strategic plan to migrate from shadcn/ui Skeleton components to DaisyUI skeleton components throughout the Recipe Generator application. The migration will be done incrementally to minimize risk and ensure consistency.

## 📊 **Current Skeleton Usage Analysis**

### **Skeleton Components Found**

| File                             | Component | Usage Count | Priority |
| -------------------------------- | --------- | ----------- | -------- |
| `src/pages/recipes-page.tsx`     | Skeleton  | 4           | High     |
| `src/pages/recipe-view-page.tsx` | Skeleton  | 8           | High     |

### **Current shadcn/ui Skeleton Structure**

```typescript
// Current Skeleton component
Skeleton: 'animate-pulse rounded-md bg-primary/10';
```

### **DaisyUI Skeleton Mapping**

| shadcn/ui Component | DaisyUI Equivalent | Notes               |
| ------------------- | ------------------ | ------------------- |
| `Skeleton`          | `skeleton`         | Base skeleton class |

| shadcn/ui Variant | DaisyUI Equivalent | Notes                        |
| ----------------- | ------------------ | ---------------------------- |
| `default`         | `skeleton`         | Standard skeleton            |
| `custom`          | `skeleton`         | Custom styling via className |

## 🚀 **Migration Phases**

### **Phase 1: Foundation & Testing** ✅

#### **Objectives**

- Set up migration infrastructure
- Create skeleton mapping utilities
- Test migration on low-risk components
- Establish patterns and best practices

#### **Tasks**

**1.1 Create Skeleton Migration Utility** ✅

```typescript
// src/lib/skeleton-migration.ts
export const createDaisyUISkeletonClasses = (className?: string): string => {
  const baseClasses = 'skeleton';
  const additionalClasses = className || '';

  return `${baseClasses} ${additionalClasses}`.trim();
};

/**
 * Migration helper to convert shadcn/ui Skeleton props to DaisyUI classes
 */
export const migrateSkeletonProps = (props: {
  className?: string;
  [key: string]: unknown;
}) => {
  const { className, ...restProps } = props;

  return {
    className: createDaisyUISkeletonClasses(className),
    ...restProps,
  };
};

/**
 * Type definitions for skeleton migration
 */
export interface SkeletonMigrationProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}
```

**1.2 Test Components** ✅

```typescript
// src/components/ui/skeleton-migration-test.tsx
import React from 'react';
import { createDaisyUISkeletonClasses } from '@/lib/skeleton-migration';

interface SkeletonMigrationTestProps {
  className?: string;
  children?: React.ReactNode;
}

export const SkeletonMigrationTest: React.FC<SkeletonMigrationTestProps> = ({
  className,
  children,
  ...props
}) => {
  const daisyUIClasses = createDaisyUISkeletonClasses(className);

  return (
    <div className={daisyUIClasses} {...props}>
      {children}
    </div>
  );
};

// Test component to showcase skeleton variants
export const SkeletonMigrationShowcase: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">DaisyUI Skeleton Migration Test</h2>

      {/* Basic Skeleton */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Skeleton</h3>
        <div className="space-y-2">
          <div className={createDaisyUISkeletonClasses('h-4 w-full')} />
          <div className={createDaisyUISkeletonClasses('h-6 w-3/4')} />
          <div className={createDaisyUISkeletonClasses('h-8 w-1/2')} />
        </div>
      </div>

      {/* Card-like Skeleton */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Card Skeleton</h3>
        <div className="card card-bordered w-80">
          <div className="aspect-video">
            <div className={createDaisyUISkeletonClasses('h-full w-full')} />
          </div>
          <div className="card-body space-y-3">
            <div className={createDaisyUISkeletonClasses('h-6 w-3/4')} />
            <div className={createDaisyUISkeletonClasses('h-4 w-1/2')} />
            <div className={createDaisyUISkeletonClasses('h-16 w-full')} />
          </div>
        </div>
      </div>

      {/* Recipe View Skeleton */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recipe View Skeleton</h3>
        <div className="space-y-6">
          <div className={createDaisyUISkeletonClasses('h-10 w-48')} />
          <div className="card card-bordered">
            <div className="card-body p-6">
              <div className={createDaisyUISkeletonClasses('mb-4 h-64 w-full')} />
              <div className={createDaisyUISkeletonClasses('mb-2 h-8 w-3/4')} />
              <div className={createDaisyUISkeletonClasses('h-4 w-1/2')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**1.3 Test Page** ✅

```typescript
// src/pages/skeleton-migration-test-page.tsx
import { SkeletonMigrationShowcase } from '@/components/ui/skeleton-migration-test';

export function SkeletonMigrationTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            DaisyUI Skeleton Migration Test
          </h1>
          <p className="text-gray-600">
            Testing the migration from shadcn/ui Skeleton components to DaisyUI
            skeleton classes
          </p>
        </div>

        <SkeletonMigrationShowcase />
      </div>
    </div>
  );
}
```

### **Phase 2: Component Migration** ✅

#### **Objectives**

- Migrate high-priority page components
- Ensure consistent user experience
- Update tests to reflect new skeleton structure

#### **Target Components**

- [x] **Recipes Page Skeleton** (`src/pages/recipes-page.tsx`) - 4 skeletons
- [x] **Recipe View Page Skeleton** (`src/pages/recipe-view-page.tsx`) - 8 skeletons

### **Phase 3: Cleanup & Optimization** ✅

#### **Objectives**

- Remove unused shadcn/ui Skeleton component
- Optimize bundle size
- Finalize migration documentation
- Performance testing

#### **Tasks**

- [x] Remove `src/components/ui/skeleton.tsx`
- [x] Update all import statements
- [x] Bundle size analysis
- [x] Performance benchmarking
- [x] Documentation updates
- [x] Remove test files

## 📈 **Progress Metrics**

### **Component Migration Status**

| Component              | Status      | File                   | Priority |
| ---------------------- | ----------- | ---------------------- | -------- |
| Recipes Page Skeletons | ✅ Complete | `recipes-page.tsx`     | High     |
| Recipe View Skeletons  | ✅ Complete | `recipe-view-page.tsx` | High     |

### **File Migration Status**

| File                             | Components | Migrated | Status      |
| -------------------------------- | ---------- | -------- | ----------- |
| `src/pages/recipes-page.tsx`     | 4          | 4        | ✅ Complete |
| `src/pages/recipe-view-page.tsx` | 8          | 8        | ✅ Complete |

## 🎯 **Success Criteria**

### **Phase 1 Success Criteria** ✅

- [x] Skeleton migration utility created and tested
- [x] Test components migrated successfully
- [x] Visual regression tests pass
- [x] No console errors or warnings

### **Phase 2 Success Criteria** ✅

- [x] All page components migrated successfully
- [x] Visual consistency maintained
- [x] All tests updated and passing
- [x] No accessibility regressions

### **Phase 3 Success Criteria** ✅

- [x] shadcn/ui Skeleton component removed
- [x] Bundle size reduced or maintained
- [x] Performance benchmarks met
- [x] Documentation complete and accurate

## 🚨 **Risk Mitigation**

### **High-Risk Scenarios**

**1. Visual Inconsistencies**

- **Mitigation**: Comprehensive visual regression testing
- **Fallback**: Feature flags for component-level rollback

**2. Animation Differences**

- **Mitigation**: DaisyUI skeleton has built-in animation
- **Fallback**: Preserve original Skeleton component as backup

**3. Performance Degradation**

- **Mitigation**: Performance benchmarking before/after
- **Fallback**: Gradual rollout with monitoring

### **Rollback Procedures**

```bash
# Quick rollback script
#!/bin/bash
# rollback-skeleton.sh

echo "Rolling back skeleton migration..."

# Restore original Skeleton component
git checkout HEAD~1 -- src/components/ui/skeleton.tsx

# Restore original imports
find src -name "*.tsx" -exec sed -i '' 's/className="skeleton/import { Skeleton } from "@/components\/ui\/skeleton";/g' {} \;

echo "Rollback complete. Please test thoroughly."
```

## 📅 **Timeline Summary**

| Phase       | Focus               | Deliverables                             | Status      |
| ----------- | ------------------- | ---------------------------------------- | ----------- |
| **Phase 1** | Foundation          | Migration utilities, test components     | ✅ Complete |
| **Phase 2** | Component Migration | Recipes page, recipe view page           | ✅ Complete |
| **Phase 3** | Cleanup             | Skeleton component removed, docs updated | ✅ Complete |

## 🎯 **Post-Migration Benefits**

### **Immediate Benefits**

- **Reduced Bundle Size**: Eliminate shadcn/ui Skeleton dependencies
- **Simplified Styling**: Semantic DaisyUI classes
- **Better Theming**: Consistent with DaisyUI theme system
- **Improved Performance**: Fewer CSS classes to process

### **Long-term Benefits**

- **Easier Maintenance**: Single styling system
- **Better Developer Experience**: Intuitive class names
- **Enhanced Customization**: DaisyUI theme flexibility
- **Future-Proof**: DaisyUI's active development

---

**Migration Complete**: All Skeleton components have been successfully migrated to DaisyUI. The migration utility remains available for future use and consistency.

For reference during future migrations, see the [DaisyUI Integration Guide](daisyui-integration-guide.md) and [Troubleshooting Guide](troubleshooting.md).

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

## 🌍 **Regional Cuisine System - NEW!**

### **Accessing Cuisine Data**

```typescript
// Import the comprehensive cuisine system
import { 
  CUISINE_REGIONS, 
  ALL_CUISINES, 
  getCuisinesByRegion,
  getCuisineRegion,
  getAvailableRegions 
} from '@/lib/cuisines';

// Get all available regions
const regions = getAvailableRegions();
// Returns: ['Americas', 'Europe', 'Asia', 'Africa', 'Middle East', 'Oceania']

// Get cuisines for a specific region
const europeanCuisines = getCuisinesByRegion('Europe');
// Returns: ['Italian', 'French', 'Greek', 'Spanish', 'British', 'German', ...]

// Find which region a cuisine belongs to
const region = getCuisineRegion('Thai');
// Returns: 'Asia'
```

### **Regional Cuisine Structure**

```typescript
// Each region contains:
interface CuisineRegion {
  description: string;    // Cultural context
  cuisines: string[];     // Available cuisines
}

// Example: Americas Region
{
  'Americas': {
    description: 'American culinary traditions',
    cuisines: [
      'Mexican', 'American', 'Brazilian', 'Peruvian', 'Caribbean',
      'Argentine', 'Chilean', 'Colombian', 'Venezuelan', 'Canadian',
      'Ecuadorian', 'Uruguayan', 'Paraguayan', 'Guatemalan', 'Honduran',
      'Salvadoran', 'Nicaraguan', 'Costa Rican', 'Panamanian', 'Belizean',
      'Jamaican', 'Trinidadian', 'Barbadian', 'Bahamian', 'Cuban',
      'Dominican', 'Haitian'
    ]
  }
}
```

### **Complete Regional Coverage**

| **Region** | **Cuisines** | **Coverage** | **Key Examples** |
|------------|---------------|--------------|------------------|
| **Americas** | 26 | 15.5% | Mexican, Brazilian, Caribbean |
| **Europe** | 30 | 17.9% | Italian, French, Ukrainian |
| **Asia** | 31 | 18.5% | Chinese, Thai, Kazakh |
| **Africa** | 19 | 11.3% | Moroccan, Ethiopian, Ugandan |
| **Middle East** | 10 | 6.0% | Lebanese, Turkish, Israeli |
| **Oceania** | 10 | 6.0% | Hawaiian, Polynesian, Papuan |

**Total Coverage: 134 cuisines (79.8% of world countries)**

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

## 🌍 **Working with Regional Cuisines**

### **Adding New Cuisines**

```typescript
// To add a new cuisine, update src/lib/cuisines.ts
export const CUISINE_REGIONS: CuisineData = {
  'Your Region': {
    description: 'Description of culinary traditions',
    cuisines: [
      'Existing Cuisine 1',
      'Existing Cuisine 2',
      'New Cuisine', // Add here
    ]
  }
};
```

### **Creating Regional Recipe Categories**

```typescript
// When creating recipes, use the namespace format:
const recipeCategories = [
  'Course: Main',
  'Cuisine: Brazilian', // Use exact cuisine name from cuisines.ts
  'Technique: Grilling',
  'Collection: Quick & Easy'
];
```

### **Filtering by Region**

```typescript
// In components, use the CuisineFilter:
import { CuisineFilter } from '@/components/ui/cuisine-filter';

<CuisineFilter
  selectedCuisines={filters.cuisine || []}
  onCuisinesChange={(cuisines) => updateFilters({ cuisine: cuisines })}
  placeholder="Filter by cuisine..."
  className="w-48"
/>
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

### **Cuisine-Related Issues**

- Always use exact cuisine names from `CUISINE_REGIONS`
- Maintain regional grouping when adding new cuisines
- Update both the region data and the flattened `ALL_CUISINES` array
- Test that new cuisines appear in the correct regional dropdown

---

## 📁 **File Organization**

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   │   ├── cuisine-filter.tsx    # NEW: Regional cuisine filter
│   │   └── category-filter.tsx   # Category filter
│   └── feature/        # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
│   ├── cuisines.ts     # NEW: Regional cuisine definitions
│   └── categories.ts   # Category definitions
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
- [ ] **Cuisine consistency**: New cuisines appear in correct regions
- [ ] **Filter functionality**: CuisineFilter works with new additions

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

### **Cuisine Filter Issues**

```bash
# Check cuisine data structure
npm run build

# Verify cuisine filter component
npm run test:run src/__tests__/components/ui/cuisine-filter.test.tsx
```

---

## 📚 **Reference Documentation**

- **Full Pre-PR Verification**: `docs/PRE-PR-VERIFICATION.md`
- **Detailed Checklist**: `docs/PRE-PR-VERIFICATION-CHECKLIST.md`
- **Project README**: `README.md`
- **Test Examples**: `src/__tests__/`
- **Cuisine System**: `src/lib/cuisines.ts`
- **Category System**: `src/lib/categories.ts`

---

## 🌍 **Regional Cuisine Quick Reference**

### **Americas (26 cuisines)**
- **North**: American, Canadian
- **Central**: Mexican, Guatemalan, Honduran, Salvadoran, Nicaraguan, Costa Rican, Panamanian, Belizean
- **South**: Brazilian, Peruvian, Argentine, Chilean, Colombian, Venezuelan, Ecuadorian, Uruguayan, Paraguayan
- **Caribbean**: Caribbean, Jamaican, Trinidadian, Barbadian, Bahamian, Cuban, Dominican, Haitian

### **Europe (30 cuisines)**
- **Western**: Italian, French, Spanish, British, German, Dutch, Belgian, Swiss, Austrian
- **Eastern**: Ukrainian, Belarusian, Lithuanian, Latvian, Estonian, Romanian, Bulgarian, Serbian, Croatian, Slovenian, Slovak, Moldovan
- **Northern**: Swedish, Norwegian, Danish, Finnish
- **Southern**: Greek, Polish, Hungarian, Czech, Russian

### **Asia (31 cuisines)**
- **East**: Chinese, Japanese, Korean, Mongolian
- **South**: Indian, Pakistani, Bangladeshi, Sri Lankan, Nepalese, Afghan
- **Southeast**: Thai, Vietnamese, Indonesian, Malaysian, Filipino, Cambodian, Laotian, Myanmar, Bruneian, Timorese, Singaporean
- **Central**: Kazakh, Uzbek, Kyrgyz, Tajik, Turkmen, Azerbaijani

### **Africa (19 cuisines)**
- **North**: Moroccan, Egyptian, Tunisian, Algerian
- **West**: Nigerian, Ghanaian, Senegalese
- **East**: Ethiopian, Kenyan, Ugandan, Tanzanian
- **South**: South African, Zimbabwean, Zambian, Malawian, Mozambican, Angolan, Namibian, Botswanan

### **Middle East (10 cuisines)**
- **Levant**: Lebanese, Syrian, Jordanian, Palestinian, Israeli
- **Persian Gulf**: Iranian, Iraqi, Yemeni
- **Cross-regional**: Turkish, Middle Eastern

### **Oceania (10 cuisines)**
- **Australia/NZ**: Australian, Maori
- **Pacific Islands**: Hawaiian, Polynesian, Fijian, Samoan, Papuan, Solomon Islander, Vanuatuan, New Caledonian

---

**Remember**: Always run `npm run verify:quick` before and after making changes to ensure the automated verification system will succeed. When working with cuisines, always reference the exact names from `src/lib/cuisines.ts` to maintain consistency.

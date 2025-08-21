# Profile System Developer Guide

## Overview

The Profile System is a modular, hook-based architecture for managing user profile data in the Recipe Generator application. This system was developed through a three-phase modularization process to achieve excellent separation of concerns, type safety, accessibility, and maintainability.

## Architecture

### Core Principles

1. **Hook-Based Business Logic**: All business logic is encapsulated in custom hooks
2. **Component Composition**: Components are pure presentation layers that compose together
3. **Type Safety**: Comprehensive TypeScript interfaces for all data and return types
4. **Accessibility First**: WCAG compliance with proper ARIA attributes and keyboard navigation
5. **Feature-First Organization**: Files organized by feature domain (basic, safety, cooking, etc.)

### Directory Structure

```
src/
├── components/profile/
│   ├── basic/          # Core profile info (avatar, bio, basics)
│   ├── safety/         # Health & safety preferences
│   ├── cooking/        # Cooking preferences & equipment
│   ├── account/        # Account management (email, password)
│   └── shared/         # Reusable UI primitives
├── hooks/profile/      # Business logic hooks
└── __tests__/
    ├── components/profile/  # Component tests
    └── hooks/profile/       # Hook tests
```

## Components Architecture

### Component Categories

#### 1. Basic Profile Components (`components/profile/basic/`)

- **AvatarCard**: Avatar upload and display
- **BioCard**: User bio editing
- **ProfileInfoForm**: Core profile information form

#### 2. Safety Components (`components/profile/safety/`)

- **SafetySection**: Container for safety-related fields
- **AllergiesField**: Allergy management with tag toggles
- **DietaryRestrictionsField**: Dietary restrictions management
- **MedicalConditionsField**: Medical conditions tracking
- **SafetySaveButton**: Save button for safety data

#### 3. Cooking Components (`components/profile/cooking/`)

- **CookingSection**: Container for cooking preferences
- **PreferredCuisinesField**: Cuisine preference selection
- **EquipmentField**: Available equipment tracking
- **SpiceToleranceField**: Spice tolerance slider
- **DislikedIngredientsField**: Ingredients to avoid
- **CookingSaveButton**: Save button for cooking data

#### 4. Account Components (`components/profile/account/`)

- **EmailCard**: Email address management
- **PasswordCard**: Password change functionality

#### 5. Shared Components (`components/profile/shared/`)

- **SectionCard**: Consistent section container
- **FieldLabel**: Standardized field labels
- **InlineIconInput**: Input fields with icons
- **TagToggleGroup**: Tag selection interface
- **RangeWithTicks**: Slider with labeled ticks

### Component Design Patterns

#### Props Interface Pattern

```typescript
interface ComponentProps {
  // Data
  value: string;
  onChange: (value: string) => void;

  // UI State
  loading?: boolean;
  error?: string | null;

  // Accessibility
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;

  // Styling
  className?: string;
}
```

#### Memoization Pattern

All components use `React.memo` for performance optimization:

```typescript
export const ComponentName = React.memo<ComponentProps>(({ ...props }) => {
  // Component implementation
});
```

## Hooks Architecture

### Hook Categories

#### 1. Data Management Hooks

- **useProfileBasics**: Core profile information (name, region, language, etc.)
- **useUserSafety**: Health and safety preferences
- **useCookingPreferences**: Cooking-related preferences
- **useAvatarUpload**: Avatar image management
- **useBioUpdate**: User biography management

#### 2. Feature-Specific Hooks

- **useUsernameAvailability**: Username validation and claiming
- **useAccountManagement**: Email and password management

### Hook Design Patterns

#### Standard Hook Interface

```typescript
export interface UseHookNameReturn {
  // State
  data: DataType;
  loading: boolean;
  error: string | null;

  // Actions
  loadData: () => Promise<void>;
  saveData: (data: DataType) => Promise<boolean>;

  // State Setters
  setField: (value: FieldType) => void;

  // Validation
  validateData: (data: DataType) => boolean;
}

export function useHookName(): UseHookNameReturn {
  // Implementation
}
```

#### Error Handling Pattern

```typescript
try {
  const result = await apiCall(data);
  if (result.error) {
    setError('Specific error message');
    return false;
  }
  // Success handling
  return true;
} catch {
  setError('Generic fallback error message');
  return false;
}
```

## Data Flow

### 1. Page Level (Thin Orchestrator)

```typescript
// src/pages/profile-page.tsx
export default function ProfilePage() {
  // Initialize all hooks
  const userSafety = useUserSafety();
  const cookingPrefs = useCookingPreferences();
  // ... other hooks

  // Simple wrapper handlers for component compatibility
  const handleSafetySave = async () => {
    await userSafety.saveUserSafety({
      allergies: userSafety.allergies,
      dietary_restrictions: userSafety.dietaryRestrictions,
      medical_conditions: userSafety.medicalConditions,
    });
  };

  // Render components with hook data
  return (
    <SafetySection>
      <AllergiesField
        values={userSafety.allergies}
        onChange={userSafety.setAllergies}
      />
      <SafetySaveButton
        onClick={handleSafetySave}
        loading={userSafety.loading}
      />
    </SafetySection>
  );
}
```

### 2. Hook Level (Business Logic)

```typescript
// src/hooks/profile/useUserSafety.ts
export function useUserSafety(): UseUserSafetyReturn {
  const [allergies, setAllergies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveUserSafety = useCallback(
    async (data: UserSafetyData) => {
      setLoading(true);
      setError(null);

      try {
        const result = await updateUserSafety(user.id, data);
        if (result.error) {
          setError('Failed to save safety data');
          return false;
        }

        toast({ title: 'Safety preferences updated!' });
        return true;
      } catch {
        setError('Failed to save safety data');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user.id, toast]
  );

  return {
    allergies,
    setAllergies,
    saveUserSafety,
    loading,
    error,
  };
}
```

### 3. Component Level (Presentation)

```typescript
// src/components/profile/safety/AllergiesField.tsx
interface AllergiesFieldProps {
  values: string[];
  onChange: (allergies: string[]) => void;
  className?: string;
}

export const AllergiesField = React.memo<AllergiesFieldProps>(({
  values,
  onChange,
  className = '',
}) => {
  const fieldId = useId();

  return (
    <div className={className}>
      <FieldLabel
        htmlFor={fieldId}
        label="Allergies"
        aria-describedby={`${fieldId}-help`}
      />
      <TagToggleGroup>
        {commonAllergens.map(allergen => (
          <TagButton
            key={allergen}
            selected={values.includes(allergen)}
            onClick={() => toggleAllergen(allergen)}
            aria-pressed={values.includes(allergen)}
          >
            {allergen}
          </TagButton>
        ))}
      </TagToggleGroup>
    </div>
  );
});
```

## Type System

### Data Interfaces

```typescript
// Hook data interfaces
export interface UserSafetyData {
  allergies: string[];
  dietary_restrictions: string[];
  medical_conditions: string[];
}

export interface ProfileBasicsData {
  full_name: string | null;
  region: string | null;
  language: string;
  units: string;
  time_per_meal: number;
  skill_level: string;
}
```

### Hook Return Types

```typescript
export interface UseUserSafetyReturn {
  // State
  allergies: string[];
  dietaryRestrictions: string[];
  medicalConditions: string[];
  loading: boolean;
  error: string | null;

  // Actions
  loadUserSafety: () => Promise<void>;
  saveUserSafety: (data: UserSafetyData) => Promise<void>;

  // State setters
  setAllergies: (allergies: string[]) => void;
  setDietaryRestrictions: (restrictions: string[]) => void;
  setMedicalConditions: (conditions: string[]) => void;
}
```

## Accessibility Features

### ARIA Implementation

- **Unique IDs**: `useId()` for form field associations
- **Labels**: Proper `htmlFor` and `aria-label` attributes
- **Descriptions**: `aria-describedby` for help text
- **Live Regions**: `aria-live` for dynamic status updates
- **Form Validation**: `aria-invalid` and `aria-required`
- **Interactive States**: `aria-pressed` for toggle buttons

### Keyboard Navigation

- Tab order follows logical flow
- Enter/Space activation for custom buttons
- Escape to close modals/dropdowns
- Arrow keys for slider controls

## Performance Optimizations

### Memoization Strategy

- **React.memo**: All components are memoized
- **useCallback**: Event handlers are stabilized
- **useMemo**: Expensive computations are cached

### Re-render Prevention

```typescript
// Stabilized handlers prevent unnecessary re-renders
const handleAllergiesChange = useCallback((allergies: string[]) => {
  setAllergies(allergies);
}, []);

// Memoized components only re-render when props change
export const AllergiesField = React.memo<AllergiesFieldProps>(
  ({ values, onChange }) => {
    // Component implementation
  }
);
```

## Error Handling

### Hook-Level Error Management

- Consistent error state in all hooks
- Generic fallback messages for network errors
- Specific API error messages when available
- Toast notifications for user feedback

### Error Recovery

- Clear error state on retry
- Optimistic updates with rollback
- Loading states prevent duplicate submissions

## Development Workflow

### Adding New Profile Features

1. **Create Hook** (`src/hooks/profile/useNewFeature.ts`)

   ```typescript
   export interface UseNewFeatureReturn {
     // Define interface
   }

   export function useNewFeature(): UseNewFeatureReturn {
     // Implement business logic
   }
   ```

2. **Create Components** (`src/components/profile/category/`)

   ```typescript
   export const NewFeatureField = React.memo<Props>(({ ...props }) => {
     // Implement presentation logic
   });
   ```

3. **Add Tests** (`src/__tests__/`)
   - Unit tests for hooks
   - Component tests for UI
   - Integration tests for workflows

4. **Update Exports**
   - Add to `src/hooks/profile/index.ts`
   - Add to `src/components/profile/category/index.ts`

5. **Integrate in Profile Page**

   ```typescript
   const newFeature = useNewFeature();

   return (
     <NewFeatureField
       value={newFeature.value}
       onChange={newFeature.setValue}
     />
   );
   ```

### Code Review Checklist

- [ ] TypeScript interfaces defined
- [ ] Accessibility attributes included
- [ ] Error handling implemented
- [ ] Loading states managed
- [ ] Components memoized
- [ ] Tests written
- [ ] Barrel exports updated

## Common Patterns

### Tag Toggle Pattern

Used for multi-select fields (allergies, cuisines, equipment):

```typescript
const toggleItem = useCallback((item: string) => {
  setItems((prev) =>
    prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
  );
}, []);
```

### Form Validation Pattern

```typescript
const validateData = useCallback((data: DataType): boolean => {
  if (!data.requiredField) return false;
  if (data.numericField < MIN || data.numericField > MAX) return false;
  return true;
}, []);
```

### Loading State Pattern

```typescript
const [loading, setLoading] = useState(false);

const performAction = useCallback(async () => {
  setLoading(true);
  try {
    await apiCall();
  } finally {
    setLoading(false);
  }
}, []);
```

## Best Practices

### Component Design

- Keep components focused on presentation
- Use composition over inheritance
- Implement proper TypeScript interfaces
- Include accessibility attributes
- Memoize for performance

### Hook Design

- Encapsulate all business logic
- Provide clear, typed interfaces
- Handle errors gracefully
- Use meaningful state names
- Include validation functions

### Testing

- Test hook logic independently
- Test component rendering and interactions
- Include integration tests for complete workflows
- Mock external dependencies
- Test error scenarios

### Performance

- Memoize components and callbacks
- Avoid unnecessary re-renders
- Use proper dependency arrays
- Profile performance in development
- Consider code splitting for large features

## Migration Guide

When updating existing profile features:

1. **Extract Logic**: Move business logic from components to hooks
2. **Update Types**: Ensure TypeScript interfaces are comprehensive
3. **Add Tests**: Create comprehensive test coverage
4. **Accessibility**: Audit and improve accessibility
5. **Performance**: Add memoization and optimization
6. **Documentation**: Update this guide with changes

## Troubleshooting

### Common Issues

**Hook not updating component**

- Check dependency arrays in useCallback/useMemo
- Verify state setter is being called
- Ensure component is not over-memoized

**TypeScript errors**

- Check interface definitions match usage
- Verify all required props are provided
- Update barrel exports after adding new types

**Accessibility warnings**

- Add missing aria-labels
- Ensure form fields have proper associations
- Check keyboard navigation flow

**Performance issues**

- Profile component re-renders
- Add React.memo to heavy components
- Stabilize callback functions with useCallback

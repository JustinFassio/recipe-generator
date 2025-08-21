# Profile System Testing Guide

## Overview

This guide covers testing strategies, patterns, and best practices for the Profile System. Our testing approach emphasizes comprehensive coverage, realistic scenarios, and maintainable test code.

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Realistic Scenarios**: Test real user workflows and edge cases
3. **Isolated Units**: Each test should be independent and focused
4. **Accessible Testing**: Include accessibility in test scenarios
5. **Error Coverage**: Test both success and failure paths

### Testing Pyramid

```
    /\     E2E Tests (Few)
   /  \    Integration Tests (Some)
  /____\   Unit Tests (Many)
```

## Test Categories

### 1. Hook Unit Tests (`src/__tests__/hooks/profile/`)

Test business logic in isolation from UI components.

#### Example: `useProfileBasics.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProfileBasics } from '@/hooks/profile/useProfileBasics';

describe('useProfileBasics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with profile values', () => {
      const { result } = renderHook(() => useProfileBasics());

      expect(result.current.fullName).toBe('Test User');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Actions', () => {
    it('should update profile successfully', async () => {
      const { result } = renderHook(() => useProfileBasics());

      await act(async () => {
        const success = await result.current.updateProfileBasics({
          full_name: 'New Name',
          language: 'en',
          units: 'metric',
          time_per_meal: 30,
          skill_level: '2',
        });
        expect(success).toBe(true);
      });
    });
  });
});
```

#### Hook Testing Patterns

**State Management Testing**

```typescript
it('should update state correctly', () => {
  const { result } = renderHook(() => useHookName());

  act(() => {
    result.current.setValue('new value');
  });

  expect(result.current.value).toBe('new value');
});
```

**Async Action Testing**

```typescript
it('should handle async operations', async () => {
  const { result } = renderHook(() => useHookName());

  await act(async () => {
    const success = await result.current.performAction();
    expect(success).toBe(true);
  });

  expect(result.current.loading).toBe(false);
});
```

**Error Handling Testing**

```typescript
it('should handle errors gracefully', async () => {
  mockApiCall.mockRejectedValueOnce(new Error('Network error'));

  const { result } = renderHook(() => useHookName());

  await act(async () => {
    const success = await result.current.performAction();
    expect(success).toBe(false);
  });

  expect(result.current.error).toBe('Failed to perform action');
});
```

### 2. Component Unit Tests (`src/__tests__/components/profile/`)

Test component rendering, interactions, and prop handling.

#### Example: `AvatarCard.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AvatarCard } from '@/components/profile/basic/AvatarCard';

describe('AvatarCard', () => {
  const defaultProps = {
    avatarUrl: 'https://example.com/avatar.jpg',
    loading: false,
    onUpload: vi.fn(),
  };

  it('renders avatar image', () => {
    render(<AvatarCard {...defaultProps} />);

    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', defaultProps.avatarUrl);
    expect(avatar).toHaveAttribute('alt', 'Profile picture');
  });

  it('handles file upload', async () => {
    const mockOnUpload = vi.fn();
    render(<AvatarCard {...defaultProps} onUpload={mockOnUpload} />);

    const fileInput = screen.getByLabelText(/upload avatar/i);
    const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

    await fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockOnUpload).toHaveBeenCalledWith(file);
  });
});
```

#### Component Testing Patterns

**Accessibility Testing**

```typescript
it('has proper accessibility attributes', () => {
  render(<Component />);

  expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Expected label');
  expect(screen.getByLabelText('Field name')).toBeInTheDocument();
});
```

**User Interaction Testing**

```typescript
it('handles user interactions', async () => {
  const mockHandler = vi.fn();
  render(<Component onAction={mockHandler} />);

  await fireEvent.click(screen.getByRole('button'));

  expect(mockHandler).toHaveBeenCalledWith(expectedValue);
});
```

**Conditional Rendering Testing**

```typescript
it('shows loading state', () => {
  render(<Component loading={true} />);

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
```

### 3. Integration Tests

Test complete workflows combining hooks and components.

#### Example: `ProfileInfoForm-integration.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ProfileInfoForm } from '@/components/profile/basic/ProfileInfoForm';
import { useProfileBasics } from '@/hooks/profile/useProfileBasics';

vi.mock('@/hooks/profile/useProfileBasics');

describe('ProfileInfoForm Integration', () => {
  it('integrates with useProfileBasics hook', async () => {
    const mockHook = {
      fullName: 'John Doe',
      setFullName: vi.fn(),
      updateProfileBasics: vi.fn().mockResolvedValue(true),
      loading: false,
    };

    vi.mocked(useProfileBasics).mockReturnValue(mockHook);

    render(<ProfileInfoForm {...mockHook} />);

    // Test form interaction
    const nameInput = screen.getByDisplayValue('John Doe');
    await fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    expect(mockHook.setFullName).toHaveBeenCalledWith('Jane Doe');

    // Test form submission
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHook.updateProfileBasics).toHaveBeenCalled();
    });
  });
});
```

## Test Setup and Configuration

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
```

### Test Setup File

```typescript
// src/test-setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

## Mocking Strategies

### 1. Hook Mocking

```typescript
// Mock external hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    profile: { full_name: 'Test User' },
    refreshProfile: vi.fn(),
  }),
}));
```

### 2. API Mocking

```typescript
// Mock API functions
vi.mock('@/lib/auth', () => ({
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
}));

// In tests
const mockUpdateProfile = vi.mocked(updateProfile);
mockUpdateProfile.mockResolvedValue({ success: true });
```

### 3. Component Mocking

```typescript
// Mock complex child components
vi.mock('@/components/ui/toast', () => ({
  Toast: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast">{children}</div>
  ),
}));
```

## Testing Patterns by Feature

### 1. Form Testing

```typescript
describe('Form Component', () => {
  it('validates input fields', async () => {
    render(<FormComponent />);

    const input = screen.getByLabelText('Required field');
    const submitButton = screen.getByRole('button', { name: /submit/i });

    // Test empty field validation
    await fireEvent.click(submitButton);
    expect(screen.getByText('Field is required')).toBeInTheDocument();

    // Test valid input
    await fireEvent.change(input, { target: { value: 'valid value' } });
    await fireEvent.click(submitButton);
    expect(screen.queryByText('Field is required')).not.toBeInTheDocument();
  });
});
```

### 2. Tag Toggle Testing

```typescript
describe('Tag Selection', () => {
  it('handles tag selection and deselection', async () => {
    const mockOnChange = vi.fn();
    render(<TagField values={[]} onChange={mockOnChange} />);

    const tag = screen.getByRole('button', { name: 'Tag Name' });

    // Select tag
    await fireEvent.click(tag);
    expect(mockOnChange).toHaveBeenCalledWith(['Tag Name']);

    // Deselect tag
    render(<TagField values={['Tag Name']} onChange={mockOnChange} />);
    await fireEvent.click(tag);
    expect(mockOnChange).toHaveBeenCalledWith([]);
  });
});
```

### 3. File Upload Testing

```typescript
describe('File Upload', () => {
  it('handles file selection and upload', async () => {
    const mockOnUpload = vi.fn();
    render(<UploadComponent onUpload={mockOnUpload} />);

    const fileInput = screen.getByLabelText(/upload/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockOnUpload).toHaveBeenCalledWith(file);
  });

  it('validates file type', async () => {
    render(<UploadComponent />);

    const fileInput = screen.getByLabelText(/upload/i);
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

    await fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(screen.getByText('Invalid file type')).toBeInTheDocument();
  });
});
```

## Accessibility Testing

### 1. ARIA Testing

```typescript
describe('Accessibility', () => {
  it('has proper ARIA attributes', () => {
    render(<Component />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('Field name')).toHaveAttribute('aria-required', 'true');
  });

  it('announces dynamic changes', async () => {
    render(<Component />);

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});
```

### 2. Keyboard Navigation Testing

```typescript
describe('Keyboard Navigation', () => {
  it('supports keyboard interactions', async () => {
    const mockHandler = vi.fn();
    render(<Component onAction={mockHandler} />);

    const button = screen.getByRole('button');

    // Test Enter key
    await fireEvent.keyDown(button, { key: 'Enter' });
    expect(mockHandler).toHaveBeenCalled();

    // Test Space key
    await fireEvent.keyDown(button, { key: ' ' });
    expect(mockHandler).toHaveBeenCalledTimes(2);
  });
});
```

## Error Testing

### 1. Network Error Testing

```typescript
describe('Error Handling', () => {
  it('handles network errors', async () => {
    const mockApiCall = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useHook());

    await act(async () => {
      await result.current.performAction();
    });

    expect(result.current.error).toBe('Failed to perform action');
  });
});
```

### 2. Validation Error Testing

```typescript
describe('Validation', () => {
  it('shows validation errors', async () => {
    render(<FormComponent />);

    const input = screen.getByLabelText('Email');
    await fireEvent.change(input, { target: { value: 'invalid-email' } });
    await fireEvent.blur(input);

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });
});
```

## Performance Testing

### 1. Re-render Testing

```typescript
describe('Performance', () => {
  it('prevents unnecessary re-renders', () => {
    const mockChild = vi.fn(() => <div>Child</div>);
    const ChildComponent = mockChild;

    const { rerender } = render(
      <ParentComponent>
        <ChildComponent />
      </ParentComponent>
    );

    // Re-render with same props
    rerender(
      <ParentComponent>
        <ChildComponent />
      </ParentComponent>
    );

    // Child should only render once due to memoization
    expect(mockChild).toHaveBeenCalledTimes(1);
  });
});
```

## Test Data Management

### 1. Test Factories

```typescript
// test-utils/factories.ts
export const createMockProfile = (overrides = {}) => ({
  id: 'test-user',
  full_name: 'Test User',
  email: 'test@example.com',
  language: 'en',
  units: 'metric',
  ...overrides,
});

export const createMockUserSafety = (overrides = {}) => ({
  allergies: ['peanuts'],
  dietary_restrictions: ['vegetarian'],
  medical_conditions: [],
  ...overrides,
});
```

### 2. Test Utilities

```typescript
// test-utils/render-helpers.ts
export const renderWithProviders = (ui: React.ReactElement) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );

  return render(ui, { wrapper: Wrapper });
};
```

## Running Tests

### Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test src/__tests__/hooks/profile/useProfileBasics.test.ts

# Run tests matching pattern
npm run test -- --grep "validation"
```

### Coverage Goals

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Debugging Tests

### 1. Debug Output

```typescript
import { screen } from '@testing-library/react';

it('debug test', () => {
  render(<Component />);

  // Print DOM structure
  screen.debug();

  // Print specific element
  screen.debug(screen.getByRole('button'));
});
```

### 2. Test Isolation

```typescript
it.only('focused test', () => {
  // Only this test will run
});

it.skip('skipped test', () => {
  // This test will be skipped
});
```

## Best Practices

### 1. Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and independent

### 2. Mock Strategy

- Mock external dependencies
- Use realistic mock data
- Reset mocks between tests
- Mock at the appropriate level

### 3. Assertions

- Use specific matchers
- Test behavior, not implementation
- Include negative test cases
- Test edge cases and error conditions

### 4. Maintenance

- Update tests when behavior changes
- Remove obsolete tests
- Keep test data current
- Refactor test code for clarity

## Common Testing Pitfalls

### 1. Over-mocking

```typescript
// Bad: Mocking internal implementation details
vi.mock('./internal-helper');

// Good: Mocking external dependencies
vi.mock('@/lib/api');
```

### 2. Testing Implementation

```typescript
// Bad: Testing internal state
expect(component.state.internalValue).toBe(true);

// Good: Testing behavior
expect(screen.getByText('Success message')).toBeInTheDocument();
```

### 3. Async Testing Issues

```typescript
// Bad: Not waiting for async operations
fireEvent.click(button);
expect(screen.getByText('Success')).toBeInTheDocument();

// Good: Properly awaiting async operations
await fireEvent.click(button);
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v1
```

This testing guide ensures comprehensive coverage of the Profile System while maintaining test quality and developer productivity.

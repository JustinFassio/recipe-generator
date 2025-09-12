# Playwright Test Environment Setup

This document explains how to set up and run Playwright E2E tests for the Recipe Generator application.

## Prerequisites

1. **Development Server**: The app must be running on `http://localhost:5174`
2. **Database**: Supabase local instance should be running
3. **Test Users**: Test users should be seeded in the database

## Quick Start

### 1. Start the Development Environment

```bash
# Start Supabase and development server
npm run dev:fresh
```

### 2. Run Playwright Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Structure

```
tests/e2e/
├── fixtures/
│   └── auth.ts              # Authentication test fixtures
├── utils/
│   ├── auth-page.ts         # Auth page object model
│   └── test-user-setup.ts   # Test user management utilities
├── setup/
│   └── test-environment.md  # This file
├── auth.spec.ts             # Authentication flow tests
└── recipes.spec.ts          # Recipe functionality tests
```

## Authentication in Tests

### Using Fixtures

The test suite provides two main fixtures for authentication:

1. **`authPage`**: Provides access to authentication page objects
2. **`authenticatedPage`**: Automatically signs in a test user before each test

### Example Usage

```typescript
// Test that requires authentication
test('should access protected route', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/recipes');
  // User is already signed in
});

// Test authentication flow
test('should sign in user', async ({ authPage }) => {
  await authPage.gotoSignIn();
  await authPage.signIn('test@example.com', 'password');
  await authPage.expectAuthenticationSuccess();
});
```

## Test Users

The following test users are available:

- **Primary**: `test@example.com` / `testpassword123`
- **Secondary**: `test2@example.com` / `testpassword123`
- **Admin**: `admin@example.com` / `adminpassword123`

## Environment Variables

Create a `.env.test` file for test-specific configuration:

```env
# Test environment variables
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_test_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key
```

## Running Specific Tests

```bash
# Run only authentication tests
npx playwright test auth.spec.ts

# Run tests matching a pattern
npx playwright test --grep "sign in"

# Run tests in specific browser
npx playwright test --project=chromium
```

## Debugging Tests

### 1. Debug Mode
```bash
npm run test:e2e:debug
```

### 2. Headed Mode
```bash
npm run test:e2e:headed
```

### 3. Screenshots and Videos
Tests automatically capture:
- Screenshots on failure
- Videos on failure
- Traces for debugging

### 4. Console Logs
```typescript
// In your test
await page.screenshot({ path: 'debug.png' });
console.log(await page.content());
```

## Best Practices

1. **Use Page Object Model**: Keep selectors and actions in page objects
2. **Wait for Elements**: Use `waitFor` and `expect` for reliable tests
3. **Clean State**: Each test should be independent
4. **Realistic Data**: Use realistic test data that matches production
5. **Error Handling**: Test both success and failure scenarios

## Troubleshooting

### Common Issues

1. **Port 5174 in use**: Kill existing dev server with `npm run dev:kill`
2. **Database not ready**: Ensure Supabase is running with `npm run db:status`
3. **Test users missing**: Run `npm run seed` to create test users
4. **Authentication failures**: Check test user credentials and database state

### Debug Commands

```bash
# Check if dev server is running
lsof -i :5174

# Check Supabase status
npm run db:status

# Reset test environment
npm run dev:fresh
```

## CI/CD Integration

For GitHub Actions or other CI systems:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Start Supabase
  run: npm run db:start

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

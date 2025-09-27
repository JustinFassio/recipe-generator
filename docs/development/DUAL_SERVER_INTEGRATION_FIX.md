# Dual Server Integration Test Fix

## Problem

The integration tests in `src/__tests__/integration/dual-server.test.ts` were failing with `ECONNREFUSED` errors because both the Vite frontend server (port 5174) and Vercel API server (port 3000) were not running during test execution.

## Solution Implemented

### 1. Dependencies Added

- `concurrently`: Run multiple commands simultaneously
- `wait-on`: Wait for TCP ports to be available

### 2. New NPM Scripts

```json
{
  "dev:frontend": "vite --port 5174",
  "dev:api": "vercel dev --listen 3000",
  "dev:dual": "concurrently \"npm run dev:frontend\" \"npm run dev:api\"",
  "test:integration:with-servers": "wait-on tcp:5174 tcp:3000 && vitest run src/__tests__/integration/dual-server.test.ts --reporter=verbose",
  "test:integration:full": "./scripts/run-integration-tests.sh"
}
```

### 3. Enhanced Integration Test

- Added robust server waiting logic with retries
- Better error messages when servers don't start
- Console output showing server status during startup

### 4. Integration Test Runner Script

Created `scripts/run-integration-tests.sh` that:

- Starts both servers in background
- Waits for servers to be ready
- Runs integration tests
- Cleans up background processes

### 5. GitHub Actions Workflow

Added `.github/workflows/integration-tests.yml` for CI/CD:

- Sets up Node.js and dependencies
- Starts Supabase and seeds database
- Runs integration tests with proper environment variables
- Cleans up resources

## Usage

### Local Development

```bash
# Option 1: Start servers manually, then run tests
npm run dev:dual
# In another terminal:
npm run test:integration

# Option 2: Wait for existing servers, then run tests
npm run test:integration:with-servers

# Option 3: Start servers and run tests automatically
npm run test:integration:full
```

### CI/CD

The GitHub Actions workflow automatically:

1. Installs dependencies
2. Starts Supabase
3. Seeds the database
4. Runs integration tests
5. Cleans up resources

## Test Results

✅ All 6 integration tests now pass:

- Server health checks (frontend + API)
- API proxy configuration
- Development workflow validation

## Benefits

- **Reliable CI/CD**: Integration tests now pass consistently
- **Flexible Testing**: Multiple ways to run tests based on needs
- **Better Debugging**: Clear error messages when servers aren't available
- **Automated Cleanup**: Background processes are properly cleaned up
- **Production Parity**: Tests run against real serverless functions

## Files Modified

- `package.json`: Added dependencies and scripts
- `src/__tests__/integration/dual-server.test.ts`: Enhanced server waiting logic
- `scripts/run-integration-tests.sh`: New integration test runner
- `.github/workflows/integration-tests.yml`: CI/CD workflow

## Next Steps

1. Update your CI/CD pipeline to use the new workflow
2. Use `npm run test:integration:full` for comprehensive testing
3. Consider adding integration tests to your pre-commit hooks if needed

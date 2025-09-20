import { describe, it, expect, beforeAll } from 'vitest';

/**
 * API Accessibility Integration Tests
 *
 * These tests validate that API endpoints are reachable during development.
 * They help catch proxy configuration issues before they break the app.
 *
 * Note: These tests require both Vite dev server (5174) and Vercel dev server (3000) to be running.
 */
describe('API Accessibility Integration Tests', () => {
  const DEV_SERVER_URL = 'http://localhost:5174';
  const API_TIMEOUT = 10000; // 10 second timeout for API calls

  beforeAll(() => {
    // Skip these tests in CI unless specifically enabled
    if (process.env.CI && !process.env.RUN_API_INTEGRATION_TESTS) {
      console.log(
        '⏭️  Skipping API integration tests in CI (set RUN_API_INTEGRATION_TESTS=true to enable)'
      );
    }
  });

  it(
    'should be able to reach the dev server',
    async () => {
      if (process.env.CI && !process.env.RUN_API_INTEGRATION_TESTS) {
        return; // Skip in CI
      }

      try {
        const response = await fetch(DEV_SERVER_URL, {
          signal: AbortSignal.timeout(5000),
        });
        expect(response.ok).toBe(true);
      } catch {
        throw new Error(
          `Dev server not reachable at ${DEV_SERVER_URL}. Make sure 'npm run dev' is running.`
        );
      }
    },
    API_TIMEOUT
  );

  it(
    'should be able to reach AI chat API through proxy',
    async () => {
      if (process.env.CI && !process.env.RUN_API_INTEGRATION_TESTS) {
        return; // Skip in CI
      }

      try {
        const response = await fetch(`${DEV_SERVER_URL}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'test' }],
            persona: 'homecook',
          }),
          signal: AbortSignal.timeout(API_TIMEOUT),
        });

        // Should not be 404 (proxy working)
        expect(response.status).not.toBe(404);

        // Should be either 200 (success) or 500 (server error, but proxy works)
        expect([200, 500].includes(response.status)).toBe(true);

        if (response.status === 500) {
          console.warn(
            '⚠️  API returned 500 - check Vercel dev server and OpenAI API key'
          );
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorName = error instanceof Error ? error.name : 'UnknownError';

        if (errorName === 'AbortError') {
          throw new Error(
            'API call timed out - check if Vercel dev server is running on port 3000'
          );
        }
        throw new Error(
          `API not reachable: ${errorMessage}. Ensure both 'npm run dev' and 'npx vercel dev --listen 3000' are running.`
        );
      }
    },
    API_TIMEOUT
  );

  it(
    'should return 404 for non-existent API endpoints',
    async () => {
      if (process.env.CI && !process.env.RUN_API_INTEGRATION_TESTS) {
        return; // Skip in CI
      }

      try {
        const response = await fetch(`${DEV_SERVER_URL}/api/nonexistent`, {
          signal: AbortSignal.timeout(5000),
        });

        // Should return 404 for non-existent endpoints (proxy working, endpoint doesn't exist)
        expect(response.status).toBe(404);
      } catch (error: unknown) {
        const errorName = error instanceof Error ? error.name : 'UnknownError';

        if (errorName === 'AbortError') {
          throw new Error('API call timed out - check if servers are running');
        }
        throw error;
      }
    },
    API_TIMEOUT
  );
});

/**
 * Development Server Health Check
 *
 * Quick validation that required services are running
 */
describe('Development Server Health Check', () => {
  it('should provide helpful error messages when servers are not running', async () => {
    // This test always runs to provide helpful debugging info

    const checks = [
      { name: 'Vite Dev Server (5174)', url: 'http://localhost:5174' },
      { name: 'Vercel Dev Server (3000)', url: 'http://localhost:3000' },
    ];

    const results = await Promise.allSettled(
      checks.map(async (check) => {
        try {
          const response = await fetch(check.url, {
            signal: AbortSignal.timeout(2000),
          });
          return { ...check, status: 'running', httpStatus: response.status };
        } catch (error) {
          return {
            ...check,
            status: 'not running',
            error: (error as Error).message,
          };
        }
      })
    );

    const healthReport = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return { ...checks[index], status: 'error', error: result.reason };
      }
    });

    // Log the health report for debugging
    console.log('\n🏥 Development Server Health Report:');
    healthReport.forEach((check) => {
      const status = check.status === 'running' ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.status}`);
      if (check.error) {
        console.log(`   Error: ${check.error}`);
      }
    });

    // Provide setup instructions if servers are not running
    const runningServers = healthReport.filter(
      (check) => check.status === 'running'
    ).length;
    if (runningServers < 2) {
      console.log('\n📋 To start development servers:');
      console.log('   Terminal 1: npm run dev');
      console.log('   Terminal 2: npx vercel dev --listen 3000');
      console.log('   Both servers are required for full API functionality.\n');
    }

    // This test always passes but provides useful debugging info
    expect(true).toBe(true);
  });
});

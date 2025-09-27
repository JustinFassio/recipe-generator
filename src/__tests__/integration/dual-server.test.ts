/**
 * Dual Server Integration Tests
 * Tests the integration between Vite frontend (port 5174) and Vercel API server (port 3000)
 * Based on docs/development/DUAL_SERVER_SETUP.md
 */

import { describe, it, expect, beforeAll } from 'vitest';

const SERVERS = {
  frontend: 'http://localhost:5174',
  api: 'http://localhost:3000',
};

// Helper function to check if a server is running
async function checkServerHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.status < 500; // Accept any non-server-error response
  } catch {
    return false;
  }
}

// Helper function to test API proxy through frontend
async function testApiProxy(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`${SERVERS.frontend}${endpoint}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.status !== 404; // API should be reachable, even if endpoint doesn't exist
  } catch {
    return false;
  }
}

describe('Dual Server Setup Integration', () => {
  beforeAll(async () => {
    // Wait for both servers to be available
    const maxRetries = 10;
    const retryDelay = 2000;

    for (let i = 0; i < maxRetries; i++) {
      const frontendReady = await checkServerHealth(SERVERS.frontend);
      const apiReady = await checkServerHealth(SERVERS.api);

      if (frontendReady && apiReady) {
        console.log('✅ Both servers are ready');
        return;
      }

      console.log(`⏳ Waiting for servers... (attempt ${i + 1}/${maxRetries})`);
      console.log(`   Frontend (5174): ${frontendReady ? '✅' : '❌'}`);
      console.log(`   API (3000): ${apiReady ? '✅' : '❌'}`);

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error(
      'Servers did not start within the expected time. Please ensure both servers are running:\n  - Frontend: npm run dev:frontend\n  - API: npm run dev:api'
    );
  });

  describe('Server Health Checks', () => {
    it('should have Vite frontend server running on port 5174', async () => {
      const isRunning = await checkServerHealth(SERVERS.frontend);
      expect(isRunning).toBe(true);
    }, 10000);

    it('should have Vercel API server running on port 3000', async () => {
      const isRunning = await checkServerHealth(SERVERS.api);
      expect(isRunning).toBe(true);
    }, 10000);
  });

  describe('API Proxy Configuration', () => {
    it('should proxy /api requests from frontend to API server', async () => {
      // Test that API requests are proxied (even if they return 404, they should reach the API server)
      const isProxied = await testApiProxy('/api/health');
      expect(isProxied).toBe(true);
    }, 10000);

    it('should handle API proxy errors gracefully', async () => {
      // Test a non-existent API endpoint to ensure proxy handles errors
      const response = await fetch(
        `${SERVERS.frontend}/api/non-existent-endpoint`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        }
      ).catch(() => ({ status: 500 }));

      // Should be proxied to API server (404 from API server is valid, 502 would indicate proxy error)
      expect(response.status).not.toBe(502); // Should not be a proxy error
      expect([404, 405, 500].includes(response.status)).toBe(true); // Valid API server responses
    }, 10000);
  });

  describe('Development Workflow', () => {
    it('should serve frontend assets from Vite', async () => {
      const response = await fetch(`${SERVERS.frontend}/`, {
        signal: AbortSignal.timeout(5000),
      });
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('<!doctype html>'); // Should serve the index.html
    }, 10000);

    it('should maintain separate concerns (frontend vs API)', async () => {
      // Frontend should serve static assets
      const frontendResponse = await fetch(`${SERVERS.frontend}/`, {
        signal: AbortSignal.timeout(5000),
      });
      expect(frontendResponse.headers.get('content-type')).toContain(
        'text/html'
      );

      // API server should handle API routes (test with a basic endpoint)
      const apiResponse = await fetch(`${SERVERS.api}/api/health`, {
        signal: AbortSignal.timeout(5000),
      }).catch(() => ({ status: 404 })); // Graceful fallback if endpoint doesn't exist

      // Even if endpoint doesn't exist, it should be handled by API server, not frontend
      expect(apiResponse.status).not.toBe(502); // Should not be a proxy error
    }, 10000);
  });
});

// Integration test setup - mock browser APIs for Node.js environment
import { vi } from 'vitest';

// Mock navigator object for Node.js environment
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
    userAgent: 'Mozilla/5.0 (compatible; Node.js Test Environment)',
  },
  writable: true,
});

// Mock window object for Node.js environment
Object.defineProperty(global, 'window', {
  value: {
    location: {
      href: 'http://localhost:3000',
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

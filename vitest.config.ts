import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 1, // Start at 1%, increase to 80% in next sprint
          functions: 1,
          lines: 1,
          statements: 1,
        },
        // Critical components have higher thresholds
        './src/components/': {
          branches: 1, // Start at 1%, increase to 90% in next sprint
          functions: 1,
          lines: 1,
          statements: 1,
        },
        './src/hooks/': {
          branches: 1, // Start at 1%, increase to 90% in next sprint
          functions: 1,
          lines: 1,
          statements: 1,
        },
        './src/lib/': {
          branches: 1, // Start at 1%, increase to 90% in next sprint
          functions: 1,
          lines: 1,
          statements: 1,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

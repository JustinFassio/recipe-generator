import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  // Use absolute base for proper asset serving in production
  base: '/',
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG || '',
      project: process.env.SENTRY_PROJECT || '',
      authToken: process.env.SENTRY_AUTH_TOKEN || '',
      sourcemaps: { assets: './dist/**' },
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  server: {
    port: 5174,
    host: true,
    // Proxy API requests to Vercel local server (vercel dev) during development
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          // Avoid proxy errors breaking HMR
          proxy.on('error', (err) => {
            console.warn('[vite proxy] /api error:', err?.message || err);
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Enable source maps for production debugging (hidden on network panel)
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
          ],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          utils: ['date-fns', 'zod', 'clsx'],
        },
        preserveModules: false,
      },
      // Re-enable tree shaking with careful configuration
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    // Use esbuild which is available everywhere
    minify: 'esbuild',
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
  },
  // Feature flag preserved
  define: {
    __TOUCH_EVENTS__: true,
  },
  // Configure esbuild to preserve clarity while allowing treeshaking
  esbuild: {
    treeShaking: true,
    keepNames: false,
  },
});

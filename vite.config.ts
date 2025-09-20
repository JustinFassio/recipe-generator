import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Use absolute base for proper asset serving in production
  base: '/',
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    // Note: API routes are handled by Vercel serverless functions in production
    // For local development, proxy API calls to Vercel dev server on port 3000
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
        // Simple chunk splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
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
});

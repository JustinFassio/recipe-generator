import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
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
    rollupOptions: {
      output: {
        // Preserve touch event handling in production
        manualChunks: undefined,
        preserveModules: false,
      },
      // Prevent tree-shaking of touch events
      treeshake: {
        moduleSideEffects: true,
        propertyReadSideEffects: true,
        unknownGlobalSideEffects: true,
      },
    },
    // Use Terser instead of esbuild to better preserve touch events
    minify: 'terser',
    target: 'es2020', // Ensure modern touch event support
    // Force preserve touch event code
    sourcemap: false,
  },
  // Force preserve touch event code
  define: {
    __TOUCH_EVENTS__: true,
  },
});

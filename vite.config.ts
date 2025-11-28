import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@types': resolve(__dirname, './src/types'),
      '@lib': resolve(__dirname, './src/lib'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
  
  // Development server optimization
  server: {
    port: 5173,
    open: true,
    hmr: {
      overlay: false,
    },
  },
  
  // Build optimization
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@headlessui/react',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      'lucide-react',
      'react-hook-form',
      '@hookform/resolvers/yup',
      'yup',
      'date-fns',
      'react-hot-toast',
    ],
    force: true,
  },
  
  // Define global polyfills
  define: {
    global: 'globalThis',
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    open: true,
  },
});

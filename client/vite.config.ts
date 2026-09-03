import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The dev server proxies /api and /uploads to the Express backend so cookies
// stay first-party (no CORS / SameSite headaches in development).
const API_TARGET = process.env.VITE_API_PROXY || 'http://localhost:5050';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/uploads': { target: API_TARGET, changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split slow-changing vendor code so it caches across deploys.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});

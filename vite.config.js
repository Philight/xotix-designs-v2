import { defineConfig } from 'vite';
import path from 'path';
import shopify from 'vite-plugin-shopify';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [shopify(), react()],
  build: {
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      ROOT: path.resolve(__dirname),
      '@': path.resolve(__dirname, 'frontend'),
      '@assets': path.resolve(__dirname, 'frontend', 'assets'),
      '@css': path.resolve(__dirname, 'frontend', 'assets', 'css'),
      '@fonts': path.resolve(__dirname, 'frontend/assets/fonts'),
      '@icons': path.resolve(__dirname, 'frontend', 'assets', 'icons'),
      '@images': path.resolve(__dirname, 'frontend', 'assets', 'images'),
      '@components': path.resolve(__dirname, 'frontend', 'components'),
      '@contexts': path.resolve(__dirname, 'frontend', 'contexts'),
      '@data': path.resolve(__dirname, 'frontend', 'data'),
      '@layouts': path.resolve(__dirname, 'frontend', 'layouts'),
      '@pages': path.resolve(__dirname, 'frontend', 'pages'),
      '@plugins': path.resolve(__dirname, 'frontend', 'plugins'),
      '@utils': path.resolve(__dirname, 'frontend', 'utils'),
    },
  },
});

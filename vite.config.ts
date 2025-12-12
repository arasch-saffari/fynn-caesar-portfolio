import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are linked relatively, crucial for GitHub Pages or subfolders
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  }
});
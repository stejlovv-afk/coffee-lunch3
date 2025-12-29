import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: This makes paths relative so it works on GitHub Pages
  build: {
    outDir: 'dist',
  }
});
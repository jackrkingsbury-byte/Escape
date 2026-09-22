import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The client lives in ./client and builds into ./play (served as a static site,
// e.g. GitHub Pages at /Escape/steal-the-tech/play/). Relative base so it works
// from any sub-path.
export default defineConfig({
  root: 'client',
  base: './',
  plugins: [react()],
  server: { fs: { allow: ['..'] }, port: 5173 },
  worker: { format: 'es' },
  build: {
    outDir: '../play',
    emptyOutDir: true,
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
});

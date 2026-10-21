import { defineConfig } from 'vite';

// The finished site is written to the repository root (one level up),
// because GitHub Pages serves the root of the main branch.
// Relative base keeps it working under any repo name.
export default defineConfig({
  base: './',
  build: {
    outDir: '..',
    emptyOutDir: false,
    chunkSizeWarningLimit: 900,
  },
});

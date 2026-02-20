import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Standalone build config for the demo page (GitHub Pages).
 * Bundles everything — no externals, no library output.
 * Usage: vite build --config vite.config.demo.ts
 */
export default defineConfig({
  root: path.resolve(__dirname, 'demo'),
  // Must match the GitHub repository name for Pages to serve assets correctly
  base: '/tess-extrude/',
  build: {
    target: 'es2022',
    outDir: path.resolve(__dirname, 'dist-demo'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'tess-extrude': path.resolve(__dirname, 'src/index.ts'),
    },
  },
});

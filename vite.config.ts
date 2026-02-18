import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
  if (command === 'build') {
    return {
      build: {
        lib: {
          entry: path.resolve(__dirname, 'src/index.ts'),
          name: 'TessExtrude',
          formats: ['es', 'cjs', 'umd'],
          fileName: (format) => `tess-extrude.${format}.js`,
        },
        rollupOptions: {
          external: ['three', /^three\/.*/],
          output: {
            globals: {
            three: 'THREE',
            'three/examples/jsm/loaders/SVGLoader.js': 'THREE',
          },
          },
        },
        sourcemap: true,
        minify: false,
      },
      plugins: [dts({ rollupTypes: true })],
    };
  }

  // Dev server — serve the demo
  return {
    root: path.resolve(__dirname, 'demo'),
    resolve: {
      alias: {
        'tess-extrude': path.resolve(__dirname, 'src/index.ts'),
      },
    },
    // poly2tri is a CJS module that references Node's `global`; shim it for browsers
    define: {
      global: 'globalThis',
    },
  };
});

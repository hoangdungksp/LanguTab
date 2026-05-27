import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifestJson from './manifest.json' with { type: 'json' };
import pkg from './package.json' with { type: 'json' };

// Version truth lives in package.json. We sync it into manifest.json at build
// time so Chrome Web Store and the footer never drift apart.
// `version` must be dotted numbers; `version_name` is a freeform label shown
// in chrome://extensions so it's obvious a reload picked up new code.
const manifest = {
  ...manifestJson,
  version: pkg.version,
  version_name: pkg.versionName ?? pkg.version,
};

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  define: {
    // Exposed to app code as a string literal, e.g. "0.5.0".
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/chunk-[hash].js',
      },
    },
  },
});

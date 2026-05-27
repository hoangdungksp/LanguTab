import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// LinguTab web app (D-21). Plain Vite + React SPA, deployed to Cloudflare
// Pages. Talks to the same worker API as the extension.
export default defineConfig({
  plugins: [react()],
});

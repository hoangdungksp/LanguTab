import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// LinguTab web app (D-21). Plain Vite + React SPA, deployed to Cloudflare
// Pages. Talks to the same worker API as the extension.
export default defineConfig({
  plugins: [react()],
  // Pin the dev port so the Google OAuth "Authorized JavaScript origins"
  // (http://localhost:5173) always matches. strictPort fails loudly instead
  // of silently hopping to 5174/5175 when 5173 is taken by a stale dev server.
  server: { port: 5173, strictPort: true },
});

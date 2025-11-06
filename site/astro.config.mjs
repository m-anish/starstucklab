import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://starstucklab.com',   // ✅ your real domain
  base: '/',                          // ✅ remove the GitHub subpath
  integrations: [],
  vite: {
    server: { fs: { allow: ['..'] } }
  }
});
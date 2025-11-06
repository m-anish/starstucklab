import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://starstucklab.com',
  integrations: [],
  vite: {
    server: {
      fs: {
        allow: ['..']
      }
    }
  }
});


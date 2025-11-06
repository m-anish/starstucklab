import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://m-anish.github.io/starstucklab',
  base: '/starstucklab/',
  integrations: [],
  vite: {
    server: {
      fs: { allow: ['..'] }
    }
  }
});

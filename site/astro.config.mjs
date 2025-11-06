import { defineConfig } from 'astro/config';

export default defineConfig({
  // 👇 When using GitHub Pages, Astro needs the repo subpath.
  // When you move to starstucklab.com, you can remove the `base` line entirely.
  site: 'https://starstucklab.com',
  base: process.env.DEPLOY_ENV === 'ghpages' ? '/starstucklab/' : '/',
  integrations: [],
  vite: {
    server: {
      fs: {
        allow: ['..']
      }
    }
  }
});

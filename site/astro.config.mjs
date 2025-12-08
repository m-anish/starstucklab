import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // ✅ your real domain
  site: 'https://starstucklab.com',

  output: 'server',

  // ✅ remove the GitHub subpath
  base: '/',

  integrations: [],

  vite: {
    server: { fs: { allow: ['..'] } }
  },

  adapter: cloudflare()
});
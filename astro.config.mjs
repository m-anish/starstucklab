import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

export default defineConfig({
  integrations: [react(), keystatic()],
  site: 'https://starstucklab.com',
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
  }),
  base: '/',
  vite: {
    assetsInclude: ['**/*.stl'],
    server: {
      fs: { allow: ['..'] },
    },
  },
});

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
  // Shop is hidden for now (too few items to warrant a separate listing) — the
  // /machines index is the catalog. Old /shop links land there. Product detail
  // pages (/shop/[slug]) stay live as info-only. To restore the shop: remove
  // this redirect and rename src/pages/_shop.astro back to shop.astro.
  redirects: {
    '/shop': '/machines',
  },
  vite: {
    assetsInclude: ['**/*.stl'],
    server: {
      fs: { allow: ['..'] },
    },
  },
});

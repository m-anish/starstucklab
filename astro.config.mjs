// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  site: 'https://starstucklab.com',
  output: 'server', // Enable server-side rendering
  adapter: cloudflare({
    mode: 'directory', // Use directory mode for Cloudflare Pages
  }),
  base: '/',
  
  vite: {
    assetsInclude: ['**/*.stl'], // Add this line to treat .stl files as assets
    server: { 
      fs: { allow: ['..'] } 
    },
  },
});
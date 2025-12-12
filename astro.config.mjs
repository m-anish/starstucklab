// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://starstucklab.com',
  output: 'server', // Enable server-side rendering
  adapter: cloudflare({
    mode: 'directory', // Use directory mode for Cloudflare Pages
  }),
  base: '/',
  
  vite: {
    server: { 
      fs: { allow: ['..'] } 
    },
  },
});

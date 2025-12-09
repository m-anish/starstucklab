// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://starstucklab.com',
  output: 'static', // Build static HTML
  base: '/',
  
  vite: {
    server: { 
      fs: { allow: ['..'] } 
    },
  },
});
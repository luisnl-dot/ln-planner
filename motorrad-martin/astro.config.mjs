import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Produktiv-Domain. Für eine Vorschau unter einer anderen Adresse SITE_URL setzen.
const site = process.env.SITE_URL ?? 'https://www.motorrad-martin.de';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [sitemap()],
  image: { responsiveStyles: false },
  devToolbar: { enabled: false },
  server: { host: true, port: 4321 },
  vite: { build: { cssMinify: true } },
});

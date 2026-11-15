import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import weiterleitungen from './src/data/weiterleitungen.json' with { type: 'json' };

// Produktiv-Domain. Für eine Vorschau unter einer anderen Adresse SITE_URL setzen.
const site = process.env.SITE_URL ?? 'https://www.motorrad-martin.de';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  // Alte Adressen der Joomla-Seite. Statisch als Weiterleitungsseite erzeugt; auf Netlify/Cloudflare
  // greift zusätzlich public/_redirects mit echten 301-Antworten (siehe README).
  redirects: Object.fromEntries(Object.entries(weiterleitungen).map(([von, nach]) => [von, { status: 301, destination: nach }])),
  integrations: [sitemap({ filter: (seite) => !seite.includes('/index.php') && !seite.includes('/vorschau/') })],
  image: { responsiveStyles: false },
  devToolbar: { enabled: false },
  server: { host: true, port: 4321 },
  vite: { build: { cssMinify: true } },
});

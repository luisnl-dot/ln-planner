import type { APIRoute } from 'astro';

/** robots.txt – Vorschau-Deploys (PUBLIC_NOINDEX=1) sperren Crawler komplett aus. */
export const GET: APIRoute = ({ site }) => {
  const text =
    import.meta.env.PUBLIC_NOINDEX === '1'
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site)}\n`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

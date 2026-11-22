import type { PagesContext } from './_lib/cf';

/** robots.txt: public pages are crawlable; the admin area and API are not. */
export const onRequestGet = (ctx: PagesContext): Response => {
  const origin = (ctx.env.SITE_URL || new URL(ctx.request.url).origin).replace(/\/+$/, '');
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};

import type { PagesContext } from './_lib/cf';
import { escapeXml } from './_lib/util';

const STATIC_PAGES: Array<{ path: string; priority: string }> = [
  { path: '/', priority: '1.0' },
  { path: '/marketplace', priority: '0.9' },
  { path: '/services', priority: '0.8' },
  { path: '/tools', priority: '0.7' },
  { path: '/about', priority: '0.5' },
  { path: '/contact', priority: '0.5' },
  { path: '/faq', priority: '0.4' },
  { path: '/licenses', priority: '0.4' },
];

/** XML sitemap built from the database: only published designs and real categories are listed. */
export const onRequestGet = async (ctx: PagesContext): Promise<Response> => {
  const { env, request } = ctx;
  const origin = (env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, '');

  const urls: string[] = STATIC_PAGES.map(
    (p) => `  <url><loc>${escapeXml(origin + p.path)}</loc><priority>${p.priority}</priority></url>`
  );

  if (env.DB) {
    try {
      const [cats, prods] = await Promise.all([
        env.DB.prepare('SELECT id FROM categories ORDER BY sort_order, name').all<{ id: string }>(),
        env.DB.prepare("SELECT slug, updated_at FROM products WHERE status = 'published' ORDER BY created_at DESC").all<{
          slug: string;
          updated_at: string;
        }>(),
      ]);
      for (const c of cats.results) {
        urls.push(`  <url><loc>${escapeXml(`${origin}/category/${encodeURIComponent(c.id)}`)}</loc><priority>0.7</priority></url>`);
      }
      for (const p of prods.results) {
        const lastmod = p.updated_at ? `<lastmod>${escapeXml(p.updated_at.slice(0, 10))}</lastmod>` : '';
        urls.push(
          `  <url><loc>${escapeXml(`${origin}/design/${encodeURIComponent(p.slug)}`)}</loc>${lastmod}<priority>0.8</priority></url>`
        );
      }
    } catch (err) {
      console.error('Sitemap database query failed:', err);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' },
  });
};

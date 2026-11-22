import type { HtmlRewriterLike, PagesContext } from './cf';
import { escapeXml } from './util';

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'product';
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

/**
 * Returns the single-page app shell (index.html) with page-specific <head> tags written into the HTML,
 * so search engines and social-media link previews see the right title, description and image
 * without having to run JavaScript.
 */
export async function renderShellWithMeta(ctx: PagesContext, meta: PageMeta, status = 200): Promise<Response> {
  const { request, env } = ctx;
  const origin = (env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, '');
  const shellUrl = new URL(request.url);
  shellUrl.pathname = '/';
  shellUrl.search = '';
  const assets = env.ASSETS;
  if (!assets) return new Response('Static assets are not available.', { status: 500 });
  const shell = await assets.fetch(new Request(shellUrl.toString(), { method: 'GET', headers: request.headers }));

  const url = origin + meta.path;
  const image = meta.image ? (meta.image.startsWith('http') ? meta.image : origin + meta.image) : '';
  const tag = (attr: string, key: string, content: string) =>
    `<meta ${attr}="${key}" content="${escapeXml(content)}">`;

  const head = [
    tag('name', 'description', meta.description),
    tag('name', 'robots', meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'),
    `<link rel="canonical" href="${escapeXml(url)}">`,
    tag('property', 'og:title', meta.title),
    tag('property', 'og:description', meta.description),
    tag('property', 'og:url', url),
    tag('property', 'og:type', meta.type === 'product' ? 'product' : 'website'),
    tag('property', 'og:site_name', 'Graphics Expert'),
    image ? tag('property', 'og:image', image) : '',
    tag('name', 'twitter:card', image ? 'summary_large_image' : 'summary'),
    tag('name', 'twitter:title', meta.title),
    tag('name', 'twitter:description', meta.description),
    image ? tag('name', 'twitter:image', image) : '',
    meta.jsonLd
      ? `<script type="application/ld+json" id="page-jsonld">${JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')}</script>`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const Rewriter = (globalThis as unknown as { HTMLRewriter?: new () => HtmlRewriterLike }).HTMLRewriter;
  if (!Rewriter) return shell;

  const rewritten = new Rewriter()
    .on('title', { element: (el) => el.setInnerContent(meta.title) })
    .on('meta[name="description"]', { element: (el) => el.remove() })
    .on('meta[name="robots"]', { element: (el) => el.remove() })
    .on('meta[property^="og:"]', { element: (el) => el.remove() })
    .on('meta[name^="twitter:"]', { element: (el) => el.remove() })
    .on('link[rel="canonical"]', { element: (el) => el.remove() })
    .on('head', { element: (el) => el.append(head, { html: true }) })
    .transform(shell);

  const headers = new Headers(rewritten.headers);
  headers.set('Cache-Control', 'public, max-age=300');
  return new Response(rewritten.body, { status, headers });
}

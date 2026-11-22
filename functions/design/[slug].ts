import type { PagesContext } from '../_lib/cf';
import { parseJson } from '../_lib/util';
import { renderShellWithMeta } from '../_lib/seo';

interface StoredDesign {
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  categoryName?: string;
  previewUrl?: string;
  price: number;
  discountPrice?: number;
}

/** /design/:slug: serves the app with real, crawlable meta tags for that design. */
export const onRequestGet = async (ctx: PagesContext): Promise<Response> => {
  const slug = String(ctx.params.slug || '');
  const row = ctx.env.DB
    ? await ctx.env.DB.prepare("SELECT data FROM products WHERE (slug = ? OR id = ?) AND status = 'published'")
        .bind(slug, slug)
        .first<{ data: string }>()
    : null;
  const product = row ? parseJson<StoredDesign | null>(row.data, null) : null;
  const origin = (ctx.env.SITE_URL || new URL(ctx.request.url).origin).replace(/\/+$/, '');

  if (!product) {
    return renderShellWithMeta(
      ctx,
      {
        title: 'Design not found | Graphics Expert',
        description: 'This design is not available.',
        path: `/design/${encodeURIComponent(slug)}`,
        noindex: true,
      },
      404
    );
  }

  const price = product.discountPrice ?? product.price;
  const description = (product.shortDescription || product.description || '').slice(0, 158);
  return renderShellWithMeta(ctx, {
    title: `${product.title} | ${product.categoryName || 'Design'} | Graphics Expert`,
    description,
    path: `/design/${encodeURIComponent(product.slug)}`,
    image: product.previewUrl,
    type: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description,
      image: product.previewUrl ? [product.previewUrl.startsWith('http') ? product.previewUrl : origin + product.previewUrl] : undefined,
      category: product.categoryName,
      brand: { '@type': 'Brand', name: 'Graphics Expert' },
      offers: {
        '@type': 'Offer',
        price: price.toFixed(2),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${origin}/design/${encodeURIComponent(product.slug)}`,
      },
    },
  });
};

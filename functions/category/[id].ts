import type { PagesContext } from '../_lib/cf';
import { renderShellWithMeta } from '../_lib/seo';

/** /category/:id: serves the app with real, crawlable meta tags for that category. */
export const onRequestGet = async (ctx: PagesContext): Promise<Response> => {
  const id = String(ctx.params.id || '');
  const row = ctx.env.DB
    ? await ctx.env.DB.prepare('SELECT id, name, description FROM categories WHERE id = ? OR slug = ?')
        .bind(id, id)
        .first<{ id: string; name: string; description: string }>()
    : null;

  if (!row) {
    return renderShellWithMeta(
      ctx,
      {
        title: 'Category not found | Graphics Expert',
        description: 'This category is not available.',
        path: `/category/${encodeURIComponent(id)}`,
        noindex: true,
      },
      404
    );
  }
  return renderShellWithMeta(ctx, {
    title: `${row.name} | Editable Design Files | Graphics Expert`,
    description: row.description || `Browse ${row.name} designs from Graphics Expert.`,
    path: `/category/${encodeURIComponent(row.id)}`,
  });
};

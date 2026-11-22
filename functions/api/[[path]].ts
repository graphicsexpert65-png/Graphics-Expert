import type { Env, PagesContext } from '../_lib/cf';
import {
  HttpError,
  checkRateLimit,
  clearRateLimit,
  errorResponse,
  extOf,
  formatBytes,
  getSessionSecret,
  hashPassword,
  json,
  parseJson,
  parseStringArray,
  randomId,
  signSession,
  slugify,
  timingSafeEqual,
  toHex,
  verifySession,
} from '../_lib/util';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const ALLOWED_DESIGN_EXTENSIONS = new Set([
  '.cdr', '.ai', '.eps', '.psd', '.psb', '.pdf', '.png', '.jpg', '.jpeg', '.svg', '.tif', '.tiff', '.zip',
]);
const ALLOWED_PREVIEW_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const ALLOWED_REFERENCE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.pdf']);
const PREVIEW_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};
// Formats a browser cannot render reliably: a preview image is mandatory for these.
const NON_BROWSER_PREVIEW_FORMATS = new Set(['CDR', 'AI', 'EPS', 'PSD', 'PSB', 'TIF', 'TIFF', 'ZIP', 'PDF']);

const PRODUCT_STATUSES = ['published', 'draft', 'unpublished'] as const;
type ProductStatus = (typeof PRODUCT_STATUSES)[number];
const LICENSES = ['Personal', 'Commercial', 'Extended Commercial'] as const;
const REQUEST_STATUSES = ['Pending', 'In Review', 'Quoted', 'In Progress', 'Completed'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoredFile {
  id: string;
  displayName: string;
  originalFileName: string;
  format: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  softwareCompatibility: string;
  supportedVersion: string;
  includedInPackage: boolean;
  uploadedAt: string;
  sha256: string;
  storageKey: string; // private R2 key — never sent to browsers
}

interface StoredProduct {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  designerId: string;
  designerName: string;
  price: number;
  discountPrice?: number;
  previewUrl: string;
  galleryImages: string[];
  fileFormats: string[];
  files: StoredFile[];
  dimensions: string;
  colorMode: 'CMYK' | 'RGB';
  dpi: number;
  softwareCompatibility: string[];
  isEditable: boolean;
  license: (typeof LICENSES)[number];
  featured: boolean;
  downloadsCount: number;
  rating: number;
  reviewsCount: number;
  tags: string[];
  whatsIncluded: string[];
  howToEdit: string[];
  status: ProductStatus;
  fileDownloadSize: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductRow {
  id: string;
  data: string;
  views: number;
}

interface Auth {
  userId: string;
  email: string;
}

interface Ctx {
  request: Request;
  env: Env;
  url: URL;
  segments: string[];
  waitUntil: (p: Promise<unknown>) => void;
}

type Handler = (ctx: Ctx, params: string[]) => Promise<Response> | Response;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maxUploadBytes(env: Env): number {
  const mb = Number(env.MAX_UPLOAD_SIZE_MB) || 90;
  // Cloudflare Pages Functions reject request bodies above 100 MB on the free plan.
  return Math.min(mb, 95) * 1024 * 1024;
}

function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

function sanitizeProduct(p: StoredProduct) {
  return {
    ...p,
    files: (p.files || []).map(({ storageKey: _key, ...rest }) => rest),
  };
}

function rowToProduct(row: ProductRow): StoredProduct {
  return JSON.parse(row.data) as StoredProduct;
}

async function requireAdmin(ctx: Ctx): Promise<Auth> {
  const header = ctx.request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'Admin authentication required.');
  const payload = await verifySession(token, getSessionSecret(ctx.env));
  if (!payload || payload.role !== 'admin') throw new HttpError(401, 'Your session has expired. Please sign in again.');
  const user = await ctx.env.DB.prepare('SELECT id, email FROM users WHERE id = ?')
    .bind(payload.userId)
    .first<{ id: string; email: string }>();
  if (!user) throw new HttpError(401, 'Your session is no longer valid. Please sign in again.');
  return { userId: user.id, email: user.email };
}

async function saveProduct(env: Env, p: StoredProduct, isNew: boolean): Promise<void> {
  const data = JSON.stringify(p);
  if (isNew) {
    await env.DB.prepare(
      'INSERT INTO products (id, slug, status, category_id, featured, views, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)'
    )
      .bind(p.id, p.slug, p.status, p.categoryId, p.featured ? 1 : 0, p.createdAt, p.updatedAt, data)
      .run();
  } else {
    await env.DB.prepare(
      'UPDATE products SET slug = ?, status = ?, category_id = ?, featured = ?, updated_at = ?, data = ? WHERE id = ?'
    )
      .bind(p.slug, p.status, p.categoryId, p.featured ? 1 : 0, p.updatedAt, data, p.id)
      .run();
  }
}

async function getProductById(env: Env, id: string): Promise<StoredProduct | null> {
  const row = await env.DB.prepare('SELECT id, data, views FROM products WHERE id = ?').bind(id).first<ProductRow>();
  return row ? rowToProduct(row) : null;
}

/** True when another product still references the given R2 key (duplicates share files). */
async function keyReferencedElsewhere(env: Env, key: string, exceptProductId: string): Promise<boolean> {
  const row = await env.DB.prepare('SELECT 1 AS hit FROM products WHERE id != ? AND instr(data, ?) > 0 LIMIT 1')
    .bind(exceptProductId, key)
    .first();
  return !!row;
}

async function deleteKeyIfUnused(env: Env, key: string, exceptProductId: string): Promise<void> {
  if (!(await keyReferencedElsewhere(env, key, exceptProductId))) {
    await env.BUCKET.delete(key);
  }
}

async function sha256Of(file: File): Promise<string> {
  // Buffering very large files would exhaust Worker memory, so only hash up to 32 MB.
  if (file.size > 32 * 1024 * 1024) return '';
  return toHex(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()));
}

function isFile(value: unknown): value is File {
  return typeof value === 'object' && value !== null && typeof (value as File).arrayBuffer === 'function' && 'name' in value;
}

function filesOf(form: FormData, field: string): File[] {
  return form.getAll(field).filter(isFile).filter((f) => f.size > 0 || f.name);
}

function fieldOf(form: FormData, field: string): string | undefined {
  const v = form.get(field);
  return typeof v === 'string' ? v : undefined;
}

function extToFormat(ext: string): string {
  return ext.replace('.', '').toUpperCase();
}

function validateDesignFile(file: File, env: Env): string | null {
  const ext = extOf(file.name);
  if (!ALLOWED_DESIGN_EXTENSIONS.has(ext)) {
    return `Unsupported file type "${ext || 'unknown'}" for "${file.name}". Allowed: CDR, AI, EPS, PSD, PSB, PDF, PNG, JPG, JPEG, SVG, TIF, TIFF, ZIP.`;
  }
  if (file.size === 0) return `File "${file.name}" is empty (0 bytes).`;
  if (file.size > maxUploadBytes(env)) {
    return `File "${file.name}" is too large. The maximum upload size is ${Math.round(maxUploadBytes(env) / 1048576)} MB per upload request.`;
  }
  return null;
}

function validatePreviewImage(file: File): string | null {
  const ext = extOf(file.name);
  if (!ALLOWED_PREVIEW_EXTENSIONS.has(ext)) return `Preview image "${file.name}" must be PNG, JPG, JPEG or WEBP.`;
  if (!file.type.toLowerCase().startsWith('image/')) return `Preview file "${file.name}" is not an image.`;
  if (file.size === 0 || file.size > 25 * 1024 * 1024) return `Preview image "${file.name}" must be between 1 byte and 25 MB.`;
  return null;
}

async function storePreview(env: Env, file: File): Promise<string> {
  const ext = extOf(file.name);
  const name = `preview_${Date.now()}_${toHex(crypto.getRandomValues(new Uint8Array(6)))}${ext}`;
  await env.BUCKET.put(`previews/${name}`, file, { httpMetadata: { contentType: PREVIEW_MIME[ext] || 'image/jpeg' } });
  return `/api/previews/${name}`;
}

async function storeDesignFile(
  env: Env,
  file: File,
  meta: { displayName?: string; softwareCompatibility?: string; supportedVersion?: string; includedInPackage?: boolean }
): Promise<StoredFile> {
  const ext = extOf(file.name);
  const format = extToFormat(ext);
  const storageKey = `designs/asset_${Date.now()}_${toHex(crypto.getRandomValues(new Uint8Array(8)))}${ext}`;
  const sha256 = await sha256Of(file);
  await env.BUCKET.put(storageKey, file, {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });
  return {
    id: randomId('file', 4),
    displayName: String(meta.displayName || file.name).trim(),
    originalFileName: file.name,
    format,
    extension: ext,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    sizeFormatted: formatBytes(file.size),
    softwareCompatibility: String(meta.softwareCompatibility || format).trim(),
    supportedVersion: String(meta.supportedVersion || 'Standard').trim(),
    includedInPackage: meta.includedInPackage !== false,
    uploadedAt: new Date().toISOString(),
    sha256,
    storageKey,
  };
}

function whatsIncluded(files: StoredFile[]): string[] {
  return files
    .filter((f) => f.includedInPackage)
    .map((f) => `${f.displayName} (${f.format} · ${f.supportedVersion} · ${f.sizeFormatted})`);
}

async function readForm(ctx: Ctx): Promise<FormData> {
  const length = Number(ctx.request.headers.get('Content-Length') || 0);
  if (length > 100 * 1024 * 1024) {
    throw new HttpError(413, 'This upload is larger than the 100 MB request limit of Cloudflare Pages. Upload fewer or smaller files at a time.');
  }
  try {
    return await ctx.request.formData();
  } catch {
    throw new HttpError(400, 'The upload could not be read. Please try again.');
  }
}

async function readJson(ctx: Ctx): Promise<Record<string, unknown>> {
  try {
    const body = await ctx.request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    throw new HttpError(400, 'Invalid request body.');
  }
}

function requestRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    designType: row.design_type,
    requiredSize: row.required_size,
    description: row.description,
    deadline: row.deadline,
    budget: row.budget,
    referenceFileName: row.reference_name || undefined,
    hasReferenceFile: !!row.reference_key,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Public handlers
// ---------------------------------------------------------------------------

const health: Handler = async ({ env }) => {
  const checks: Record<string, string> = {};
  try {
    await env.DB.prepare('SELECT 1 AS ok').first();
    checks.database = 'ok';
  } catch (e) {
    checks.database = 'error: ' + (e instanceof Error ? e.message : 'unknown');
  }
  checks.bucket = env.BUCKET ? 'bound' : 'missing binding BUCKET';
  checks.adminEmail = env.ADMIN_EMAIL ? 'set' : 'missing';
  checks.adminPassword = env.ADMIN_PASSWORD ? 'set' : 'missing (only needed for first sign-in)';
  checks.sessionSecret = env.SESSION_SECRET && env.SESSION_SECRET.length >= 32 ? 'set' : 'missing or shorter than 32 characters';
  const healthy = checks.database === 'ok' && checks.bucket === 'bound';
  return json({ ok: healthy, checks }, healthy ? 200 : 503);
};

const listCategories: Handler = async ({ env }) => {
  const [cats, counts] = await Promise.all([
    env.DB.prepare('SELECT id, name, slug, description, icon_name, sort_order FROM categories ORDER BY sort_order, name').all<{
      id: string; name: string; slug: string; description: string; icon_name: string;
    }>(),
    env.DB.prepare("SELECT category_id, COUNT(*) AS n FROM products WHERE status = 'published' GROUP BY category_id").all<{
      category_id: string; n: number;
    }>(),
  ]);
  const countMap = new Map(counts.results.map((r) => [r.category_id, r.n]));
  return json({
    categories: cats.results.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      iconName: c.icon_name,
      templateCount: countMap.get(c.id) || 0,
    })),
  });
};

const listPublishedProducts: Handler = async ({ env }) => {
  const rows = await env.DB.prepare(
    "SELECT id, data, views FROM products WHERE status = 'published' ORDER BY created_at DESC LIMIT 500"
  ).all<ProductRow>();
  return json(
    { products: rows.results.map((r) => sanitizeProduct(rowToProduct(r))) },
    200,
    { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' }
  );
};

const getPublishedProduct: Handler = async ({ env, waitUntil }, [idOrSlug]) => {
  const row = await env.DB.prepare(
    "SELECT id, data, views FROM products WHERE status = 'published' AND (id = ? OR slug = ?)"
  )
    .bind(idOrSlug, idOrSlug)
    .first<ProductRow>();
  if (!row) return errorResponse(404, 'Design not found.');
  waitUntil(env.DB.prepare('UPDATE products SET views = views + 1 WHERE id = ?').bind(row.id).run());
  return json({ product: sanitizeProduct(rowToProduct(row)) });
};

const servePreview: Handler = async ({ env }, [name]) => {
  if (!/^preview_[0-9]+_[0-9a-f]+\.(png|jpe?g|webp)$/.test(name)) return errorResponse(404, 'Not found.');
  const obj = await env.BUCKET.get(`previews/${name}`);
  if (!obj) return errorResponse(404, 'Preview not found.');
  return new Response(obj.body, {
    headers: {
      'Content-Type': PREVIEW_MIME[extOf(name)] || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

function fileResponse(obj: { body: ReadableStream; size: number }, file: StoredFile): Response {
  const safeName = file.originalFileName.replace(/[^\w.\- ]+/g, '_');
  return new Response(obj.body, {
    headers: {
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Length': String(obj.size),
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** Free designs only. Paid designs stay unavailable until a real payment provider exists. */
const downloadFreeFile: Handler = async ({ env, waitUntil }, [productId, fileId]) => {
  const row = await env.DB.prepare("SELECT id, data, views FROM products WHERE status = 'published' AND (id = ? OR slug = ?)")
    .bind(productId, productId)
    .first<ProductRow>();
  if (!row) return errorResponse(404, 'Design not found.');
  const product = rowToProduct(row);
  if (product.price > 0) {
    return errorResponse(402, 'Paid downloads are not available yet. Please contact Graphics Expert to purchase this design.');
  }
  const file = product.files.find((f) => f.id === fileId && f.includedInPackage);
  if (!file) return errorResponse(404, 'File not found.');
  const obj = await env.BUCKET.get(file.storageKey);
  if (!obj) return errorResponse(404, 'The file is missing from storage. Please contact Graphics Expert.');
  waitUntil(
    (async () => {
      product.downloadsCount = (product.downloadsCount || 0) + 1;
      await env.DB.prepare('UPDATE products SET data = ? WHERE id = ?').bind(JSON.stringify(product), product.id).run();
    })()
  );
  return fileResponse(obj, file);
};

const createCustomRequest: Handler = async (ctx) => {
  const { env, request } = ctx;
  const ip = clientIp(request);
  if (!(await checkRateLimit(env, `brief:${ip}`, 6, 3600))) {
    return errorResponse(429, 'Too many requests. Please try again in a little while.');
  }

  let fields: Record<string, string> = {};
  let reference: File | null = null;
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await readForm(ctx);
    for (const [k, v] of form.entries()) if (typeof v === 'string') fields[k] = v;
    reference = filesOf(form, 'referenceFile')[0] || null;
  } else {
    const body = await readJson(ctx);
    fields = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, v == null ? '' : String(v)]));
  }

  if (fields.website) return errorResponse(400, 'Invalid submission.'); // honeypot field
  const name = (fields.name || '').trim().slice(0, 120);
  const email = (fields.email || '').trim().slice(0, 200);
  const phone = (fields.phone || '').trim().slice(0, 40);
  const designType = (fields.designType || '').trim().slice(0, 120);
  const description = (fields.description || '').trim().slice(0, 5000);
  if (name.length < 2) return errorResponse(400, 'Please enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse(400, 'Please enter a valid email address.');
  if (!designType) return errorResponse(400, 'Please choose the design service you need.');
  if (description.length < 10) return errorResponse(400, 'Please describe your project in at least a few words.');

  let referenceKey: string | null = null;
  let referenceName: string | null = null;
  if (reference) {
    const ext = extOf(reference.name);
    if (!ALLOWED_REFERENCE_EXTENSIONS.has(ext)) return errorResponse(400, 'Reference file must be PNG, JPG, WEBP or PDF.');
    if (reference.size > 10 * 1024 * 1024) return errorResponse(400, 'Reference file must be 10 MB or smaller.');
    referenceKey = `references/ref_${Date.now()}_${toHex(crypto.getRandomValues(new Uint8Array(6)))}${ext}`;
    referenceName = reference.name.slice(0, 200);
    await env.BUCKET.put(referenceKey, reference, { httpMetadata: { contentType: reference.type || 'application/octet-stream' } });
  }

  const id = 'REQ-' + toHex(crypto.getRandomValues(new Uint8Array(3))).toUpperCase();
  const createdAt = new Date().toISOString();
  try {
    await env.DB.prepare(
      'INSERT INTO custom_requests (id, name, email, phone, design_type, required_size, description, deadline, budget, reference_key, reference_name, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        id, name, email, phone, designType,
        (fields.requiredSize || '').slice(0, 200),
        description,
        (fields.deadline || '').slice(0, 40),
        (fields.budget || '').slice(0, 80),
        referenceKey, referenceName, 'Pending', createdAt
      )
      .run();
  } catch (e) {
    if (referenceKey) await env.BUCKET.delete(referenceKey);
    throw e;
  }
  const saved = await env.DB.prepare('SELECT * FROM custom_requests WHERE id = ?').bind(id).first<Record<string, unknown>>();
  return json({ customRequest: requestRow(saved!) }, 201);
};

// ---------------------------------------------------------------------------
// Auth handlers
// ---------------------------------------------------------------------------

const login: Handler = async (ctx) => {
  const { env, request } = ctx;
  const secret = getSessionSecret(env);
  const adminEmail = (env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!adminEmail) {
    return errorResponse(503, 'Server is not configured: set ADMIN_EMAIL in the Cloudflare Pages environment variables.');
  }
  const body = await readJson(ctx);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const ipBucket = `login:ip:${clientIp(request)}`;
  const emailBucket = `login:email:${email}`;

  if (!(await checkRateLimit(env, ipBucket, 10, 900, false)) || !(await checkRateLimit(env, emailBucket, 40, 900, false))) {
    return errorResponse(429, 'Too many sign-in attempts. Please wait 15 minutes and try again.');
  }

  const fail = async () => {
    await checkRateLimit(env, ipBucket, 10, 900);
    await checkRateLimit(env, emailBucket, 40, 900);
    return errorResponse(401, 'Invalid email or password.');
  };

  if (!email || !password || email !== adminEmail) {
    await hashPassword(password || 'x'); // keep timing similar for unknown accounts
    return fail();
  }

  let user = await env.DB.prepare('SELECT id, email, name, password_hash, password_salt, created_at FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string; email: string; name: string; password_hash: string; password_salt: string; created_at: string }>();

  if (!user) {
    // First sign-in: accept the bootstrap ADMIN_PASSWORD secret and store only its hash.
    if (!env.ADMIN_PASSWORD || !timingSafeEqual(password, env.ADMIN_PASSWORD)) return fail();
    const { hash, salt } = await hashPassword(password);
    const id = randomId('usr', 6);
    const createdAt = new Date().toISOString();
    await env.DB.prepare('INSERT INTO users (id, email, name, role, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, email, 'Graphics Expert (Owner)', 'admin', hash, salt, createdAt)
      .run();
    user = { id, email, name: 'Graphics Expert (Owner)', password_hash: hash, password_salt: salt, created_at: createdAt };
  } else {
    const { hash } = await hashPassword(password, user.password_salt);
    if (!timingSafeEqual(hash, user.password_hash)) return fail();
  }

  await clearRateLimit(env, emailBucket);
  const token = await signSession({ userId: user.id, email: user.email, role: 'admin', exp: Date.now() + SESSION_TTL_MS }, secret);
  return json({ token, user: publicUser(user) });
};

function publicUser(user: { id: string; email: string; name: string; created_at: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: 'admin',
    country: 'Pakistan',
    joinedDate: user.created_at.slice(0, 10),
  };
}

const me: Handler = async (ctx) => {
  const auth = await requireAdmin(ctx);
  const user = await ctx.env.DB.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?')
    .bind(auth.userId)
    .first<{ id: string; email: string; name: string; created_at: string }>();
  return json({ user: publicUser(user!) });
};

const changePassword: Handler = async (ctx) => {
  const auth = await requireAdmin(ctx);
  const body = await readJson(ctx);
  const current = String(body.currentPassword || '');
  const next = String(body.newPassword || '');
  if (next.length < 12) return errorResponse(400, 'The new password must be at least 12 characters long.');
  const user = await ctx.env.DB.prepare('SELECT password_hash, password_salt FROM users WHERE id = ?')
    .bind(auth.userId)
    .first<{ password_hash: string; password_salt: string }>();
  const { hash } = await hashPassword(current, user!.password_salt);
  if (!timingSafeEqual(hash, user!.password_hash)) return errorResponse(401, 'Current password is incorrect.');
  const fresh = await hashPassword(next);
  await ctx.env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?')
    .bind(fresh.hash, fresh.salt, auth.userId)
    .run();
  return json({ success: true });
};

// ---------------------------------------------------------------------------
// Admin: products
// ---------------------------------------------------------------------------

const adminListProducts: Handler = async (ctx) => {
  await requireAdmin(ctx);
  const rows = await ctx.env.DB.prepare('SELECT id, data, views FROM products ORDER BY created_at DESC LIMIT 1000').all<ProductRow>();
  return json({ products: rows.results.map((r) => ({ ...sanitizeProduct(rowToProduct(r)), views: r.views })) });
};

const adminStats: Handler = async (ctx) => {
  await requireAdmin(ctx);
  const { env } = ctx;
  const [byStatus, cats, views, recent, requests, recentRequests] = await Promise.all([
    env.DB.prepare('SELECT status, COUNT(*) AS n FROM products GROUP BY status').all<{ status: string; n: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM categories').first<{ n: number }>(),
    env.DB.prepare('SELECT COALESCE(SUM(views), 0) AS n FROM products').first<{ n: number }>(),
    env.DB.prepare('SELECT id, data FROM products ORDER BY created_at DESC LIMIT 5').all<{ id: string; data: string }>(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM custom_requests WHERE status = 'Pending'").first<{ n: number }>(),
    env.DB.prepare('SELECT * FROM custom_requests ORDER BY created_at DESC LIMIT 5').all<Record<string, unknown>>(),
  ]);
  const count = (s: string) => byStatus.results.find((r) => r.status === s)?.n || 0;
  return json({
    stats: {
      published: count('published'),
      drafts: count('draft') + count('unpublished'),
      categories: cats?.n || 0,
      totalViews: views?.n || 0,
      pendingBriefs: requests?.n || 0,
      recentUploads: recent.results.map((r) => {
        const p = JSON.parse(r.data) as StoredProduct;
        return { id: p.id, title: p.title, status: p.status, createdAt: p.createdAt };
      }),
      recentBriefs: recentRequests.results.map(requestRow),
    },
  });
};

interface FileMeta {
  displayName?: string;
  softwareCompatibility?: string;
  supportedVersion?: string;
  includedInPackage?: boolean;
}

const adminCreateProduct: Handler = async (ctx) => {
  const auth = await requireAdmin(ctx);
  const { env } = ctx;
  const form = await readForm(ctx);

  const title = (fieldOf(form, 'title') || '').trim();
  const categoryId = (fieldOf(form, 'categoryId') || '').trim();
  const priceRaw = fieldOf(form, 'price');
  const price = priceRaw === undefined || priceRaw === '' ? 0 : Number(priceRaw);
  const discountRaw = fieldOf(form, 'discountPrice');
  const discountPrice = discountRaw ? Number(discountRaw) : undefined;
  const status = (PRODUCT_STATUSES as readonly string[]).includes(fieldOf(form, 'status') || '')
    ? (fieldOf(form, 'status') as ProductStatus)
    : 'draft';

  if (!title || !categoryId || Number.isNaN(price) || price < 0) {
    return errorResponse(400, 'A design title, a category and a valid price (0 for free) are required.');
  }
  if (discountPrice !== undefined && (Number.isNaN(discountPrice) || discountPrice < 0 || discountPrice >= price)) {
    return errorResponse(400, 'The discount price must be 0 or more and lower than the selling price.');
  }
  const category = await env.DB.prepare('SELECT id, name FROM categories WHERE id = ?').bind(categoryId).first<{ id: string; name: string }>();
  if (!category) return errorResponse(400, 'The selected category does not exist.');

  const coverFiles = filesOf(form, 'coverPreview');
  const galleryFiles = filesOf(form, 'galleryPreviews');
  const designFiles = filesOf(form, 'designFiles');
  if (designFiles.length === 0 && status === 'published') {
    return errorResponse(400, 'Upload at least one design file before publishing. You can save a draft without files.');
  }
  for (const img of [...coverFiles, ...galleryFiles]) {
    const err = validatePreviewImage(img);
    if (err) return errorResponse(400, err);
  }
  for (const f of designFiles) {
    const err = validateDesignFile(f, env);
    if (err) return errorResponse(400, err);
  }
  const detectedFormats = Array.from(new Set(designFiles.map((f) => extToFormat(extOf(f.name)))));
  if (detectedFormats.some((f) => NON_BROWSER_PREVIEW_FORMATS.has(f)) && coverFiles.length + galleryFiles.length === 0) {
    return errorResponse(
      400,
      'A preview image is required because this design includes formats browsers cannot preview (CDR, AI, EPS, PSD, PSB, TIFF, PDF or ZIP).'
    );
  }

  const filesMeta = parseJson<FileMeta[]>(fieldOf(form, 'filesMeta'), []);
  const storedFiles: StoredFile[] = [];
  const previewUrls: string[] = [];
  try {
    for (const img of [...coverFiles, ...galleryFiles]) previewUrls.push(await storePreview(env, img));
    if (previewUrls.length === 0) {
      const firstImage = designFiles.find((f) => ['.png', '.jpg', '.jpeg'].includes(extOf(f.name)));
      if (firstImage) previewUrls.push(await storePreview(env, firstImage));
    }
    const seen = new Set<string>();
    for (let i = 0; i < designFiles.length; i++) {
      const rec = await storeDesignFile(env, designFiles[i], filesMeta[i] || {});
      if (rec.sha256 && seen.has(rec.sha256)) {
        await env.BUCKET.delete(rec.storageKey);
        throw new HttpError(409, `"${designFiles[i].name}" is identical to another file in this upload.`);
      }
      if (rec.sha256) seen.add(rec.sha256);
      storedFiles.push(rec);
    }

    const softwareList = parseStringArray(fieldOf(form, 'softwareCompatibility'));
    const customFormats = parseStringArray(fieldOf(form, 'fileFormats'));
    const formats = Array.from(new Set([...detectedFormats, ...customFormats]));
    const dpi = Number(fieldOf(form, 'dpi')) || 300;
    const colorMode = fieldOf(form, 'colorMode') === 'RGB' ? 'RGB' : 'CMYK';
    const id = randomId('prod', 4);
    const nowIso = new Date().toISOString();
    const license = (LICENSES as readonly string[]).includes(fieldOf(form, 'license') || '')
      ? (fieldOf(form, 'license') as StoredProduct['license'])
      : 'Commercial';
    const totalBytes = storedFiles.reduce((s, f) => s + f.sizeBytes, 0);

    const product: StoredProduct = {
      id,
      title,
      slug: `${slugify(title) || 'design'}-${id.slice(-4)}`,
      shortDescription: (fieldOf(form, 'shortDescription') || '').trim() || `${title} — editable ${formats.join('/')} design.`,
      description: (fieldOf(form, 'description') || '').trim() || `${title} by Graphics Expert.`,
      categoryId,
      categoryName: category.name,
      subcategory: (fieldOf(form, 'subcategory') || '').trim() || undefined,
      designerId: auth.userId,
      designerName: 'Graphics Expert Studio',
      price: Number(price.toFixed(2)),
      discountPrice: discountPrice !== undefined ? Number(discountPrice.toFixed(2)) : undefined,
      previewUrl: previewUrls[0] || '',
      galleryImages: previewUrls,
      fileFormats: formats,
      files: storedFiles,
      dimensions: (fieldOf(form, 'dimensions') || '').trim() || 'Custom print canvas',
      colorMode,
      dpi,
      softwareCompatibility: softwareList.length > 0 ? softwareList : formats,
      isEditable: true,
      license,
      featured: fieldOf(form, 'featured') === 'true',
      downloadsCount: 0,
      rating: 0,
      reviewsCount: 0,
      tags: parseStringArray(fieldOf(form, 'tags')),
      whatsIncluded: whatsIncluded(storedFiles),
      howToEdit: [
        `Open the included ${formats.join(' / ') || 'source'} file in ${softwareList.join(' or ') || 'your compatible design software'}.`,
        'Customize text, brand colors and image placeholders as needed.',
        `Export at ${dpi} DPI in ${colorMode} mode for final production.`,
      ],
      status,
      fileDownloadSize: formatBytes(totalBytes),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await saveProduct(env, product, true);
    return json({ product: sanitizeProduct(product) }, 201);
  } catch (err) {
    // Roll back anything already written to R2 so failed uploads leave no orphans.
    await Promise.all([
      ...storedFiles.map((f) => env.BUCKET.delete(f.storageKey)),
      ...previewUrls.map((u) => env.BUCKET.delete(`previews/${u.split('/').pop()}`)),
    ]);
    throw err;
  }
};

const adminUpdateProduct: Handler = async (ctx, [id]) => {
  await requireAdmin(ctx);
  const { env } = ctx;
  const existing = await getProductById(env, id);
  if (!existing) return errorResponse(404, 'Design not found.');
  const form = await readForm(ctx);

  const coverFiles = filesOf(form, 'coverPreview');
  const galleryFiles = filesOf(form, 'galleryPreviews');
  const newDesignFiles = filesOf(form, 'designFiles');
  const replacementFiles = filesOf(form, 'replacementFiles');
  for (const img of [...coverFiles, ...galleryFiles]) {
    const err = validatePreviewImage(img);
    if (err) return errorResponse(400, err);
  }
  for (const f of [...newDesignFiles, ...replacementFiles]) {
    const err = validateDesignFile(f, env);
    if (err) return errorResponse(400, err);
  }

  const existingUpdates = parseJson<Array<FileMeta & { id: string; remove?: boolean }>>(fieldOf(form, 'existingFilesMeta'), []);
  const replacementTargetIds = parseJson<string[]>(fieldOf(form, 'replacementTargetIds'), []);
  const newFilesMeta = parseJson<FileMeta[]>(fieldOf(form, 'newFilesMeta'), []);
  const nowIso = new Date().toISOString();

  const createdKeys: string[] = [];
  const keysToDeleteAfterSave: string[] = [];
  try {
    let files: StoredFile[] = [...existing.files];

    const next: StoredFile[] = [];
    for (const rec of files) {
      const patch = existingUpdates.find((u) => u.id === rec.id);
      if (patch?.remove) {
        keysToDeleteAfterSave.push(rec.storageKey);
        continue;
      }
      next.push({
        ...rec,
        displayName: patch?.displayName ? String(patch.displayName).trim() : rec.displayName,
        softwareCompatibility: patch?.softwareCompatibility !== undefined ? String(patch.softwareCompatibility).trim() : rec.softwareCompatibility,
        supportedVersion: patch?.supportedVersion !== undefined ? String(patch.supportedVersion).trim() : rec.supportedVersion,
        includedInPackage: patch?.includedInPackage !== undefined ? Boolean(patch.includedInPackage) : rec.includedInPackage,
      });
    }
    files = next;

    for (let i = 0; i < replacementFiles.length; i++) {
      const idx = files.findIndex((f) => f.id === replacementTargetIds[i]);
      if (idx === -1) continue;
      const old = files[idx];
      const created = await storeDesignFile(env, replacementFiles[i], old);
      createdKeys.push(created.storageKey);
      keysToDeleteAfterSave.push(old.storageKey);
      files[idx] = { ...created, id: old.id, displayName: old.displayName };
    }

    const knownHashes = new Set(files.map((f) => f.sha256).filter(Boolean));
    for (let i = 0; i < newDesignFiles.length; i++) {
      const created = await storeDesignFile(env, newDesignFiles[i], newFilesMeta[i] || {});
      createdKeys.push(created.storageKey);
      if (created.sha256 && knownHashes.has(created.sha256)) {
        throw new HttpError(409, `"${newDesignFiles[i].name}" is already attached to this design.`);
      }
      if (created.sha256) knownHashes.add(created.sha256);
      files.push(created);
    }

    if (files.length === 0 && (fieldOf(form, 'status') || existing.status) === 'published') {
      throw new HttpError(400, 'A published design must keep at least one file.');
    }

    let gallery = parseJson<string[]>(fieldOf(form, 'retainedGalleryImages'), existing.galleryImages);
    const removedPreviews = existing.galleryImages.filter((u) => !gallery.includes(u));
    const newPreviewUrls: string[] = [];
    if (coverFiles.length > 0) {
      const url = await storePreview(env, coverFiles[0]);
      newPreviewUrls.push(url);
      createdKeys.push(`previews/${url.split('/').pop()}`);
      gallery = [url, ...gallery.filter((u) => u !== existing.previewUrl)];
      if (existing.previewUrl) removedPreviews.push(existing.previewUrl);
    }
    for (const g of galleryFiles) {
      const url = await storePreview(env, g);
      createdKeys.push(`previews/${url.split('/').pop()}`);
      gallery.push(url);
    }

    const formats = Array.from(new Set(files.map((f) => f.format)));
    if (formats.some((f) => NON_BROWSER_PREVIEW_FORMATS.has(f)) && gallery.length === 0) {
      throw new HttpError(400, 'A preview image is required for formats browsers cannot preview.');
    }

    const priceRaw = fieldOf(form, 'price');
    const price = priceRaw !== undefined && priceRaw !== '' ? Number(priceRaw) : existing.price;
    if (Number.isNaN(price) || price < 0) throw new HttpError(400, 'Enter a valid price (0 for free).');
    const discountRaw = fieldOf(form, 'discountPrice');
    const discountPrice = discountRaw === undefined ? existing.discountPrice : discountRaw === '' ? undefined : Number(discountRaw);
    if (discountPrice !== undefined && (Number.isNaN(discountPrice) || discountPrice < 0 || discountPrice >= price)) {
      throw new HttpError(400, 'The discount price must be 0 or more and lower than the selling price.');
    }

    let categoryName = existing.categoryName;
    const categoryId = (fieldOf(form, 'categoryId') || '').trim() || existing.categoryId;
    if (categoryId !== existing.categoryId) {
      const cat = await env.DB.prepare('SELECT name FROM categories WHERE id = ?').bind(categoryId).first<{ name: string }>();
      if (!cat) throw new HttpError(400, 'The selected category does not exist.');
      categoryName = cat.name;
    }

    const colorField = fieldOf(form, 'colorMode');
    const statusField = fieldOf(form, 'status');
    const licenseField = fieldOf(form, 'license');
    const featuredField = fieldOf(form, 'featured');
    const text = (name: string, fallback: string) => (fieldOf(form, name) !== undefined ? String(fieldOf(form, name)).trim() : fallback);

    const updated: StoredProduct = {
      ...existing,
      title: (fieldOf(form, 'title') || '').trim() || existing.title,
      shortDescription: text('shortDescription', existing.shortDescription),
      description: text('description', existing.description),
      categoryId,
      categoryName,
      subcategory: fieldOf(form, 'subcategory') !== undefined ? text('subcategory', '') || undefined : existing.subcategory,
      price: Number(price.toFixed(2)),
      discountPrice: discountPrice !== undefined ? Number(discountPrice.toFixed(2)) : undefined,
      previewUrl: gallery[0] || '',
      galleryImages: gallery,
      fileFormats: formats,
      files,
      dimensions: text('dimensions', existing.dimensions),
      colorMode: colorField === 'RGB' ? 'RGB' : colorField === 'CMYK' ? 'CMYK' : existing.colorMode,
      dpi: Number(fieldOf(form, 'dpi')) || existing.dpi,
      softwareCompatibility: parseStringArray(fieldOf(form, 'softwareCompatibility'), existing.softwareCompatibility),
      license: (LICENSES as readonly string[]).includes(licenseField || '') ? (licenseField as StoredProduct['license']) : existing.license,
      featured: featuredField !== undefined ? featuredField === 'true' : existing.featured,
      tags: parseStringArray(fieldOf(form, 'tags'), existing.tags),
      status: (PRODUCT_STATUSES as readonly string[]).includes(statusField || '') ? (statusField as ProductStatus) : existing.status,
      whatsIncluded: whatsIncluded(files),
      fileDownloadSize: formatBytes(files.reduce((s, f) => s + f.sizeBytes, 0)),
      updatedAt: nowIso,
    };
    await saveProduct(env, updated, false);

    for (const key of keysToDeleteAfterSave) await deleteKeyIfUnused(env, key, existing.id);
    for (const url of removedPreviews) {
      const key = `previews/${url.split('/').pop()}`;
      if (!(await keyReferencedElsewhere(env, url, existing.id)) && !updated.galleryImages.includes(url)) await env.BUCKET.delete(key);
    }
    return json({ product: sanitizeProduct(updated) });
  } catch (err) {
    await Promise.all(createdKeys.map((k) => env.BUCKET.delete(k)));
    throw err;
  }
};

const adminSetStatus: Handler = async (ctx, [id]) => {
  await requireAdmin(ctx);
  const body = await readJson(ctx);
  const status = String(body.status || '');
  if (!(PRODUCT_STATUSES as readonly string[]).includes(status)) return errorResponse(400, 'Invalid status.');
  const product = await getProductById(ctx.env, id);
  if (!product) return errorResponse(404, 'Design not found.');
  if (status === 'published' && product.files.length === 0) {
    return errorResponse(400, 'Upload at least one design file before publishing.');
  }
  product.status = status as ProductStatus;
  product.updatedAt = new Date().toISOString();
  await saveProduct(ctx.env, product, false);
  return json({ product: sanitizeProduct(product) });
};

const adminDuplicate: Handler = async (ctx, [id]) => {
  await requireAdmin(ctx);
  const original = await getProductById(ctx.env, id);
  if (!original) return errorResponse(404, 'Design not found.');
  const nowIso = new Date().toISOString();
  const newId = randomId('prod', 4);
  // The copy shares the original's R2 objects; files are only removed when no product references them.
  const copy: StoredProduct = {
    ...original,
    id: newId,
    title: `${original.title} (Copy)`,
    slug: `${original.slug}-copy-${newId.slice(-4)}`,
    status: 'draft',
    featured: false,
    downloadsCount: 0,
    files: original.files.map((f) => ({ ...f, id: randomId('file', 4) })),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  await saveProduct(ctx.env, copy, true);
  return json({ product: sanitizeProduct(copy) }, 201);
};

const adminDelete: Handler = async (ctx, [id]) => {
  await requireAdmin(ctx);
  const { env } = ctx;
  const product = await getProductById(env, id);
  if (!product) return errorResponse(404, 'Design not found.');
  await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  for (const f of product.files) await deleteKeyIfUnused(env, f.storageKey, id);
  for (const url of product.galleryImages) {
    const stillUsed = await env.DB.prepare('SELECT 1 AS hit FROM products WHERE instr(data, ?) > 0 LIMIT 1').bind(url).first();
    if (!stillUsed && url.startsWith('/api/previews/')) await env.BUCKET.delete(`previews/${url.split('/').pop()}`);
  }
  return json({ success: true });
};

const adminDownloadFile: Handler = async (ctx, [id, fileId]) => {
  await requireAdmin(ctx);
  const product = await getProductById(ctx.env, id);
  const file = product?.files.find((f) => f.id === fileId);
  if (!product || !file) return errorResponse(404, 'File not found.');
  const obj = await ctx.env.BUCKET.get(file.storageKey);
  if (!obj) return errorResponse(404, 'The file is missing from storage.');
  return fileResponse(obj, file);
};

const storageStatus: Handler = async (ctx) => {
  await requireAdmin(ctx);
  return json({
    provider: 'Cloudflare R2',
    maxUploadSizeMb: Math.round(maxUploadBytes(ctx.env) / 1048576),
    privateStoragePath: 'R2 bucket (designs/ prefix, private)',
    publicPreviewPath: 'R2 bucket (previews/ prefix, served via /api/previews)',
    persistentDiskActive: true,
    demoCheckoutEnabled: false,
    s3Configured: true,
  });
};

// ---------------------------------------------------------------------------
// Admin: categories
// ---------------------------------------------------------------------------

async function readCategoryBody(ctx: Ctx) {
  const body = await readJson(ctx);
  const name = String(body.name || '').trim().slice(0, 80);
  const description = String(body.description || '').trim().slice(0, 300);
  const iconName = String(body.iconName || 'Layers').trim().slice(0, 40) || 'Layers';
  if (name.length < 2) throw new HttpError(400, 'Category name is required.');
  return { name, description, iconName };
}

const adminCreateCategory: Handler = async (ctx) => {
  await requireAdmin(ctx);
  const { name, description, iconName } = await readCategoryBody(ctx);
  const slug = slugify(name);
  if (!slug) return errorResponse(400, 'Category name must contain letters or numbers.');
  const exists = await ctx.env.DB.prepare('SELECT 1 AS hit FROM categories WHERE id = ? OR slug = ?').bind(slug, slug).first();
  if (exists) return errorResponse(409, 'A category with this name already exists.');
  const order = await ctx.env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM categories').first<{ n: number }>();
  await ctx.env.DB.prepare('INSERT INTO categories (id, name, slug, description, icon_name, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(slug, name, slug, description, iconName, order?.n || 1)
    .run();
  return json({ category: { id: slug, name, slug, description, iconName, templateCount: 0 } }, 201);
};

const adminUpdateCategory: Handler = async (ctx, [id]) => {
  await requireAdmin(ctx);
  const { name, description, iconName } = await readCategoryBody(ctx);
  const result = await ctx.env.DB.prepare('UPDATE categories SET name = ?, description = ?, icon_name = ? WHERE id = ?')
    .bind(name, description, iconName, id)
    .run();
  if (!result.meta?.changes) return errorResponse(404, 'Category not found.');
  // Keep the denormalised category name inside each design in sync.
  const rows = await ctx.env.DB.prepare('SELECT id, data, views FROM products WHERE category_id = ?').bind(id).all<ProductRow>();
  for (const row of rows.results) {
    const p = rowToProduct(row);
    p.categoryName = name;
    await ctx.env.DB.prepare('UPDATE products SET data = ? WHERE id = ?').bind(JSON.stringify(p), p.id).run();
  }
  return json({ success: true });
};

const adminDeleteCategory: Handler = async (ctx, [id]) => {
  await requireAdmin(ctx);
  const used = await ctx.env.DB.prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ?').bind(id).first<{ n: number }>();
  if (used && used.n > 0) {
    return errorResponse(409, `This category still contains ${used.n} design(s). Move or delete them first.`);
  }
  const result = await ctx.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
  if (!result.meta?.changes) return errorResponse(404, 'Category not found.');
  return json({ success: true });
};

// ---------------------------------------------------------------------------
// Admin: design briefs
// ---------------------------------------------------------------------------

const adminListRequests: Handler = async (ctx) => {
  await requireAdmin(ctx);
  const rows = await ctx.env.DB.prepare('SELECT * FROM custom_requests ORDER BY created_at DESC LIMIT 500').all<Record<string, unknown>>();
  return json({ customRequests: rows.results.map(requestRow) });
};

const adminUpdateRequest: Handler = async (ctx, [id]) => {
  await requireAdmin(ctx);
  const body = await readJson(ctx);
  const status = String(body.status || '');
  if (!REQUEST_STATUSES.includes(status)) return errorResponse(400, 'Invalid status.');
  const result = await ctx.env.DB.prepare('UPDATE custom_requests SET status = ? WHERE id = ?').bind(status, id).run();
  if (!result.meta?.changes) return errorResponse(404, 'Request not found.');
  return json({ success: true });
};

const adminDeleteRequest: Handler = async (ctx, [id]) => {
  await requireAdmin(ctx);
  const row = await ctx.env.DB.prepare('SELECT reference_key FROM custom_requests WHERE id = ?').bind(id).first<{ reference_key: string | null }>();
  if (!row) return errorResponse(404, 'Request not found.');
  await ctx.env.DB.prepare('DELETE FROM custom_requests WHERE id = ?').bind(id).run();
  if (row.reference_key) await ctx.env.BUCKET.delete(row.reference_key);
  return json({ success: true });
};

const adminRequestReference: Handler = async (ctx, [id]) => {
  await requireAdmin(ctx);
  const row = await ctx.env.DB.prepare('SELECT reference_key, reference_name FROM custom_requests WHERE id = ?')
    .bind(id)
    .first<{ reference_key: string | null; reference_name: string | null }>();
  if (!row?.reference_key) return errorResponse(404, 'No reference file for this request.');
  const obj = await ctx.env.BUCKET.get(row.reference_key);
  if (!obj) return errorResponse(404, 'The reference file is missing from storage.');
  const safeName = (row.reference_name || 'reference').replace(/[^\w.\- ]+/g, '_');
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

interface Route {
  method: string;
  pattern: string;
  handler: Handler;
}

const routes: Route[] = [
  { method: 'GET', pattern: 'health', handler: health },
  { method: 'GET', pattern: 'categories', handler: listCategories },
  { method: 'GET', pattern: 'products', handler: listPublishedProducts },
  { method: 'GET', pattern: 'products/:id', handler: getPublishedProduct },
  { method: 'GET', pattern: 'previews/:name', handler: servePreview },
  { method: 'GET', pattern: 'downloads/:productId/:fileId', handler: downloadFreeFile },
  { method: 'POST', pattern: 'custom-requests', handler: createCustomRequest },

  { method: 'POST', pattern: 'auth/login', handler: login },
  { method: 'GET', pattern: 'auth/me', handler: me },
  { method: 'POST', pattern: 'admin/change-password', handler: changePassword },

  { method: 'GET', pattern: 'storage-status', handler: storageStatus },
  { method: 'GET', pattern: 'admin/stats', handler: adminStats },
  { method: 'GET', pattern: 'admin/products', handler: adminListProducts },
  { method: 'POST', pattern: 'admin/products', handler: adminCreateProduct },
  { method: 'PUT', pattern: 'admin/products/:id', handler: adminUpdateProduct },
  { method: 'PATCH', pattern: 'admin/products/:id/status', handler: adminSetStatus },
  { method: 'POST', pattern: 'admin/products/:id/duplicate', handler: adminDuplicate },
  { method: 'DELETE', pattern: 'admin/products/:id', handler: adminDelete },
  { method: 'GET', pattern: 'admin/products/:id/files/:fileId/download', handler: adminDownloadFile },

  { method: 'POST', pattern: 'admin/categories', handler: adminCreateCategory },
  { method: 'PUT', pattern: 'admin/categories/:id', handler: adminUpdateCategory },
  { method: 'DELETE', pattern: 'admin/categories/:id', handler: adminDeleteCategory },

  { method: 'GET', pattern: 'custom-requests', handler: adminListRequests },
  { method: 'PATCH', pattern: 'admin/custom-requests/:id', handler: adminUpdateRequest },
  { method: 'DELETE', pattern: 'admin/custom-requests/:id', handler: adminDeleteRequest },
  { method: 'GET', pattern: 'admin/custom-requests/:id/reference', handler: adminRequestReference },
];

function matchRoute(method: string, segments: string[]): { handler: Handler; params: string[] } | 'method' | null {
  let pathMatched = false;
  for (const route of routes) {
    const parts = route.pattern.split('/');
    if (parts.length !== segments.length) continue;
    const params: string[] = [];
    let ok = true;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith(':')) params.push(decodeURIComponent(segments[i]));
      else if (parts[i] !== segments[i]) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    pathMatched = true;
    if (route.method === method) return { handler: route.handler, params };
  }
  return pathMatched ? 'method' : null;
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const { request, env } = context;
  const url = new URL(request.url);
  const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const method = request.method === 'HEAD' ? 'GET' : request.method;

  if (!env.DB || !env.BUCKET) {
    return errorResponse(
      503,
      'The server is not fully configured: bind a D1 database as "DB" and an R2 bucket as "BUCKET" in Cloudflare Pages → Settings → Bindings.'
    );
  }

  const matched = matchRoute(method, segments);
  if (matched === null) return errorResponse(404, 'API route not found.');
  if (matched === 'method') return errorResponse(405, 'Method not allowed.');

  try {
    return await matched.handler({ request, env, url, segments, waitUntil: (p) => context.waitUntil(p) }, matched.params);
  } catch (err) {
    if (err instanceof HttpError) return errorResponse(err.status, err.message);
    console.error('API error:', err);
    return errorResponse(500, 'Something went wrong on the server. Please try again.');
  }
};

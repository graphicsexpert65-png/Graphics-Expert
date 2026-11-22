/**
 * End-to-end API tests for the Cloudflare Pages Functions backend.
 *
 * The real `onRequest` handler is called with real Request objects. Cloudflare D1 is emulated with
 * Node's built-in SQLite (same SQL dialect) and R2 with an in-memory map, so the SQL migration,
 * authentication, uploads, publishing, downloads, briefs and rate limits are exercised for real.
 *
 * Run with:  npm run test:api
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { onRequest } from '../functions/api/[[path]]';
import { onRequestGet as sitemap } from '../functions/sitemap.xml';
import { onRequestGet as robots } from '../functions/robots.txt';
import { signSession } from '../functions/_lib/util';

// ---------------------------------------------------------------------------
// Cloudflare emulation
// ---------------------------------------------------------------------------

class Stmt {
  constructor(private db: DatabaseSync, private sql: string, private args: unknown[] = []) {}
  bind(...values: unknown[]) {
    return new Stmt(this.db, this.sql, values);
  }
  async first<T>(): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...(this.args as never[]));
    return (row ? { ...row } : null) as T | null;
  }
  async all<T>() {
    const rows = this.db.prepare(this.sql).all(...(this.args as never[]));
    return { results: rows.map((r) => ({ ...r })) as T[], success: true };
  }
  async run() {
    const r = this.db.prepare(this.sql).run(...(this.args as never[]));
    return { results: [], success: true, meta: { changes: Number(r.changes) } };
  }
}

function makeD1(db: DatabaseSync) {
  return {
    prepare: (sql: string) => new Stmt(db, sql),
    batch: async (stmts: Stmt[]) => {
      const out = [];
      for (const s of stmts) out.push(await s.run());
      return out;
    },
  };
}

function makeBucket() {
  const store = new Map<string, { bytes: ArrayBuffer; contentType?: string }>();
  return {
    store,
    async put(key: string, value: unknown, options?: { httpMetadata?: { contentType?: string } }) {
      let bytes: ArrayBuffer;
      if (value instanceof Blob) bytes = await value.arrayBuffer();
      else if (value instanceof ArrayBuffer) bytes = value;
      else if (ArrayBuffer.isView(value)) bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice().buffer;
      else if (typeof value === 'string') bytes = new TextEncoder().encode(value).buffer as ArrayBuffer;
      else bytes = await new Response(value as ReadableStream).arrayBuffer();
      store.set(key, { bytes, contentType: options?.httpMetadata?.contentType });
    },
    async get(key: string) {
      const hit = store.get(key);
      if (!hit) return null;
      return {
        body: new Blob([hit.bytes]).stream(),
        size: hit.bytes.byteLength,
        httpEtag: `"${key}"`,
        httpMetadata: { contentType: hit.contentType },
      };
    },
    async delete(keys: string | string[]) {
      for (const k of Array.isArray(keys) ? keys : [keys]) store.delete(k);
    },
  };
}

const ORIGIN = 'https://graphics-expert.test';
const ADMIN_EMAIL = 'owner@graphics-expert.test';
const ADMIN_PASSWORD = 'correct horse battery staple 42';
const SESSION_SECRET = 'a'.repeat(64);

function newEnv(overrides: Record<string, unknown> = {}) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_init.sql', import.meta.url), 'utf8'));
  const bucket = makeBucket();
  return {
    sqlite,
    bucket,
    env: {
      DB: makeD1(sqlite),
      BUCKET: bucket,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      SESSION_SECRET,
      SITE_URL: ORIGIN,
      ...overrides,
    } as never,
  };
}

let pending: Promise<unknown>[] = [];
let ipCounter = 0;

async function call(
  env: never,
  method: string,
  path: string,
  opts: { token?: string; json?: unknown; form?: FormData; ip?: string } = {}
): Promise<{ status: number; body: any; res: Response }> {
  const headers: Record<string, string> = { 'CF-Connecting-IP': opts.ip || `10.0.0.${(ipCounter = (ipCounter + 1) % 250)}` };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let body: BodyInit | undefined;
  if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.json);
  } else if (opts.form) {
    body = opts.form;
  }
  const request = new Request(ORIGIN + path, { method, headers, body });
  const res = await onRequest({ request, env, params: {}, waitUntil: (p: Promise<unknown>) => void pending.push(p) } as never);
  await Promise.all(pending);
  pending = [];
  const text = await res.clone().text();
  let parsed: any = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // not JSON (file download)
  }
  return { status: res.status, body: parsed, res };
}

const PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0)
);
const CDR_BYTES = new TextEncoder().encode('RIFF....CDRX fake corel draw payload for testing');

function designForm(fields: Record<string, string>, files: { name: string; bytes: Uint8Array; type?: string; field: string }[] = []) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  for (const f of files) form.append(f.field, new File([f.bytes], f.name, { type: f.type || 'application/octet-stream' }));
  return form;
}

// ---------------------------------------------------------------------------
// Tiny test runner
// ---------------------------------------------------------------------------

const results: { name: string; ok: boolean; error?: unknown }[] = [];
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error });
    console.log(`  FAIL  ${name}\n        ${(error as Error).message.split('\n').join('\n        ')}`);
  }
}

async function main() {
  const ctx = newEnv();
  const { env, sqlite, bucket } = ctx;
  let token = '';

  console.log('\nPublic API');
  await test('health endpoint responds', async () => {
    const r = await call(env, 'GET', '/api/health');
    assert.equal(r.status, 200);
  });
  await test('categories are seeded (14 real categories)', async () => {
    const r = await call(env, 'GET', '/api/categories');
    assert.equal(r.status, 200);
    assert.equal(r.body.categories.length, 14);
  });
  await test('marketplace starts empty: no fake demo products', async () => {
    const r = await call(env, 'GET', '/api/products');
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.products, []);
  });
  await test('unknown route returns 404 and wrong method returns 405', async () => {
    assert.equal((await call(env, 'GET', '/api/nope')).status, 404);
    assert.equal((await call(env, 'DELETE', '/api/products')).status, 405);
  });

  console.log('\nAdmin authorization (no token)');
  for (const [method, path] of [
    ['GET', '/api/admin/products'],
    ['POST', '/api/admin/products'],
    ['PUT', '/api/admin/products/x'],
    ['PATCH', '/api/admin/products/x/status'],
    ['DELETE', '/api/admin/products/x'],
    ['POST', '/api/admin/categories'],
    ['DELETE', '/api/admin/categories/x'],
    ['GET', '/api/custom-requests'],
    ['PATCH', '/api/admin/custom-requests/x'],
    ['GET', '/api/admin/stats'],
    ['GET', '/api/storage-status'],
    ['POST', '/api/admin/change-password'],
  ] as const) {
    await test(`${method} ${path} requires sign-in`, async () => {
      assert.equal((await call(env, method, path)).status, 401);
    });
  }
  await test('forged and expired tokens are rejected', async () => {
    assert.equal((await call(env, 'GET', '/api/admin/products', { token: 'abc.def' })).status, 401);
    const expired = await signSession({ userId: 'usr_x', email: ADMIN_EMAIL, role: 'admin', exp: Date.now() - 1000 }, SESSION_SECRET);
    assert.equal((await call(env, 'GET', '/api/admin/products', { token: expired })).status, 401);
    const wrongKey = await signSession({ userId: 'usr_x', email: ADMIN_EMAIL, role: 'admin', exp: Date.now() + 60000 }, 'b'.repeat(64));
    assert.equal((await call(env, 'GET', '/api/admin/products', { token: wrongKey })).status, 401);
  });

  console.log('\nSign-in');
  await test('wrong password and unknown email are rejected', async () => {
    assert.equal((await call(env, 'POST', '/api/auth/login', { json: { email: ADMIN_EMAIL, password: 'wrong password!!' } })).status, 401);
    assert.equal((await call(env, 'POST', '/api/auth/login', { json: { email: 'someone@else.com', password: ADMIN_PASSWORD } })).status, 401);
    assert.equal((await call(env, 'GET', '/api/auth/me')).status, 401);
  });
  await test('owner can sign in and only a password HASH is stored', async () => {
    const r = await call(env, 'POST', '/api/auth/login', { json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.ok(r.body.token);
    assert.equal(r.body.user.role, 'admin');
    token = r.body.token;
    const row = sqlite.prepare('SELECT password_hash, password_salt FROM users').get() as { password_hash: string; password_salt: string };
    assert.ok(row.password_hash.length >= 64);
    assert.ok(!JSON.stringify(row).includes(ADMIN_PASSWORD));
    assert.equal((await call(env, 'GET', '/api/auth/me', { token })).status, 200);
  });
  await test('second sign-in uses the stored hash', async () => {
    const r = await call(env, 'POST', '/api/auth/login', { json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    assert.equal(r.status, 200);
  });
  await test('too many failed sign-ins are rate limited (429)', async () => {
    const ip = '203.0.113.9';
    let last = 0;
    for (let i = 0; i < 12; i++) {
      last = (await call(env, 'POST', '/api/auth/login', { ip, json: { email: ADMIN_EMAIL, password: `bad-password-${i}` } })).status;
    }
    assert.equal(last, 429);
  });
  await test('missing SESSION_SECRET gives a clear 503, not a crash', async () => {
    const bad = newEnv({ SESSION_SECRET: '' });
    const r = await call(bad.env, 'POST', '/api/auth/login', { json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    assert.equal(r.status, 503);
    assert.match(r.body.error, /SESSION_SECRET/);
  });
  await test('missing D1/R2 bindings give a clear 503', async () => {
    const r = await call({ ADMIN_EMAIL } as never, 'GET', '/api/products');
    assert.equal(r.status, 503);
    assert.match(r.body.error, /DB|BUCKET/);
  });

  console.log('\nDesign upload, publishing and download');
  let freeId = '';
  let freeSlug = '';
  let freeFileId = '';
  let paidId = '';
  await test('draft upload with CDR + preview image succeeds (201)', async () => {
    const form = designForm(
      { title: 'Wedding Card Test', categoryId: 'wedding-nikkah-cards', price: '0', status: 'draft', tags: 'wedding, card', featured: 'true' },
      [
        { field: 'designFiles', name: 'card.cdr', bytes: CDR_BYTES },
        { field: 'coverPreview', name: 'preview.png', bytes: PNG, type: 'image/png' },
      ]
    );
    const r = await call(env, 'POST', '/api/admin/products', { token, form });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    freeId = r.body.product.id;
    freeSlug = r.body.product.slug;
    freeFileId = r.body.product.files[0].id;
    assert.equal(r.body.product.status, 'draft');
    assert.ok(!JSON.stringify(r.body).includes('storageKey'), 'private R2 keys must never reach the browser');
    assert.ok([...bucket.store.keys()].some((k) => k.startsWith('previews/')));
  });
  await test('drafts are NOT public (list, detail, download)', async () => {
    assert.deepEqual((await call(env, 'GET', '/api/products')).body.products, []);
    assert.equal((await call(env, 'GET', `/api/products/${freeId}`)).status, 404);
    assert.equal((await call(env, 'GET', `/api/downloads/${freeId}/${freeFileId}`)).status, 404);
    const admin = await call(env, 'GET', '/api/admin/products', { token });
    assert.equal(admin.body.products.length, 1);
  });
  await test('publishing makes it appear publicly with no private keys', async () => {
    const r = await call(env, 'PATCH', `/api/admin/products/${freeId}/status`, { token, json: { status: 'published' } });
    assert.equal(r.status, 200);
    const list = await call(env, 'GET', '/api/products');
    assert.equal(list.body.products.length, 1);
    assert.equal(list.body.products[0].title, 'Wedding Card Test');
    assert.ok(!JSON.stringify(list.body).includes('storageKey'));
    const detail = await call(env, 'GET', `/api/products/${freeSlug}`);
    assert.equal(detail.status, 200);
  });
  await test('free design downloads the exact original bytes without signing in', async () => {
    const r = await call(env, 'GET', `/api/downloads/${freeId}/${freeFileId}`);
    assert.equal(r.status, 200);
    const bytes = new Uint8Array(await r.res.arrayBuffer());
    assert.deepEqual([...bytes], [...CDR_BYTES]);
    assert.match(r.res.headers.get('Content-Disposition') || '', /attachment/);
  });
  await test('paid design is listed but the download is blocked (no fake payments)', async () => {
    const form = designForm(
      { title: 'Paid Menu Test', categoryId: 'restaurant-menus', price: '15', status: 'published' },
      [
        { field: 'designFiles', name: 'menu.ai', bytes: CDR_BYTES },
        { field: 'coverPreview', name: 'p.png', bytes: PNG, type: 'image/png' },
      ]
    );
    const r = await call(env, 'POST', '/api/admin/products', { token, form });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    paidId = r.body.product.id;
    const dl = await call(env, 'GET', `/api/downloads/${paidId}/${r.body.product.files[0].id}`);
    assert.equal(dl.status, 402);
    assert.match(dl.body.error, /not available/i);
    assert.equal((await call(env, 'GET', '/api/products')).body.products.length, 2);
  });
  await test('invalid uploads are rejected with clear messages', async () => {
    const base = { title: 'X', categoryId: 'business-cards', price: '0' };
    const png = { field: 'coverPreview', name: 'p.png', bytes: PNG, type: 'image/png' };
    const bad = [
      ['.exe file', designForm({ ...base, status: 'draft' }, [{ field: 'designFiles', name: 'virus.exe', bytes: CDR_BYTES }, png])],
      ['CDR without preview', designForm({ ...base, status: 'draft' }, [{ field: 'designFiles', name: 'a.cdr', bytes: CDR_BYTES }])],
      ['publish without files', designForm({ ...base, status: 'published' })],
      ['negative price', designForm({ ...base, price: '-5', status: 'draft' })],
      ['unknown category', designForm({ ...base, categoryId: 'nope', status: 'draft' })],
      ['discount above price', designForm({ ...base, price: '5', discountPrice: '9', status: 'draft' })],
      ['no title', designForm({ ...base, title: '', status: 'draft' })],
    ] as const;
    for (const [label, form] of bad) {
      const r = await call(env, 'POST', '/api/admin/products', { token, form });
      assert.equal(r.status, 400, `${label} should be 400 but was ${r.status}: ${JSON.stringify(r.body)}`);
    }
  });
  await test('SVG and PNG design files are accepted', async () => {
    const form = designForm(
      { title: 'Vector Test', categoryId: 'social-media-designs', price: '0', status: 'draft' },
      [
        { field: 'designFiles', name: 'logo.svg', bytes: new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>') },
        { field: 'coverPreview', name: 'p.png', bytes: PNG, type: 'image/png' },
      ]
    );
    const r = await call(env, 'POST', '/api/admin/products', { token, form });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    await call(env, 'DELETE', `/api/admin/products/${r.body.product.id}`, { token });
  });
  await test('editing a design saves the change', async () => {
    const form = designForm({ title: 'Wedding Card Renamed', categoryId: 'wedding-nikkah-cards', price: '0', status: 'published' });
    const r = await call(env, 'PUT', `/api/admin/products/${freeId}`, { token, form });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const pub = await call(env, 'GET', `/api/products/${freeId}`);
    assert.equal(pub.body.product.title, 'Wedding Card Renamed');
  });
  await test('duplicate creates an unpublished copy', async () => {
    const r = await call(env, 'POST', `/api/admin/products/${freeId}/duplicate`, { token });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.notEqual(r.body.product.status, 'published');
    await call(env, 'DELETE', `/api/admin/products/${r.body.product.id}`, { token });
    // the original's files must survive deleting the copy
    const dl = await call(env, 'GET', `/api/downloads/${freeId}/${freeFileId}`);
    assert.equal(dl.status, 200);
  });
  await test('unpublishing removes it from the public site', async () => {
    await call(env, 'PATCH', `/api/admin/products/${paidId}/status`, { token, json: { status: 'unpublished' } });
    const list = await call(env, 'GET', '/api/products');
    assert.equal(list.body.products.length, 1);
    assert.equal((await call(env, 'GET', `/api/products/${paidId}`)).status, 404);
  });
  await test('deleting removes the design and its stored files', async () => {
    const before = bucket.store.size;
    const r = await call(env, 'DELETE', `/api/admin/products/${paidId}`, { token });
    assert.equal(r.status, 200);
    assert.ok(bucket.store.size < before, 'R2 objects should be removed');
    assert.equal((await call(env, 'GET', '/api/admin/products', { token })).body.products.length, 1);
    assert.equal((await call(env, 'DELETE', `/api/admin/products/${paidId}`, { token })).status, 404);
  });

  console.log('\nCategories');
  await test('create, rename and delete an empty category', async () => {
    const c = await call(env, 'POST', '/api/admin/categories', { token, json: { name: 'Logo Templates', description: 'Logos', iconName: 'PenTool' } });
    assert.equal(c.status, 201, JSON.stringify(c.body));
    assert.equal((await call(env, 'POST', '/api/admin/categories', { token, json: { name: 'Logo Templates', description: '', iconName: 'Layers' } })).status, 409);
    const u = await call(env, 'PUT', `/api/admin/categories/${c.body.category.id}`, { token, json: { name: 'Logo Templates', description: 'Updated', iconName: 'Layers' } });
    assert.equal(u.status, 200, JSON.stringify(u.body));
    assert.equal((await call(env, 'DELETE', `/api/admin/categories/${c.body.category.id}`, { token })).status, 200);
  });
  await test('a category that still contains designs cannot be deleted', async () => {
    const r = await call(env, 'DELETE', '/api/admin/categories/wedding-nikkah-cards', { token });
    assert.equal(r.status, 409);
  });

  console.log('\nDesign briefs');
  const brief = { name: 'Asad Khan', email: 'asad@example.com', phone: '0300', designType: 'Logo design', description: 'I need a logo for my bakery please.' };
  let briefId = '';
  await test('valid brief is saved and returned with an id (JSON)', async () => {
    const r = await call(env, 'POST', '/api/custom-requests', { json: brief });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    briefId = r.body.customRequest.id;
    const row = sqlite.prepare('SELECT * FROM custom_requests WHERE id = ?').get(briefId) as { email: string; status: string };
    assert.equal(row.email, 'asad@example.com');
    assert.equal(row.status, 'Pending');
  });
  await test('brief with a reference image (multipart) is saved and admin can download it', async () => {
    const form = designForm(brief, [{ field: 'referenceFile', name: 'ref.png', bytes: PNG, type: 'image/png' }]);
    const r = await call(env, 'POST', '/api/custom-requests', { form });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.customRequest.hasReferenceFile, true);
    const id = r.body.customRequest.id;
    assert.equal((await call(env, 'GET', `/api/admin/custom-requests/${id}/reference`)).status, 401);
    const dl = await call(env, 'GET', `/api/admin/custom-requests/${id}/reference`, { token });
    assert.equal(dl.status, 200);
    assert.deepEqual([...new Uint8Array(await dl.res.arrayBuffer())], [...PNG]);
  });
  await test('invalid briefs are rejected and NOT saved', async () => {
    const count = () => (sqlite.prepare('SELECT COUNT(*) AS n FROM custom_requests').get() as { n: number }).n;
    const before = count();
    const bad = [
      { ...brief, email: 'not-an-email' },
      { ...brief, name: '' },
      { ...brief, description: 'short' },
      { ...brief, designType: '' },
      { ...brief, website: 'http://spam.example' }, // honeypot
    ];
    for (const b of bad) assert.equal((await call(env, 'POST', '/api/custom-requests', { json: b })).status, 400, JSON.stringify(b));
    const exe = designForm(brief, [{ field: 'referenceFile', name: 'bad.exe', bytes: CDR_BYTES }]);
    assert.equal((await call(env, 'POST', '/api/custom-requests', { form: exe })).status, 400);
    assert.equal(count(), before);
  });
  await test('owner sees briefs, can change status, and delete', async () => {
    const list = await call(env, 'GET', '/api/custom-requests', { token });
    assert.equal(list.status, 200);
    assert.ok(list.body.customRequests.some((b: { id: string }) => b.id === briefId));
    assert.equal((await call(env, 'PATCH', `/api/admin/custom-requests/${briefId}`, { token, json: { status: 'Quoted' } })).status, 200);
    assert.equal((await call(env, 'PATCH', `/api/admin/custom-requests/${briefId}`, { token, json: { status: 'Bogus' } })).status, 400);
    assert.equal((await call(env, 'DELETE', `/api/admin/custom-requests/${briefId}`, { token })).status, 200);
  });
  await test('brief spam is rate limited per visitor (429)', async () => {
    const ip = '198.51.100.7';
    let last = 0;
    for (let i = 0; i < 8; i++) last = (await call(env, 'POST', '/api/custom-requests', { ip, json: brief })).status;
    assert.equal(last, 429);
  });

  console.log('\nDashboard data');
  await test('stats reflect real data', async () => {
    const r = await call(env, 'GET', '/api/admin/stats', { token });
    assert.equal(r.status, 200);
    assert.equal(r.body.stats.published, 1);
    assert.ok(r.body.stats.categories >= 14);
    assert.ok(r.body.stats.totalViews >= 1);
    assert.ok(Array.isArray(r.body.stats.recentUploads));
  });
  await test('storage status honestly reports payments are off', async () => {
    const r = await call(env, 'GET', '/api/storage-status', { token });
    assert.equal(r.status, 200);
    assert.equal(r.body.demoCheckoutEnabled, false);
  });
  await test('owner can change the password; old one stops working', async () => {
    const newPassword = 'a brand new very long password 99';
    assert.equal((await call(env, 'POST', '/api/admin/change-password', { token, json: { currentPassword: 'nope', newPassword } })).status, 401);
    assert.equal((await call(env, 'POST', '/api/admin/change-password', { token, json: { currentPassword: ADMIN_PASSWORD, newPassword: 'short' } })).status, 400);
    assert.equal((await call(env, 'POST', '/api/admin/change-password', { token, json: { currentPassword: ADMIN_PASSWORD, newPassword } })).status, 200);
    assert.equal((await call(env, 'POST', '/api/auth/login', { json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })).status, 401);
    assert.equal((await call(env, 'POST', '/api/auth/login', { json: { email: ADMIN_EMAIL, password: newPassword } })).status, 200);
  });

  console.log('\nSEO files');
  await test('sitemap.xml lists only public pages + published designs, never /admin', async () => {
    const res = await sitemap({ request: new Request(`${ORIGIN}/sitemap.xml`), env, params: {}, waitUntil() {} } as never);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('Content-Type') || '', /xml/);
    const xml = await res.text();
    assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset /);
    assert.ok(xml.includes(`<loc>${ORIGIN}/</loc>`));
    assert.ok(xml.includes(`<loc>${ORIGIN}/marketplace</loc>`));
    assert.ok(xml.includes(`<loc>${ORIGIN}/design/${freeSlug}</loc>`));
    assert.ok(xml.includes(`<loc>${ORIGIN}/category/wedding-nikkah-cards</loc>`));
    assert.ok(!xml.includes('/admin'));
    assert.ok(!xml.includes('/api/'));
    const opens = (xml.match(/<url>/g) || []).length;
    assert.equal(opens, (xml.match(/<\/url>/g) || []).length);
  });
  await test('sitemap omits unpublished/draft designs', async () => {
    await call(env, 'PATCH', `/api/admin/products/${freeId}/status`, { token, json: { status: 'draft' } });
    const res = await sitemap({ request: new Request(`${ORIGIN}/sitemap.xml`), env, params: {}, waitUntil() {} } as never);
    assert.ok(!(await res.text()).includes(`/design/${freeSlug}`));
  });
  await test('robots.txt blocks /admin and /api and points to the sitemap', async () => {
    const res = robots({ request: new Request(`${ORIGIN}/robots.txt`), env, params: {}, waitUntil() {} } as never);
    const txt = await res.text();
    assert.match(txt, /Disallow: \/admin/);
    assert.match(txt, /Disallow: \/api\//);
    assert.match(txt, new RegExp(`Sitemap: ${ORIGIN}/sitemap.xml`));
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} tests passed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

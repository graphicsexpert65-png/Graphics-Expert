import type { Env } from './cf';

// ---------- HTTP helpers ----------

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

export function errorResponse(status: number, message: string): Response {
  return json({ error: message }, status);
}

// ---------- encoding ----------

const enc = new TextEncoder();

export function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function randomId(prefix: string, bytes = 5): string {
  return `${prefix}_${toHex(crypto.getRandomValues(new Uint8Array(bytes)))}`;
}

export function timingSafeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

// ---------- password hashing (PBKDF2-SHA256; Workers caps iterations at 100000) ----------

const PBKDF2_ITERATIONS = 100000;

export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ?? toHex(crypto.getRandomValues(new Uint8Array(16)));
  const saltBytes = Uint8Array.from(salt.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return { hash: toHex(bits), salt };
}

// ---------- signed session tokens (HMAC-SHA256) ----------

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: 'admin';
  exp: number;
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const body = toBase64Url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(token: string, secret: string): Promise<SessionPayload | null> {
  try {
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body));
    if (!timingSafeEqual(sig, toBase64Url(new Uint8Array(expected)))) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionSecret(env: Env): string {
  const secret = env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new HttpError(
      503,
      'Server is not configured: set a SESSION_SECRET (32+ characters) in the Cloudflare Pages environment variables.'
    );
  }
  return secret;
}

// ---------- rate limiting (D1 backed) ----------

export async function checkRateLimit(
  env: Env,
  bucket: string,
  limit: number,
  windowSeconds: number,
  consume = true
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare('SELECT count, reset_at FROM rate_limits WHERE bucket = ?')
    .bind(bucket)
    .first<{ count: number; reset_at: number }>();
  if (!row || row.reset_at <= now) {
    if (consume) {
      await env.DB.prepare(
        'INSERT INTO rate_limits (bucket, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET count = 1, reset_at = excluded.reset_at'
      )
        .bind(bucket, now + windowSeconds)
        .run();
    }
    return true;
  }
  if (row.count >= limit) return false;
  if (consume) {
    await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE bucket = ?').bind(bucket).run();
  }
  return true;
}

export async function clearRateLimit(env: Env, bucket: string): Promise<void> {
  await env.DB.prepare('DELETE FROM rate_limits WHERE bucket = ?').bind(bucket).run();
}

// ---------- misc ----------

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i).toLowerCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function parseStringArray(val: unknown, fallback: string[] = []): string[] {
  if (val === undefined || val === null || val === '') return fallback;
  if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    } catch {
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return fallback;
}

export function parseJson<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw !== 'string') return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Escape text for safe use in HTML/XML output. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Minimal Cloudflare runtime types (kept local so the project needs no extra type packages).

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta?: { changes?: number };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

export interface R2ObjectBody {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
}

export interface R2Bucket {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob | null,
    options?: { httpMetadata?: { contentType?: string; contentDisposition?: string } }
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(keys: string | string[]): Promise<void>;
}

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  /** Owner e-mail address used to sign in to the private admin dashboard. */
  ADMIN_EMAIL?: string;
  /** One-time bootstrap password. Hashed into D1 on first successful sign-in. */
  ADMIN_PASSWORD?: string;
  /** Random string (32+ chars) used to sign admin session tokens. */
  SESSION_SECRET?: string;
  /** Public site origin, e.g. https://graphics-expert.pages.dev */
  SITE_URL?: string;
  MAX_UPLOAD_SIZE_MB?: string;
  /** Static asset fetcher that Cloudflare Pages injects automatically. */
  ASSETS?: { fetch(request: Request): Promise<Response> };
}

export interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil(promise: Promise<unknown>): void;
}

export type PagesHandler = (ctx: PagesContext) => Promise<Response> | Response;

// Workers runtime global used for server-side <head> injection (kept untyped on purpose).
export interface HtmlRewriterLike {
  on(selector: string, handlers: Record<string, (el: any) => void>): HtmlRewriterLike;
  transform(res: Response): Response;
}

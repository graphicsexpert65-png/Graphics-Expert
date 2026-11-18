import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { ZipArchive } from 'archiver';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB) || 250;
const MAX_FILE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'graphicsexpert65@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ALLOW_DEMO_AUTH = process.env.ALLOW_DEMO_AUTH === 'true';

// Storage Directories
const STORAGE_ROOT = path.resolve(__dirname, 'storage');
const PRIVATE_DESIGNS_DIR = path.join(STORAGE_ROOT, 'private', 'designs');
const PUBLIC_PREVIEWS_DIR = path.join(STORAGE_ROOT, 'public', 'previews');
const TEMP_UPLOAD_DIR = path.join(STORAGE_ROOT, 'tmp');
const DB_FILE = path.join(STORAGE_ROOT, 'db.json');
const SECRETS_FILE = path.join(STORAGE_ROOT, '.secrets.json');

for (const dir of [STORAGE_ROOT, PRIVATE_DESIGNS_DIR, PUBLIC_PREVIEWS_DIR, TEMP_UPLOAD_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

// Persistent server-side secrets (never exposed to frontend)
function loadOrCreateSecrets(): { sessionSecret: string; downloadSecret: string } {
  if (process.env.SESSION_SECRET && process.env.DOWNLOAD_TOKEN_SECRET) {
    return {
      sessionSecret: process.env.SESSION_SECRET,
      downloadSecret: process.env.DOWNLOAD_TOKEN_SECRET,
    };
  }
  if (fs.existsSync(SECRETS_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf-8'));
      if (parsed.sessionSecret && parsed.downloadSecret) return parsed;
    } catch {
      // regenerate below
    }
  }
  const generated = {
    sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    downloadSecret: process.env.DOWNLOAD_TOKEN_SECRET || crypto.randomBytes(32).toString('hex'),
  };
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(generated, null, 2), { mode: 0o600 });
  return generated;
}

const SECRETS = loadOrCreateSecrets();

// Allowed Extensions & Validation Maps
const ALLOWED_DESIGN_EXTENSIONS = new Set([
  '.cdr',
  '.ai',
  '.eps',
  '.psd',
  '.psb',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.tif',
  '.tiff',
  '.zip',
]);

const ALLOWED_PREVIEW_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

const NON_BROWSER_PREVIEW_FORMATS = new Set([
  'CDR',
  'AI',
  'EPS',
  'PSD',
  'PSB',
  'TIF',
  'TIFF',
  'ZIP',
  'PDF',
]);

const STRICT_MIME_MAP: Record<string, string[]> = {
  '.png': ['image/png'],
  '.jpg': ['image/jpeg', 'image/jpg', 'image/pjpeg'],
  '.jpeg': ['image/jpeg', 'image/jpg', 'image/pjpeg'],
  '.webp': ['image/webp'],
  '.pdf': ['application/pdf', 'application/x-pdf', 'application/octet-stream'],
  '.zip': [
    'application/zip',
    'application/x-zip-compressed',
    'multipart/x-zip',
    'application/octet-stream',
  ],
};

function extToFormat(ext: string): string {
  const clean = ext.replace('.', '').toUpperCase();
  if (clean === 'JPEG') return 'JPEG';
  if (clean === 'TIFF') return 'TIFF';
  return clean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Types for DB records
interface StoredFileRecord {
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
  storageKey: string; // Private filename inside PRIVATE_DESIGNS_DIR - NEVER exposed publicly
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
  files: StoredFileRecord[];
  dimensions: string;
  colorMode: 'CMYK' | 'RGB';
  dpi: number;
  softwareCompatibility: string[];
  isEditable: boolean;
  license: 'Personal' | 'Commercial' | 'Extended Commercial';
  featured: boolean;
  downloadsCount: number;
  rating: number;
  reviewsCount: number;
  tags: string[];
  whatsIncluded: string[];
  howToEdit: string[];
  status: 'published' | 'draft' | 'unpublished';
  fileDownloadSize: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'designer' | 'admin';
  country: string;
  bio?: string;
  passwordHash?: string;
  passwordSalt?: string;
  joinedDate: string;
}

interface StoredOrder {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerCountry: string;
  items: {
    id: string;
    productId: string;
    productTitle: string;
    productThumbnail: string;
    price: number;
    license: 'Personal' | 'Commercial' | 'Extended Commercial';
    downloadToken: string;
    downloadExpiresAt: string;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentMethod: string;
  paymentStatus: 'completed' | 'pending' | 'failed';
  isDemoOrder: boolean;
  createdAt: string;
}

interface StoredCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  expiry: string;
  minOrder: number;
  active: boolean;
}

interface StoredCustomRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  designType: string;
  requiredSize: string;
  description: string;
  deadline: string;
  budget: string;
  referenceFileName?: string;
  status: 'Pending' | 'In Review' | 'Quoted' | 'In Progress' | 'Completed';
  createdAt: string;
}

interface StoredDesignerSubmission {
  id: string;
  designerId: string;
  designerName: string;
  title: string;
  category: string;
  price: number;
  fileFormats: string[];
  dimensions: string;
  status: 'Draft' | 'Pending Review' | 'Approved' | 'Rejected';
  reviewNote?: string;
  previewUrl: string;
  submittedAt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  products: StoredProduct[];
  orders: StoredOrder[];
  coupons: StoredCoupon[];
  customRequests: StoredCustomRequest[];
  designerSubmissions: StoredDesignerSubmission[];
  wishlists: Record<string, string[]>;
}

const DEFAULT_DB: DatabaseSchema = {
  users: [
    {
      id: 'usr_adm_owner',
      name: 'Graphics Expert (Owner)',
      email: ADMIN_EMAIL,
      role: 'admin',
      country: 'Pakistan',
      joinedDate: 'Nov 2026',
    },
    {
      id: 'usr_cust_01',
      name: 'Customer Account',
      email: 'customer@graphicsexpert.com',
      role: 'customer',
      country: 'Pakistan',
      joinedDate: 'Nov 2026',
    },
    {
      id: 'usr_des_02',
      name: 'Contributor Studio',
      email: 'designer@graphicsexpert.com',
      role: 'designer',
      country: 'Pakistan',
      bio: 'Independent graphic design contributor.',
      joinedDate: 'Nov 2026',
    },
  ],
  products: [],
  orders: [],
  coupons: [],
  customRequests: [],
  designerSubmissions: [],
  wishlists: {},
};

function loadDb(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
    return structuredClone(DEFAULT_DB);
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    return {
      users: parsed.users || structuredClone(DEFAULT_DB.users),
      products: parsed.products || [],
      orders: parsed.orders || [],
      coupons: parsed.coupons || [],
      customRequests: parsed.customRequests || [],
      designerSubmissions: parsed.designerSubmissions || [],
      wishlists: parsed.wishlists || {},
    };
  } catch {
    return structuredClone(DEFAULT_DB);
  }
}

function saveDb(db: DatabaseSchema): void {
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2));
  fs.renameSync(tmpFile, DB_FILE);
}

// Crypto helpers for passwords, sessions & download tokens
function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function signPayload(payloadObj: Record<string, unknown>, secret: string): string {
  const json = JSON.stringify(payloadObj);
  const b64 = Buffer.from(json, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifySignedPayload<T>(token: string, secret: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (parsed.exp && Date.now() > Number(parsed.exp)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

interface SessionPayload {
  userId: string;
  email: string;
  role: 'customer' | 'designer' | 'admin';
  exp: number;
}

interface DownloadTokenPayload {
  orderId: string;
  itemId: string;
  productId: string;
  userId: string;
  exp: number;
}

function issueSessionToken(user: StoredUser): string {
  return signPayload(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    SECRETS.sessionSecret
  );
}

function issueDownloadToken(orderId: string, itemId: string, productId: string, userId: string): {
  token: string;
  expiresAt: string;
} {
  const expMs = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiring download token
  const token = signPayload(
    {
      orderId,
      itemId,
      productId,
      userId,
      exp: expMs,
    },
    SECRETS.downloadSecret
  );
  return {
    token,
    expiresAt: new Date(expMs).toISOString(),
  };
}

// Strip private storageKey from file records before sending to any client
function sanitizeProduct(product: StoredProduct) {
  return {
    ...product,
    files: (product.files || []).map(({ storageKey: _removed, ...rest }) => rest),
  };
}

function computeFileSha256(filePath: string): string {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

function cleanupTempFiles(files: Express.Multer.File[]) {
  for (const f of files) {
    try {
      if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
    } catch {
      // ignore
    }
  }
}

// Multer setup to receive multipart uploads safely into TEMP_UPLOAD_DIR first
const uploadMiddleware = multer({
  dest: TEMP_UPLOAD_DIR,
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: 40,
  },
});

interface AuthenticatedRequest extends Request {
  authUser?: StoredUser;
}

function attachAuthUser(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (bearer) {
    const payload = verifySignedPayload<SessionPayload>(bearer, SECRETS.sessionSecret);
    if (payload) {
      const db = loadDb();
      const user = db.users.find((u) => u.id === payload.userId);
      if (user) {
        req.authUser = user;
      }
    }
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  if (req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Graphics Expert administrator access required.' });
    return;
  }
  next();
}

function validateUploadedDesignFile(file: Express.Multer.File): { valid: boolean; error?: string; ext: string } {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_DESIGN_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      ext,
      error: `Unsupported file extension "${ext || 'unknown'}" for "${file.originalname}". Allowed formats: CDR, AI, EPS, PSD, PSB, PDF, PNG, JPG, JPEG, TIF, TIFF, ZIP.`,
    };
  }
  if (file.size === 0) {
    return { valid: false, ext, error: `File "${file.originalname}" is empty (0 bytes).` };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      valid: false,
      ext,
      error: `File "${file.originalname}" exceeds maximum allowed size (${MAX_UPLOAD_SIZE_MB} MB).`,
    };
  }
  const strictMimes = STRICT_MIME_MAP[ext];
  if (strictMimes && file.mimetype && !strictMimes.includes(file.mimetype.toLowerCase())) {
    return {
      valid: false,
      ext,
      error: `Invalid MIME type "${file.mimetype}" for file "${file.originalname}".`,
    };
  }
  return { valid: true, ext };
}

function validateUploadedPreviewImage(file: Express.Multer.File): { valid: boolean; error?: string; ext: string } {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_PREVIEW_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      ext,
      error: `Preview image "${file.originalname}" must be PNG, JPG, JPEG, or WEBP.`,
    };
  }
  if (!file.mimetype.toLowerCase().startsWith('image/')) {
    return {
      valid: false,
      ext,
      error: `Preview file "${file.originalname}" has invalid MIME type "${file.mimetype}".`,
    };
  }
  if (file.size === 0 || file.size > 25 * 1024 * 1024) {
    return {
      valid: false,
      ext,
      error: `Preview image "${file.originalname}" must be between 1 byte and 25 MB.`,
    };
  }
  return { valid: true, ext };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(attachAuthUser);

  // Serve ONLY public preview images (never private design files)
  app.use('/uploads/previews', express.static(PUBLIC_PREVIEWS_DIR, { maxAge: '7d' }));

  // =========================================================
  // HEALTH & STORAGE STATUS
  // =========================================================
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', brand: 'Graphics Expert', timestamp: new Date().toISOString() });
  });

  app.get('/api/storage-status', requireAdmin, (_req, res) => {
    const s3Configured = Boolean(
      process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
    );
    res.json({
      provider: STORAGE_PROVIDER,
      maxUploadSizeMb: MAX_UPLOAD_SIZE_MB,
      privateStoragePath: 'storage/private/designs (protected, non-public)',
      publicPreviewPath: 'storage/public/previews',
      persistentDiskActive: true,
      demoCheckoutEnabled: true,
      s3Configured,
    });
  });

  // =========================================================
  // AUTHENTICATION ROUTES
  // =========================================================
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, country, role } = req.body || {};
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const db = loadDb();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const { hash, salt } = hashPassword(String(password));
    const safeRole = 'customer';
    const newUser: StoredUser = {
      id: 'usr_' + crypto.randomUUID().slice(0, 8),
      name: String(name).trim(),
      email: cleanEmail,
      role: safeRole,
      country: String(country || 'Pakistan').trim(),
      passwordHash: hash,
      passwordSalt: salt,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };

    db.users.push(newUser);
    saveDb(db);

    const token = issueSessionToken(newUser);
    const { passwordHash: _ph, passwordSalt: _ps, ...publicUser } = newUser;
    res.status(201).json({ token, user: publicUser });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const db = loadDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.role === 'admin') {
      if (!ADMIN_PASSWORD || String(password) !== ADMIN_PASSWORD) {
        res.status(401).json({ error: 'Administrator password is not configured or is incorrect.' });
        return;
      }
    } else if (user.passwordHash && user.passwordSalt) {
      const { hash } = hashPassword(String(password), user.passwordSalt);
      if (hash !== user.passwordHash) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }
    }

    const token = issueSessionToken(user);
    const { passwordHash: _ph, passwordSalt: _ps, ...publicUser } = user;
    res.json({ token, user: publicUser });
  });

  app.post('/api/auth/demo-switch', (req, res) => {
    if (!ALLOW_DEMO_AUTH) {
      res.status(403).json({ error: 'Preview role switching is disabled in production.' });
      return;
    }
    const { role } = req.body || {};
    const db = loadDb();
    const user = db.users.find((u) => u.role === role);
    if (!user) {
      res.status(404).json({ error: 'Account role not found.' });
      return;
    }
    const token = issueSessionToken(user);
    const { passwordHash: _ph, passwordSalt: _ps, ...publicUser } = user;
    res.json({ token, user: publicUser });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const { passwordHash: _ph, passwordSalt: _ps, ...publicUser } = req.authUser!;
    res.json({ user: publicUser });
  });

  // =========================================================
  // PUBLIC MARKETPLACE ROUTES (STRICTLY PUBLISHED ONLY)
  // =========================================================
  app.get('/api/products', (_req, res) => {
    const db = loadDb();
    const published = db.products
      .filter((p) => p.status === 'published')
      .map(sanitizeProduct);
    res.json({ products: published });
  });

  app.get('/api/products/:id', (req: AuthenticatedRequest, res) => {
    const db = loadDb();
    const product = db.products.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Design not found.' });
      return;
    }
    if (product.status !== 'published' && req.authUser?.role !== 'admin') {
      res.status(404).json({ error: 'Design is not publicly available.' });
      return;
    }
    res.json({ product: sanitizeProduct(product) });
  });

  // =========================================================
  // ADMIN PRODUCT UPLOAD & MANAGEMENT ROUTES
  // =========================================================
  app.get('/api/admin/products', requireAdmin, (_req, res) => {
    const db = loadDb();
    res.json({ products: db.products.map(sanitizeProduct) });
  });

  const productUploadFields = uploadMiddleware.fields([
    { name: 'coverPreview', maxCount: 1 },
    { name: 'galleryPreviews', maxCount: 10 },
    { name: 'designFiles', maxCount: 20 },
    { name: 'replacementFiles', maxCount: 20 },
  ]);

  app.post('/api/admin/products', requireAdmin, productUploadFields, (req: AuthenticatedRequest, res) => {
    const uploadedFilesMap = (req.files || {}) as Record<string, Express.Multer.File[]>;
    const coverFiles = uploadedFilesMap.coverPreview || [];
    const galleryFiles = uploadedFilesMap.galleryPreviews || [];
    const designFiles = uploadedFilesMap.designFiles || [];
    const allTemp = [...coverFiles, ...galleryFiles, ...designFiles];

    try {
      const body = req.body || {};
      const title = String(body.title || '').trim();
      const shortDescription = String(body.shortDescription || '').trim();
      const description = String(body.description || '').trim();
      const categoryId = String(body.categoryId || '').trim();
      const categoryName = String(body.categoryName || '').trim();
      const subcategory = String(body.subcategory || '').trim();
      const price = Number(body.price);
      const discountPrice = body.discountPrice ? Number(body.discountPrice) : undefined;
      const dimensions = String(body.dimensions || '').trim();
      const colorMode = body.colorMode === 'RGB' ? 'RGB' : 'CMYK';
      const dpi = Number(body.dpi) || 300;
      const license = (['Personal', 'Commercial', 'Extended Commercial'].includes(body.license)
        ? body.license
        : 'Commercial') as StoredProduct['license'];
      const featured = body.featured === 'true' || body.featured === true;
      const status = (['published', 'draft', 'unpublished'].includes(body.status)
        ? body.status
        : 'draft') as StoredProduct['status'];

      if (!title || !categoryId || Number.isNaN(price) || price < 0) {
        cleanupTempFiles(allTemp);
        res.status(400).json({ error: 'Design title, category, and valid selling price are required.' });
        return;
      }

      if (discountPrice !== undefined && (Number.isNaN(discountPrice) || discountPrice < 0 || discountPrice >= price)) {
        cleanupTempFiles(allTemp);
        res.status(400).json({ error: 'Discount price must be greater than or equal to 0 and lower than selling price.' });
        return;
      }

      if (designFiles.length === 0) {
        cleanupTempFiles(allTemp);
        res.status(400).json({ error: 'Please upload at least one original source design file.' });
        return;
      }

      // Validate all preview images
      for (const img of [...coverFiles, ...galleryFiles]) {
        const check = validateUploadedPreviewImage(img);
        if (!check.valid) {
          cleanupTempFiles(allTemp);
          res.status(400).json({ error: check.error });
          return;
        }
      }

      // Parse per-file metadata from form
      let filesMeta: Array<{
        displayName?: string;
        softwareCompatibility?: string;
        supportedVersion?: string;
        includedInPackage?: boolean;
      }> = [];
      try {
        if (body.filesMeta) filesMeta = JSON.parse(body.filesMeta);
      } catch {
        filesMeta = [];
      }

      // Validate all design files and detect duplicates within the upload
      const seenHashes = new Set<string>();
      const preparedDesignFiles: Array<{ file: Express.Multer.File; ext: string; sha256: string; meta: (typeof filesMeta)[number] }> = [];

      for (let i = 0; i < designFiles.length; i++) {
        const df = designFiles[i];
        const check = validateUploadedDesignFile(df);
        if (!check.valid) {
          cleanupTempFiles(allTemp);
          res.status(400).json({ error: check.error });
          return;
        }
        const sha256 = computeFileSha256(df.path);
        if (seenHashes.has(sha256)) {
          cleanupTempFiles(allTemp);
          res.status(409).json({
            error: `Duplicate file detected: "${df.originalname}" is identical to another file in this upload.`,
          });
          return;
        }
        seenHashes.add(sha256);
        preparedDesignFiles.push({
          file: df,
          ext: check.ext,
          sha256,
          meta: filesMeta[i] || {},
        });
      }

      // Check if non-browser-previewable files exist -> require preview image!
      const detectedFormats = Array.from(
        new Set(preparedDesignFiles.map((item) => extToFormat(item.ext)))
      );
      const needsPreviewImage = detectedFormats.some((fmt) => NON_BROWSER_PREVIEW_FORMATS.has(fmt));

      if (needsPreviewImage && coverFiles.length === 0 && galleryFiles.length === 0) {
        cleanupTempFiles(allTemp);
        res.status(400).json({
          error:
            'A preview image is required because this package includes non-browser-previewable design files (CDR, AI, EPS, PSD, PSB, TIFF, PDF, or ZIP).',
        });
        return;
      }

      // Move preview images to PUBLIC_PREVIEWS_DIR
      const savedPreviewUrls: string[] = [];
      for (const img of [...coverFiles, ...galleryFiles]) {
        const ext = path.extname(img.originalname).toLowerCase();
        const safeName = `preview_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
        const destPath = path.join(PUBLIC_PREVIEWS_DIR, safeName);
        fs.renameSync(img.path, destPath);
        savedPreviewUrls.push(`/uploads/previews/${safeName}`);
      }

      // If no cover preview uploaded (only PNG/JPG design files), generate preview copy from first image design file
      if (savedPreviewUrls.length === 0 && preparedDesignFiles.length > 0) {
        const firstImg = preparedDesignFiles.find((d) => ['.png', '.jpg', '.jpeg'].includes(d.ext));
        if (firstImg) {
          const safeName = `preview_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${firstImg.ext}`;
          const destPath = path.join(PUBLIC_PREVIEWS_DIR, safeName);
          fs.copyFileSync(firstImg.file.path, destPath);
          savedPreviewUrls.push(`/uploads/previews/${safeName}`);
        }
      }

      // Move original design files to PRIVATE_DESIGNS_DIR untouched (byte-for-byte preserved!)
      const nowIso = new Date().toISOString();
      const storedRecords: StoredFileRecord[] = [];
      let totalSizeBytes = 0;

      for (const item of preparedDesignFiles) {
        const storageKey = `asset_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${item.ext}`;
        const destPath = path.join(PRIVATE_DESIGNS_DIR, storageKey);
        fs.renameSync(item.file.path, destPath);

        const format = extToFormat(item.ext);
        totalSizeBytes += item.file.size;
        storedRecords.push({
          id: 'file_' + crypto.randomUUID().slice(0, 8),
          displayName: String(item.meta.displayName || item.file.originalname).trim(),
          originalFileName: item.file.originalname,
          format,
          extension: item.ext,
          mimeType: item.file.mimetype || 'application/octet-stream',
          sizeBytes: item.file.size,
          sizeFormatted: formatBytes(item.file.size),
          softwareCompatibility: String(item.meta.softwareCompatibility || format).trim(),
          supportedVersion: String(item.meta.supportedVersion || 'Standard').trim(),
          includedInPackage: item.meta.includedInPackage !== false,
          uploadedAt: nowIso,
          sha256: item.sha256,
          storageKey,
        });
      }

      // Parse arrays
      const parseStringArray = (val: unknown): string[] => {
        if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
          } catch {
            return val.split(',').map((s) => s.trim()).filter(Boolean);
          }
        }
        return [];
      };

      const softwareList = parseStringArray(body.softwareCompatibility);
      const tagsList = parseStringArray(body.tags);
      const customFormats = parseStringArray(body.fileFormats);
      const combinedFormats = Array.from(new Set([...detectedFormats, ...customFormats]));

      const slugBase = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const id = 'prod_' + crypto.randomUUID().slice(0, 8);

      const newProduct: StoredProduct = {
        id,
        title,
        slug: `${slugBase || 'design'}-${id.slice(-4)}`,
        shortDescription: shortDescription || `${title} — Editable ${combinedFormats.join('/')} design package.`,
        description:
          description ||
          `Original ${title} created by Graphics Expert. Includes ${storedRecords.map((f) => f.displayName).join(', ')}.`,
        categoryId,
        categoryName: categoryName || categoryId,
        subcategory: subcategory || undefined,
        designerId: req.authUser!.id,
        designerName: 'Graphics Expert Studio',
        price: Number(price.toFixed(2)),
        discountPrice: discountPrice !== undefined ? Number(discountPrice.toFixed(2)) : undefined,
        previewUrl: savedPreviewUrls[0] || '',
        galleryImages: savedPreviewUrls,
        fileFormats: combinedFormats,
        files: storedRecords,
        dimensions: dimensions || 'Custom Print Canvas',
        colorMode,
        dpi,
        softwareCompatibility: softwareList.length > 0 ? softwareList : combinedFormats,
        isEditable: true,
        license,
        featured,
        downloadsCount: 0,
        rating: 0,
        reviewsCount: 0,
        tags: tagsList,
        whatsIncluded: storedRecords
          .filter((f) => f.includedInPackage)
          .map((f) => `${f.displayName} (${f.format} · ${f.supportedVersion} · ${f.sizeFormatted})`),
        howToEdit: [
          `Open the included ${combinedFormats.join(' / ')} source file in ${softwareList.join(' or ') || 'your compatible design software'}.`,
          'Customize text layers, brand colors, and image placeholders as needed.',
          `Export at ${dpi} DPI in ${colorMode} mode for final production.`,
        ],
        status,
        fileDownloadSize: formatBytes(totalSizeBytes),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const db = loadDb();
      db.products.unshift(newProduct);
      saveDb(db);

      res.status(201).json({ product: sanitizeProduct(newProduct) });
    } catch (err) {
      cleanupTempFiles(allTemp);
      console.error('Upload error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to upload design.' });
    }
  });

  // Update existing product & manage its files (add, remove, replace, rename, edit compatibility/versions)
  app.put('/api/admin/products/:id', requireAdmin, productUploadFields, (req: AuthenticatedRequest, res) => {
    const uploadedFilesMap = (req.files || {}) as Record<string, Express.Multer.File[]>;
    const coverFiles = uploadedFilesMap.coverPreview || [];
    const galleryFiles = uploadedFilesMap.galleryPreviews || [];
    const newDesignFiles = uploadedFilesMap.designFiles || [];
    const replacementFiles = uploadedFilesMap.replacementFiles || [];
    const allTemp = [...coverFiles, ...galleryFiles, ...newDesignFiles, ...replacementFiles];

    try {
      const db = loadDb();
      const idx = db.products.findIndex((p) => p.id === req.params.id);
      if (idx === -1) {
        cleanupTempFiles(allTemp);
        res.status(404).json({ error: 'Product not found.' });
        return;
      }

      const existing = db.products[idx];
      const body = req.body || {};

      // Validate new preview images
      for (const img of [...coverFiles, ...galleryFiles]) {
        const check = validateUploadedPreviewImage(img);
        if (!check.valid) {
          cleanupTempFiles(allTemp);
          res.status(400).json({ error: check.error });
          return;
        }
      }

      // Validate new design files
      for (const df of [...newDesignFiles, ...replacementFiles]) {
        const check = validateUploadedDesignFile(df);
        if (!check.valid) {
          cleanupTempFiles(allTemp);
          res.status(400).json({ error: check.error });
          return;
        }
      }

      const parseJson = <T,>(raw: unknown, fallback: T): T => {
        if (!raw) return fallback;
        if (typeof raw !== 'string') return raw as T;
        try {
          return JSON.parse(raw) as T;
        } catch {
          return fallback;
        }
      };

      // Update/remove/replace existing files
      const existingUpdates = parseJson<
        Array<{
          id: string;
          displayName?: string;
          softwareCompatibility?: string;
          supportedVersion?: string;
          includedInPackage?: boolean;
          remove?: boolean;
        }>
      >(body.existingFilesMeta, []);

      const replacementTargetIds = parseJson<string[]>(body.replacementTargetIds, []);
      const newFilesMeta = parseJson<
        Array<{
          displayName?: string;
          softwareCompatibility?: string;
          supportedVersion?: string;
          includedInPackage?: boolean;
        }>
      >(body.newFilesMeta, []);

      const nowIso = new Date().toISOString();
      let updatedFiles: StoredFileRecord[] = [...existing.files];

      // Handle removals and metadata updates
      if (existingUpdates.length > 0) {
        const nextFiles: StoredFileRecord[] = [];
        for (const fileRec of updatedFiles) {
          const patch = existingUpdates.find((u) => u.id === fileRec.id);
          if (patch?.remove) {
            // Remove private binary file from disk if not shared by another duplicate product
            const stillReferencedElsewhere = db.products.some(
              (p) => p.id !== existing.id && p.files.some((f) => f.storageKey === fileRec.storageKey)
            );
            if (!stillReferencedElsewhere) {
              const privatePath = path.join(PRIVATE_DESIGNS_DIR, fileRec.storageKey);
              if (fs.existsSync(privatePath)) fs.unlinkSync(privatePath);
            }
            continue;
          }
          nextFiles.push({
            ...fileRec,
            displayName: patch?.displayName ? String(patch.displayName).trim() : fileRec.displayName,
            softwareCompatibility:
              patch?.softwareCompatibility !== undefined
                ? String(patch.softwareCompatibility).trim()
                : fileRec.softwareCompatibility,
            supportedVersion:
              patch?.supportedVersion !== undefined
                ? String(patch.supportedVersion).trim()
                : fileRec.supportedVersion,
            includedInPackage:
              patch?.includedInPackage !== undefined
                ? Boolean(patch.includedInPackage)
                : fileRec.includedInPackage,
          });
        }
        updatedFiles = nextFiles;
      }

      // Handle file replacements (replaceFile index corresponds to replacementTargetIds index)
      for (let i = 0; i < replacementFiles.length; i++) {
        const repFile = replacementFiles[i];
        const targetId = replacementTargetIds[i];
        const targetIdx = updatedFiles.findIndex((f) => f.id === targetId);
        if (targetIdx === -1) continue;

        const oldRec = updatedFiles[targetIdx];
        const ext = path.extname(repFile.originalname).toLowerCase();
        const sha256 = computeFileSha256(repFile.path);
        const newKey = `asset_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
        fs.renameSync(repFile.path, path.join(PRIVATE_DESIGNS_DIR, newKey));

        // Clean up old file if not referenced elsewhere
        const sharedElsewhere = db.products.some(
          (p) => p.id !== existing.id && p.files.some((f) => f.storageKey === oldRec.storageKey)
        );
        if (!sharedElsewhere) {
          const oldPath = path.join(PRIVATE_DESIGNS_DIR, oldRec.storageKey);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const fmt = extToFormat(ext);
        updatedFiles[targetIdx] = {
          ...oldRec,
          originalFileName: repFile.originalname,
          displayName: oldRec.displayName || repFile.originalname,
          format: fmt,
          extension: ext,
          mimeType: repFile.mimetype || 'application/octet-stream',
          sizeBytes: repFile.size,
          sizeFormatted: formatBytes(repFile.size),
          sha256,
          storageKey: newKey,
          uploadedAt: nowIso,
        };
      }

      // Handle newly added design files
      const existingHashes = new Set(updatedFiles.map((f) => f.sha256).filter(Boolean));
      for (let i = 0; i < newDesignFiles.length; i++) {
        const nf = newDesignFiles[i];
        const ext = path.extname(nf.originalname).toLowerCase();
        const sha256 = computeFileSha256(nf.path);
        if (existingHashes.has(sha256)) {
          cleanupTempFiles(allTemp);
          res.status(409).json({
            error: `Duplicate file detected: "${nf.originalname}" is already attached to this product.`,
          });
          return;
        }
        existingHashes.add(sha256);

        const storageKey = `asset_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
        fs.renameSync(nf.path, path.join(PRIVATE_DESIGNS_DIR, storageKey));
        const fmt = extToFormat(ext);
        const meta = newFilesMeta[i] || {};
        updatedFiles.push({
          id: 'file_' + crypto.randomUUID().slice(0, 8),
          displayName: String(meta.displayName || nf.originalname).trim(),
          originalFileName: nf.originalname,
          format: fmt,
          extension: ext,
          mimeType: nf.mimetype || 'application/octet-stream',
          sizeBytes: nf.size,
          sizeFormatted: formatBytes(nf.size),
          softwareCompatibility: String(meta.softwareCompatibility || fmt).trim(),
          supportedVersion: String(meta.supportedVersion || 'Standard').trim(),
          includedInPackage: meta.includedInPackage !== false,
          uploadedAt: nowIso,
          sha256,
          storageKey,
        });
      }

      if (updatedFiles.length === 0) {
        cleanupTempFiles(allTemp);
        res.status(400).json({ error: 'A design product must have at least one source file.' });
        return;
      }

      // Handle preview images updates
      let nextGallery = parseJson<string[]>(body.retainedGalleryImages, existing.galleryImages);
      if (coverFiles.length > 0) {
        const ext = path.extname(coverFiles[0].originalname).toLowerCase();
        const safeName = `preview_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
        fs.renameSync(coverFiles[0].path, path.join(PUBLIC_PREVIEWS_DIR, safeName));
        const newCoverUrl = `/uploads/previews/${safeName}`;
        nextGallery = [newCoverUrl, ...nextGallery.filter((u) => u !== existing.previewUrl)];
      }
      for (const gf of galleryFiles) {
        const ext = path.extname(gf.originalname).toLowerCase();
        const safeName = `preview_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
        fs.renameSync(gf.path, path.join(PUBLIC_PREVIEWS_DIR, safeName));
        nextGallery.push(`/uploads/previews/${safeName}`);
      }

      const detectedFormats = Array.from(new Set(updatedFiles.map((f) => f.format)));
      const needsPreviewImage = detectedFormats.some((fmt) => NON_BROWSER_PREVIEW_FORMATS.has(fmt));
      if (needsPreviewImage && nextGallery.length === 0) {
        cleanupTempFiles(allTemp);
        res.status(400).json({ error: 'A preview image is required for non-browser-previewable design formats.' });
        return;
      }

      const totalBytes = updatedFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
      const parseStringArray = (val: unknown, fallback: string[]): string[] => {
        if (!val) return fallback;
        if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
        if (typeof val === 'string') {
          try {
            const p = JSON.parse(val);
            if (Array.isArray(p)) return p.map(String).map((s) => s.trim()).filter(Boolean);
          } catch {
            return val.split(',').map((s) => s.trim()).filter(Boolean);
          }
        }
        return fallback;
      };

      const nextPrice = body.price !== undefined ? Number(body.price) : existing.price;
      const nextDiscount =
        body.discountPrice !== undefined && body.discountPrice !== ''
          ? Number(body.discountPrice)
          : body.discountPrice === ''
          ? undefined
          : existing.discountPrice;

      const updated: StoredProduct = {
        ...existing,
        title: body.title ? String(body.title).trim() : existing.title,
        shortDescription:
          body.shortDescription !== undefined ? String(body.shortDescription).trim() : existing.shortDescription,
        description: body.description !== undefined ? String(body.description).trim() : existing.description,
        categoryId: body.categoryId ? String(body.categoryId).trim() : existing.categoryId,
        categoryName: body.categoryName ? String(body.categoryName).trim() : existing.categoryName,
        subcategory: body.subcategory !== undefined ? String(body.subcategory).trim() : existing.subcategory,
        price: Number(nextPrice.toFixed(2)),
        discountPrice: nextDiscount !== undefined ? Number(nextDiscount.toFixed(2)) : undefined,
        previewUrl: nextGallery[0] || existing.previewUrl,
        galleryImages: nextGallery,
        fileFormats: detectedFormats,
        files: updatedFiles,
        dimensions: body.dimensions !== undefined ? String(body.dimensions).trim() : existing.dimensions,
        colorMode: body.colorMode === 'RGB' ? 'RGB' : body.colorMode === 'CMYK' ? 'CMYK' : existing.colorMode,
        dpi: body.dpi ? Number(body.dpi) : existing.dpi,
        softwareCompatibility: parseStringArray(body.softwareCompatibility, existing.softwareCompatibility),
        license: (['Personal', 'Commercial', 'Extended Commercial'].includes(body.license)
          ? body.license
          : existing.license) as StoredProduct['license'],
        featured:
          body.featured !== undefined
            ? body.featured === 'true' || body.featured === true
            : existing.featured,
        tags: parseStringArray(body.tags, existing.tags),
        status: (['published', 'draft', 'unpublished'].includes(body.status)
          ? body.status
          : existing.status) as StoredProduct['status'],
        whatsIncluded: updatedFiles
          .filter((f) => f.includedInPackage)
          .map((f) => `${f.displayName} (${f.format} · ${f.supportedVersion} · ${f.sizeFormatted})`),
        fileDownloadSize: formatBytes(totalBytes),
        updatedAt: nowIso,
      };

      db.products[idx] = updated;
      saveDb(db);
      res.json({ product: sanitizeProduct(updated) });
    } catch (err) {
      cleanupTempFiles(allTemp);
      console.error('Update product error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update product.' });
    }
  });

  app.patch('/api/admin/products/:id/status', requireAdmin, (req, res) => {
    const { status } = req.body || {};
    if (!['published', 'draft', 'unpublished'].includes(status)) {
      res.status(400).json({ error: 'Invalid status value.' });
      return;
    }
    const db = loadDb();
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    product.status = status;
    product.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ product: sanitizeProduct(product) });
  });

  app.post('/api/admin/products/:id/duplicate', requireAdmin, (req, res) => {
    const db = loadDb();
    const original = db.products.find((p) => p.id === req.params.id);
    if (!original) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const newId = 'prod_' + crypto.randomUUID().slice(0, 8);
    const copiedFiles: StoredFileRecord[] = original.files.map((f) => {
      const srcPath = path.join(PRIVATE_DESIGNS_DIR, f.storageKey);
      const newKey = `asset_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${f.extension}`;
      const dstPath = path.join(PRIVATE_DESIGNS_DIR, newKey);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, dstPath);
      }
      return {
        ...f,
        id: 'file_' + crypto.randomUUID().slice(0, 8),
        storageKey: newKey,
        uploadedAt: nowIso,
      };
    });

    const duplicate: StoredProduct = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${newId.slice(-4)}`,
      status: 'draft',
      featured: false,
      downloadsCount: 0,
      files: copiedFiles,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.products.unshift(duplicate);
    saveDb(db);
    res.status(201).json({ product: sanitizeProduct(duplicate) });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const [removed] = db.products.splice(idx, 1);

    // Clean up private files not referenced by any other product
    for (const f of removed.files) {
      const stillReferenced = db.products.some((p) =>
        p.files.some((other) => other.storageKey === f.storageKey)
      );
      if (!stillReferenced) {
        const pPath = path.join(PRIVATE_DESIGNS_DIR, f.storageKey);
        if (fs.existsSync(pPath)) fs.unlinkSync(pPath);
      }
    }

    // Clean up preview images not referenced by any other product
    for (const imgUrl of removed.galleryImages) {
      if (imgUrl.startsWith('/uploads/previews/')) {
        const stillReferenced = db.products.some((p) => p.galleryImages.includes(imgUrl));
        if (!stillReferenced) {
          const fileName = path.basename(imgUrl);
          const previewPath = path.join(PUBLIC_PREVIEWS_DIR, fileName);
          if (fs.existsSync(previewPath)) fs.unlinkSync(previewPath);
        }
      }
    }

    saveDb(db);
    res.json({ success: true });
  });

  // =========================================================
  // ORDERS & SERVER-VERIFIED SECURE DOWNLOADS
  // =========================================================
  app.get('/api/orders', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = loadDb();
    const user = req.authUser!;
    const matchingOrders =
      user.role === 'admin'
        ? db.orders
        : db.orders.filter(
            (o) => o.userId === user.id || o.customerEmail.toLowerCase() === user.email.toLowerCase()
          );

    // Attach sanitized package file list for each purchased product
    const enriched = matchingOrders.map((order) => ({
      ...order,
      items: order.items.map((item) => {
        const prod = db.products.find((p) => p.id === item.productId);
        return {
          ...item,
          files: prod
            ? prod.files
                .filter((f) => f.includedInPackage)
                .map(({ storageKey: _removed, ...rest }) => rest)
            : [],
        };
      }),
    }));

    res.json({ orders: enriched });
  });

  app.post('/api/orders', (req: AuthenticatedRequest, res) => {
    const { items, customerName, customerEmail, customerCountry, paymentMethod, couponCode } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Cart is empty.' });
      return;
    }
    if (!customerName || !customerEmail) {
      res.status(400).json({ error: 'Customer name and email are required.' });
      return;
    }

    const db = loadDb();
    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const userId = req.authUser?.id || `guest_${String(customerEmail).toLowerCase()}`;

    let subtotal = 0;
    const orderItems: StoredOrder['items'] = [];

    for (const cartEntry of items) {
      const prod = db.products.find(
        (p) => p.id === cartEntry.productId && p.status === 'published'
      );
      if (!prod) {
        res.status(400).json({ error: `Product "${cartEntry.productId}" is unavailable for purchase.` });
        return;
      }
      const license = (['Personal', 'Commercial', 'Extended Commercial'].includes(cartEntry.license)
        ? cartEntry.license
        : 'Commercial') as StoredOrder['items'][number]['license'];
      const basePrice = prod.discountPrice ?? prod.price;
      const computedPrice = Number((license === 'Extended Commercial' ? basePrice * 2.5 : basePrice).toFixed(2));
      subtotal += computedPrice;

      const itemId = 'item_' + crypto.randomUUID().slice(0, 8);
      const { token, expiresAt } = issueDownloadToken(orderId, itemId, prod.id, userId);

      orderItems.push({
        id: itemId,
        productId: prod.id,
        productTitle: prod.title,
        productThumbnail: prod.previewUrl,
        price: computedPrice,
        license,
        downloadToken: token,
        downloadExpiresAt: expiresAt,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    let discount = 0;
    let appliedCode: string | undefined;

    if (couponCode) {
      const found = db.coupons.find(
        (c) => c.code.toUpperCase() === String(couponCode).trim().toUpperCase() && c.active
      );
      if (found && subtotal >= found.minOrder) {
        discount =
          found.discountType === 'percentage'
            ? Number(((subtotal * found.value) / 100).toFixed(2))
            : Math.min(found.value, subtotal);
        appliedCode = found.code;
      }
    }

    const total = Number(Math.max(0, subtotal - discount).toFixed(2));
    const newOrder: StoredOrder = {
      id: orderId,
      userId,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim().toLowerCase(),
      customerCountry: String(customerCountry || 'Pakistan').trim(),
      items: orderItems,
      subtotal,
      discount,
      total,
      couponCode: appliedCode,
      paymentMethod: String(paymentMethod || 'Demo Checkout (Simulated)'),
      paymentStatus: 'completed',
      isDemoOrder: true,
      createdAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);
    saveDb(db);

    const enrichedOrder = {
      ...newOrder,
      items: newOrder.items.map((item) => {
        const prod = db.products.find((p) => p.id === item.productId);
        return {
          ...item,
          files: prod
            ? prod.files
                .filter((f) => f.includedInPackage)
                .map(({ storageKey: _removed, ...rest }) => rest)
            : [],
        };
      }),
    };

    res.status(201).json({ order: enrichedOrder });
  });

  app.post('/api/orders/:orderId/items/:itemId/refresh-token', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = loadDb();
    const order = db.orders.find((o) => o.id === req.params.orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const user = req.authUser!;
    const ownsOrder =
      user.role === 'admin' ||
      order.userId === user.id ||
      order.customerEmail.toLowerCase() === user.email.toLowerCase();

    if (!ownsOrder) {
      res.status(403).json({ error: 'Unauthorized: You do not own this order.' });
      return;
    }

    const item = order.items.find((i) => i.id === req.params.itemId);
    if (!item) {
      res.status(404).json({ error: 'Order item not found.' });
      return;
    }

    const { token, expiresAt } = issueDownloadToken(order.id, item.id, item.productId, order.userId);
    item.downloadToken = token;
    item.downloadExpiresAt = expiresAt;
    saveDb(db);
    res.json({ downloadToken: token, downloadExpiresAt: expiresAt });
  });

  // Protected Download Endpoint (Streams original files byte-for-byte after verifying token & purchase)
  app.get('/api/downloads/:orderId/:itemId', (req: AuthenticatedRequest, res) => {
    const token = String(req.query.token || '');
    const fileId = req.query.fileId ? String(req.query.fileId) : null;

    const tokenData = verifySignedPayload<DownloadTokenPayload>(token, SECRETS.downloadSecret);
    if (!tokenData) {
      res.status(401).json({ error: 'Download link is invalid or has expired. Please refresh your download token from your Dashboard.' });
      return;
    }

    if (tokenData.orderId !== req.params.orderId || tokenData.itemId !== req.params.itemId) {
      res.status(403).json({ error: 'Download token mismatch.' });
      return;
    }

    const db = loadDb();
    const order = db.orders.find((o) => o.id === req.params.orderId);
    if (!order || order.paymentStatus !== 'completed') {
      res.status(403).json({ error: 'Purchase verification failed.' });
      return;
    }

    const orderItem = order.items.find((i) => i.id === req.params.itemId);
    if (!orderItem) {
      res.status(404).json({ error: 'Purchased item not found.' });
      return;
    }

    // If user session is also provided, verify ownership (unless admin)
    if (req.authUser && req.authUser.role !== 'admin') {
      const matchesUser =
        order.userId === req.authUser.id ||
        order.customerEmail.toLowerCase() === req.authUser.email.toLowerCase();
      if (!matchesUser) {
        res.status(403).json({ error: 'You are not authorized to download this purchase.' });
        return;
      }
    }

    const product = db.products.find((p) => p.id === orderItem.productId);
    if (!product) {
      res.status(404).json({ error: 'Design source files are no longer available.' });
      return;
    }

    const packageFiles = product.files.filter((f) => f.includedInPackage);
    if (packageFiles.length === 0) {
      res.status(404).json({ error: 'No files included in this product package.' });
      return;
    }

    // Increment real download count
    product.downloadsCount += 1;
    saveDb(db);

    // Case A: Single specific file requested (streams exact original file untouched)
    if (fileId) {
      const target = packageFiles.find((f) => f.id === fileId);
      if (!target) {
        res.status(404).json({ error: 'Requested file not found in package.' });
        return;
      }
      const privateFilePath = path.join(PRIVATE_DESIGNS_DIR, target.storageKey);
      if (!fs.existsSync(privateFilePath)) {
        res.status(404).json({ error: 'Private design file missing from storage.' });
        return;
      }
      res.setHeader('Content-Type', target.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${target.displayName.replace(/"/g, '')}"`);
      res.setHeader('Cache-Control', 'no-store');
      fs.createReadStream(privateFilePath).pipe(res);
      return;
    }

    // Case B: If package has exactly 1 file and it's already a ZIP, stream it directly untouched
    if (packageFiles.length === 1 && packageFiles[0].extension === '.zip') {
      const single = packageFiles[0];
      const privateFilePath = path.join(PRIVATE_DESIGNS_DIR, single.storageKey);
      if (!fs.existsSync(privateFilePath)) {
        res.status(404).json({ error: 'Private ZIP package missing from storage.' });
        return;
      }
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${single.displayName.replace(/"/g, '')}"`);
      res.setHeader('Cache-Control', 'no-store');
      fs.createReadStream(privateFilePath).pipe(res);
      return;
    }

    // Case C: Bundle all original files (byte-for-byte untouched) + License Certificate into a ZIP stream
    const safeSlug = product.slug || 'graphics-expert-design';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeSlug}-package.zip"`);
    res.setHeader('Cache-Control', 'no-store');

    const archive = new ZipArchive({ zlib: { level: 6 } });
    archive.on('error', (err: Error) => {
      console.error('Archive error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to assemble download package.' });
    });
    archive.pipe(res);

    for (const f of packageFiles) {
      const privateFilePath = path.join(PRIVATE_DESIGNS_DIR, f.storageKey);
      if (fs.existsSync(privateFilePath)) {
        archive.file(privateFilePath, { name: f.displayName || f.originalFileName });
      }
    }

    const licenseText = [
      '============================================================',
      '        GRAPHICS EXPERT DIGITAL LICENSE CERTIFICATE',
      '============================================================',
      `Design: ${product.title}`,
      `Order ID: ${order.id}`,
      `Licensed To: ${order.customerName} (${order.customerEmail})`,
      `License Tier: ${orderItem.license}`,
      `Dimensions: ${product.dimensions} | ${product.colorMode} | ${product.dpi} DPI`,
      `Issued At: ${new Date().toISOString()}`,
      '',
      'INCLUDED ORIGINAL FILES:',
      ...packageFiles.map(
        (f, i) => `${i + 1}. ${f.displayName} (${f.format} · ${f.supportedVersion} · ${f.sizeFormatted})`
      ),
      '',
      'Contact: graphicsexpert65@gmail.com',
      '============================================================',
    ].join('\n');

    archive.append(licenseText, { name: 'GRAPHICS_EXPERT_LICENSE.txt' });
    archive.finalize();
  });

  // =========================================================
  // COUPONS, CUSTOM DESIGN REQUESTS & SUBMISSIONS
  // =========================================================
  app.get('/api/coupons/validate', (req, res) => {
    const code = String(req.query.code || '').trim().toUpperCase();
    const subtotal = Number(req.query.subtotal || 0);
    const db = loadDb();
    const found = db.coupons.find((c) => c.code.toUpperCase() === code && c.active);
    if (!found) {
      res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
      return;
    }
    if (subtotal < found.minOrder) {
      res.status(400).json({ success: false, message: `Minimum order for ${found.code} is $${found.minOrder}.` });
      return;
    }
    res.json({ success: true, coupon: found });
  });

  app.get('/api/admin/coupons', requireAdmin, (_req, res) => {
    const db = loadDb();
    res.json({ coupons: db.coupons });
  });

  app.post('/api/admin/coupons', requireAdmin, (req, res) => {
    const { code, discountType, value, minOrder, expiry } = req.body || {};
    if (!code || !value) {
      res.status(400).json({ error: 'Coupon code and discount value are required.' });
      return;
    }
    const db = loadDb();
    const cleanCode = String(code).trim().toUpperCase();
    if (db.coupons.some((c) => c.code === cleanCode)) {
      res.status(409).json({ error: 'Coupon code already exists.' });
      return;
    }
    const newCoupon: StoredCoupon = {
      id: 'cpn_' + crypto.randomUUID().slice(0, 6),
      code: cleanCode,
      discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
      value: Number(value),
      minOrder: Number(minOrder || 0),
      expiry: String(expiry || '2027-12-31'),
      active: true,
    };
    db.coupons.unshift(newCoupon);
    saveDb(db);
    res.status(201).json({ coupon: newCoupon });
  });

  app.delete('/api/admin/coupons/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    db.coupons = db.coupons.filter((c) => c.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
  });

  app.get('/api/custom-requests', requireAdmin, (_req, res) => {
    const db = loadDb();
    res.json({ customRequests: db.customRequests });
  });

  app.post('/api/custom-requests', (req, res) => {
    const { name, email, phone, designType, requiredSize, description, deadline, budget, referenceFileName } =
      req.body || {};
    if (!name || !email || !description) {
      res.status(400).json({ error: 'Name, email, and project description are required.' });
      return;
    }
    const db = loadDb();
    const id = 'REQ-' + Math.floor(100 + Math.random() * 900);
    const newReq: StoredCustomRequest = {
      id,
      name: String(name),
      email: String(email),
      phone: String(phone || ''),
      designType: String(designType || 'Custom'),
      requiredSize: String(requiredSize || ''),
      description: String(description),
      deadline: String(deadline || ''),
      budget: String(budget || ''),
      referenceFileName: referenceFileName ? String(referenceFileName) : undefined,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    db.customRequests.unshift(newReq);
    saveDb(db);
    res.status(201).json({ customRequest: newReq });
  });

  app.patch('/api/admin/custom-requests/:id', requireAdmin, (req, res) => {
    const { status } = req.body || {};
    const db = loadDb();
    const reqObj = db.customRequests.find((r) => r.id === req.params.id);
    if (!reqObj) {
      res.status(404).json({ error: 'Custom request not found.' });
      return;
    }
    reqObj.status = status;
    saveDb(db);
    res.json({ customRequest: reqObj });
  });

  // Designer submissions
  app.get('/api/designer-submissions', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = loadDb();
    const user = req.authUser!;
    const list =
      user.role === 'admin'
        ? db.designerSubmissions
        : db.designerSubmissions.filter((s) => s.designerId === user.id);
    res.json({ submissions: list });
  });

  app.post('/api/designer-submissions', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { title, category, price, fileFormats, dimensions, previewUrl } = req.body || {};
    const db = loadDb();
    const newSub: StoredDesignerSubmission = {
      id: 'SUB-' + Math.floor(100 + Math.random() * 900),
      designerId: req.authUser!.id,
      designerName: req.authUser!.name,
      title: String(title || 'Untitled Design'),
      category: String(category || 'CorelDRAW Designs'),
      price: Number(price || 5),
      fileFormats: Array.isArray(fileFormats) ? fileFormats : ['CDR'],
      dimensions: String(dimensions || 'Standard'),
      status: 'Pending Review',
      previewUrl: String(previewUrl || ''),
      submittedAt: new Date().toISOString(),
    };
    db.designerSubmissions.unshift(newSub);
    saveDb(db);
    res.status(201).json({ submission: newSub });
  });

  app.patch('/api/admin/designer-submissions/:id', requireAdmin, (req, res) => {
    const { status, reviewNote } = req.body || {};
    const db = loadDb();
    const sub = db.designerSubmissions.find((s) => s.id === req.params.id);
    if (!sub) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }
    sub.status = status;
    sub.reviewNote = reviewNote;
    saveDb(db);
    res.json({ submission: sub });
  });

  // Multer error handler
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          error: `File exceeds the maximum upload limit of ${MAX_UPLOAD_SIZE_MB} MB.`,
        });
        return;
      }
      res.status(400).json({ error: `Upload error: ${err.message}` });
      return;
    }
    next(err);
  });

  // Vite / Static Frontend Serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Graphics Expert server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

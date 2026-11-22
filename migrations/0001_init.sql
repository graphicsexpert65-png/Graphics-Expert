-- Graphics Expert: initial D1 schema (single-owner marketplace)
-- Apply with:  npm run db:init   (or paste this file into the D1 console in the Cloudflare dashboard)
-- Safe to run more than once: every statement is IF NOT EXISTS / INSERT OR IGNORE.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon_name   TEXT NOT NULL DEFAULT 'Layers',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- A product is stored as one JSON document (`data`) plus a few indexed columns.
-- File records inside `data.files[]` hold private R2 keys and are never sent to browsers.
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'draft',
  category_id TEXT NOT NULL,
  featured    INTEGER NOT NULL DEFAULT 0,
  views       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);

CREATE TABLE IF NOT EXISTS custom_requests (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  phone          TEXT NOT NULL DEFAULT '',
  design_type    TEXT NOT NULL,
  required_size  TEXT NOT NULL DEFAULT '',
  description    TEXT NOT NULL,
  deadline       TEXT NOT NULL DEFAULT '',
  budget         TEXT NOT NULL DEFAULT '',
  reference_key  TEXT,
  reference_name TEXT,
  status         TEXT NOT NULL DEFAULT 'Pending',
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_requests_created ON custom_requests (created_at DESC);

-- Rate limiting for login and public form submissions
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket   TEXT PRIMARY KEY,
  count    INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO categories (id, name, slug, description, icon_name, sort_order) VALUES
  ('coreldraw-designs', 'CorelDRAW Designs', 'coreldraw-designs', 'Native editable .CDR vector layouts, print press curves, and multi-layer templates.', 'PenTool', 1),
  ('illustrator-designs', 'Adobe Illustrator Designs', 'illustrator-designs', 'Clean scalable .AI vector artwork, logos, packaging, and print stationery.', 'Layers', 2),
  ('photoshop-templates', 'Photoshop Templates', 'photoshop-templates', 'High-resolution layered .PSD and .PSB files with smart object placeholders.', 'Image', 3),
  ('eps-vector-designs', 'EPS Vector Designs', 'eps-vector-designs', 'Cross-compatible .EPS vector illustrations, badges, and ornamental frames.', 'Sparkles', 4),
  ('business-cards', 'Business Cards', 'business-cards', 'Single and double-sided visiting cards with spot UV and cutting bleed marks.', 'CreditCard', 5),
  ('wedding-nikkah-cards', 'Wedding & Nikkah Cards', 'wedding-nikkah-cards', 'Royal Shadi, Walima, and Nikkah invitations with laser die-cut and foil layers.', 'HeartHandshake', 6),
  ('restaurant-menus', 'Restaurant Menus', 'restaurant-menus', 'Bi-fold, tri-fold, tabletop, and digital board food & cafe menu templates.', 'UtensilsCrossed', 7),
  ('panaflex-flex-banners', 'Panaflex & Flex Banners', 'panaflex-flex-banners', 'Wide-format shop boards, outdoor hoardings, and frontlit/backlit flex banners.', 'Flag', 8),
  ('rollup-standee-designs', 'Roll-up Standee Designs', 'rollup-standee-designs', '2.5x6 ft and 3x6 ft exhibition standees and retail promotional displays.', 'Maximize2', 9),
  ('flyers-posters', 'Flyers & Posters', 'flyers-posters', 'Promotional handbills, event posters, A4/A5 flyers, and sale leaflets.', 'FileText', 10),
  ('bill-books', 'Bill Books', 'bill-books', 'Invoice pads, cash memos, receipt books, and commercial challan layouts.', 'Receipt', 11),
  ('brochures', 'Brochures', 'brochures', 'Company profiles, bi-fold, tri-fold, and multi-page corporate catalogs.', 'BookOpen', 12),
  ('islamic-designs', 'Islamic Designs', 'islamic-designs', 'Ramadan calendars, Eid Mubarak cards, Jalsa banners, and Arabic calligraphy.', 'Moon', 13),
  ('social-media-designs', 'Social Media Designs', 'social-media-designs', 'Instagram posts, Facebook ads, YouTube thumbnails, and WhatsApp promos.', 'Share2', 14);

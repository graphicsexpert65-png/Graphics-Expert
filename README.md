# Graphics Expert

A single-owner graphic design marketplace and services website.

- **Public site:** browse published designs, search, filter by category, download free designs, send a design brief, use free browser tools.
- **Owner dashboard (`/admin`):** upload and manage designs, categories and customer briefs. Only the owner can sign in.
- **No fake payments:** paid designs are listed with a price, but visitors are asked to contact the owner. There is no checkout until a real payment provider is connected.

Production: https://graphics-expert.pages.dev/ (Cloudflare Pages, deployed from the `cloudflare-free-migration` branch)

## Architecture

| Part | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 (single-page app) |
| Backend | Cloudflare Pages Functions in `functions/` (replaces the old Express server) |
| Database | Cloudflare D1, schema in `migrations/0001_init.sql` |
| File storage | Cloudflare R2: private bucket for original design files, `previews/` for public preview images and `briefs/` for customer reference images |
| Auth | PBKDF2 password hash in D1, signed expiring session tokens, login rate limiting |
| SEO | `functions/sitemap.xml.ts`, `functions/robots.txt.ts`, server-rendered meta tags for `/design/:slug` and `/category/:id` |

Original design files are never public. They are read from R2 only by the free-download route (price 0, published designs) or by the signed-in owner.

## One-time Cloudflare setup (owner actions)

The code cannot create Cloudflare resources for you. Do these once in the Cloudflare dashboard.

1. **Create the D1 database**: Storage & Databases → D1 → Create database, name it `graphics-expert-db`.
2. **Create the tables**: open the database → Console, paste the contents of `migrations/0001_init.sql` and run it. (Or, from a computer with Node: `npm run db:init`.) It is safe to run twice.
3. **Create the R2 bucket**: R2 → Create bucket, name it `graphics-expert-files`. Keep it private (do not enable public access).
4. **Bind them to the Pages project**: Workers & Pages → `graphics-expert` → Settings → Bindings.
   - D1 database binding: variable name `DB` → `graphics-expert-db`
   - R2 bucket binding: variable name `BUCKET` → `graphics-expert-files`
5. **Add variables and secrets**: Settings → Variables and Secrets (Production).

   | Name | Type | Value |
   |---|---|---|
   | `ADMIN_EMAIL` | Text | the owner's e-mail address (used to sign in) |
   | `ADMIN_PASSWORD` | **Secret** | a long unique password (12+ characters) for the first sign-in |
   | `SESSION_SECRET` | **Secret** | a random string of 64+ characters (`openssl rand -hex 32`) |
   | `SITE_URL` | Text (optional) | `https://graphics-expert.pages.dev` or your custom domain |
   | `MAX_UPLOAD_SIZE_MB` | Text (optional) | defaults to 90 (Cloudflare's free plan limit is 100 MB per request) |

6. **Redeploy** (Deployments → the latest deployment → Retry deployment). Bindings and variables only apply to new deployments.
7. **Check the setup**: open `https://<your-site>/api/health`. It should report the database, bucket, `SESSION_SECRET` and `ADMIN_EMAIL` as set.
8. **Sign in** at `https://<your-site>/admin` with `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then change the password under *Settings*.
9. **Submit the sitemap** in Google Search Console: `https://<your-site>/sitemap.xml`.

If a design brief or upload fails, the site shows the real error (for example "Server is not configured: DB binding missing") instead of a fake success message.

## Local development

```bash
npm install
npm run dev          # frontend only (the API is not available)
npm run pages:dev    # full stack with a local D1 + R2 via wrangler (needs .dev.vars, see .env.example)
```

## Checks

```bash
npm run lint         # TypeScript type-check of the app and the Functions
npm run build        # production build into dist/
npm run test:api     # 47 end-to-end API tests (D1 emulated with SQLite, R2 in memory)
```

GitHub Actions runs `lint`, `test:api` and `build` on every push to `cloudflare-free-migration`.

## Security notes

- No password or secret is stored in the repository or sent to the browser. The only secrets are Cloudflare environment variables.
- The first sign-in hashes `ADMIN_PASSWORD` into D1. After you change the password in the dashboard, the environment value is no longer used for sign-in.
- Every admin route verifies the session token on the server. The dashboard UI is only a convenience.
- Rotating `SESSION_SECRET` signs everyone out.

## Not included yet

- Online payments. Paid designs show contact instructions. Connecting a real payment provider is a separate project.
- Multi-designer marketplace. Only the owner can upload designs.

# Svivva

Svivva is the primary product app in this monorepo. It combines a Next.js
frontend, API routes, and shared business logic for SEO, growth automation,
Svivva Play, and marketplace tooling.

## Quick Start

1. Install dependencies:
   - `npm install`
2. Start Postgres (from monorepo root, one folder above `Svivva`):
   - `docker compose up -d postgres`
3. Copy `.env.example` to `.env` and set secrets (`NEXTAUTH_SECRET`, API keys). `DATABASE_URL` defaults match Docker (`svivva` / `svivva_local_dev`).
4. Apply the schema:
   - `npm run db:push`
5. Start development:
   - `npm run dev`

On macOS, if the dev server exits with `EADDRINUSE` on port 5000, AirPlay Receiver is usually using that port. Set `PORT=3000` and `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000` in `.env` (see `.env.example`).

## Core Scripts

- `npm run dev` - run local development server.
- `npm run build` - full self-hosted build (`next build` + `dist/` launcher). **Vercel** ignores this and runs `next build` only (see `vercel.json`).
- `npm run start` - run production build output.
- `npm run check` - run TypeScript checks.
- `npm run verify` - owner-note gate: `check` + `lint` + dummy-copy scan (see `scripts/owner-note-verify.mjs`). Runs automatically before `next build` via `npm run build:vercel` and `npm run build`.
- `npm run lint` - run ESLint checks.
- `npm run format:check` - check Prettier formatting.
- `npm run format` - write Prettier formatting.
- `npm run secrets:for-deploy` - print random `NEXTAUTH_SECRET` / `CRON_SECRET` / `ORBIT_INTERNAL_SECRET` for pasting into Vercel.

## Project Layout

- `app/` - App Router pages and API routes.
- `components/` - shared React components.
- `lib/` - domain logic, integrations, db helpers.
- `hooks/` - reusable client hooks.
- `shared/` - shared schema/types for cross-runtime usage.
- `docs/` - architecture and contributor docs.

See `docs/PROJECT_STRUCTURE.md` for conventions and where new files should go.

## Deploy on Vercel (short checklist)

GitHub only stores code; [Vercel](https://vercel.com) builds and hosts the Next.js app.

1. Push this repo to GitHub.
2. Vercel → **Add New… → Project** → **Import** your repo.
3. **Root Directory:** set to **`Svivva`** (required — do not leave blank).
4. Framework should detect **Next.js**. Build uses `vercel.json`: `npm ci` then `next build`.
5. **Environment variables** (Production — copy names from `.env.example`):
   - **`DATABASE_URL`** — hosted Postgres (e.g. Neon/Vercel Postgres).
   - **`NEXTAUTH_SECRET`** — long random string.
   - **`NEXT_PUBLIC_SITE_URL`** — `https://your-domain.com` (no trailing slash). Until you add a domain, you can use your `https://….vercel.app` URL.
   - **`CRON_SECRET`** — long random string (Vercel Cron calls `/api/cron/run-scheduled` with `Authorization: Bearer …`; without this, cron returns 401).
   - Add **`ORBIT_INTERNAL_SECRET`** if you use internal SEO/growth routes the same way as locally.
   - Stripe / OpenAI / OIDC keys as needed for those features.
6. **Deploy.** First deploy does **not** run `drizzle-kit push`. Against production Postgres run **`npm run db:push`** once from your machine (with prod `DATABASE_URL` in env), or apply migrations your platform supports.
7. Optional: **Settings → Domains** add `yourdomain.com`; put the DNS records Vercel shows into GoDaddy (apex **A** / **www** **CNAME**).

Repo layout reminder: this monorepo has other folders; only **`Svivva`** is configured for this Next+Vercel setup.

### GitHub Actions deploy (optional)

The repo includes **`.github/workflows/vercel-svivva-production.yml`**. It runs **`vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`** from this folder.

- Enable with GitHub repository variable **`VERCEL_CI_DEPLOY`** = **`true`** plus secrets **`VERCEL_TOKEN`**, **`VERCEL_ORG_ID`**, **`VERCEL_PROJECT_ID`** (see root **`README.md`** Path B).
- If you use **Vercel’s Git integration** instead, disable that workflow to avoid double deploys.

### Local CLI deploy (optional)

```bash
cd Svivva
npx vercel@53.3.1 login
npx vercel@53.3.1 link    # creates .vercel/project.json (gitignored)
npx vercel@53.3.1 deploy --prod
```

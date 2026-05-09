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
- `npm run build` - build production output.
- `npm run start` - run production build output.
- `npm run check` - run TypeScript checks.
- `npm run lint` - run ESLint checks.
- `npm run format:check` - check Prettier formatting.
- `npm run format` - write Prettier formatting.

## Project Layout

- `app/` - App Router pages and API routes.
- `components/` - shared React components.
- `lib/` - domain logic, integrations, db helpers.
- `hooks/` - reusable client hooks.
- `shared/` - shared schema/types for cross-runtime usage.
- `docs/` - architecture and contributor docs.

See `docs/PROJECT_STRUCTURE.md` for conventions and where new files should go.

## Production and a GoDaddy (or any) domain

GitHub stores your code; it does not host the public website by itself. Point your domain at a host (for example [Vercel](https://vercel.com)) and connect DNS at GoDaddy to that host.

1. Push this repo to GitHub (you already have the remote; `git push origin main`).
2. In Vercel: **Add New Project** → import the GitHub repo → set **Root Directory** to `Svivva` if you only deploy that app.
3. Copy environment variables from `Svivva/.env.example` into the Vercel project settings (production and preview as needed), including `DATABASE_URL`, `NEXTAUTH_*`, and `NEXT_PUBLIC_SITE_URL` (use your real site URL, e.g. `https://yourdomain.com`).
4. Deploy. Vercel will show a `*.vercel.app` URL.
5. In Vercel: **Project → Settings → Domains** → add `yourdomain.com` and `www.yourdomain.com`. Vercel shows the exact DNS records (usually apex **A** records to their IPs and **CNAME** for `www`).
6. In GoDaddy: **DNS** for the domain → add or edit those records to match Vercel. Propagation can take a few minutes to a few hours.

If you use another host (Netlify, Railway, etc.), the pattern is the same: deploy from GitHub there, then follow that provider’s DNS instructions in GoDaddy.

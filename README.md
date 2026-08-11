# ALL DE APPS IN ONE

Monorepo of multiple apps. The production-ready **Next.js** product lives in **`Svivva/`**.

## Monorepo layout

| Folder                                           | What it is                                       | Run locally                                                        |
| ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------ |
| **`Svivva/`**                                    | Main product (Next.js, deploy target for Vercel) | `npm run dev:svivva` from repo root, or `cd Svivva && npm run dev` |
| **`Ai-Tools-Hub/`**                              | pnpm workspace (AI tools hub + libs)             | `npm run dev:ai-tools-hub` (needs `pnpm install` in that folder)   |
| **`Pyracrypt/`**                                 | Crypto / cybersec app artifacts                  | `npm run dev:pyracrypt-web` / `dev:pyracrypt-api`                  |
| **`CYBER-SECURITY-MINI-APPS-zip/cyberwavy-hub`** | Vite hub for mini-apps                           | `npm run dev:mini-apps`                                            |
| **`docker-compose.yml`** (root)                  | Local Postgres for Svivva                        | `npm run db:up`                                                    |

Bulk vendor drops (`Ai-Tools-Hub/_uploaded_tools`, `Ai-Tools-Hub/artifacts`) are excluded from repo-wide Prettier; see **`.prettierignore`**.

**Heavy binaries:** `Ai-Tools-Hub/attached_assets/` and similar still contain large zips used by that workspace; do not duplicate them under **`Svivva/attached_assets/`** — Svivva keeps an **8-file allowlist** enforced in `npm run verify` (see **`Svivva/README.md`**).

## Repo-wide formatting

From the **repository root**:

```bash
npm install          # once — installs Prettier
npm run format       # write formatting (respects .prettierignore)
npm run format:check # CI-style check
```

**`Svivva`** also has its own `format` / `format:check`; `npm run verify` there includes Prettier + Vitest + the owner-note scan.

## Deploy Svivva (Netlify preferred while Vercel is paused)

Production domain: **`zzaizzai.com`**. Full cutover checklist: **`.cursor/CONNECT.md`**.

### Path N — Netlify (recommended right now)

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → import this GitHub repo.
2. **Base / Package directory:** **`Svivva`** (required). Build uses `Svivva/netlify.toml`.
3. Add env vars from **`Svivva/.env.example`** (at least `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `ORBIT_INTERNAL_SECRET`, `ADMIN_USER_ID`).
4. **Deploy**, confirm the `*.netlify.app` URL works, then add **`zzaizzai.com`** + **`www`** under Domain management and update **GoDaddy DNS** to Netlify’s records.

Scheduled SEO/growth/autopilot jobs live in **`Svivva/netlify/functions/`** (need `CRON_SECRET`).

### Path A — Vercel imports GitHub

Use when the Vercel team is **Active** again (not `DEPLOYMENT_DISABLED`).

1. [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
2. **Root Directory:** **`Svivva`** (required).
3. Add env vars from **`Svivva/.env.example`** — see **`Svivva/README.md`**.
4. **Deploy.** Do **not** also enable Path B for the same production site.

### Path B — GitHub Actions (`vercel deploy --prebuilt`)

Optional CI deploy. Secrets: **`VERCEL_TOKEN`**, **`VERCEL_ORG_ID`**, **`VERCEL_PROJECT_ID`**. Variable: **`VERCEL_CI_DEPLOY=true`**. See **`.github/workflows/vercel-svivva-production.yml`**. Do not run Path A and Path B together.

### Secrets helper

```bash
cd Svivva && npm run secrets:for-deploy
```

Paste into the **Netlify** (or Vercel) env UI.
# ALL DE APPS IN ONE

Monorepo of multiple apps. The production-ready **Next.js** product lives in **`Svivva/`**.

## Monorepo layout

| Folder                                           | What it is                                       | Run locally                                                        |
| ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------ |
| **`Svivva/`**                                    | Main product (Next.js, production deploy target) | `npm run dev:svivva` from repo root, or `cd Svivva && npm run dev` |
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

## Deploy Svivva (Netlify + Origin)

Production domain: **`zzaizzai.com`**.

| Layer | Service | Notes |
| --- | --- | --- |
| **Git** | [Cursor Origin](https://cursor.com/codebase) (optional) + GitHub sync | See **`docs/ORIGIN_HOSTING.md`** |
| **Host** | **Netlify** (recommended) | Base directory **`Svivva`**, config in `Svivva/netlify.toml` |
| **DNS** | GoDaddy → Netlify | **`.cursor/CONNECT.md`** |

### Path N — Netlify (recommended)

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → import **`pipertzion2-dev/all-de-apps-in-one`**
2. **Base / Package directory:** **`Svivva`**
3. Env vars from **`Svivva/.env.example`** — include **`GOOGLE_GSC_CLIENT_ID`** + **`GOOGLE_GSC_CLIENT_SECRET`**
4. Deploy → add **`zzaizzai.com`** → update GoDaddy DNS to Netlify

Scheduled jobs: **`Svivva/netlify/functions/`** (needs **`CRON_SECRET`**).

### Path V — Vercel (optional, when account is active)

Team **`zzai-zzai`**, project **`all-de-apps-in-one`**, root **`Svivva`**. Do **not** use **`svivva-main-app`**. See **`docs/VERCEL_ACCOUNT.md`**. Do not run Vercel Git + GitHub Actions deploy together.

### Secrets helper

```bash
cd Svivva && npm run secrets:for-deploy
```

Paste into **Netlify** (or Vercel) env UI.

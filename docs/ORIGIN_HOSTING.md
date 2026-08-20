# Cursor Origin + Vercel production

**Origin** is Cursor’s git platform ([cursor.com/codebase](https://cursor.com/codebase)). **Vercel** hosts the live site at `zzaizzai.com`.

## Stack

| Layer | Service | What it does |
| --- | --- | --- |
| Edit | Cursor IDE | Write code |
| Git (optional) | **Cursor Origin** | Host repo, PRs, sync with GitHub |
| Git (mirror) | **GitHub** | `pipertzion2-dev/all-de-apps-in-one` |
| Production | **Vercel** | team **zzai-zzai**, project **all-de-apps-in-one**, root **`Svivva`** |
| DNS | GoDaddy | Points domain at Vercel |

Canonical Vercel config: **`Svivva/vercel-canonical.json`**. Full checklist: **`.cursor/CONNECT.md`**.

## 1. Claim Origin codebase (optional)

1. [cursor.com/codebase](https://cursor.com/codebase) (paid Cursor plan)
2. Sync **`all-de-apps-in-one`** from GitHub or push a new repo
3. Edit in Cursor → push to Origin (syncs to GitHub)

## 2. Deploy on Vercel

### Path A — Vercel Git (simplest)

1. [vercel.com](https://vercel.com) as **ziontpiper@icloud.com** → team **zzai-zzai** → **all-de-apps-in-one**
2. **Root Directory:** **`Svivva`**
3. **Settings → Environment Variables → Production** — include:
   - `NEXT_PUBLIC_SITE_URL=https://zzaizzai.com`
   - `GOOGLE_GSC_CLIENT_ID` + `GOOGLE_GSC_CLIENT_SECRET` (for Connect Google)
   - `DATABASE_URL`, `NEXTAUTH_SECRET`, Stripe keys, etc. (`Svivva/.env.example`)
4. **Deploy** (or push to `main` if Git integration is connected)

### Path B — Origin repo → Vercel

From an Origin repo’s **Apps** tab in Cursor, connect **Vercel**. PRs get preview deploys; merge to production branch ships to production. Same env vars as Path A.

### Path C — GitHub Actions

See root **`README.md`** Path B and **`.github/workflows/vercel-svivva-production.yml`**. Do not run Path A and Path C together.

## 3. Connect Vercel from Origin (if using Origin git)

1. Open your repo on [cursor.com/codebase](https://cursor.com/codebase)
2. **Apps** → add **Vercel** → select team **zzai-zzai** / project **all-de-apps-in-one**
3. Ensure **Root Directory = `Svivva`**

Or connect from [vercel.com/new](https://vercel.com/new) → **Continue with Origin**.

## 4. Google OAuth

After Vercel deploy:

1. Google Cloud → redirect URI: `https://zzaizzai.com/api/gsc/oauth/callback`
2. Set credentials in **Vercel env** or paste at `/dashboard/gsc-connect` (admin **272727**)
3. **Connect with Google**

## Do not use

- **`svivva-main-app`** — wrong Vercel project ([docs/VERCEL_ACCOUNT.md](../docs/VERCEL_ACCOUNT.md))
- Dual-pointing `zzaizzai.com` at multiple hosts

## Verify

```bash
curl -sI https://zzaizzai.com | grep -i server
# expect: server: Vercel
```

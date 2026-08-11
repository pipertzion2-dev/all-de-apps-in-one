# Cursor Origin + Netlify production

**Origin** is Cursor’s git platform ([cursor.com/codebase](https://cursor.com/codebase)). It stores your repo and PRs — it does **not** serve the public website. **Netlify** hosts `zzaizzai.com`.

## Stack

| Layer | Service | What it does |
| --- | --- | --- |
| Edit | Cursor IDE | Write code |
| Git (optional) | **Cursor Origin** | Host repo, PRs, sync with GitHub |
| Git (mirror) | **GitHub** | `pipertzion2-dev/all-de-apps-in-one` — Netlify imports from here |
| Production | **Netlify** | Builds & serves `Svivva/` at `zzaizzai.com` |
| DNS | GoDaddy | Points domain at Netlify |

Canonical Netlify config: **`Svivva/netlify-canonical.json`**

## 1. Claim Origin codebase (one-time)

1. Open [cursor.com/codebase](https://cursor.com/codebase) (paid Cursor plan)
2. Claim your codebase name
3. **New repo** or **Sync from GitHub** → select `all-de-apps-in-one`
4. Push from Cursor or use the Origin CLI shown in the UI

Origin and GitHub stay in sync — pushes to either side update the other when sync is enabled.

## 2. Connect Netlify (production host)

Netlify currently deploys from **GitHub**, not Origin directly:

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → GitHub → `pipertzion2-dev/all-de-apps-in-one`
2. **Base directory:** `Svivva`
3. Add env vars (see **`.cursor/CONNECT.md`**) — **required for Google connect:**
   - `GOOGLE_GSC_CLIENT_ID`
   - `GOOGLE_GSC_CLIENT_SECRET`
   - `NEXT_PUBLIC_SITE_URL=https://zzaizzai.com`
   - `DATABASE_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, etc.
4. Deploy → add custom domain → update GoDaddy DNS

Every merge to `main` on GitHub triggers a Netlify production deploy (if auto-publish is on).

## 3. Workflow with Origin

```
Edit in Cursor → commit → push to Origin (syncs to GitHub) → Netlify auto-deploys
```

Or push to GitHub directly — same result for Netlify.

## 4. Google OAuth on Netlify

After Netlify deploy is live:

1. Google Cloud Console → OAuth redirect: `https://zzaizzai.com/api/gsc/oauth/callback`
2. Set credentials in **Netlify env** **or** paste at `/dashboard/gsc-connect` (admin 272727)
3. Connect Google

## 5. Vercel (optional)

You can connect Vercel to an **Origin repo** from the repo’s **Apps** tab in Cursor — but if Vercel deploys are blocked, use **Netlify only**. Never point `zzaizzai.com` at two hosts.

## Verify

```bash
curl -sI https://zzaizzai.com | grep -iE 'server|netlify|x-nf'
```

You should **not** see `x-vercel-error: DEPLOYMENT_DISABLED`.

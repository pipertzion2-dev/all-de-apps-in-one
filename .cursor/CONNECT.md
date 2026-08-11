# Connect zzaizzai.com (GoDaddy → Netlify)

**Production host is Netlify** (`Svivva/netlify.toml`). Cursor **Origin** can hold your git repo; Netlify serves the live site. GoDaddy DNS points at Netlify.

| Piece | Role |
| --- | --- |
| **Cursor / Origin** | Edit code, PRs, optional git host ([cursor.com/codebase](https://cursor.com/codebase)) |
| **GitHub** | Sync mirror (Netlify imports from here today) |
| **Netlify** | Hosts the live Next.js app — **Base directory = `Svivva`** |
| **GoDaddy** | DNS for `zzaizzai.com` → Netlify |

| What | Value |
| --- | --- |
| Domain | `zzaizzai.com` |
| Host | **Netlify** (not Vercel while deploys are blocked) |
| GitHub repo | `pipertzion2-dev/all-de-apps-in-one` |
| App root on Netlify | **Base / Package directory = `Svivva`** |

See also: **`docs/ORIGIN_HOSTING.md`** (Origin git + Netlify deploy), **`docs/VERCEL_ACCOUNT.md`** (optional Vercel later).

## 1. Create the Netlify site

1. Open [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → GitHub
2. Select **`pipertzion2-dev/all-de-apps-in-one`**
3. Set:
   - **Base directory:** `Svivva`
   - **Build command:** `npm run build:vercel` (from `netlify.toml`)
   - **Publish directory:** `.next`
4. **Add environment variables** (Site configuration → Environment variables). Minimum:

```bash
NEXT_PUBLIC_SITE_URL=https://zzaizzai.com
DATABASE_URL=           # production Postgres URL
NEXTAUTH_SECRET=        # npm run secrets:for-deploy in Svivva/
CRON_SECRET=
ORBIT_INTERNAL_SECRET=
ADMIN_USER_ID=

# Google Search Console OAuth (required for Connect Google)
GOOGLE_GSC_CLIENT_ID=
GOOGLE_GSC_CLIENT_SECRET=
```

Also copy Stripe, OpenAI/Gemini, etc. from `Svivva/.env.example`.  
**Or** paste Google OAuth client ID + secret in-app at `/dashboard/gsc-connect` after deploy (saved to DB — no redeploy needed).

5. **Deploy site.** Confirm the `*.netlify.app` URL returns HTTP 200.

### Secrets helper

```bash
cd Svivva && npm run secrets:for-deploy
```

## 2. Add the custom domain on Netlify

1. Site → **Domain management** → **Add a domain** → `zzaizzai.com`
2. Add **`www.zzaizzai.com`**
3. Copy DNS records Netlify shows:

| Host | Type | Value |
| --- | --- | --- |
| `@` (apex) | **A** | confirm in Netlify UI (often `75.2.60.5`) |
| `www` | **CNAME** | `<your-site>.netlify.app` |

## 3. Point GoDaddy at Netlify

1. GoDaddy → **My Products → Domains → zzaizzai.com → DNS**
2. Remove Vercel / Replit / parking **A** / **CNAME** for `@` and `www`
3. Add Netlify records from step 2
4. Wait for DNS + SSL (minutes to 48h)

## 4. Google OAuth (fix “not configured” error)

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Web client
2. Redirect URI: `https://zzaizzai.com/api/gsc/oauth/callback`
3. Enable **Search Console API** + **Web Search Indexing API**
4. Add `GOOGLE_GSC_CLIENT_ID` + `GOOGLE_GSC_CLIENT_SECRET` in **Netlify env**, redeploy  
   **or** paste in **https://zzaizzai.com/dashboard/gsc-connect** (admin code 272727)
5. Connect Google as **pipertzion2@gmail.com**

Also update: Stripe webhook, GSC redirect (same domain), Search Console property.

## 5. Optional: Vercel later

Do **not** point `zzaizzai.com` at both Netlify and Vercel. When Vercel is active again, pick one host. See `docs/VERCEL_ACCOUNT.md`.

## Verify

```bash
curl -sI https://zzaizzai.com | head -15
curl -sL https://zzaizzai.com/sitemap.xml | head -20
```

Expect Netlify (or your HTML), not `x-vercel-error: DEPLOYMENT_DISABLED`.

## Quick problems

- **Raw JSON “Google OAuth not configured”:** add `GOOGLE_GSC_CLIENT_ID` + `SECRET` in Netlify env or paste on `/dashboard/gsc-connect`.
- **Domain still on Vercel / 402:** GoDaddy DNS still points at Vercel — fix to Netlify.
- **Build fails on peer deps:** `Svivva/.npmrc` sets `legacy-peer-deps=true`.
- **Cron 401:** set `CRON_SECRET` in Netlify env (`Svivva/netlify/functions/`).

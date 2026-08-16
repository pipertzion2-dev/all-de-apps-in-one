# Connect zzaizzai.com (GoDaddy → Netlify)

Vercel is currently returning **402 DEPLOYMENT_DISABLED** for this project. Production cutover target is **Netlify** (config in `Svivva/netlify.toml`). Cursor cannot host the public site.

| Piece | Role |
| --- | --- |
| **Cursor** | Edit code, commit, push |
| **Netlify** | Hosts the live Next.js app (`Svivva/` base directory) |
| **GoDaddy** | DNS for `zzaizzai.com` → Netlify |

| What | Value |
| --- | --- |
| Domain | `zzaizzai.com` |
| Host | Netlify |
| GitHub repo | `pipertzion2-dev/all-de-apps-in-one` |
| App root on Netlify | **Base / Package directory = `Svivva`** |

## 1. Create the Netlify site

1. Open [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → GitHub
2. Select **`pipertzion2-dev/all-de-apps-in-one`**
3. Set:
   - **Base directory:** `Svivva`
   - **Build command:** `npm run build:vercel` (from `netlify.toml`)
   - **Publish directory:** `.next`
4. **Add environment variables** (Site configuration → Environment variables) before or right after the first deploy. Minimum:

```bash
NEXT_PUBLIC_SITE_URL=https://zzaizzai.com
DATABASE_URL=           # your production Postgres URL
NEXTAUTH_SECRET=        # long random — npm run secrets:for-deploy in Svivva/
CRON_SECRET=
ORBIT_INTERNAL_SECRET=
ADMIN_USER_ID=          # your owner account id(s)
```

Also copy any keys you already use (Stripe, Gemini/OpenAI, GSC OAuth, etc.) from `Svivva/.env.example`.

5. **Deploy site.** Wait until the deploy is **Published** and open the `*.netlify.app` URL — it should return HTTP 200 (not Vercel’s 402).

### Secrets helper

```bash
cd Svivva && npm run secrets:for-deploy
```

## 2. Add the custom domain on Netlify

1. Site → **Domain management** → **Add a domain** → `zzaizzai.com`
2. Add **`www.zzaizzai.com`** as well (Netlify can redirect www ↔ apex)
3. Copy the DNS records Netlify shows. Typical external DNS:

| Host | Type | Value |
| --- | --- | --- |
| `@` (apex) | **A** | `75.2.60.5` (confirm in Netlify UI) |
| `www` | **CNAME** | `<your-site>.netlify.app` (confirm in Netlify UI) |

## 3. Point GoDaddy at Netlify

1. GoDaddy → **My Products → Domains → zzaizzai.com → DNS**
2. Remove Vercel / Replit / parking **A** / **CNAME** records for `@` and `www` (and any old `cname.vercel-dns.com`)
3. Add the Netlify records from step 2
4. Wait for DNS (often minutes; up to 48h). Netlify should show the domain as **Netlify DNS** / SSL provisioned when ready.

## 4. After the domain is live

Update anything that still points at the old host:

- **Stripe** webhook: `https://zzaizzai.com/api/stripe/webhook`
- **GSC OAuth** redirect: `https://zzaizzai.com/api/gsc/oauth/callback`
- Auth / OIDC callback URLs if you use them
- Redeploy on Netlify after env changes

In-app: Dashboard → Marketing / Connections → domain `zzaizzai.com`, reconnect GSC, submit sitemap.

## 5. Optional: keep Vercel later

You can leave the paused Vercel project alone. When Pro is active again you may delete or pause it so you do not run two production hosts. Do **not** point `zzaizzai.com` at both Netlify and Vercel.

## Verify

```bash
curl -sI https://zzaizzai.com | head -15
curl -sL https://zzaizzai.com/sitemap.xml | head -20
```

Expect **Netlify** headers (or your site HTML), not `x-vercel-error: DEPLOYMENT_DISABLED`.

## Quick problems

- **Build fails on peer deps:** `Svivva/.npmrc` already sets `legacy-peer-deps=true`.
- **Domain still 402 / Vercel:** GoDaddy still points at Vercel — fix DNS to Netlify.
- **SSL pending:** DNS not fully pointing at Netlify yet.
- **Cron 401:** set `CRON_SECRET` in Netlify env (scheduled functions in `Svivva/netlify/functions/`).

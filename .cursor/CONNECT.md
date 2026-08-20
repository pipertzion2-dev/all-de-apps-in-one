# Connect zzaizzai.com (GoDaddy → Vercel)

## Important

**Your domain cannot point at Cursor.** Cursor is an editor. The public site runs on **Vercel**. GoDaddy only holds DNS that points at that host.

| Piece | Role |
| --- | --- |
| **Cursor / Origin** | Edit code, commit, push (optional git host — see `docs/ORIGIN_HOSTING.md`) |
| **Vercel** | Hosts the live Next.js app (`Svivva/` root directory) |
| **GoDaddy** | DNS for `zzaizzai.com` → Vercel |

## Your values

| What | Value |
| --- | --- |
| Domain | `zzaizzai.com` |
| Host | Vercel team **zzai-zzai**, project **all-de-apps-in-one** (`ziontpiper@icloud.com`) — not `svivva-main-app` ([disconnect wrong project](../docs/VERCEL_ACCOUNT.md)) |
| GitHub repo | `pipertzion2-dev/all-de-apps-in-one` |
| App root on Vercel | `Svivva` |

## One-command cutover (after this code is deployed)

From `Svivva/` (uses GoDaddy keys already saved in the dashboard + admin passcode):

```bash
npm run domain:cutover
# or: node scripts/domain-cutover.mjs --domain zzaizzai.com
```

That sets GoDaddy `@` → Vercel A (`76.76.21.21`) and `www` → `cname.vercel-dns.com`, updates app credentials, and adds the domain in Vercel when `VERCEL_TOKEN` + `VERCEL_PROJECT_ID` are present.

### Manual checklist (if the CLI can’t reach GoDaddy / Vercel)

### 1. Vercel — add the domain

1. Open [vercel.com](https://vercel.com) as **ziontpiper@icloud.com** → team **zzai-zzai** → **all-de-apps-in-one** → **Settings → Domains**
2. Add **`zzaizzai.com`** and **`www.zzaizzai.com`**
3. Copy the DNS records Vercel shows (usually):
   - Apex `zzaizzai.com`: **A** → `76.76.21.21` (confirm in Vercel UI)
   - `www`: **CNAME** → `cname.vercel-dns.com` (confirm in Vercel UI)

### 2. GoDaddy — point DNS at Vercel

1. GoDaddy → **My Products → Domains → zzaizzai.com → DNS**
2. Remove old Replit / parking / conflicting **A** / **CNAME** records for `@` and `www`
3. Add the records Vercel gave you
4. Wait for DNS (often minutes; can take up to 48h)

### 3. Vercel — production env

Set (or update) these for **Production**:

```bash
NEXT_PUBLIC_SITE_URL=https://zzaizzai.com

# Required for Connect Google (Search Console)
GOOGLE_GSC_CLIENT_ID=
GOOGLE_GSC_CLIENT_SECRET=
```

Also copy Stripe, `DATABASE_URL`, `NEXTAUTH_SECRET`, etc. from `Svivva/.env.example`.

**Alternative:** paste Google OAuth client ID + secret in-app at `/dashboard/gsc-connect` (admin code 272727) — saved to DB, no redeploy needed for those two keys.

Also update anything that embeds the old domain:

- **Stripe** webhook: `https://zzaizzai.com/api/stripe/webhook`
- **GSC OAuth** redirect: `https://zzaizzai.com/api/gsc/oauth/callback`
- **Auth / OIDC** callback URLs if you use them
- Redeploy after env changes

### 4. Google OAuth (fix “not configured” JSON error)

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Web client
2. Redirect URI: `https://zzaizzai.com/api/gsc/oauth/callback`
3. Enable **Search Console API** + **Web Search Indexing API**
4. Add `GOOGLE_GSC_CLIENT_ID` + `GOOGLE_GSC_CLIENT_SECRET` in Vercel → **Settings → Environment Variables → Production**, then redeploy  
   **or** paste on `/dashboard/gsc-connect` after deploy
5. Admin code **272727** → **Connect with Google** → sign in as **pipertzion2@gmail.com**

### 5. In-app Marketing → Traffic Setup

1. Sign in as admin → **Dashboard → Marketing** (or Connections Hub)
2. Set **GoDaddy domain** to `zzaizzai.com`
3. Paste GoDaddy API key + secret ([developer.godaddy.com/keys](https://developer.godaddy.com/keys))
4. Set **Google site URL** to `https://zzaizzai.com` (or `sc-domain:zzaizzai.com`)
5. Reconnect GSC / submit sitemap for the **new** property

### 6. Search Console + Analytics

1. Add `zzaizzai.com` (or domain property) in [Google Search Console](https://search.google.com/search-console)
2. Verify ownership (DNS TXT or HTML tag → `GOOGLE_SITE_VERIFICATION`)
3. Submit `https://zzaizzai.com/sitemap.xml`
4. In GA4, add `zzaizzai.com` as a data stream / allowed domain if needed

### 7. Optional: keep svivva.com

If you still own `svivva.com`, in Vercel add it as a domain and set a **301 redirect** to `zzaizzai.com` so old links and SEO equity move over.

## Verify

```bash
curl -sI https://zzaizzai.com | head -15
curl -sL https://zzaizzai.com/sitemap.xml | head -20
```

You should see Vercel headers and sitemap URLs under `https://zzaizzai.com/...`.

## Quick problems

- **Raw JSON “Google OAuth not configured”:** add `GOOGLE_GSC_CLIENT_ID` + `SECRET` in Vercel env or paste on `/dashboard/gsc-connect`.
- **Domain still shows parking / old host**: GoDaddy DNS not updated or not propagated yet.
- **SSL pending on Vercel**: DNS not pointing at Vercel yet — wait until Vercel shows the domain as Valid.
- **Wrong Vercel project**: use **all-de-apps-in-one** on team **zzai-zzai**, not `svivva-main-app`.

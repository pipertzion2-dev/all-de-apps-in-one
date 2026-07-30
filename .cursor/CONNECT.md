# Connect zzaizzai.com (GoDaddy → Vercel)

## Important

**Your domain cannot point at Cursor.** Cursor is an editor. The public site runs on **Vercel** (or another host). GoDaddy only holds DNS that points at that host.

| Piece | Role |
| --- | --- |
| **Cursor** | Edit code, commit, push |
| **Vercel** | Hosts the live Next.js app (`Svivva/` root directory) |
| **GoDaddy** | DNS for `zzaizzai.com` → Vercel |

## Your values

| What | Value |
| --- | --- |
| Domain | `zzaizzai.com` |
| Host | Vercel |
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

1. Open [vercel.com](https://vercel.com) → your Svivva project → **Settings → Domains**
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
```

Also update anything that embeds the old domain:

- **Stripe** webhook: `https://zzaizzai.com/api/stripe/webhook`
- **GSC OAuth** redirect: `https://zzaizzai.com/api/gsc/oauth/callback`
- **Auth / OIDC** callback URLs if you use them
- Redeploy after env changes

### 4. In-app Marketing → Traffic Setup

1. Sign in as admin → **Dashboard → Marketing** (or Connections Hub)
2. Set **GoDaddy domain** to `zzaizzai.com`
3. Paste GoDaddy API key + secret ([developer.godaddy.com/keys](https://developer.godaddy.com/keys))
4. Set **Google site URL** to `https://zzaizzai.com` (or `sc-domain:zzaizzai.com`)
5. Reconnect GSC / submit sitemap for the **new** property

### 5. Search Console + Analytics

1. Add `zzaizzai.com` (or domain property) in [Google Search Console](https://search.google.com/search-console)
2. Verify ownership (DNS TXT or HTML tag → `GOOGLE_SITE_VERIFICATION`)
3. Submit `https://zzaizzai.com/sitemap.xml`
4. In GA4, add `zzaizzai.com` as a data stream / allowed domain if needed

### 6. Optional: keep svivva.com

If you still own `svivva.com`, in Vercel add it as a domain and set a **301 redirect** to `zzaizzai.com` so old links and SEO equity move over.

## Verify

```bash
curl -sI https://zzaizzai.com | head -15
curl -sL https://zzaizzai.com/sitemap.xml | head -20
```

You should see Vercel headers and sitemap URLs under `https://zzaizzai.com/...`.

## Quick problems

- **Domain still shows parking / old host**: GoDaddy DNS not updated or not propagated yet.
- **SSL pending on Vercel**: DNS not pointing at Vercel yet — wait until Vercel shows the domain as Valid.
- **“I want it only in Cursor”**: Local `localhost` is fine for development; the public domain always needs Vercel (or another host).

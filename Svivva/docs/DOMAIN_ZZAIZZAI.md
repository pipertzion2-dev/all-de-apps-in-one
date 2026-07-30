# Domain cutover: zzaizzai.com

Production canonical URL is **`https://zzaizzai.com`**.

## Automatic cutover

Once this code is on the live host:

```bash
cd Svivva
npm run domain:cutover
```

Uses GoDaddy keys from Marketing → Traffic Setup to set:

- `@` **A** → `76.76.21.21` (Vercel)
- `www` **CNAME** → `cname.vercel-dns.com`

Also updates `seed_credentials` + platform site URL. Adds the domain in Vercel when `VERCEL_TOKEN` + `VERCEL_PROJECT_ID` are set.

API: `POST /api/orbit/domain-cutover` `{ "domain": "zzaizzai.com" }`

## Env

```bash
NEXT_PUBLIC_SITE_URL=https://zzaizzai.com
```

Full DNS + Vercel checklist: [`.cursor/CONNECT.md`](../../.cursor/CONNECT.md).

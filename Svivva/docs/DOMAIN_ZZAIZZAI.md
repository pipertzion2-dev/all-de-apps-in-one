# Domain cutover: zzaizzai.com

Production canonical URL is **`https://zzaizzai.com`**.

While Vercel returns **DEPLOYMENT_DISABLED**, point the domain at **Netlify** instead. Step-by-step: [`.cursor/CONNECT.md`](../../.cursor/CONNECT.md).

## Env

```bash
NEXT_PUBLIC_SITE_URL=https://zzaizzai.com
```

## Automatic cutover (Vercel DNS helpers)

`npm run domain:cutover` still targets **Vercel** A/CNAME records. Use it only after Vercel is healthy again. For Netlify, set GoDaddy records from the Netlify Domain management UI (documented in CONNECT.md).

API: `POST /api/orbit/domain-cutover` `{ "domain": "zzaizzai.com" }` (Vercel path).

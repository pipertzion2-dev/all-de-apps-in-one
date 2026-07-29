# Domain cutover: zzaizzai.com

Production canonical URL is **`https://zzaizzai.com`**.

Code defaults (`getSiteUrl()`, sitemaps, Orbit CLI, Stripe return URLs, etc.) use this host when `NEXT_PUBLIC_SITE_URL` is unset. **Always set the env var on Vercel** so deploys stay explicit:

```bash
NEXT_PUBLIC_SITE_URL=https://zzaizzai.com
```

## Host vs registrar

- **Vercel** hosts the app (project root directory = `Svivva`).
- **GoDaddy** only provides DNS for `zzaizzai.com`.
- **Cursor** does not host the site and cannot be a DNS target.

Full steps: [`.cursor/CONNECT.md`](../../.cursor/CONNECT.md).

## After DNS is live

1. Redeploy so sitemaps/canonicals rebuild with the new host.
2. Run Orbit: Traffic Setup → GSC connect → IndexNow / sitemap submit.
3. Update Stripe webhook + GSC OAuth redirect to `zzaizzai.com`.
4. If keeping `svivva.com`, 301 redirect it to `zzaizzai.com` in Vercel.

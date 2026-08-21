# Orbit SEO & Indexing Manager

## What it does

When mini-apps are published in Orbit, they get:

- Public URL: `https://{domain}/apps/{slug}`
- Crawlable landing + interactive tool link on the same URL
- SEO metadata (title, description, canonical, OG, robots, JSON-LD)
- Sitemap inclusion (`/sitemap.xml` apps chunk)
- Indexing status board + pre-publish checks
- Opportunities from stored Search Console snapshots
- Optional Ahrefs layer (not required for indexing)

## Setup

1. Apply migration:

```bash
psql "$DATABASE_URL" -f migrations/006_orbit_seo_indexing.sql
```

2. Environment variables:

| Variable                                   | Required    | Purpose                                                             |
| ------------------------------------------ | ----------- | ------------------------------------------------------------------- |
| `ORBIT_SEO_SECRETS_KEY`                    | Recommended | 32-byte hex or passphrase for encrypting GSC/Ahrefs secrets at rest |
| `GOOGLE_GSC_CLIENT_ID`                     | For GSC     | Existing Orbit GSC OAuth client                                     |
| `GOOGLE_GSC_CLIENT_SECRET`                 | For GSC     | Existing Orbit GSC OAuth secret                                     |
| `AHREFS_API_KEY`                           | Optional    | Premium Ahrefs intelligence                                         |
| `ADMIN_USER_ID` / `ORBIT_INTERNAL_USER_ID` | Recommended | Workspace id for SEO jobs                                           |
| `CRON_SECRET`                              | For cron    | Existing scheduled SEO jobs                                         |

3. Connect Search Console: `/dashboard/gsc-connect` (Orbit does **not** iframe GSC).

4. Open manager: `/dashboard/orbit/seo` or Orbit Admin launchpad → SEO & Indexing.

5. Click **Sync curated apps** then **Run SEO jobs**.

## Flow

Create Mini-App → SEO Validation → Publish → Public URL → Internal Links (`/apps`) → Sitemap → Google Discovery → GSC Snapshots → Orbit Analysis → Recommendations

## Notes

- Orbit never labels a page “Google Indexed” unless verified from an appropriate Google-supported source.
- Unpublished/private apps are removed from the sitemap and set to `noindex`.
- `/apps/` is never blocked in `robots.txt`.

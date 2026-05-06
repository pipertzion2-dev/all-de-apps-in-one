# Svivva SEO Pack (Replit Import)

This package is pre-structured for a Next.js App Router project.

## 1) Import into Replit

1. Upload this zip to your Replit project.
2. Extract it at the project root.
3. Copy/merge each folder into your app root:
   - `app/`
   - `lib/`
   - `scripts/`

## 2) Files included

- `app/layout.tsx`
- `app/robots.ts`
- `app/sitemap.xml/route.ts`
- `app/sitemaps/[id].xml/route.ts`
- `app/blog/page.tsx`
- `app/blog/[slug]/page.tsx`
- `lib/seo.ts`
- `lib/sitemap-data.ts`
- `scripts/seo-audit.ts`
- `NEXT_PROMPT_SEO_OPS.txt`
- `POST_IMPORT_VALIDATION_COMMANDS.sh`
- `HYBRID_MARKETING_OPERATING_SYSTEM.md`

## 3) Install dependencies

```bash
npm install fast-xml-parser cheerio robots-parser
```

If `tsx` is not already available in your project:

```bash
npm install -D tsx
```

## 4) Required environment variable

Set this in Replit Secrets:

`NEXT_PUBLIC_SITE_URL=https://svivva.com`

## 5) Validate after deploy

- `https://svivva.com/robots.txt` returns 200
- `https://svivva.com/sitemap.xml` returns 200
- `https://svivva.com/sitemaps/1.xml` returns 200
- Canonical is self-referencing on:
  - homepage
  - `/blog`
  - at least 3 blog posts

## 6) Run SEO audit

```bash
npx tsx scripts/seo-audit.ts https://svivva.com
```

Resolve all `high` priority findings first, then resubmit sitemap in Google Search Console.

## 7) One-command post-import validation

```bash
bash POST_IMPORT_VALIDATION_COMMANDS.sh https://svivva.com
```

## 8) Hybrid GTM operating model

Use `HYBRID_MARKETING_OPERATING_SYSTEM.md` as the strategy document for cross-engine indexing + fusion-growth execution.

#!/usr/bin/env tsx
/**
 * Unpublish legacy Pyracrypt/clutety SEO slugs from the database.
 * Run: npm run seo:unpublish-legacy  (requires DATABASE_URL)
 */
import { unpublishLegacySeoSlugs } from "../lib/seo/unpublish-legacy-slugs";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  const unpublished = await unpublishLegacySeoSlugs();
  if (unpublished.length === 0) {
    console.log("No legacy published SEO slugs found.");
    return;
  }
  console.log(`Unpublished ${unpublished.length} page(s):`);
  for (const row of unpublished) {
    console.log(`  - ${row.slug}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

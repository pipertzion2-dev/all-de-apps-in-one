#!/usr/bin/env tsx
/**
 * Unpublish legacy Pyracrypt/clutety SEO slugs from the database.
 * Run: npm run seo:unpublish-legacy  (requires DATABASE_URL)
 */
import { ensureOrbitHubPages } from "../lib/orbit/ensure-hub-pages";
import { unpublishLegacySeoSlugs } from "../lib/seo/unpublish-legacy-slugs";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  const unpublished = await unpublishLegacySeoSlugs();
  if (unpublished.length === 0) {
    console.log("No legacy published SEO slugs found.");
  } else {
    console.log(`Unpublished ${unpublished.length} legacy brand page(s):`);
    for (const row of unpublished) {
      console.log(`  - ${row.slug}`);
    }
  }
  const hubSteps = await ensureOrbitHubPages();
  if (hubSteps.length) {
    console.log("Hub pages:");
    for (const step of hubSteps) console.log(`  ${step}`);
  } else {
    console.log("Hub pages already published.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env tsx
/**
 * Unpublish SEO slugs that must not stay published (legacy brands, native /tools dupes).
 * Run: npm run seo:unpublish-legacy  (requires DATABASE_URL)
 */
import { ensureOrbitHubPages } from "../lib/orbit/ensure-hub-pages";
import { unpublishSeoSlugHygiene } from "../lib/seo/unpublish-legacy-slugs";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  const unpublished = await unpublishSeoSlugHygiene();
  if (unpublished.length === 0) {
    console.log("No hygiene SEO slugs to unpublish.");
  } else {
    console.log(`Unpublished ${unpublished.length} SEO page(s):`);
    for (const row of unpublished) {
      console.log(`  - ${row.slug} (${row.reason})`);
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

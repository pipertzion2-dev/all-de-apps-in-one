#!/usr/bin/env node
/**
 * Attach svivva.com (or another legacy domain) to all-de-apps-in-one with a Vercel redirect
 * to the canonical production domain.
 *
 * Requires VERCEL_TOKEN + VERCEL_PROJECT_ID (and optional VERCEL_ORG_ID).
 *
 *   npm run domain:legacy-alias
 *   LEGACY_DOMAIN=svivva.com CANONICAL_DOMAIN=zzaizzai.com npm run domain:legacy-alias
 */
import { attachLegacyDomainRedirect } from "../lib/orbit/domain-cutover.ts";

const legacy = (process.env.LEGACY_DOMAIN || "svivva.com").replace(/^www\./, "");
const canonical = (process.env.CANONICAL_DOMAIN || "zzaizzai.com").replace(/^www\./, "");

async function main() {
  console.log(`\n▶ Attach ${legacy} → redirect to ${canonical} on Vercel\n`);
  const result = await attachLegacyDomainRedirect(legacy, canonical);
  console.log(result.detail);
  if (result.domains.length) console.log(`Domains: ${result.domains.join(", ")}`);
  if (!result.ok) {
    console.error(
      "\nIf the domain is on an old blocked Vercel project, remove it there first (Vercel Support can help).",
    );
    process.exit(1);
  }
  console.log("\n✓ Done — DNS for svivva.com must still point at Vercel (76.76.21.21 / cname.vercel-dns.com)\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

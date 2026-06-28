#!/usr/bin/env node
/**
 * Adds metadata.tier (pro | enterprise) to live Stripe products that are missing
 * it, so hosted checkout (validateCheckoutPrice) accepts them. Safe + idempotent:
 * only ADDS metadata, infers tier from the product name, never archives/deletes.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const name of [".env", ".env.local", ".env.orbit"]) {
  const p = resolve(repoRoot, name);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error("Missing STRIPE_SECRET_KEY in .env");
  process.exit(1);
}
const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });

function inferTier(name) {
  return /enterprise/i.test(name) ? "enterprise" : "pro";
}

async function main() {
  const { data: products } = await stripe.products.list({ active: true, limit: 100 });
  console.log(`Found ${products.length} active products.\n`);
  let updated = 0;
  for (const p of products) {
    const current = p.metadata?.tier;
    if (current === "pro" || current === "enterprise") {
      console.log(`  · ${p.name}: already tier=${current} (skip)`);
      continue;
    }
    const tier = inferTier(p.name);
    await stripe.products.update(p.id, { metadata: { ...p.metadata, tier } });
    console.log(`  ✓ ${p.name}: set tier=${tier}`);
    updated++;
  }
  console.log(`\nDone. Updated ${updated} product(s).`);
}
main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});

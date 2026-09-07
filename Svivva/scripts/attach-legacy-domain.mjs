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
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const vercelCanonical = JSON.parse(
  readFileSync(join(__dirname, "..", "vercel-canonical.json"), "utf8"),
);

const VERCEL_API = "https://api.vercel.com";
const legacy = (process.env.LEGACY_DOMAIN || "svivva.com").replace(/^www\./, "");
const canonical = (process.env.CANONICAL_DOMAIN || vercelCanonical.productionDomain || "zzaizzai.com").replace(
  /^www\./,
  "",
);

async function attachLegacyDomainRedirect(legacyDomain, redirectTarget) {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  const teamId = process.env.VERCEL_ORG_ID?.trim() || process.env.VERCEL_TEAM_ID?.trim();

  if (!token || !projectId) {
    return {
      ok: false,
      detail:
        "VERCEL_TOKEN / VERCEL_PROJECT_ID not set — add svivva.com in Vercel → all-de-apps-in-one → Domains → Redirect to zzaizzai.com",
      domains: [],
    };
  }

  const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  const added = [];
  const errors = [];

  for (const name of [legacyDomain, `www.${legacyDomain}`]) {
    const requestBody = { name };
    if (name === legacyDomain) requestBody.redirect = redirectTarget;

    const res = await fetch(`${VERCEL_API}/v10/projects/${projectId}/domains${qs}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(20000),
    });
    const responseBody = await res.json().catch(() => ({}));

    if (res.ok || res.status === 409 || responseBody.error?.code === "domain_already_in_use") {
      added.push(name);
      continue;
    }
    if (/already/i.test(responseBody.error?.message || "")) {
      added.push(name);
      continue;
    }
    errors.push(`${name}: ${responseBody.error?.message || res.status}`);
  }

  if (added.length === 0) {
    return { ok: false, detail: errors.join("; ") || "Vercel domain add failed", domains: [] };
  }

  return {
    ok: errors.length === 0,
    detail:
      errors.length === 0
        ? `Added/confirmed on Vercel: ${added.join(", ")} → redirect ${redirectTarget}`
        : `Partial: ${added.join(", ")}. Errors: ${errors.join("; ")}`,
    domains: added,
  };
}

async function main() {
  console.log(`\n▶ Attach ${legacy} → redirect to ${canonical} on Vercel (${vercelCanonical.projectName})\n`);
  const result = await attachLegacyDomainRedirect(legacy, canonical);
  console.log(result.detail);
  if (result.domains.length) console.log(`Domains: ${result.domains.join(", ")}`);
  if (!result.ok) {
    console.error(
      "\nIf the domain is on an old blocked Vercel project, remove it there first (Vercel Support can help).",
    );
    process.exit(1);
  }
  console.log(
    "\n✓ Done — ensure svivva.com DNS points at Vercel (76.76.21.21 / cname.vercel-dns.com)\n",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

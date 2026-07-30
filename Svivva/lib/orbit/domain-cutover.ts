/**
 * Point a GoDaddy domain at Vercel (apex A + www CNAME) and update app credentials.
 */
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { normalizeGodaddyDomain } from "@/lib/godaddy-domain";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { patchPlatformRuntimeSecrets } from "@/lib/platform-runtime-secrets";

const GODADDY_API = "https://api.godaddy.com/v1";
const VERCEL_API = "https://api.vercel.com";

/** Vercel anycast IPv4 for apex domains (confirm in Vercel Domains UI if this ever changes). */
export const VERCEL_APEX_A = "76.76.21.21";
export const VERCEL_WWW_CNAME = "cname.vercel-dns.com";

export type DomainCutoverInput = {
  domain?: string;
  /** Skip Vercel API even if token is present. */
  skipVercel?: boolean;
  /** Optional override; defaults to VERCEL_APEX_A. */
  apexA?: string;
  /** Optional override; defaults to VERCEL_WWW_CNAME. */
  wwwCname?: string;
};

export type DomainCutoverResult = {
  ok: boolean;
  domain: string;
  siteUrl: string;
  summary: string;
  summaryLines: string[];
  dns: {
    apexA?: { ok: boolean; detail: string };
    wwwCname?: { ok: boolean; detail: string };
    verified?: { ok: boolean; detail: string; status?: string; nameservers?: string[] };
  };
  vercel: {
    attempted: boolean;
    ok: boolean;
    detail: string;
    domains?: string[];
  };
  credentialsUpdated: boolean;
  platformSiteUrlUpdated: boolean;
  nextSteps: string[];
};

async function resolveCredsRow() {
  const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";
  let [row] = await db
    .select()
    .from(seedCredentials)
    .where(eq(seedCredentials.userId, userId))
    .limit(1);

  // Fallback: newest row that already has GoDaddy keys (admin UI may use a different user_id).
  if (!row?.godaddyApiKey || !row?.godaddyApiSecret) {
    const [fallback] = await db
      .select()
      .from(seedCredentials)
      .orderBy(desc(seedCredentials.updatedAt))
      .limit(1);
    if (fallback?.godaddyApiKey && fallback?.godaddyApiSecret) {
      row = fallback;
    }
  }

  return { userId: row?.userId || userId, row };
}

async function godaddyFetch(
  authHeader: string,
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(`${GODADDY_API}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function addVercelDomains(domain: string): Promise<{
  ok: boolean;
  detail: string;
  domains: string[];
}> {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  const teamId = process.env.VERCEL_ORG_ID?.trim() || process.env.VERCEL_TEAM_ID?.trim();

  if (!token || !projectId) {
    return {
      ok: false,
      detail:
        "VERCEL_TOKEN / VERCEL_PROJECT_ID not set — add the domain in Vercel → Domains (or set those env vars and re-run).",
      domains: [],
    };
  }

  const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  const added: string[] = [];
  const errors: string[] = [];

  for (const name of [domain, `www.${domain}`]) {
    const res = await fetch(`${VERCEL_API}/v10/projects/${projectId}/domains${qs}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
      signal: AbortSignal.timeout(20000),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };

    if (res.ok || res.status === 409 || body.error?.code === "domain_already_in_use") {
      added.push(name);
      continue;
    }
    if (/already/i.test(body.error?.message || "")) {
      added.push(name);
      continue;
    }
    errors.push(`${name}: ${body.error?.message || res.status}`);
  }

  if (added.length === 0) {
    return { ok: false, detail: errors.join("; ") || "Vercel domain add failed", domains: [] };
  }

  return {
    ok: errors.length === 0,
    detail:
      errors.length === 0
        ? `Added/confirmed on Vercel: ${added.join(", ")}`
        : `Partial: ${added.join(", ")}. Errors: ${errors.join("; ")}`,
    domains: added,
  };
}

export async function runDomainCutover(
  input: DomainCutoverInput = {},
): Promise<DomainCutoverResult> {
  const summaryLines: string[] = ["═══ Domain cutover → Vercel ═══", ""];
  const nextSteps: string[] = [];
  const domain =
    normalizeGodaddyDomain(input.domain || process.env.CUTOVER_DOMAIN || "zzaizzai.com") ||
    "zzaizzai.com";
  const siteUrl = `https://${domain}`;
  const apexA = input.apexA || VERCEL_APEX_A;
  const wwwCname = (input.wwwCname || VERCEL_WWW_CNAME).replace(/\.$/, "");

  const { userId, row } = await resolveCredsRow();
  if (!row?.godaddyApiKey || !row?.godaddyApiSecret) {
    const lines = [
      ...summaryLines,
      "✖ GoDaddy API key/secret not found in seed_credentials.",
      "  Add them in Dashboard → Marketing → Traffic Setup, then re-run.",
    ];
    return {
      ok: false,
      domain,
      siteUrl,
      summary: lines.join("\n"),
      summaryLines: lines,
      dns: {},
      vercel: { attempted: false, ok: false, detail: "skipped" },
      credentialsUpdated: false,
      platformSiteUrlUpdated: false,
      nextSteps: [
        "Save GoDaddy API key + secret in Marketing → Traffic Setup",
        `Re-run POST /api/orbit/domain-cutover with { "domain": "${domain}" }`,
      ],
    };
  }

  const authHeader = `sso-key ${row.godaddyApiKey}:${row.godaddyApiSecret}`;
  const dns: DomainCutoverResult["dns"] = {};

  const verify = await godaddyFetch(authHeader, `/domains/${domain}`);
  if (!verify.ok) {
    const msg =
      typeof verify.body === "object" && verify.body && "message" in verify.body
        ? String((verify.body as { message?: string }).message)
        : `HTTP ${verify.status}`;
    summaryLines.push(`✖ GoDaddy cannot access ${domain}: ${msg}`);
    summaryLines.push("  Confirm the domain is in the same GoDaddy account as the API key.");
    return {
      ok: false,
      domain,
      siteUrl,
      summary: summaryLines.join("\n"),
      summaryLines,
      dns: { verified: { ok: false, detail: msg } },
      vercel: { attempted: false, ok: false, detail: "skipped" },
      credentialsUpdated: false,
      platformSiteUrlUpdated: false,
      nextSteps: [
        "In GoDaddy, open the account that owns zzaizzai.com",
        "Create API keys at https://developer.godaddy.com/keys and save them in Traffic Setup",
      ],
    };
  }

  const vbody = verify.body as { status?: string; nameServers?: string[] };
  dns.verified = {
    ok: true,
    detail: `status=${vbody.status || "ok"}`,
    status: vbody.status,
    nameservers: vbody.nameServers,
  };
  summaryLines.push(`✓ GoDaddy domain verified: ${domain} (${vbody.status || "ACTIVE"})`);

  // Domain Forwarding / parking overrides A+CNAME — remove it first.
  const fwdGet = await godaddyFetch(authHeader, `/domains/${domain}/forwarding`);
  if (fwdGet.ok) {
    const fwdDel = await godaddyFetch(authHeader, `/domains/${domain}/forwarding`, {
      method: "DELETE",
    });
    summaryLines.push(
      fwdDel.ok || fwdDel.status === 404
        ? "✓ Removed GoDaddy domain forwarding/parking"
        : `⚠ Could not remove forwarding: ${JSON.stringify(fwdDel.body).slice(0, 160)}`,
    );
  } else {
    summaryLines.push("· No GoDaddy forwarding config (or not readable)");
  }

  // Prefer PATCH (same path that successfully wrote _svivva TXT onto the live zone).
  // GoDaddy PUT /records/{type}/{name} can return 200 while the authoritative zone stays parked.
  const aPatch = await godaddyFetch(authHeader, `/domains/${domain}/records`, {
    method: "PATCH",
    body: JSON.stringify([{ type: "A", name: "@", data: apexA, ttl: 600 }]),
  });
  let aOk = aPatch.ok;
  if (!aOk) {
    const aPut = await godaddyFetch(authHeader, `/domains/${domain}/records/A/@`, {
      method: "PUT",
      body: JSON.stringify([{ data: apexA, ttl: 600 }]),
    });
    aOk = aPut.ok;
  }
  // Remove common parking A leftovers if still present after write
  if (aOk) {
    await godaddyFetch(authHeader, `/domains/${domain}/records/A/@`, {
      method: "PUT",
      body: JSON.stringify([{ data: apexA, ttl: 600 }]),
    });
  }
  dns.apexA = {
    ok: aOk,
    detail: aOk ? `@ A → ${apexA}` : `A record failed: ${JSON.stringify(aPatch.body).slice(0, 200)}`,
  };
  summaryLines.push(aOk ? `✓ ${dns.apexA.detail}` : `✖ ${dns.apexA.detail}`);

  // Delete www→apex parking CNAME then set Vercel target
  await godaddyFetch(authHeader, `/domains/${domain}/records/CNAME/www`, {
    method: "DELETE",
  });
  const cPatch = await godaddyFetch(authHeader, `/domains/${domain}/records`, {
    method: "PATCH",
    body: JSON.stringify([{ type: "CNAME", name: "www", data: wwwCname, ttl: 600 }]),
  });
  let cOk = cPatch.ok;
  if (!cOk) {
    const cPut = await godaddyFetch(authHeader, `/domains/${domain}/records/CNAME/www`, {
      method: "PUT",
      body: JSON.stringify([{ data: wwwCname, ttl: 600 }]),
    });
    cOk = cPut.ok;
  } else {
    // Force replace via PUT after PATCH so only Vercel CNAME remains
    await godaddyFetch(authHeader, `/domains/${domain}/records/CNAME/www`, {
      method: "PUT",
      body: JSON.stringify([{ data: wwwCname, ttl: 600 }]),
    });
  }
  dns.wwwCname = {
    ok: cOk,
    detail: cOk
      ? `www CNAME → ${wwwCname}`
      : `CNAME failed: ${JSON.stringify(cPatch.body).slice(0, 200)}`,
  };
  summaryLines.push(cOk ? `✓ ${dns.wwwCname.detail}` : `✖ ${dns.wwwCname.detail}`);

  await godaddyFetch(authHeader, `/domains/${domain}/records`, {
    method: "PATCH",
    body: JSON.stringify([{ type: "TXT", name: "_svivva", data: "zzaizzai-cutover", ttl: 600 }]),
  });

  // Read back what GoDaddy currently has for @ and www
  const listA = await godaddyFetch(authHeader, `/domains/${domain}/records/A/@`);
  const listC = await godaddyFetch(authHeader, `/domains/${domain}/records/CNAME/www`);
  const listAll = await godaddyFetch(authHeader, `/domains/${domain}/records`);
  summaryLines.push(
    `· GoDaddy readback A/@: ${JSON.stringify(listA.body).slice(0, 180)}`,
  );
  summaryLines.push(
    `· GoDaddy readback CNAME/www: ${JSON.stringify(listC.body).slice(0, 180)}`,
  );
  if (listAll.ok && Array.isArray(listAll.body)) {
    const interesting = (listAll.body as { type?: string; name?: string; data?: string }[])
      .filter((r) => r.name === "@" || r.name === "www" || r.type === "A" || r.type === "CNAME")
      .slice(0, 12);
    summaryLines.push(`· Zone snapshot: ${JSON.stringify(interesting).slice(0, 400)}`);
  }

  await db
    .insert(seedCredentials)
    .values({
      id: crypto.randomUUID(),
      userId,
      godaddyDomain: domain,
      googleSiteUrl: `sc-domain:${domain}`,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: seedCredentials.userId,
      set: {
        godaddyDomain: domain,
        googleSiteUrl: `sc-domain:${domain}`,
        updatedAt: new Date(),
      },
    });

  if (row.userId !== userId) {
    await db
      .update(seedCredentials)
      .set({
        godaddyDomain: domain,
        googleSiteUrl: `sc-domain:${domain}`,
        updatedAt: new Date(),
      })
      .where(eq(seedCredentials.userId, row.userId));
  }

  summaryLines.push(`✓ seed_credentials.godaddyDomain = ${domain}`);

  let platformSiteUrlUpdated = false;
  try {
    await patchPlatformRuntimeSecrets({ nextPublicSiteUrl: siteUrl });
    platformSiteUrlUpdated = true;
    summaryLines.push(`✓ platform runtime site URL = ${siteUrl}`);
  } catch (e) {
    summaryLines.push(`⚠ platform site URL not updated: ${String(e)}`);
  }

  let vercel: DomainCutoverResult["vercel"] = {
    attempted: false,
    ok: false,
    detail: "skipped",
  };

  if (!input.skipVercel) {
    const v = await addVercelDomains(domain);
    vercel = { attempted: true, ok: v.ok, detail: v.detail, domains: v.domains };
    summaryLines.push(v.ok ? `✓ Vercel: ${v.detail}` : `⚠ Vercel: ${v.detail}`);
    if (!v.ok) {
      nextSteps.push(`Vercel → Project → Domains → add ${domain} and www.${domain}`);
    }
  } else {
    nextSteps.push(`Vercel → Domains → add ${domain} + www.${domain}`);
  }

  nextSteps.push(
    `Set Vercel Production env NEXT_PUBLIC_SITE_URL=${siteUrl} and Redeploy`,
    `Stripe webhook → ${siteUrl}/api/stripe/webhook`,
    `GSC: add/verify ${domain}, OAuth redirect ${siteUrl}/api/gsc/oauth/callback`,
    "Wait 5–30 min for DNS, then open the new domain",
  );

  const ok = !!(dns.apexA?.ok && dns.wwwCname?.ok);
  summaryLines.push("");
  summaryLines.push(ok ? "✓ DNS cutover applied at GoDaddy." : "✖ DNS cutover incomplete.");

  return {
    ok,
    domain,
    siteUrl,
    summary: summaryLines.join("\n"),
    summaryLines,
    dns,
    vercel,
    credentialsUpdated: true,
    platformSiteUrlUpdated,
    nextSteps,
  };
}

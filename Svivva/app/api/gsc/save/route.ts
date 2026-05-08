import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { createSign } from "crypto";
import { getSitemapUrl } from "@/lib/site-url";
import { submitSitemapToGSC } from "@/lib/google-indexing";

export const dynamic = "force-dynamic";

interface ServiceAccount {
  private_key: string;
  client_email: string;
  token_uri: string;
}

function base64url(str: string | Buffer): string {
  const b = typeof str === "string" ? Buffer.from(str) : str;
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getAccessToken(sa: ServiceAccount, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ iss: sa.client_email, scope, aud: sa.token_uri, exp: now + 3600, iat: now }));
  const sigInput = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(sigInput);
  const sig = base64url(sign.sign(sa.private_key));
  const jwt = `${sigInput}.${sig}`;
  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`Token: ${res.status} — ${t.slice(0, 200)}`); }
  return (await res.json()).access_token;
}

export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal = internalSecret && internalSecret === process.env.ORBIT_INTERNAL_SECRET;
  const body = await req.json();
  const { action } = body;

  // submit_sitemap can run without user context (internal scheduler or authenticated user).
  // Google: real Webmasters v3 API via service-account JWT (the legacy ?ping= endpoint was
  // retired June 2023). Bing: legacy ping endpoint still alive.
  if (action === "submit_sitemap") {
    try {
      const sitemapUrl = getSitemapUrl();

      // Find the admin's stored service-account + site URL.
      // Prefer ADMIN_USER_ID (deterministic); fall back to most-recent enabled row.
      const adminUserId = process.env.ADMIN_USER_ID || "";
      const [creds] = adminUserId
        ? await db.select({ sa: seedCredentials.googleServiceAccountJson, site: seedCredentials.googleSiteUrl })
            .from(seedCredentials)
            .where(eq(seedCredentials.userId, adminUserId))
            .limit(1)
        : await db.select({ sa: seedCredentials.googleServiceAccountJson, site: seedCredentials.googleSiteUrl })
            .from(seedCredentials)
            .where(and(eq(seedCredentials.googleIndexingEnabled, true), isNotNull(seedCredentials.googleServiceAccountJson), isNotNull(seedCredentials.googleSiteUrl)))
            .orderBy(desc(seedCredentials.updatedAt))
            .limit(1);

      const googlePromise = creds?.sa && creds?.site
        ? submitSitemapToGSC(creds.sa, creds.site, sitemapUrl)
        : Promise.resolve({ ok: false as const, error: "No service account configured (paste JSON at /dashboard/gsc-connect)" });

      const bingPromise = fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
        signal: AbortSignal.timeout(10000),
      })
        .then((r) => ({ ok: r.ok, status: r.status }))
        .catch((e) => ({ ok: false, status: 0, error: String(e) }));

      const [google, bing] = await Promise.all([googlePromise, bingPromise]);
      return NextResponse.json({ success: true, sitemapUrl, google, bing });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Remaining actions require authenticated user (not available for internal scheduler)
  if (isInternal) return NextResponse.json({ error: "Action not available for internal calls" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [existing] = await db.select({ id: seedCredentials.id }).from(seedCredentials).where(eq(seedCredentials.userId, user.id)).limit(1);
  if (!existing) {
    await db.insert(seedCredentials).values({ userId: user.id, updatedAt: new Date() });
  }

  // Fix site URL
  if (action === "fix_url") {
    const { siteUrl } = body;
    if (!siteUrl || typeof siteUrl !== "string") return NextResponse.json({ error: "siteUrl required" }, { status: 400 });
    await db.update(seedCredentials).set({ googleSiteUrl: siteUrl, updatedAt: new Date() }).where(eq(seedCredentials.userId, user.id));
    return NextResponse.json({ success: true, siteUrl });
  }

  // Save service account JSON
  if (action === "save_service_account") {
    const { json } = body;
    if (!json || typeof json !== "string") return NextResponse.json({ error: "json required" }, { status: 400 });
    let sa: ServiceAccount;
    try {
      sa = JSON.parse(json);
      if (!sa.private_key || !sa.client_email || !sa.token_uri) throw new Error("Missing required fields");
    } catch (e: any) {
      return NextResponse.json({ error: `Invalid JSON: ${e.message}` }, { status: 400 });
    }
    try {
      await getAccessToken(sa, "https://www.googleapis.com/auth/webmasters.readonly");
    } catch (e: any) {
      return NextResponse.json({ error: `Service account auth failed: ${e.message}` }, { status: 400 });
    }
    try {
      const result = await db.update(seedCredentials)
        .set({ googleServiceAccountJson: json, googleIndexingEnabled: true, updatedAt: new Date() })
        .where(eq(seedCredentials.userId, user.id));
      console.log("[gsc/save] UPDATE result:", JSON.stringify(result));
    } catch (e: any) {
      console.error("[gsc/save] UPDATE failed:", e?.message);
      return NextResponse.json({ error: `DB save failed: ${e.message}` }, { status: 500 });
    }
    return NextResponse.json({ success: true, email: sa.client_email });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

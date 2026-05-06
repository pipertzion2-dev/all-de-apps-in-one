import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import dns from "dns/promises";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { action, domain, siteUrl } = await req.json();

    if (action === "generate") {
      if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 });
      const token = `svivva-verify-${randomBytes(12).toString("hex")}`;

      await db.execute(sql`
        INSERT INTO seed_credentials (user_id, custom_domain, domain_token, domain_verified)
        VALUES (${user.id}, ${domain}, ${token}, false)
        ON CONFLICT (user_id) DO UPDATE SET custom_domain = ${domain}, domain_token = ${token}, domain_verified = false
      `);

      return NextResponse.json({ token, domain, record: `TXT @ "${token}"` });
    }

    if (action === "check") {
      const [creds] = await db.select().from(seedCredentials).where(eq(seedCredentials.userId, user.id)).limit(1);
      if (!creds?.domainToken || !creds?.customDomain) {
        return NextResponse.json({ error: "No verification token found. Generate one first." }, { status: 400 });
      }

      let verified = false;
      try {
        const records = await dns.resolveTxt(creds.customDomain);
        verified = records.flat().some((r) => r.includes(creds.domainToken!));
      } catch { /* domain not yet propagated */ }

      if (verified) {
        await db.execute(sql`UPDATE seed_credentials SET domain_verified = true WHERE user_id = ${user.id}`);
      }

      return NextResponse.json({ verified, domain: creds.customDomain, token: creds.domainToken });
    }

    if (action === "save-google") {
      if (!siteUrl) return NextResponse.json({ error: "siteUrl required" }, { status: 400 });
      await db.execute(sql`
        INSERT INTO seed_credentials (user_id, google_site_url)
        VALUES (${user.id}, ${siteUrl})
        ON CONFLICT (user_id) DO UPDATE SET google_site_url = ${siteUrl}
      `);
      try {
        await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(siteUrl + "/sitemap.xml")}`, { signal: AbortSignal.timeout(4000) });
      } catch { /* non-critical */ }
      return NextResponse.json({ success: true, siteUrl });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("domain-verify error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

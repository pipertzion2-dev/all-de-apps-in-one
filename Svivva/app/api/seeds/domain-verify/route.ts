import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import dns from "dns/promises";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { requireAdminUser } from "@/lib/auth/require-admin-user";

export async function POST(req: Request) {
  try {
    const { user, error } = await requireAdminUser();
    if (error || !user) return error!;

    const { action, domain, siteUrl } = await req.json();

    if (action === "generate") {
      if (!domain) return badRequest("domain required");
      const token = `svivva-verify-${randomBytes(12).toString("hex")}`;

      await db.execute(sql`
        INSERT INTO seed_credentials (user_id, custom_domain, domain_token, domain_verified)
        VALUES (${user.id}, ${domain}, ${token}, false)
        ON CONFLICT (user_id) DO UPDATE SET custom_domain = ${domain}, domain_token = ${token}, domain_verified = false
      `);

      return ok({ token, domain, record: `TXT @ "${token}"` });
    }

    if (action === "check") {
      const [creds] = await db.select().from(seedCredentials).where(eq(seedCredentials.userId, user.id)).limit(1);
      if (!creds?.domainToken || !creds?.customDomain) {
        return badRequest("No verification token found. Generate one first.");
      }

      let verified = false;
      try {
        const records = await dns.resolveTxt(creds.customDomain);
        verified = records.flat().some((r) => r.includes(creds.domainToken!));
      } catch { /* domain not yet propagated */ }

      if (verified) {
        await db.execute(sql`UPDATE seed_credentials SET domain_verified = true WHERE user_id = ${user.id}`);
      }

      return ok({ verified, domain: creds.customDomain, token: creds.domainToken });
    }

    if (action === "save-google") {
      if (!siteUrl) return badRequest("siteUrl required");
      await db.execute(sql`
        INSERT INTO seed_credentials (user_id, google_site_url)
        VALUES (${user.id}, ${siteUrl})
        ON CONFLICT (user_id) DO UPDATE SET google_site_url = ${siteUrl}
      `);
      // Note: Google sitemap ping removed (?ping= retired June 2023).
      // The user can submit the sitemap manually at /dashboard/gsc-connect once they paste a service account.
      return ok({ success: true, siteUrl });
    }

    return badRequest("Unknown action");
  } catch (e) {
    console.error("domain-verify error:", e);
    return serverError(String(e));
  }
}

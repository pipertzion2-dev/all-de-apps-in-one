import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";

const GODADDY_API = "https://api.godaddy.com/v1";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasAdminAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [creds] = await db
      .select()
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, user.id))
      .limit(1);
    if (!creds?.godaddyApiKey || !creds?.godaddyApiSecret) {
      return NextResponse.json(
        { error: "GoDaddy API credentials not configured." },
        { status: 400 },
      );
    }
    if (!creds.godaddyDomain) {
      return NextResponse.json({ error: "GoDaddy domain not configured." }, { status: 400 });
    }

    const authHeader = `sso-key ${creds.godaddyApiKey}:${creds.godaddyApiSecret}`;

    const domainRes = await fetch(`${GODADDY_API}/domains/${creds.godaddyDomain}`, {
      headers: { Authorization: authHeader, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!domainRes.ok) {
      const err = await domainRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `GoDaddy API error: ${err.message || domainRes.status}` },
        { status: 400 },
      );
    }

    const domainData = await domainRes.json();

    const dnsRecords = [
      { type: "TXT", name: "_svivva", data: "svivva-site-verified", ttl: 600 },
      { type: "TXT", name: "@", data: "v=spf1 include:replit.com ~all", ttl: 600 },
    ];

    const dnsRes = await fetch(`${GODADDY_API}/domains/${creds.godaddyDomain}/records`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(dnsRecords),
      signal: AbortSignal.timeout(10000),
    });

    const dnsOk = dnsRes.ok;

    const nameservers: string[] = domainData.nameServers || [];
    const status: string = domainData.status || "ACTIVE";
    const expires: string = domainData.expires || "";

    return NextResponse.json({
      success: true,
      domain: creds.godaddyDomain,
      status,
      expires,
      nameservers,
      dnsRecordAdded: dnsOk,
      message: dnsOk
        ? `Domain ${creds.godaddyDomain} verified and DNS records added. Use the Marketing dashboard to add the CNAME pointing to your Replit deployment.`
        : `Domain ${creds.godaddyDomain} verified. DNS update may require a moment — try again shortly.`,
    });
  } catch (e) {
    console.error("GoDaddy setup error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

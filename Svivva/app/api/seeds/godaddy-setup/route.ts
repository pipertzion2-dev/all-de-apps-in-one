import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { runDomainCutover } from "@/lib/orbit/domain-cutover";

const GODADDY_API = "https://api.godaddy.com/v1";

export async function POST(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // Full GoDaddy → Vercel cutover (preferred)
    if (body?.action === "vercel-cutover" || body?.vercelCutover === true) {
      const result = await runDomainCutover({
        domain: typeof body.domain === "string" ? body.domain : "zzaizzai.com",
        skipVercel: !!body.skipVercel,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";
    const [creds] = await db
      .select()
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, userId))
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

    const dnsRecords = [{ type: "TXT", name: "_svivva", data: "svivva-site-verified", ttl: 600 }];

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
        ? `Domain ${creds.godaddyDomain} verified. Run vercel-cutover (POST { \"action\": \"vercel-cutover\" }) to point DNS at Vercel.`
        : `Domain ${creds.godaddyDomain} verified. DNS update may require a moment — try again shortly.`,
    });
  } catch (e) {
    console.error("GoDaddy setup error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

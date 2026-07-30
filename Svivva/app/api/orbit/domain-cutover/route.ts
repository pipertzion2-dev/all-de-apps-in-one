import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runDomainCutover } from "@/lib/orbit/domain-cutover";

export const maxDuration = 60;

/**
 * POST /api/orbit/domain-cutover
 * Body: { domain?: "zzaizzai.com", skipVercel?: boolean }
 *
 * Uses GoDaddy keys in seed_credentials to point DNS at Vercel, updates
 * app domain fields, and adds the domain to Vercel when VERCEL_TOKEN is set.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await runDomainCutover({
      domain: typeof body.domain === "string" ? body.domain : "zzaizzai.com",
      skipVercel: !!body.skipVercel,
      apexA: typeof body.apexA === "string" ? body.apexA : undefined,
      wwwCname: typeof body.wwwCname === "string" ? body.wwwCname : undefined,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({
      endpoint: "/api/orbit/domain-cutover",
      defaultDomain: "zzaizzai.com",
      vercelApexA: "76.76.21.21",
      vercelWwwCname: "cname.vercel-dns.com",
      usage: 'POST { "domain": "zzaizzai.com" }',
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

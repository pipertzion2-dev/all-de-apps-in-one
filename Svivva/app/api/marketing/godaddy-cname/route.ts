import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";

const GODADDY_API = "https://api.godaddy.com/v1";

function extractTargetHostname(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasAdminAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { subdomain, targetUrl } = await req.json();

    const [creds] = await db
      .select()
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, user.id))
      .limit(1);
    if (!creds?.godaddyApiKey || !creds?.godaddyApiSecret) {
      return NextResponse.json(
        { error: "GoDaddy credentials not configured. Add them in the Traffic Connections panel." },
        { status: 400 },
      );
    }
    if (!creds.godaddyDomain) {
      return NextResponse.json({ error: "GoDaddy domain not configured." }, { status: 400 });
    }

    const targetDomain = targetUrl ? extractTargetHostname(targetUrl) : null;
    if (!targetDomain) {
      return NextResponse.json(
        {
          error:
            "Invalid target URL — enter a full URL (e.g. https://your-project.vercel.app or https://mini-apps.example.com)",
        },
        { status: 400 },
      );
    }

    const sub = (subdomain || "apps").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const authHeader = `sso-key ${creds.godaddyApiKey}:${creds.godaddyApiSecret}`;

    // Check if record already exists
    const checkRes = await fetch(
      `${GODADDY_API}/domains/${creds.godaddyDomain}/records/CNAME/${sub}`,
      {
        headers: { Authorization: authHeader },
      },
    );
    const existing = checkRes.ok ? await checkRes.json() : [];

    // Create or update CNAME
    const putRes = await fetch(
      `${GODADDY_API}/domains/${creds.godaddyDomain}/records/CNAME/${sub}`,
      {
        method: "PUT",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify([{ data: targetDomain, ttl: 3600 }]),
      },
    );

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `GoDaddy error: ${err.message || putRes.status}` },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      created: existing.length === 0,
      subdomain: `${sub}.${creds.godaddyDomain}`,
      target: targetDomain,
      domain: creds.godaddyDomain,
      message: `${sub}.${creds.godaddyDomain} → ${targetDomain} (CNAME ${existing.length === 0 ? "created" : "updated"})`,
    });
  } catch (e) {
    console.error("GoDaddy CNAME error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasAdminAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [creds] = await db
      .select()
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, user.id))
      .limit(1);
    if (!creds?.godaddyApiKey || !creds?.godaddyApiSecret || !creds.godaddyDomain) {
      return NextResponse.json({ records: [], error: "GoDaddy not configured" });
    }

    const authHeader = `sso-key ${creds.godaddyApiKey}:${creds.godaddyApiSecret}`;
    const res = await fetch(`${GODADDY_API}/domains/${creds.godaddyDomain}/records/CNAME`, {
      headers: { Authorization: authHeader },
    });

    if (!res.ok)
      return NextResponse.json({ records: [], error: `GoDaddy API error: ${res.status}` });
    const records = await res.json();
    return NextResponse.json({ records: records || [], domain: creds.godaddyDomain });
  } catch (e) {
    return NextResponse.json({ records: [], error: String(e) });
  }
}

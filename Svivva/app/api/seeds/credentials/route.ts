import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { normalizeGodaddyDomain } from "@/lib/godaddy-domain";

export async function GET() {
  try {
    if (!(await isOrbitAdminAllowed()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";

    const [creds] = await db
      .select()
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, userId))
      .limit(1);

    if (!creds) {
      return NextResponse.json({
        hasReplit: false,
        hasGodaddy: false,
        hasGoogle: false,
        godaddyDomain: null,
        googleSiteUrl: null,
        googleVerificationToken: null,
      });
    }

    // Also check indexnow_key via raw SQL since it may not be in the ORM model
    let indexnowKey: string | null = null;
    try {
      const rows = await db.execute(
        sql`SELECT indexnow_key FROM seed_credentials WHERE user_id = ${userId} LIMIT 1`,
      );
      indexnowKey = (rows as unknown as any[])[0]?.indexnow_key || null;
    } catch {
      /* column may not exist yet */
    }

    return NextResponse.json({
      hasReplit: !!(creds.replitUsername || creds.replitToken),
      replitUsername: creds.replitUsername || null,
      hasGodaddy: !!(creds.godaddyApiKey && creds.godaddyApiSecret && creds.godaddyDomain),
      hasGoogle: !!creds.googleSiteUrl,
      godaddyDomain: creds.godaddyDomain,
      googleSiteUrl: creds.googleSiteUrl,
      googleVerificationToken: creds.googleVerificationToken,
      indexnowKey,
      miniAppsUrl: creds.miniAppsUrl || null,
      miniAppsSubdomain: creds.miniAppsSubdomain || null,
    });
  } catch (e) {
    console.error("Credentials GET error:", e);
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";
    const body = await request.json();

    // Validate GoDaddy domain if provided
    if (typeof body.godaddyDomain === "string" && body.godaddyDomain.trim()) {
      const normalized = normalizeGodaddyDomain(body.godaddyDomain);
      if (!normalized) {
        return NextResponse.json(
          { error: "Invalid domain. Use apex domain only, e.g. example.com" },
          { status: 400 },
        );
      }
      body.godaddyDomain = normalized;
    }

    // Collect updates
    const updates: Record<string, string | null> = {};
    if (typeof body.replitToken === "string") updates.replitToken = body.replitToken || null;
    if (typeof body.replitUsername === "string")
      updates.replitUsername = body.replitUsername || null;
    if (typeof body.godaddyApiKey === "string") updates.godaddyApiKey = body.godaddyApiKey || null;
    if (typeof body.godaddyApiSecret === "string")
      updates.godaddyApiSecret = body.godaddyApiSecret || null;
    if (typeof body.godaddyDomain === "string") updates.godaddyDomain = body.godaddyDomain || null;
    if (typeof body.googleSiteUrl === "string") updates.googleSiteUrl = body.googleSiteUrl || null;
    if (typeof body.googleVerificationToken === "string")
      updates.googleVerificationToken = body.googleVerificationToken || null;
    if (typeof body.miniAppsUrl === "string") updates.miniAppsUrl = body.miniAppsUrl || null;
    if (typeof body.miniAppsSubdomain === "string")
      updates.miniAppsSubdomain = body.miniAppsSubdomain || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
    }

    // Step 1: Ensure a row exists for this userId (idempotent)
    await db.execute(
      sql`INSERT INTO seed_credentials (id, user_id, updated_at)
          VALUES (${crypto.randomUUID()}, ${userId}, NOW())
          ON CONFLICT (user_id) DO NOTHING`,
    );

    // Step 2: Update individual fields via raw SQL (reliable across all column sets)
    for (const [key, value] of Object.entries(updates)) {
      const col = key.replace(/([A-Z])/g, "_$1").toLowerCase(); // camelCase → snake_case
      await db.execute(
        sql`UPDATE seed_credentials SET ${sql.raw(col)} = ${value}, updated_at = NOW() WHERE user_id = ${userId}`,
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Credentials POST error:", msg, e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

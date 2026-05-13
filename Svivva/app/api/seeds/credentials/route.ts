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
    const updates: Partial<typeof seedCredentials.$inferInsert> = {};
    if (typeof body.replitToken === "string") updates.replitToken = body.replitToken;
    if (typeof body.replitUsername === "string")
      updates.replitUsername = body.replitUsername || null;
    if (typeof body.godaddyApiKey === "string") updates.godaddyApiKey = body.godaddyApiKey;
    if (typeof body.godaddyApiSecret === "string") updates.godaddyApiSecret = body.godaddyApiSecret;
    if (typeof body.godaddyDomain === "string") {
      const normalized = normalizeGodaddyDomain(body.godaddyDomain);
      if (body.godaddyDomain.trim() && !normalized) {
        return NextResponse.json(
          {
            error:
              "Invalid domain. Use your apex domain only, e.g. example.com (no https:// or www).",
          },
          { status: 400 },
        );
      }
      updates.godaddyDomain = normalized ?? null;
    }
    if (typeof body.googleSiteUrl === "string") updates.googleSiteUrl = body.googleSiteUrl;
    if (typeof body.googleVerificationToken === "string")
      updates.googleVerificationToken = body.googleVerificationToken;

    const hasMiniAppsUrl = typeof body.miniAppsUrl === "string";
    const hasMiniAppsSubdomain = typeof body.miniAppsSubdomain === "string";

    if (Object.keys(updates).length === 0 && !hasMiniAppsUrl && !hasMiniAppsSubdomain) {
      return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: seedCredentials.id })
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, userId))
      .limit(1);

    if (existing) {
      if (Object.keys(updates).length > 0) {
        await db
          .update(seedCredentials)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(seedCredentials.userId, userId));
      }
      if (hasMiniAppsUrl) {
        await db.execute(
          sql`UPDATE seed_credentials SET mini_apps_url = ${body.miniAppsUrl}, updated_at = NOW() WHERE user_id = ${userId}`,
        );
      }
      if (hasMiniAppsSubdomain) {
        await db.execute(
          sql`UPDATE seed_credentials SET mini_apps_subdomain = ${body.miniAppsSubdomain}, updated_at = NOW() WHERE user_id = ${userId}`,
        );
      }
    } else {
      await db.insert(seedCredentials).values({ userId, ...updates });
      if (hasMiniAppsUrl) {
        await db.execute(
          sql`UPDATE seed_credentials SET mini_apps_url = ${body.miniAppsUrl} WHERE user_id = ${userId}`,
        );
      }
      if (hasMiniAppsSubdomain) {
        await db.execute(
          sql`UPDATE seed_credentials SET mini_apps_subdomain = ${body.miniAppsSubdomain} WHERE user_id = ${userId}`,
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Credentials POST error:", e);
    return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
  }
}

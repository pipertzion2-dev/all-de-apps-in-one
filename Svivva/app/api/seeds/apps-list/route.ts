import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { sql } from "drizzle-orm";
import { like } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userAppRows = await db.execute(
      sql`SELECT * FROM user_apps WHERE user_id = ${user.id} ORDER BY created_at DESC`
    );

    const replitPages = await db
      .select({ toolUrl: seoLandingPages.toolUrl, slug: seoLandingPages.slug, title: seoLandingPages.title })
      .from(seoLandingPages)
      .where(like(seoLandingPages.toolUrl, "replit:%"));

    const replitMap: Record<string, { replId: string; title: string; pages: { slug: string; title: string }[]; subApps: { name: string; pages: { slug: string; title: string }[] }[] }> = {};

    for (const p of replitPages) {
      if (!p.toolUrl) continue;
      const parts = p.toolUrl.split(":");
      if (parts.length === 2) {
        const replId = parts[1];
        if (!replitMap[replId]) replitMap[replId] = { replId, title: p.title || replId, pages: [], subApps: [] };
        replitMap[replId].pages.push({ slug: p.slug, title: p.title || p.slug });
      } else if (parts.length === 4 && parts[2] === "sub") {
        const replId = parts[1];
        const subName = parts[3];
        if (!replitMap[replId]) replitMap[replId] = { replId, title: replId, pages: [], subApps: [] };
        let sub = replitMap[replId].subApps.find((s) => s.name === subName);
        if (!sub) { sub = { name: subName, pages: [] }; replitMap[replId].subApps.push(sub); }
        sub.pages.push({ slug: p.slug, title: p.title || p.slug });
      }
    }

    const replitSubRows = await db.execute(
      sql`SELECT * FROM replit_sub_apps WHERE user_id = ${user.id}`
    );

    for (const row of replitSubRows.rows as Record<string, unknown>[]) {
      const replId = row.parent_repl_id as string;
      const subName = row.sub_app_name as string;
      if (!replitMap[replId]) replitMap[replId] = { replId, title: row.parent_repl_title as string, pages: [], subApps: [] };
      if (!replitMap[replId].subApps.find((s) => s.name === subName)) {
        replitMap[replId].subApps.push({ name: subName, pages: (row.marketing_slugs as string[] || []).map((s) => ({ slug: s, title: s })) });
      }
    }

    const manualApps = (userAppRows.rows as Record<string, unknown>[]).map((r) => ({
      id: r.id as number,
      name: r.name as string,
      url: r.url as string,
      description: r.description as string,
      platform: r.platform as string,
      hostingProvider: r.hosting_provider as string,
      domain: r.domain as string,
      slugs: (r.marketing_slugs as string[]) || [],
      subApps: (r.sub_apps as { name: string; description: string; url: string }[]) || [],
      source: "manual" as const,
    }));

    return NextResponse.json({
      manualApps,
      replitApps: Object.values(replitMap),
    });
  } catch (e) {
    console.error("apps-list error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

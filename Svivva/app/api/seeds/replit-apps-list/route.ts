import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq, like } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pages = await db
      .select({
        toolUrl: seoLandingPages.toolUrl,
        title: seoLandingPages.title,
        slug: seoLandingPages.slug,
        headline: seoLandingPages.headline,
      })
      .from(seoLandingPages)
      .where(like(seoLandingPages.toolUrl, "replit:%"));

    const parentMap: Record<string, {
      replId: string;
      title: string;
      pages: { slug: string; title: string }[];
      subApps: { id: string; name: string; path: string; url: string; description: string; pages: { slug: string; title: string }[] }[];
    }> = {};

    for (const p of pages) {
      if (!p.toolUrl) continue;
      const parts = p.toolUrl.split(":");
      if (parts.length === 2) {
        const replId = parts[1];
        if (!parentMap[replId]) {
          parentMap[replId] = { replId, title: p.title || replId, pages: [], subApps: [] };
        }
        parentMap[replId].pages.push({ slug: p.slug, title: p.title || p.slug });
      } else if (parts.length === 4 && parts[2] === "sub") {
        const replId = parts[1];
        const subName = parts[3];
        if (!parentMap[replId]) {
          parentMap[replId] = { replId, title: replId, pages: [], subApps: [] };
        }
        let sub = parentMap[replId].subApps.find((s) => s.id === subName);
        if (!sub) {
          sub = { id: subName, name: subName, path: "", url: "", description: "", pages: [] };
          parentMap[replId].subApps.push(sub);
        }
        sub.pages.push({ slug: p.slug, title: p.title || p.slug });
      }
    }

    const subAppRows = await db.execute(
      sql`SELECT * FROM replit_sub_apps WHERE user_id = ${user.id} ORDER BY created_at ASC`
    );

    for (const row of subAppRows.rows as Record<string, unknown>[]) {
      const replId = row.parent_repl_id as string;
      const subName = row.sub_app_name as string;
      if (!parentMap[replId]) {
        parentMap[replId] = { replId, title: row.parent_repl_title as string, pages: [], subApps: [] };
      }
      const existing = parentMap[replId].subApps.find((s) => s.id === subName);
      if (!existing) {
        const slugs: string[] = Array.isArray(row.marketing_slugs) ? row.marketing_slugs as string[] : [];
        parentMap[replId].subApps.push({
          id: subName,
          name: subName,
          path: (row.sub_app_path as string) || "",
          url: (row.sub_app_url as string) || "",
          description: (row.sub_app_description as string) || "",
          pages: slugs.map((s) => ({ slug: s, title: s })),
        });
      } else {
        existing.path = (row.sub_app_path as string) || existing.path;
        existing.url = (row.sub_app_url as string) || existing.url;
        existing.description = (row.sub_app_description as string) || existing.description;
      }
    }

    return NextResponse.json({ apps: Object.values(parentMap) });
  } catch (e) {
    console.error("replit-apps-list error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { generateSeedMarketingPages } from "@/lib/llm/seeds";
import type { SeedAppSpec } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { requireAdminUser } from "@/lib/auth/require-admin-user";

interface SubAppInput {
  name: string;
  description: string;
  path: string;
  url: string;
}

export async function POST(req: Request) {
  try {
    const { user, error } = await requireAdminUser();
    if (error || !user) return error!;

    const { replId, replTitle, subApps } = (await req.json()) as {
      replId: string;
      replTitle: string;
      subApps: SubAppInput[];
    };

    if (!replId || !subApps?.length) {
      return badRequest("replId and subApps required");
    }

    const results = [];

    for (const subApp of subApps) {
      const subKey = `replit:${replId}:sub:${subApp.name.toLowerCase().replace(/\s+/g, "-")}`;

      const existing = await db
        .select({ id: seoLandingPages.id })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.toolUrl, subKey))
        .limit(1);

      if (existing.length > 0) {
        await db.execute(sql`
          INSERT INTO replit_sub_apps (user_id, parent_repl_id, parent_repl_title, sub_app_name, sub_app_description, sub_app_path, sub_app_url)
          VALUES (${user.id}, ${replId}, ${replTitle}, ${subApp.name}, ${subApp.description}, ${subApp.path}, ${subApp.url})
          ON CONFLICT DO NOTHING
        `);
        results.push({ name: subApp.name, skipped: true, slugs: [] });
        continue;
      }

      const parentPages = await db
        .select({ slug: seoLandingPages.slug })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.toolUrl, `replit:${replId}`))
        .limit(3);

      const parentSlugs = parentPages.map((p) => p.slug);

      const spec: SeedAppSpec = {
        appName: `${replTitle} — ${subApp.name}`,
        problemStatement:
          subApp.description || `${subApp.name} module inside ${replTitle} — a focused mini-application`,
        targetUsers: "Developers and end users looking for " + subApp.name + " functionality",
        features: [
          `${subApp.name} core functionality`,
          `Part of ${replTitle} ecosystem`,
          subApp.path ? `Located at ${subApp.path}` : "Integrated module",
          subApp.url ? `Live at ${subApp.url}` : "Embedded in parent app",
        ],
        userFlows: [
          `Access ${subApp.name} through the main ${replTitle} interface`,
          `Use ${subApp.name} features`,
          "Share or embed results",
        ],
        databaseSchema: "Shared database with parent application",
        apiEndpoints: [subApp.url || "/api", ...(subApp.path ? [subApp.path] : [])],
        uiComponents: ["Mini app interface", "Navigation back to main app", "Core feature components"],
        businessModel: `Part of ${replTitle} — ${subApp.description ? subApp.description : "free to use"}`,
        deploymentPreferences: `Sub-application of ${replTitle}, accessible at ${subApp.url || subApp.path || "the main app URL"}`,
      };

      const result = await generateSeedMarketingPages(spec, subKey);
      const slugs: string[] = [];

      if (result.success) {
        for (const page of result.pages) {
          const [row] = await db
            .insert(seoLandingPages)
            .values({
              slug: page.slug,
              keyword: page.keyword,
              title: page.title,
              headline: page.headline,
              subheadline: page.subheadline,
              content: page.content,
              benefits: page.benefits,
              howItWorks: page.howItWorks,
              whoItsFor: page.whoItsFor,
              metaTitle: page.metaTitle,
              metaDescription: page.metaDescription,
              published: true,
              category: "seed-marketing",
              toolUrl: subKey,
            })
            .returning({ slug: seoLandingPages.slug });
          if (row) slugs.push(row.slug);
        }
      }

      await db.execute(sql`
        INSERT INTO replit_sub_apps (user_id, parent_repl_id, parent_repl_title, sub_app_name, sub_app_description, sub_app_path, sub_app_url, marketing_slugs)
        VALUES (${user.id}, ${replId}, ${replTitle}, ${subApp.name}, ${subApp.description}, ${subApp.path}, ${subApp.url}, ${JSON.stringify(slugs)}::jsonb)
        ON CONFLICT DO NOTHING
      `);

      results.push({ name: subApp.name, skipped: false, slugs, parentSlugs });
    }

    // Note: per-page Google sitemap ping removed (?ping= retired June 2023).
    // GSC picks up new pages via the periodic submit_sitemap scheduler.

    return ok({
      success: true,
      results,
      totalPages: results.reduce((acc, r) => acc + r.slugs.length, 0),
    });
  } catch (e) {
    console.error("replit-sub-apps error:", e);
    return serverError(String(e));
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { generateSeedMarketingPages } from "@/lib/llm/seeds";
import type { SeedAppSpec } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { requireAdminUser } from "@/lib/auth/require-admin-user";

export async function POST(req: Request) {
  try {
    const { user, error } = await requireAdminUser();
    if (error || !user) return error!;

    const { name, url, description, platform, hostingProvider, domain, subApps } = await req.json();
    if (!name || !url) return badRequest("name and url are required");

    const appKey = `app:${user.id}:${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;

    const existing = await db
      .select({ id: seoLandingPages.id })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.toolUrl, appKey))
      .limit(1);

    const spec: SeedAppSpec = {
      appName: name,
      problemStatement: description || `${name} — a web application at ${url}`,
      targetUsers: "Developers, businesses, and end users",
      features: [
        `Core ${name} functionality`,
        hostingProvider ? `Hosted on ${hostingProvider}` : "Web application",
        domain ? `Available at ${domain}` : `Available at ${url}`,
      ],
      userFlows: [`Visit ${url}`, "Use the app features", "Share or integrate"],
      databaseSchema: "Application data layer",
      apiEndpoints: [url],
      uiComponents: ["Main interface", "Navigation", "Core features"],
      businessModel: `${name} web application`,
      deploymentPreferences: `Deployed at ${url}${domain ? ` · Domain: ${domain}` : ""}${hostingProvider ? ` · Hosted on ${hostingProvider}` : ""}`,
    };

    const slugs: string[] = [];

    if (existing.length === 0) {
      const result = await generateSeedMarketingPages(spec, appKey);
      if (result.success) {
        for (const page of result.pages) {
          const [row] = await db.insert(seoLandingPages).values({
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
            toolUrl: appKey,
          }).returning({ slug: seoLandingPages.slug });
          if (row) slugs.push(row.slug);
        }
      }
    } else {
      const existingPages = await db.select({ slug: seoLandingPages.slug }).from(seoLandingPages).where(eq(seoLandingPages.toolUrl, appKey));
      slugs.push(...existingPages.map((p) => p.slug));
    }

    const subAppsJson = JSON.stringify(subApps || []);
    await db.execute(sql`
      INSERT INTO user_apps (user_id, name, url, description, platform, hosting_provider, domain, marketing_slugs, sub_apps)
      VALUES (${user.id}, ${name}, ${url}, ${description || ""}, ${platform || "custom"}, ${hostingProvider || ""}, ${domain || ""}, ${JSON.stringify(slugs)}::jsonb, ${subAppsJson}::jsonb)
      ON CONFLICT DO NOTHING
    `);

    // Note: per-page Google sitemap ping removed (?ping= retired June 2023).
    // GSC picks up new pages via the periodic submit_sitemap scheduler.

    return ok({ success: true, appKey, slugs, skipped: existing.length > 0 });
  } catch (e) {
    console.error("seeds/app error:", e);
    return serverError(String(e));
  }
}

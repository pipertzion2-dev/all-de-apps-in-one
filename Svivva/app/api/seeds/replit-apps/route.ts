import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials, seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { generateSeedMarketingPages } from "@/lib/llm/seeds";
import type { SeedAppSpec } from "@/lib/schema";
import { getSitemapUrl } from "@/lib/site-url";

const REPLIT_GQL = "https://replit.com/graphql";

const REPLS_QUERY = `
query GetUserRepls($username: String!, $count: Int) {
  userByUsername(username: $username) {
    username
    publicRepls(count: $count) {
      items {
        id
        title
        description
        slug
        url
      }
    }
  }
}
`;

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [creds] = await db.select().from(seedCredentials).where(eq(seedCredentials.userId, user.id)).limit(1);
    const replitUsername = creds?.replitUsername || null;
    if (!replitUsername) {
      return NextResponse.json({ error: "Replit not connected. Enter your Replit username in Connected Services first." }, { status: 400 });
    }

    const gqlRes = await fetch(REPLIT_GQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://replit.com",
        "User-Agent": "Mozilla/5.0 Svivva/1.0",
      },
      body: JSON.stringify({ query: REPLS_QUERY, variables: { username: replitUsername, count: 100 } }),
      signal: AbortSignal.timeout(15000),
    });

    if (!gqlRes.ok) {
      const body = await gqlRes.text().catch(() => "");
      console.error("[replit-apps] GQL error:", gqlRes.status, body.slice(0, 200));
      return NextResponse.json({ error: `Replit API error: ${gqlRes.status} ${gqlRes.statusText}` }, { status: 400 });
    }

    const gqlData = await gqlRes.json();
    const items = gqlData?.data?.userByUsername?.publicRepls?.items || [];
    const username = gqlData?.data?.userByUsername?.username || replitUsername;

    if (gqlData.errors?.length > 0) {
      return NextResponse.json({ error: `Replit API: ${gqlData.errors[0].message}` }, { status: 400 });
    }

    const apps = items.map((r: Record<string, unknown>) => {
      const replUrl = (r.url as string) || `https://replit.com/@${username}/${r.slug}`;
      return {
        id: r.id as string,
        title: r.title as string,
        description: (r.description as string) || "",
        url: replUrl,
        slug: r.slug as string,
        hasDeployment: false,
      };
    });

    const generated = [];

    for (const app of apps.slice(0, 50)) {
      const existing = await db
        .select({ id: seoLandingPages.id })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.toolUrl, `replit:${app.id}`))
        .limit(1);

      if (existing.length > 0) {
        generated.push({ appId: app.id, title: app.title, skipped: true, slugs: [] });
        continue;
      }

      const spec: SeedAppSpec = {
        appName: app.title,
        problemStatement: app.description || `${app.title} - a web application`,
        targetUsers: "Developers and end users",
        features: ["Web application", "Built on Replit", app.hasDeployment ? "Live deployment" : "Development mode"],
        userFlows: ["Visit the app", "Use core features", "Share with others"],
        databaseSchema: "Application-specific database",
        apiEndpoints: ["/api", app.url],
        uiComponents: ["Main interface", "Navigation", "Core features"],
        businessModel: "Free to use",
        deploymentPreferences: `Deployed at ${app.url}`,
      };

      const result = await generateSeedMarketingPages(spec, `replit:${app.id}`);
      const slugs: string[] = [];

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
            toolUrl: `replit:${app.id}`,
          }).returning({ slug: seoLandingPages.slug });
          if (row) slugs.push(row.slug);
        }
      }

      generated.push({ appId: app.id, title: app.title, skipped: false, slugs, url: app.url });
    }

    // Note: per-page Google sitemap ping removed (?ping= retired June 2023).
    // GSC picks up new pages via the periodic submit_sitemap scheduler.

    return NextResponse.json({
      success: true,
      username,
      totalApps: apps.length,
      generated: generated.filter((g) => !g.skipped),
      skipped: generated.filter((g) => g.skipped).length,
      totalPages: generated.reduce((acc, g) => acc + g.slugs.length, 0),
    });
  } catch (e) {
    console.error("Replit apps error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

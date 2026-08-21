import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orbitAppSeoConfig,
  orbitIndexingChecks,
  orbitPublicApps,
  orbitSitemapEntries,
} from "@/lib/orbit/seo/schema";
import { getSiteUrl } from "@/lib/site-url";
import { defaultSeoMetadata } from "./metadata-defaults";
import { canPublish, runPrePublishSeoChecks } from "./pre-publish-checks";
import { isValidPublicAppSlug, publicAppPath, publicAppUrl, slugifyMiniAppName } from "./slug";
import { NATIVE_SVIVVA_TOOLS } from "@/lib/orbit/mini-app-curation";
import { FEATURE_MINI_APPS } from "@/lib/tools/feature-mini-apps";

export type PublishMiniAppInput = {
  workspaceId: string;
  name: string;
  description?: string;
  category?: string;
  toolPath?: string | null;
  slug?: string;
  /** Admin overrides for SEO fields */
  seoOverrides?: Partial<{
    seoTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    canonicalOverride: boolean;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    robotsDirective: string;
    crawlableBody: string;
    whoItsFor: string;
    howToUse: string;
    keyFeatures: string[];
  }>;
  force?: boolean;
};

function origin(): string {
  return getSiteUrl().replace(/\/$/, "");
}

async function upsertSitemapEntry(opts: {
  workspaceId: string;
  appId: string;
  slug: string;
  active: boolean;
  lastmod: Date;
}) {
  const url = publicAppUrl(origin(), opts.slug);
  const existing = await db
    .select()
    .from(orbitSitemapEntries)
    .where(eq(orbitSitemapEntries.url, url))
    .limit(1);
  if (existing[0]) {
    await db
      .update(orbitSitemapEntries)
      .set({
        active: opts.active,
        lastmod: opts.lastmod,
        appId: opts.appId,
        updatedAt: new Date(),
      })
      .where(eq(orbitSitemapEntries.id, existing[0].id));
    return;
  }
  if (!opts.active) return;
  await db.insert(orbitSitemapEntries).values({
    workspaceId: opts.workspaceId,
    appId: opts.appId,
    url,
    canonical: true,
    chunk: "apps",
    lastmod: opts.lastmod,
    priority: 0.85,
    changeFrequency: "weekly",
    active: true,
  });
}

export async function publishOrbitMiniApp(input: PublishMiniAppInput) {
  const slug = slugifyMiniAppName(input.slug || input.name);
  if (!isValidPublicAppSlug(slug)) {
    return {
      ok: false as const,
      error: "Invalid slug",
      checks: runPrePublishSeoChecks({
        slug,
        origin: origin(),
      }),
    };
  }

  const dup = await db
    .select({ id: orbitPublicApps.id })
    .from(orbitPublicApps)
    .where(and(eq(orbitPublicApps.workspaceId, input.workspaceId), eq(orbitPublicApps.slug, slug)))
    .limit(1);

  const defaults = defaultSeoMetadata(
    {
      name: input.name,
      description: input.description || "",
      category: input.category,
      toolPath: input.toolPath,
      slug,
    },
    origin(),
  );
  const seo = { ...defaults, ...input.seoOverrides };

  const checks = runPrePublishSeoChecks({
    slug,
    seoTitle: seo.seoTitle,
    metaDescription: seo.metaDescription,
    canonicalUrl: seo.canonicalUrl,
    robotsDirective: seo.robotsDirective,
    crawlableBody: seo.crawlableBody,
    whoItsFor: seo.whoItsFor,
    howToUse: seo.howToUse,
    slugTakenByOther: false,
    origin: origin(),
  });

  // If updating existing draft of same slug, not a conflict
  if (!canPublish(checks) && !input.force) {
    return { ok: false as const, error: "Pre-publish checks failed", checks };
  }

  const now = new Date();
  let appId = dup[0]?.id;

  if (appId) {
    await db
      .update(orbitPublicApps)
      .set({
        name: input.name,
        description: input.description || "",
        category: input.category || "general",
        toolPath: input.toolPath || null,
        status: "published",
        isPublic: true,
        indexable: true,
        sitemapIncluded: true,
        publishedAt: now,
        unpublishedAt: null,
        contentLastmod: now,
        updatedAt: now,
      })
      .where(eq(orbitPublicApps.id, appId));
  } else {
    const inserted = await db
      .insert(orbitPublicApps)
      .values({
        workspaceId: input.workspaceId,
        contentType: "mini_app",
        slug,
        name: input.name,
        description: input.description || "",
        category: input.category || "general",
        toolPath: input.toolPath || null,
        status: "published",
        isPublic: true,
        indexable: true,
        sitemapIncluded: true,
        publishedAt: now,
        contentLastmod: now,
      })
      .returning({ id: orbitPublicApps.id });
    appId = inserted[0]!.id;
  }

  const existingSeo = await db
    .select()
    .from(orbitAppSeoConfig)
    .where(eq(orbitAppSeoConfig.appId, appId))
    .limit(1);

  const seoRow = {
    seoTitle: seo.seoTitle,
    metaDescription: seo.metaDescription,
    canonicalUrl: seo.canonicalUrl,
    canonicalOverride: !!input.seoOverrides?.canonicalOverride,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImage: seo.ogImage,
    robotsDirective: seo.robotsDirective,
    structuredDataJson: seo.structuredDataJson,
    crawlableBody: seo.crawlableBody,
    whoItsFor: seo.whoItsFor,
    howToUse: seo.howToUse,
    keyFeatures: seo.keyFeatures,
    faqJson: seo.faqJson,
    updatedAt: now,
  };

  if (existingSeo[0]) {
    await db
      .update(orbitAppSeoConfig)
      .set(seoRow)
      .where(eq(orbitAppSeoConfig.id, existingSeo[0].id));
  } else {
    await db.insert(orbitAppSeoConfig).values({ appId, ...seoRow });
  }

  await upsertSitemapEntry({
    workspaceId: input.workspaceId,
    appId,
    slug,
    active: true,
    lastmod: now,
  });

  await refreshIndexingCheck(input.workspaceId, appId);

  return {
    ok: true as const,
    appId,
    slug,
    publicPath: publicAppPath(slug),
    publicUrl: publicAppUrl(origin(), slug),
    checks,
  };
}

export async function unpublishOrbitMiniApp(workspaceId: string, appId: string) {
  const now = new Date();
  const rows = await db
    .select()
    .from(orbitPublicApps)
    .where(and(eq(orbitPublicApps.id, appId), eq(orbitPublicApps.workspaceId, workspaceId)))
    .limit(1);
  const app = rows[0];
  if (!app) return { ok: false as const, error: "Not found" };

  await db
    .update(orbitPublicApps)
    .set({
      status: "private",
      isPublic: false,
      sitemapIncluded: false,
      indexable: false,
      unpublishedAt: now,
      updatedAt: now,
    })
    .where(eq(orbitPublicApps.id, appId));

  await db
    .update(orbitAppSeoConfig)
    .set({ robotsDirective: "noindex,nofollow", updatedAt: now })
    .where(eq(orbitAppSeoConfig.appId, appId));

  await upsertSitemapEntry({
    workspaceId,
    appId,
    slug: app.slug,
    active: false,
    lastmod: now,
  });

  await refreshIndexingCheck(workspaceId, appId);
  return { ok: true as const };
}

export async function refreshIndexingCheck(workspaceId: string, appId: string) {
  const apps = await db
    .select()
    .from(orbitPublicApps)
    .where(and(eq(orbitPublicApps.id, appId), eq(orbitPublicApps.workspaceId, workspaceId)))
    .limit(1);
  const app = apps[0];
  if (!app) return;

  const seo = (
    await db.select().from(orbitAppSeoConfig).where(eq(orbitAppSeoConfig.appId, appId)).limit(1)
  )[0];

  const sitemap = (
    await db
      .select()
      .from(orbitSitemapEntries)
      .where(and(eq(orbitSitemapEntries.appId, appId), eq(orbitSitemapEntries.active, true)))
      .limit(1)
  )[0];

  const published = app.status === "published" && app.isPublic;
  const metadataComplete = !!(seo?.seoTitle && seo?.metaDescription && seo?.canonicalUrl);
  const crawlable = !!(
    seo?.crawlableBody &&
    seo.crawlableBody.length >= 120 &&
    seo.whoItsFor &&
    seo.howToUse
  );
  const canonicalValid = !!seo?.canonicalUrl;
  const attention: string[] = [];
  if (!published) attention.push("Not published/public");
  if (!sitemap) attention.push("Missing from sitemap");
  if (!metadataComplete) attention.push("Incomplete SEO metadata");
  if (!crawlable) attention.push("Thin crawlable content");

  const row = {
    workspaceId,
    appId,
    published,
    isPublic: app.isPublic,
    sitemapIncluded: !!sitemap || app.sitemapIncluded,
    crawlable,
    indexable: published && app.indexable && !(seo?.robotsDirective || "").includes("noindex"),
    canonicalValid,
    metadataComplete,
    googleTrafficDetected: false,
    needsAttention: attention.length > 0,
    attentionReasons: attention,
    checkedAt: new Date(),
  };

  const existing = await db
    .select()
    .from(orbitIndexingChecks)
    .where(eq(orbitIndexingChecks.appId, appId))
    .limit(1);
  if (existing[0]) {
    await db.update(orbitIndexingChecks).set(row).where(eq(orbitIndexingChecks.id, existing[0].id));
  } else {
    await db.insert(orbitIndexingChecks).values(row);
  }
}

/** Sync curated native/feature mini-apps into Orbit public apps for a workspace. */
export async function syncCuratedMiniAppsToOrbit(workspaceId: string) {
  const seeds = [
    ...NATIVE_SVIVVA_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.hub,
      toolPath: t.path,
      slug: t.path.replace(/^\/tools\//, ""),
    })),
    ...FEATURE_MINI_APPS.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.hub,
      toolPath: t.path,
      slug: t.slug,
    })),
  ];

  const results = [];
  for (const seed of seeds) {
    results.push(
      await publishOrbitMiniApp({
        workspaceId,
        name: seed.name,
        description: seed.description,
        category: seed.category,
        toolPath: seed.toolPath,
        slug: seed.slug,
      }),
    );
  }
  return results;
}

export async function listPublicAppsForSitemap() {
  try {
    return await db
      .select({
        slug: orbitPublicApps.slug,
        lastmod: orbitPublicApps.contentLastmod,
        sitemapIncluded: orbitPublicApps.sitemapIncluded,
        isPublic: orbitPublicApps.isPublic,
        status: orbitPublicApps.status,
        indexable: orbitPublicApps.indexable,
      })
      .from(orbitPublicApps)
      .where(and(eq(orbitPublicApps.isPublic, true), eq(orbitPublicApps.status, "published")));
  } catch {
    return [];
  }
}

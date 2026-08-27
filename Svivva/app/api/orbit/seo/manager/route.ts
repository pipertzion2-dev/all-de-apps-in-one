import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http-response";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { getSeoOverview, runOrbitSeoJobs } from "@/lib/orbit/seo/overview";
import {
  publishOrbitMiniApp,
  unpublishOrbitMiniApp,
  syncCuratedMiniAppsToOrbit,
} from "@/lib/orbit/seo/publish-pipeline";
import { recalculateSeoOpportunities, fetchAhrefsInsights } from "@/lib/orbit/seo/opportunities";
import { db } from "@/lib/db";
import {
  orbitIndexingChecks,
  orbitPublicApps,
  orbitSeoOpportunities,
} from "@/lib/orbit/seo/schema";
import { runPrePublishSeoChecks } from "@/lib/orbit/seo/pre-publish-checks";
import { getSiteUrl } from "@/lib/site-url";

async function workspaceId(): Promise<string> {
  return (await resolveOrbitInternalUserId()) || "orbit-default-workspace";
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req))) return unauthorized("Orbit admin required");
    const ws = await workspaceId();
    const view = req.nextUrl.searchParams.get("view") || "overview";

    if (view === "overview") {
      return ok({ overview: await getSeoOverview(ws) });
    }
    if (view === "indexing") {
      const apps = await db
        .select()
        .from(orbitPublicApps)
        .where(eq(orbitPublicApps.workspaceId, ws));
      const checks = await db
        .select()
        .from(orbitIndexingChecks)
        .where(eq(orbitIndexingChecks.workspaceId, ws));
      const byApp = new Map(checks.map((c) => [c.appId, c]));
      return ok({
        apps: apps.map((a) => ({
          ...a,
          check: byApp.get(a.id) || null,
          publicPath: `/apps/${a.slug}`,
        })),
        filters: [
          "all",
          "healthy",
          "not_indexable",
          "sitemap_issues",
          "seo_issues",
          "no_google_impressions",
        ],
        note: "Statuses describe Orbit eligibility and stored GSC traffic — not a verified “Google Indexed” claim.",
      });
    }
    if (view === "opportunities") {
      const rows = await db
        .select()
        .from(orbitSeoOpportunities)
        .where(
          and(eq(orbitSeoOpportunities.workspaceId, ws), eq(orbitSeoOpportunities.status, "open")),
        );
      return ok({ opportunities: rows });
    }
    if (view === "integrations") {
      return ok({
        searchConsole: {
          connectedViaExistingGsc: true,
          manageHref: "/dashboard/gsc-connect",
          note: "Use existing Orbit GSC OAuth. Snapshots refresh via SEO jobs — Orbit does not iframe Search Console.",
        },
        ahrefs: await fetchAhrefsInsights(ws),
        env: {
          ORBIT_SEO_SECRETS_KEY: !!process.env.ORBIT_SEO_SECRETS_KEY,
          AHREFS_API_KEY: !!process.env.AHREFS_API_KEY,
          GOOGLE_GSC_CLIENT_ID: !!process.env.GOOGLE_GSC_CLIENT_ID,
        },
      });
    }
    return badRequest("Unknown view");
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "SEO manager failed");
  }
}

const publishSchema = z.object({
  action: z.enum([
    "publish",
    "unpublish",
    "sync_curated",
    "run_jobs",
    "recalc_opportunities",
    "precheck",
  ]),
  name: z.string().max(200).optional(),
  description: z.string().max(4000).optional(),
  category: z.string().max(120).optional(),
  toolPath: z.string().max(300).optional(),
  slug: z.string().max(80).optional(),
  appId: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req))) return unauthorized("Orbit admin required");
    const parsed = publishSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid SEO action");
    const ws = await workspaceId();
    const body = parsed.data;

    if (body.action === "precheck") {
      const checks = runPrePublishSeoChecks({
        slug: body.slug || "untitled-app",
        seoTitle: body.name ? `${body.name} — free online tool | ZZAI` : null,
        metaDescription: body.description,
        canonicalUrl: `${getSiteUrl().replace(/\/$/, "")}/apps/${body.slug || "untitled-app"}`,
        crawlableBody: body.description,
        whoItsFor: body.description ? `People who need ${body.name || "this tool"}` : null,
        howToUse: body.name ? `Open ${body.name} and follow on-page steps.` : null,
        origin: getSiteUrl(),
      });
      return ok({ checks });
    }
    if (body.action === "sync_curated") {
      return ok({ results: await syncCuratedMiniAppsToOrbit(ws) });
    }
    if (body.action === "run_jobs") {
      return ok({ jobs: await runOrbitSeoJobs(ws) });
    }
    if (body.action === "recalc_opportunities") {
      return ok(await recalculateSeoOpportunities(ws));
    }
    if (body.action === "unpublish") {
      if (!body.appId) return badRequest("appId required");
      return ok(await unpublishOrbitMiniApp(ws, body.appId));
    }
    if (body.action === "publish") {
      if (!body.name) return badRequest("name required");
      return ok(
        await publishOrbitMiniApp({
          workspaceId: ws,
          name: body.name,
          description: body.description,
          category: body.category,
          toolPath: body.toolPath,
          slug: body.slug,
        }),
      );
    }
    return badRequest("Unknown action");
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "SEO action failed");
  }
}

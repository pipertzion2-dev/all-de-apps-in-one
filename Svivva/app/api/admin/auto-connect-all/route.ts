import { NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getAllWorkspaceProjects } from "@/lib/workspace-external-apps";
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";

export const maxDuration = 120;

async function checkUrl(url: string): Promise<{ ok: boolean; status?: number }> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false };
  }
}

async function fix404Links() {
  const allPages = await db
    .select({ id: seoLandingPages.id, toolUrl: seoLandingPages.toolUrl })
    .from(seoLandingPages);
  const removed: string[] = [];

  for (const page of allPages) {
    if (!page.toolUrl) continue;
    const check = await checkUrl(page.toolUrl);
    if (!check.ok || check.status === 404) {
      await db
        .update(seoLandingPages)
        .set({ toolUrl: null, published: false })
        .where(eq(seoLandingPages.id, page.id));
      removed.push(page.toolUrl);
    }
  }

  return { removed };
}

export async function POST() {
  try {
    if (!(await isOrbitAdminAllowed()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const siteUrl = getSiteUrl();
    const results: Record<string, unknown> = {};

    results.apps = await Promise.all(
      getAllWorkspaceProjects().map(async (project) => {
        const check = await checkUrl(project.url);
        return {
          name: project.name,
          url: project.url,
          status: check.ok ? "connected" : "error",
        };
      }),
    );

    results.links404 = await fix404Links();

    const projectUrls = getAllWorkspaceProjects().map((p) => p.url);
    const allUrls = [...new Set([...projectUrls, ...(await getAllSiteUrlsForIndexing())])];
    const indexResult = await submitIndexNowBatched(allUrls);
    results.indexNow = {
      ok: indexResult.ok,
      message: indexResult.message,
      submitted: indexResult.submittedCount,
      total: indexResult.totalUrls,
    };

    return NextResponse.json({
      success: true,
      results,
      message: `Connected ${results.apps ? (results.apps as unknown[]).length : 0} workspace apps; IndexNow: ${indexResult.message}`,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

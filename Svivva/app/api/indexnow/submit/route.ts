import { NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isOrbitAdminAllowed()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const urls = await getAllSiteUrlsForIndexing();
  const result = await submitIndexNowBatched(urls);

  if (!result.ok && result.lastHttpStatus === 403) {
    return NextResponse.json(
      {
        error: result.message,
      },
      { status: 400 },
    );
  }
  if (!result.ok && result.lastHttpStatus === 422) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message || `IndexNow failed (HTTP ${result.lastHttpStatus})` },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    urlCount: result.totalUrls,
    chunks: result.chunks,
    submittedTo: ["api.indexnow.org (Bing, Yandex, Yahoo)", "www.bing.com"],
  });
}

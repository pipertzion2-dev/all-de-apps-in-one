import { NextRequest } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { runAutomatableManualActions } from "@/lib/orbit/automate-manual-actions";
import { getGoogleOAuthAccessTokenForUser } from "@/lib/google-gsc-oauth";
import { runGscAutoSetup } from "@/lib/google-gsc-auto-setup";
import { forbidden, ok, badRequest } from "@/lib/http-response";

export const dynamic = "force-dynamic";

/** One-click: re-run Google sitemap + Indexing API (+ full IndexNow/Bing from traffic engine). */
export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) return forbidden();

  const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";
  const accessToken = await getGoogleOAuthAccessTokenForUser(userId);

  let autoSetup = null;
  if (accessToken) {
    autoSetup = await runGscAutoSetup({ userId, accessToken });
  }

  const indexing = await runAutomatableManualActions({ googleMaxBatches: 5 });

  return ok({
    ok: indexing.googleSitemap.ok || indexing.googleIndexing.submitted > 0,
    autoSetup,
    indexing: {
      indexNow: indexing.indexNow,
      googleSitemap: indexing.googleSitemap,
      googleIndexing: indexing.googleIndexing,
      bingPing: indexing.bingPing,
    },
    message: accessToken
      ? autoSetup?.message || "Indexing run complete"
      : "Connect Google first at /dashboard/gsc-connect",
  });
}

export async function GET() {
  return badRequest("Use POST");
}

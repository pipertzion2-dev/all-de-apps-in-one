import { NextRequest } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveGscCredentialsUserId } from "@/lib/orbit/gsc-credentials-user";
import { runAutomatableManualActions } from "@/lib/orbit/automate-manual-actions";
import { getGoogleOAuthAccessTokenForUser } from "@/lib/google-gsc-oauth";
import { runGscAutoSetup } from "@/lib/google-gsc-auto-setup";
import { forbidden, ok, badRequest } from "@/lib/http-response";

export const dynamic = "force-dynamic";

/** One-click: re-run Google sitemap + Indexing API (+ full IndexNow/Bing from traffic engine). */
export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) return forbidden();

  const userId = await resolveGscCredentialsUserId();
  const accessToken = await getGoogleOAuthAccessTokenForUser(userId);

  let autoSetup = null;
  if (accessToken) {
    // Sitemap/property only here — Indexing API runs once in automate below
    // so we do not burn the ~200/day quota twice in one click.
    autoSetup = await runGscAutoSetup({ userId, accessToken, skipIndexingApi: true });
  }

  const indexing = await runAutomatableManualActions({ googleMaxBatches: 5 });

  const discoveryOk =
    indexing.indexNow.ok ||
    indexing.googleSitemap.ok ||
    indexing.googleIndexing.submitted > 0 ||
    !!autoSetup?.sitemapOk;

  const messageParts: string[] = [];
  if (accessToken) {
    messageParts.push(autoSetup?.message || "GSC property synced");
  } else {
    messageParts.push("Connect Google first at /dashboard/gsc-connect");
  }
  if (indexing.indexNow.ok) {
    messageParts.push(
      `IndexNow accepted ${indexing.indexNow.submittedCount}/${indexing.indexNow.totalUrls}`,
    );
  }
  if (indexing.googleIndexing.quotaExhausted && indexing.googleIndexing.submitted === 0) {
    messageParts.push(
      "Indexing API daily quota already used — IndexNow + GSC sitemap still cover discovery",
    );
  } else if (indexing.googleIndexing.submitted > 0) {
    messageParts.push(
      `Indexing API notified ${indexing.googleIndexing.submitted} URLs${
        indexing.googleIndexing.quotaExhausted ? " (then hit daily quota)" : ""
      }`,
    );
  }

  return ok({
    ok: discoveryOk,
    autoSetup,
    indexing: {
      indexNow: indexing.indexNow,
      googleSitemap: indexing.googleSitemap,
      googleIndexing: indexing.googleIndexing,
      bingPing: indexing.bingPing,
    },
    summaryLines: indexing.summaryLines,
    message: messageParts.join(" · "),
  });
}

export async function GET() {
  return badRequest("Use POST");
}
